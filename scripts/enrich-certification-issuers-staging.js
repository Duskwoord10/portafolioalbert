import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb'

const table = 'albert-cms-staging-api-CmsTable-IRPMELF0742D'
if (process.env.AWS_PROFILE !== 'default' || process.env.AWS_REGION !== 'us-east-1' ||
    process.env.CMS_DYNAMODB_TABLE !== table) throw new Error('Entorno de staging inesperado.')
const apply = process.argv.includes('--apply')
if (process.argv.slice(2).some(arg => arg !== '--apply')) throw new Error('Argumento inesperado.')
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region:'us-east-1' }))
const rows = []
let ExclusiveStartKey
do {
  const page = await client.send(new ScanCommand({ TableName:table, ConsistentRead:true,
    FilterExpression:'#entity = :content AND #kind = :cert AND #status = :published',
    ExpressionAttributeNames:{'#entity':'entity','#kind':'kind','#status':'status'},
    ExpressionAttributeValues:{':content':'content',':cert':'certification',':published':'published'},
    ExclusiveStartKey }))
  rows.push(...(page.Items || []))
  ExclusiveStartKey = page.LastEvaluatedKey
} while (ExclusiveStartKey)
const changes = rows.map(row => {
  if (row.pk !== `CONTENT#${row.id}` || row.sk !== 'META' || !/^AWS Certified\b/.test(row.title))
    throw new Error('Certificación publicada inesperada; revisar manualmente.')
  const data = JSON.parse(row.data_json)
  if (data.issuer && data.issuer !== 'Amazon Web Services')
    throw new Error(`Emisor ya definido de manera diferente: ${row.slug}`)
  return { row,data,needed:!data.issuer }
})
console.log(JSON.stringify({mode:apply ? 'apply' : 'dry-run',
  records:changes.map(({row,needed}) => ({slug:row.slug,needed}))},null,2))
if (!apply) process.exit(0)
const { store } = await import('../server/store/dynamo.js')
for (const {row,data,needed} of changes) {
  if (!needed) continue
  data.issuer = 'Amazon Web Services'
  await store.saveContent('certification',row.id,{
    title:row.title,slug:row.slug,status:row.status,dataJson:JSON.stringify(data),sortOrder:row.sort_order,
  },'system:jsx-content-migration')
  await store.audit('system:jsx-content-migration','issuer_enriched',row.id)
  const saved = (await client.send(new GetCommand({TableName:table,
    Key:{pk:`CONTENT#${row.id}`,sk:'META'},ConsistentRead:true}))).Item
  if (JSON.parse(saved.data_json).issuer !== 'Amazon Web Services')
    throw new Error(`Emisor no confirmado: ${row.slug}`)
}
console.log('Emisores AWS verificados en staging.')
