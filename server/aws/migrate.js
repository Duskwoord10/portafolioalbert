import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const readJson = path => JSON.parse(readFileSync(path, 'utf8'))
const args = process.argv.slice(2)
const exportDir = args[0] && resolve(args[0])
if (!exportDir) throw new Error('Uso: npm run migration:aws -- RUTA_EXPORTACION [--apply]')
const apply = args.includes('--apply')
const manifest = readJson(join(exportDir, 'manifest.json'))
if (manifest.format !== 1) throw new Error('Formato de exportación desconocido.')
const lines = readFileSync(join(exportDir, 'items.jsonl'))
if (digest(lines) !== manifest.sha256) throw new Error('Hash de exportación inválido.')
const records = lines.toString('utf8').trim().split('\n').map(line => JSON.parse(line))
if (records.length !== manifest.items) throw new Error('Conteo de elementos distinto del manifiesto.')
const keys = new Set()
for (const record of records) {
  if (!record.pk || !record.sk || !record.entity || !record.attributes ||
      keys.has(`${record.pk}\0${record.sk}`)) throw new Error('Clave de exportación inválida o duplicada.')
  keys.add(`${record.pk}\0${record.sk}`)
  if (Buffer.byteLength(JSON.stringify(record)) > 350_000)
    throw new Error(`Elemento demasiado grande: ${record.pk}`)
  if (record.entity === 'admins' && record.attributes.totp_secret &&
      !/^(?:pending:)?enc:v1:/.test(record.attributes.totp_secret))
    throw new Error('Existe un secreto MFA sin cifrar. Ejecuta security:migrate-totp antes de exportar.')
}
const sourceBackup = resolve(process.env.CMS_BACKUP_DIR || '.cms-backups', manifest.sourceBackup)
const backupManifestPath = join(sourceBackup, 'manifest.json')
if (!existsSync(backupManifestPath)) throw new Error('Falta el respaldo original con archivos multimedia.')
const backupManifest = readJson(backupManifestPath)
const media = records.filter(row => row.entity === 'media')
for (const record of media) {
  const name = record.attributes.stored_name
  if (!/^[a-f0-9-]+\.(?:jpg|png|webp|avif|pdf)$/.test(name)) throw new Error('Nombre multimedia inválido.')
  const path = `media/${name}`
  const expected = backupManifest.files.find(file => file.path === path)
  if (!expected || digest(readFileSync(join(sourceBackup, path))) !== expected.sha256)
    throw new Error(`Archivo del respaldo alterado: ${name}`)
}
if (!apply) {
  console.log(JSON.stringify({ mode:'dry-run', items:records.length, media:media.length,
    entities:Object.fromEntries([...new Set(records.map(row => row.entity))].map(entity =>
      [entity, records.filter(row => row.entity === entity).length])) }, null, 2))
  process.exit(0)
}
const table = process.env.CMS_DYNAMODB_TABLE
const bucket = process.env.CMS_S3_BUCKET
if (!table || !bucket || process.env.CMS_MIGRATION_APPLY !== 'YES')
  throw new Error('Configura CMS_DYNAMODB_TABLE, CMS_S3_BUCKET y CMS_MIGRATION_APPLY=YES para importar.')
if (process.env.CMS_MIGRATION_TARGET_ENV === 'production') {
  if (!table.startsWith('albert-cms-production-api-CmsTable-') ||
      !bucket.startsWith('albert-cms-production-api-cmsmedia-') ||
      records.some(row => !['content','slug_guard','media'].includes(row.entity) ||
        (row.entity === 'content' && row.attributes.status !== 'published') ||
        (row.entity === 'media' && row.attributes.access !== 'public')))
    throw new Error('La migración de producción exige recursos separados y sólo contenido publicado.')
}
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions:{ removeUndefinedValues:true } })
const s3 = new S3Client({})
let written = 0, identical = 0
const itemFor = record => {
  const { attributes: a } = record
  const item = { pk:record.pk, sk:record.sk, entity:record.entity, ...a,
    migration_sha256:digest(Buffer.from(JSON.stringify(a))) }
  if (record.entity === 'content') {
    item.gsi1pk = `KIND#${a.kind}`
    item.gsi1sk = `${a.status}#${String(a.sort_order).padStart(12, '0')}#${a.updated_at}#${a.id}`
  } else if (record.entity === 'media' || record.entity === 'messages') {
    item.gsi1pk = record.entity.toUpperCase()
    item.gsi1sk = `${a.created_at}#${a.id}`
  } else if (record.entity === 'admins') {
    item.gsi1pk = `EMAIL#${a.email.toLowerCase()}`
    item.gsi1sk = `ADMIN#${a.id}`
  }
  return item
}
async function existing(item) {
  const found = await ddb.send(new GetCommand({ TableName:table,
    Key:{ pk:item.pk, sk:item.sk }, ConsistentRead:true }))
  return found.Item || null
}
const pending=[]
for (const record of records) {
  const item = itemFor(record)
  const found=await existing(item)
  if (found) {
    if (found.migration_sha256 !== item.migration_sha256)
      throw new Error(`Conflicto con elemento existente ${record.pk}/${record.sk}; importación detenida.`)
    identical++; continue
  }
  pending.push(item)
}
const missingMedia=[]
let uploaded = 0, present = 0
for (const record of media) {
  const key = `media/${record.attributes.stored_name}`
  const sha256=digest(readFileSync(join(sourceBackup,key)))
  try {
    const head=await s3.send(new HeadObjectCommand({ Bucket:bucket, Key:key }))
    if (head.Metadata?.sha256 !== sha256) throw new Error(`Objeto S3 distinto: ${key}`)
    present++
  } catch (error) {
    if (error.name !== 'NotFound' && error.name !== 'NoSuchKey') throw error
    missingMedia.push(record)
  }
}
for (const record of missingMedia) {
  const name = record.attributes.stored_name
  const key = `media/${name}`
  const bytes = readFileSync(join(sourceBackup, key))
  const sha256 = digest(bytes)
  try {
    await s3.send(new PutObjectCommand({ Bucket:bucket, Key:key, Body:bytes,
      ContentType:record.attributes.mime, ServerSideEncryption:'AES256',
      Metadata:{ sha256 }, IfNoneMatch:'*' }))
    uploaded++
  } catch (error) {
    if (error.name === 'PreconditionFailed') throw new Error(`Objeto S3 creado por otro proceso: ${key}`)
    throw error
  }
}
for (const item of pending) {
  try {
    await ddb.send(new PutCommand({ TableName:table, Item:item,
      ConditionExpression:'attribute_not_exists(pk) AND attribute_not_exists(sk)' }))
    written++
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException')
      throw new Error(`Conflicto con elemento existente ${item.pk}/${item.sk}; importación detenida.`)
    throw error
  }
}
console.log(JSON.stringify({ written, identical, uploaded, present, total:records.length }))
