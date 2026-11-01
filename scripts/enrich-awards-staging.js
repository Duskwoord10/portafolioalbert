import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { AWARD_SEEDS } from '../src/content/professionalSeed.js'

const table = 'albert-cms-staging-api-CmsTable-IRPMELF0742D'
if (process.env.AWS_PROFILE !== 'default' || process.env.AWS_REGION !== 'us-east-1' ||
    process.env.CMS_DYNAMODB_TABLE !== table) throw new Error('Entorno de staging inesperado.')
const apply = process.argv.includes('--apply')
if (process.argv.slice(2).some(arg => arg !== '--apply')) throw new Error('Argumento inesperado.')
const client = DynamoDBDocumentClient.from(new DynamoDBClient({region:'us-east-1'}))
const found = []
let ExclusiveStartKey
do {
  const page = await client.send(new ScanCommand({TableName:table,ConsistentRead:true,
    FilterExpression:'#entity = :content AND #kind = :award AND #status = :published',
    ExpressionAttributeNames:{'#entity':'entity','#kind':'kind','#status':'status'},
    ExpressionAttributeValues:{':content':'content',':award':'award',':published':'published'},
    ExclusiveStartKey}))
  found.push(...(page.Items || []))
  ExclusiveStartKey=page.LastEvaluatedKey
} while (ExclusiveStartKey)
const changes = AWARD_SEEDS.map(seed => {
  const row = found.find(item => item.slug === seed.slug)
  if (!row || row.title !== seed.title || row.pk !== `CONTENT#${row.id}` || row.sk !== 'META')
    throw new Error(`Premio publicado inesperado: ${seed.slug}`)
  const data = JSON.parse(row.data_json)
  const additions = Object.entries(seed.data).filter(([key]) => data[key] === undefined)
  return {row,data,additions}
})
console.log(JSON.stringify({mode:apply ? 'apply' : 'dry-run',changes:changes.map(({row,additions}) =>
  ({slug:row.slug,fields:additions.map(([key])=>key)}))},null,2))
if (!apply) process.exit(0)
const {store} = await import('../server/store/dynamo.js')
for (const {row,data,additions} of changes) {
  if (!additions.length) continue
  for (const [key,value] of additions) data[key]=value
  await store.saveContent('award',row.id,{
    title:row.title,slug:row.slug,status:row.status,dataJson:JSON.stringify(data),sortOrder:row.sort_order,
  },'system:jsx-content-migration')
  await store.audit('system:jsx-content-migration','award_presentation_enriched',row.id)
  const saved = (await client.send(new GetCommand({TableName:table,
    Key:{pk:`CONTENT#${row.id}`,sk:'META'},ConsistentRead:true}))).Item
  const confirmed = JSON.parse(saved.data_json)
  if (additions.some(([key,value]) => JSON.stringify(confirmed[key]) !== JSON.stringify(value)))
    throw new Error(`Presentación no confirmada: ${row.slug}`)
}
console.log('Premios publicados verificados en staging.')
