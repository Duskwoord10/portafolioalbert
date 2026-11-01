import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { HOME_PRESENTATION_SEED } from '../src/content/homePresentationSeed.js'
import { ABOUT_PRESENTATION_SEED } from '../src/content/aboutSeed.js'

const table = 'albert-cms-staging-api-CmsTable-IRPMELF0742D'
if (process.env.AWS_PROFILE !== 'default' || process.env.AWS_REGION !== 'us-east-1' ||
    process.env.CMS_DYNAMODB_TABLE !== table) throw new Error('Entorno de staging inesperado.')
const apply = process.argv.includes('--apply')
const homeOnly = process.argv.includes('--home-only')
if (process.argv.slice(2).some(arg => !['--apply','--home-only'].includes(arg))) throw new Error('Argumento inesperado.')
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region:'us-east-1' }))
const targets = [
  { kind:'home', slug:'inicio', id:'89b841b7-340b-4fef-8062-949c2cae828a', seed:HOME_PRESENTATION_SEED },
  { kind:'about', slug:'sobre-mi', id:'ffdb60ad-715e-44f5-ae37-7ab7a169af90', seed:ABOUT_PRESENTATION_SEED },
]
const changes = []
for (const target of targets.filter(target => !homeOnly || target.kind === 'home')) {
  const row = (await client.send(new GetCommand({ TableName:table,
    Key:{ pk:`CONTENT#${target.id}`, sk:'META' }, ConsistentRead:true }))).Item
  if (!row || row.kind !== target.kind || row.slug !== target.slug || row.status !== 'published')
    throw new Error(`Registro esperado no encontrado: ${target.kind}/${target.slug}; observado ${row?.kind || 'ausente'}/${row?.slug || 'ausente'} (${row?.status || 'ausente'})`)
  const data = JSON.parse(row.data_json)
  const missing = Object.entries(target.seed).filter(([key]) => data[key] === undefined)
  changes.push({ target,row,data,missing })
}
console.log(JSON.stringify({ mode:apply ? 'apply' : 'dry-run',
  changes:changes.map(({target,missing}) => ({kind:target.kind,slug:target.slug,fields:missing.map(([key])=>key)})) },null,2))
if (!apply) process.exit(0)
const { store } = await import('../server/store/dynamo.js')
for (const { target,row,data,missing } of changes) {
  if (!missing.length) continue
  for (const [key,value] of missing) data[key] = value
  await store.saveContent(target.kind,target.id,{
    title:row.title,slug:row.slug,status:row.status,dataJson:JSON.stringify(data),sortOrder:row.sort_order,
  },'system:jsx-content-migration')
  await store.audit('system:jsx-content-migration','presentation_enriched',target.id)
  const saved = (await client.send(new GetCommand({TableName:table,
    Key:{pk:`CONTENT#${target.id}`,sk:'META'},ConsistentRead:true}))).Item
  const savedData = JSON.parse(saved.data_json)
  if (missing.some(([key,value]) => JSON.stringify(savedData[key]) !== JSON.stringify(value)))
    throw new Error(`Verificación fallida: ${target.kind}/${target.slug}`)
}
console.log('Campos de presentación de staging verificados.')
