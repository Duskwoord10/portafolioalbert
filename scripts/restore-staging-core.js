import { createHash } from 'node:crypto'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { existingNavigation } from '../src/cms/navigation.js'

const table = 'albert-cms-staging-api-CmsTable-IRPMELF0742D'
if (process.env.AWS_PROFILE !== 'default' || process.env.AWS_REGION !== 'us-east-1' ||
    process.env.CMS_DYNAMODB_TABLE !== table)
  throw new Error('El entorno de staging no coincide con el esperado.')
const apply = process.argv.includes('--apply')
if (process.argv.some((arg, index) => index > 1 && arg !== '--apply'))
  throw new Error('Argumento inesperado.')
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }))
const get = async (pk, sk = 'META') => (await client.send(new GetCommand({ TableName: table,
  Key: { pk, sk }, ConsistentRead: true }))).Item || null
const digest = value => createHash('sha256').update(value || '').digest('hex')
const about = await get('CONTENT#ffdb60ad-715e-44f5-ae37-7ab7a169af90')
if (!about || about.kind !== 'about' || about.slug !== 'sobre-mi') throw new Error('Sobre mí inesperado.')
const latest = await client.send(new QueryCommand({ TableName: table, ConsistentRead: true,
  KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
  ExpressionAttributeValues: { ':pk': about.pk, ':prefix': 'REV#' },
  ScanIndexForward: false, Limit: 1 }))
const prior = latest.Items?.[0]
if (about.status !== 'trash' && about.status !== 'published') throw new Error('Estado de Sobre mí inesperado.')
if (about.status === 'trash' && (!prior || prior.status !== 'published' ||
    digest(prior.data_json) !== digest(about.data_json) || prior.title !== about.title))
  throw new Error('La última revisión de Sobre mí difiere; requiere revisión manual.')
const owner = await get('SLUG#menu#principal', 'LOCK')
const menuData = { blocks: existingNavigation.map(link => ({ type: 'link', title: link.label, url: link.to })) }
const existingMenu = owner?.content_id ? await get(`CONTENT#${owner.content_id}`) : null
if (owner && (!existingMenu || existingMenu.kind !== 'menu' || existingMenu.slug !== 'principal'))
  throw new Error('El slug del menú ya tiene un dueño inesperado.')
console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run',
  about: { status: about.status, version: about.version,
    action: about.status === 'trash' ? 'publicar mismos datos' : 'sin cambio' },
  menu: { status: existingMenu?.status || 'ausente',
    action: existingMenu ? 'conservar menú existente' : 'crear navegación original',
    links: existingMenu ? JSON.parse(existingMenu.data_json).blocks?.length : menuData.blocks.length } }))
if (!apply) process.exit(0)

const { store } = await import('../server/store/dynamo.js')
const actor = 'system:staging-core-reconciliation'
if (about.status === 'trash') {
  await store.saveContent('about', about.id, { slug: about.slug, title: about.title,
    status: 'published', dataJson: about.data_json, sortOrder: about.sort_order }, actor)
  await store.audit(actor, 'about_republished_without_data_change', about.id)
}
let created = existingMenu
if (!existingMenu) {
  created = await store.saveContent('menu', null, { slug: 'principal', title: 'Menú principal',
    status: 'published', dataJson: JSON.stringify(menuData), sortOrder: 0 }, actor)
  await store.audit(actor, 'original_menu_created', created.id)
}
const verifiedAbout = await get(about.pk)
const verifiedMenu = await get(created.pk)
if (verifiedAbout?.status !== 'published' || digest(verifiedAbout.data_json) !== digest(about.data_json) ||
    verifiedMenu?.status !== 'published' ||
    verifiedMenu.data_json !== (existingMenu?.data_json || JSON.stringify(menuData)))
  throw new Error('Falló la verificación posterior.')
console.log(JSON.stringify({ result: 'verificado', aboutId: about.id, menuId: created.id }))
