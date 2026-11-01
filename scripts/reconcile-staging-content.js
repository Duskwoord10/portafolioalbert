import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'

const table = 'albert-cms-staging-api-CmsTable-IRPMELF0742D'
if (process.env.AWS_PROFILE !== 'default' || process.env.AWS_REGION !== 'us-east-1' ||
    process.env.CMS_DYNAMODB_TABLE !== table)
  throw new Error('Perfil, región o tabla de staging inesperados.')
const apply = process.argv.includes('--apply')
if (process.argv.some(arg => arg !== '--apply' && arg !== process.argv[0] && arg !== process.argv[1]))
  throw new Error('Argumento inesperado.')
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region:'us-east-1' }))
const records = [
  { id:'1ee604ab-0e44-4118-b1a1-d959786ab17c',kind:'company',slug:'never-off-technology',
    field:'title',before:'Never Off Technologyxd',after:'Never Off Technology' },
  { id:'89b841b7-340b-4fef-8062-949c2cae828a',kind:'home',slug:'inicio',
    field:'photo',
    before:'https://albertsanflepage.s3.us-east-1.amazonaws.com/media/albertsanfleportafolioimagen.jpg',
    after:'https://albertsanflepage.s3.us-east-1.amazonaws.com/media/albertsanflefotopg.jpg' },
  { id:'ffdb60ad-715e-44f5-ae37-7ab7a169af90',kind:'about',slug:'sobre-mi',
    field:'name',before:['Albert Javier Sanfle Lopezprueba','Albert Javier Sanfle Lopezxd'],
    after:'Albert Javier Sanfle Lopez' },
]
const pending = []
for (const change of records) {
  const row = (await client.send(new GetCommand({ TableName:table,
    Key:{ pk:`CONTENT#${change.id}`,sk:'META' },ConsistentRead:true }))).Item
  if (!row || row.kind !== change.kind || row.slug !== change.slug || row.status !== 'published')
    throw new Error(`Registro inesperado: ${change.kind}/${change.slug}`)
  const data = JSON.parse(row.data_json)
  const current = change.field === 'title' ? row.title : data[change.field]
  const beforeValues=Array.isArray(change.before) ? change.before : [change.before]
  if (!beforeValues.includes(current) && current !== change.after)
    throw new Error(`Valor divergente: ${change.kind}/${change.slug}.${change.field}`)
  pending.push({ change,row,data,needed:beforeValues.includes(current) })
}
console.log(JSON.stringify({ table, mode:apply ? 'apply' : 'dry-run',
  changes:pending.map(({ change,needed }) => ({ kind:change.kind,slug:change.slug,
    field:change.field,needed })) },null,2))
if (!apply) process.exit(0)
const { store } = await import('../server/store/dynamo.js')
for (const { change,row,data,needed } of pending) {
  if (!needed) continue
  if (change.field === 'title') row.title=change.after
  else data[change.field]=change.after
  await store.saveContent(change.kind,change.id,{
    title:row.title,slug:row.slug,status:row.status,dataJson:JSON.stringify(data),
    sortOrder:row.sort_order,
  },'system:staging-content-reconciliation')
  await store.audit('system:staging-content-reconciliation','content_reconciled',change.id)
}
for (const { change } of pending) {
  const row = (await client.send(new GetCommand({ TableName:table,
    Key:{ pk:`CONTENT#${change.id}`,sk:'META' },ConsistentRead:true }))).Item
  const actual = change.field === 'title' ? row.title : JSON.parse(row.data_json)[change.field]
  if (actual !== change.after) throw new Error(`Verificación fallida: ${change.kind}/${change.slug}`)
}
console.log('Reconciliación de staging verificada.')
