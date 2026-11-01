import { createHash, randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { HOME_PRESENTATION_SEED } from '../src/content/homePresentationSeed.js'
import { METHODICA_SEED } from '../src/content/methodicaSeed.js'
import { PROFILE } from '../src/data.js'
import { ABOUT_SEED, ABOUT_PRESENTATION_SEED } from '../src/content/aboutSeed.js'

if (process.env.AWS_PROFILE !== 'default' || process.env.AWS_REGION !== 'us-east-1')
  throw new Error('Perfil o región AWS inesperados.')

const table = 'albert-cms-staging-api-CmsTable-IRPMELF0742D'
const bucket = 'albert-cms-staging-api-cmsmedia-y63puile7rsz'
const kinds = new Set(['home','about','company','experience','project','certification',
  'event','album','blog','page','education','skill','award','cv','menu'])
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region:'us-east-1' }))
const s3 = new S3Client({ region:'us-east-1' })
const sha256 = value => createHash('sha256').update(value).digest('hex')

const content = []
let ExclusiveStartKey
do {
  const page = await ddb.send(new ScanCommand({ TableName:table, ConsistentRead:true,
    FilterExpression:'#entity = :content AND #status = :published',
    ExpressionAttributeNames:{ '#entity':'entity', '#status':'status' },
    ExpressionAttributeValues:{ ':content':'content', ':published':'published' },
    ExclusiveStartKey }))
  content.push(...(page.Items || []))
  ExclusiveStartKey = page.LastEvaluatedKey
} while (ExclusiveStartKey)
for (const kind of ['home','about','menu']) {
  if (!content.some(row => row.kind === kind))
    throw new Error(`Falta ${kind} publicado en staging; no exportar un candidato incompleto.`)
}

const records = []
const review = []
const mediaIds = new Set()
const slugs = new Set()
const assetReferences = new Set()
for (const row of content.sort((a,b) => `${a.kind}/${a.slug}`.localeCompare(`${b.kind}/${b.slug}`))) {
  if (!kinds.has(row.kind) || !row.id || !row.slug || !row.data_json ||
      row.pk !== `CONTENT#${row.id}` || row.sk !== 'META')
    throw new Error('Hay contenido publicado con una clave o tipo inesperado.')
  const slugKey = `${row.kind}/${row.slug}`
  if (slugs.has(slugKey)) throw new Error(`URL duplicada: ${slugKey}`)
  slugs.add(slugKey)
  const data = JSON.parse(row.data_json)
  if (row.kind === 'home') {
    for (const [key,value] of Object.entries(HOME_PRESENTATION_SEED))
      if (data[key] === undefined) data[key] = value
    // El texto visible original era más largo que el resumen guardado en staging.
    if (data.summary === PROFILE.summary) data.summary = HOME_PRESENTATION_SEED.summary
  }
  if (row.kind === 'about') {
    // Detener la migración si el nombre publicado difiere del original verificado.
    if (data.name !== ABOUT_SEED.name)
      throw new Error('Nombre de Sobre mí difiere del sitio original; reconciliar antes de exportar.')
    for (const [key,value] of Object.entries(ABOUT_PRESENTATION_SEED))
      if (data[key] === undefined) data[key] = value
  }
  const serialized = JSON.stringify(data)
  for (const match of serialized.matchAll(/(?:https?:\/\/[^"\\\s]+|\/api\/media\/[a-f0-9-]+|\/blog\/[^"\\\s]+|\/media\/[^"\\\s]+)/g))
    assetReferences.add(match[0])
  const references = [...new Set(serialized.match(/\/api\/media\/[a-f0-9-]+/g) || [])]
    .map(value => value.slice('/api/media/'.length)).sort()
  references.forEach(id => mediaIds.add(id))
  const attributes = Object.fromEntries(['id','kind','slug','title','status','data_json',
    'sort_order','created_at','updated_at'].map(key => [key,row[key]]))
  if (row.kind === 'home' || row.kind === 'about') attributes.data_json = JSON.stringify(data)
  records.push({ pk:row.pk, sk:row.sk, entity:'content', attributes })
  records.push({ pk:`SLUG#${row.kind}#${row.slug}`, sk:'LOCK', entity:'slug_guard',
    attributes:{ content_id:row.id } })
  review.push({ kind:row.kind,slug:row.slug,title:row.title,updated_at:row.updated_at,
    media:references.length })
}

// La página Methodica sigue en el JSX público y no existe en staging.
// Se incluye como registro editable sólo si staging aún no tiene esa URL.
if (!slugs.has('company/methodica-technology')) {
  const id = randomUUID()
  const at = new Date().toISOString()
  const slug = 'methodica-technology'
  const data = { ...METHODICA_SEED,
    description:METHODICA_SEED.introduction, city:'Santo Domingo',
    country:'República Dominicana', sector:'Tecnología' }
  const serialized = JSON.stringify(data)
  for (const match of serialized.matchAll(/https?:\/\/[^"\\\s]+/g)) assetReferences.add(match[0])
  records.push({ pk:`CONTENT#${id}`,sk:'META',entity:'content',attributes:{
    id,kind:'company',slug,title:METHODICA_SEED.name,status:'published',
    data_json:serialized,sort_order:0,created_at:at,updated_at:at,
  } })
  records.push({ pk:`SLUG#company#${slug}`,sk:'LOCK',entity:'slug_guard',
    attributes:{ content_id:id } })
  review.push({ kind:'company',slug,title:METHODICA_SEED.name,updated_at:at,
    media:0,source:'página Methodica ya publicada en JSX' })
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const suffix = randomUUID().slice(0, 8)
const backupName = `production-candidate-${stamp}-${suffix}`
const backupDir = resolve('.cms-backups', backupName)
const exportDir = resolve('.cms-exports', backupName)
const files = []
const mediaRecords = []
for (const id of [...mediaIds].sort()) {
  const result = await ddb.send(new GetCommand({ TableName:table,
    Key:{ pk:`MEDIA#${id}`, sk:'META' }, ConsistentRead:true }))
  const row = result.Item
  if (!row || row.entity !== 'media' || row.access !== 'public' || row.deleted_at ||
      !/^[a-f0-9-]+\.(?:jpg|png|webp|avif|pdf)$/.test(row.stored_name || ''))
    throw new Error(`Medio publicado inválido o privado: ${id}`)
  const key = `media/${row.stored_name}`
  const object = await s3.send(new GetObjectCommand({ Bucket:bucket, Key:key }))
  const bytes = Buffer.from(await object.Body.transformToByteArray())
  const attributes = Object.fromEntries(['id','filename','stored_name','mime','bytes','alt',
    'access','created_at','updated_at','deleted_at'].filter(field => row[field] !== undefined)
    .map(field => [field,row[field]]))
  mediaRecords.push({ pk:row.pk,sk:row.sk,entity:'media',attributes })
  files.push({ path:key,bytes:bytes.length,sha256:sha256(bytes),content:bytes })
}
records.push(...mediaRecords)

mkdirSync(join(backupDir, 'media'), { recursive:true })
mkdirSync(exportDir, { recursive:true })
for (const file of files) writeFileSync(join(backupDir,file.path),file.content,{ flag:'wx' })
writeFileSync(join(backupDir,'manifest.json'),JSON.stringify({ format:1,
  createdAt:new Date().toISOString(),sourceTable:table,sourceBucket:bucket,
  files:files.map(file => ({ path:file.path,bytes:file.bytes,sha256:file.sha256 })) },null,2)+'\n',{ flag:'wx' })
const lines = records.map(record => JSON.stringify(record)).join('\n') + '\n'
writeFileSync(join(exportDir,'items.jsonl'),lines,{ flag:'wx' })
writeFileSync(join(exportDir,'manifest.json'),JSON.stringify({ format:1,
  sourceBackup:backupName,items:records.length,sha256:sha256(lines),
  counts:{ content:review.length,slug_guard:review.length,media:mediaRecords.length },
  note:'Solo contenido publicado y medios públicos referenciados. Sin administradores, sesiones, revisiones, auditoría, analítica ni registros de prueba archivados.'
},null,2)+'\n',{ flag:'wx' })
writeFileSync(join(exportDir,'review.json'),JSON.stringify(review,null,2)+'\n',{ flag:'wx' })
writeFileSync(join(exportDir,'asset-references.json'),JSON.stringify([...assetReferences].sort(),null,2)+'\n',{ flag:'wx' })
console.log(JSON.stringify({ exportDir,backupDir,items:records.length,
  published:review.length,media:mediaRecords.length,assetReferences:assetReferences.size,
  byKind:Object.fromEntries([...kinds].sort().map(kind =>
    [kind,review.filter(row => row.kind === kind).length])) },null,2))
