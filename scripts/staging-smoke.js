import assert from 'node:assert/strict'
import { createHmac, randomBytes, randomUUID } from 'node:crypto'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { passwordHash } from '../server/security.js'

const origin = process.env.CMS_STAGING_ORIGIN
const table = process.env.CMS_DYNAMODB_TABLE
if (process.env.CMS_STAGING_TEST_APPLY !== 'YES' ||
    !/^https:\/\/d[a-z0-9]+\.cloudfront\.net$/.test(origin || '') ||
    !/^albert-cms-staging-api-CmsTable-/.test(table || ''))
  throw new Error('Configura el origen HTTPS y la tabla exclusivamente de staging, con CMS_STAGING_TEST_APPLY=YES.')

const { store } = await import('../server/store/dynamo.js')
await store.ready()
if (await store.adminCount()) throw new Error('Staging ya tiene un administrador; no se ejecuta la prueba temporal.')

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const id = randomUUID()
const email = `cms-staging-smoke-${id}@example.invalid`
let password = randomBytes(32).toString('base64url')
const now = new Date().toISOString()
const hashed = passwordHash(password)
await store.createAdmin({ id, email, password_hash:hashed.value, password_salt:hashed.salt,
  role:'superadmin', created_at:now, updated_at:now })

let cookie, csrf, secret
let mediaId
const created=[]
const results=[]
const record = (name, detail = 'OK') => { results.push({ name, detail }); console.log(`${name}: ${detail}`) }
async function request(path, { method='GET', data, auth=true } = {}) {
  const response=await fetch(`${origin}/api${path}`, { method, redirect:'manual', headers:{ Origin:origin,
    ...(auth && cookie ? { Cookie:cookie } : {}),
    ...(auth && csrf && method !== 'GET' ? { 'X-CSRF-Token':csrf } : {}),
    ...(data ? { 'Content-Type':'application/json' } : {}) },
    body:data ? JSON.stringify(data) : undefined })
  const body=await response.json().catch(() => null)
  return { status:response.status, body, cookie:response.headers.get('set-cookie') }
}
function code() {
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits=0,value=0;const bytes=[]
  for (const char of secret) {
    value=(value << 5)|alphabet.indexOf(char);bits+=5
    if (bits>=8) bytes.push((value >>> (bits-=8))&255)
  }
  const counter=Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)))
  const digest=createHmac('sha1',Buffer.from(bytes)).update(counter).digest()
  const offset=digest[digest.length-1]&15
  return String((digest.readUInt32BE(offset)&0x7fffffff)%1_000_000).padStart(6,'0')
}
function check(response,status,label) {
  assert.equal(response.status,status,`${label}: HTTP ${response.status}, ${JSON.stringify(response.body)}`)
  return response.body
}
async function content(kind,title,data) {
  const slug=`smoke-${kind}-${id.slice(0,8)}`
  const draft=check(await request(`/admin/${kind}`,{ method:'POST',data:{ title,slug,status:'draft',data } }),201,`${kind} borrador`)
  created.push({ kind,id:draft.id,slug })
  assert.equal((await request(`/public/${kind}/${slug}`,{ auth:false })).body,null)
  const published=check(await request(`/admin/${kind}/${draft.id}`,{ method:'PATCH',
    data:{ title,slug,status:'published',data } }),200,`${kind} publicación`)
  assert.equal((await request(`/public/${kind}/${slug}`,{ auth:false })).body?.id,draft.id)
  const edited=check(await request(`/admin/${kind}/${draft.id}`,{ method:'PATCH',
    data:{ title:`${title} editado`,slug,status:'published',data:published.data } }),200,`${kind} edición`)
  assert.equal((await request(`/public/${kind}/${slug}`,{ auth:false })).body?.title,edited.title)
  record(kind,'borrador, publicación, edición y lectura pública')
  return edited
}

try {
  assert.equal((await request('/admin/project',{ auth:false })).status,401)
  record('acceso sin sesión','HTTP 401')
  const login=await request('/login',{ method:'POST',auth:false,data:{ email,password } })
  check(login,200,'login')
  cookie=login.cookie?.split(';')[0];csrf=login.body.csrf
  assert.ok(cookie && csrf)
  assert.equal((await request('/admin/project')).status,403)
  const setup=check(await request('/mfa/setup',{ method:'POST' }),200,'MFA setup')
  secret=setup.secret
  check(await request('/mfa/verify',{ method:'POST',data:{ code:code() } }),200,'MFA verify')
  record('autenticación y MFA')

  const recovery=check(await request('/admin/recovery-code',{ method:'POST',
    data:{ password,code:code() } }),200,'código recuperación')
  const nextPassword=randomBytes(32).toString('base64url')
  check(await request('/password/recover',{ method:'POST',auth:false,
    data:{ email,recoveryCode:recovery.recoveryCode,code:code(),next:nextPassword } }),200,'recuperación')
  assert.equal((await request('/admin/project')).status,401)
  password=nextPassword
  const relogin=await request('/login',{ method:'POST',auth:false,data:{ email,password,code:code() } })
  check(relogin,200,'relogin')
  cookie=relogin.cookie?.split(';')[0];csrf=relogin.body.csrf
  record('recuperación','código usado y sesión anterior revocada')

  const company=await content('company','STAGING Empresa de prueba',{})
  await content('experience','STAGING Experiencia de prueba',{
    company:'STAGING Empresa de prueba',companyId:company.id,role:'Cargo de prueba' })
  await content('project','STAGING Proyecto de prueba',{ summary:'Contenido técnico temporal para staging.' })
  await content('certification','STAGING Certificación de prueba',{ issuer:'Emisor de prueba' })
  await content('event','STAGING Evento de prueba',{ organizer:'Organización de prueba' })
  await content('blog','STAGING Artículo de prueba',{ excerpt:'Artículo temporal de staging.',blocks:[{ type:'text',text:'Prueba de publicación.' }] })
  await content('page','STAGING Página de prueba',{ blocks:[{ type:'text',text:'Página temporal de staging.' }] })

  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/b9sAAAAASUVORK5CYII=','base64')
  const uploaded=await fetch(`${origin}/api/admin/media`,{ method:'POST',headers:{ Origin:origin,Cookie:cookie,
    'X-CSRF-Token':csrf,'Content-Type':'image/png','X-Filename':'staging-smoke.png' },body:png })
  assert.equal(uploaded.status,201,`subida de imagen: HTTP ${uploaded.status}`)
  const media=await uploaded.json()
  mediaId=media.id
  const fetched=await fetch(`${origin}${media.url}`,{ headers:{ Cookie:cookie } })
  assert.equal(fetched.status,200)
  assert.deepEqual(Buffer.from(await fetched.arrayBuffer()),png)
  record('imagen S3','subida API y recuperación idéntica')
  check(await request(`/admin/media/${media.id}`,{ method:'PATCH',data:{ access:'private' } }),200,'medio privado')
  assert.equal((await fetch(`${origin}${media.url}`,{ redirect:'manual' })).status,401)
  const signed=await fetch(`${origin}${media.url}`,{ headers:{ Cookie:cookie },redirect:'manual' })
  assert.equal(signed.status,302)
  const signedUrl=signed.headers.get('location')
  assert.ok(signedUrl?.startsWith('https://'))
  const privateFile=await fetch(signedUrl)
  assert.equal(privateFile.status,200)
  assert.deepEqual(Buffer.from(await privateFile.arrayBuffer()),png)
  record('archivo privado','sin sesión 401; sesión autorizada recibe URL firmada temporal')

  const summary=check(await request('/admin/summary'),200,'resumen')
  assert.ok(summary.counts)
  record('dashboard','conteos reales disponibles')
  for (const row of [...created].reverse()) {
    check(await request(`/admin/${row.kind}/${row.id}`,{ method:'DELETE' }),200,`${row.kind} papelera`)
    assert.equal((await request(`/public/${row.kind}/${row.slug}`,{ auth:false })).body,null)
  }
  created.length=0
  if (mediaId) check(await request(`/admin/media/${mediaId}`,{ method:'DELETE' }),200,'medio papelera')
  record('papelera','contenidos de prueba retirados de lectura pública')
  check(await request('/logout',{ method:'POST' }),200,'logout')
  assert.equal((await request('/admin/project')).status,401)
  record('cierre de sesión','sesión revocada')
} finally {
  try {
    if (cookie && csrf) for (const row of [...created].reverse()) {
      await request(`/admin/${row.kind}/${row.id}`,{ method:'DELETE' }).catch(() => {})
    }
  } finally {
    await client.send(new DeleteCommand({ TableName:table,Key:{ pk:`ADMIN#${id}`,sk:'PROFILE' },
      ConditionExpression:'id = :id',ExpressionAttributeValues:{ ':id':id } }))
    await client.send(new DeleteCommand({ TableName:table,Key:{ pk:'ADMIN#SINGLETON',sk:'LOCK' },
      ConditionExpression:'admin_id = :id',ExpressionAttributeValues:{ ':id':id } }))
    record('limpieza','cuenta temporal retirada; contenidos de prueba en papelera')
  }
}
