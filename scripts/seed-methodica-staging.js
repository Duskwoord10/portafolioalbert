import { METHODICA_SEED } from '../src/content/methodicaSeed.js'

const table = 'albert-cms-staging-api-CmsTable-IRPMELF0742D'
if (process.env.AWS_PROFILE !== 'default' || process.env.AWS_REGION !== 'us-east-1' ||
    process.env.CMS_DYNAMODB_TABLE !== table)
  throw new Error('Perfil, región o tabla de staging inesperados.')
const apply = process.argv.includes('--apply')
const { store } = await import('../server/store/dynamo.js')
const slug = 'methodica-technology'
const owner = await store.slugOwner('company',slug)
if (owner) {
  const row = await store.content('company',owner)
  if (!row || row.title !== METHODICA_SEED.name) throw new Error('Methodica existente difiere; revisión manual necesaria.')
  console.log('Methodica ya existe en staging; no se modificó.')
  process.exit(0)
}
console.log(`Methodica publicado previamente en JSX; ${apply ? 'crear' : 'dry-run'} registro CMS en staging.`)
if (apply) {
  const row = await store.saveContent('company',null,{
    slug,title:METHODICA_SEED.name,status:'published',sortOrder:0,
    dataJson:JSON.stringify({ ...METHODICA_SEED, description:METHODICA_SEED.introduction,
      city:'Santo Domingo',country:'República Dominicana',sector:'Tecnología' }),
  },'system:jsx-content-migration')
  await store.audit('system:jsx-content-migration','content_migrated',row.id)
  const saved = await store.content('company',row.id)
  if (saved?.status !== 'published' || saved.title !== METHODICA_SEED.name)
    throw new Error('No se confirmó publicación de Methodica.')
  console.log('Methodica publicado en CMS de staging y verificado.')
}
