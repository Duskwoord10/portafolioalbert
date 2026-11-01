import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createHmac, randomBytes, randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { passwordHash } from './security.js'

const folder = mkdtempSync(join(tmpdir(), 'albert-cms-test-'))
const port = 19000 + Math.floor(Math.random() * 10000)
const origin = 'http://localhost:5173'
const publicOrigin = 'http://public.localhost:5173'
const base = `http://127.0.0.1:${port}`
const recoveryOutbox = join(folder, 'recovery-test.json')
const server = spawn(process.execPath, ['server/index.js'], { cwd: process.cwd(),
  env: { ...process.env, CMS_PORT: String(port), CMS_DB_PATH: join(folder, 'cms.sqlite'),
    CMS_MEDIA_DIR: join(folder, 'media'), CMS_PUBLIC_ORIGIN: publicOrigin, CMS_ADMIN_ORIGIN: origin,
    CMS_SECURE_COOKIES: 'false', CMS_TOTP_ENCRYPTION_KEY: randomBytes(32).toString('hex'),
    NODE_ENV:'test', CMS_RECOVERY_FROM_EMAIL:'no-reply@albertsanfle.com',
    CMS_RECOVERY_TEST_OUTBOX:recoveryOutbox }, stdio: 'ignore' })
after(async () => { server.kill(); await once(server, 'exit'); rmSync(folder, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }) })
async function ready() {
  for (let attempt = 0; attempt < 30; attempt++) {
    try { const response = await fetch(`${base}/api/health`); if (response.ok) return } catch { /* starting */ }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('La API no arrancó')
}
async function request(path, { method = 'GET', body, cookie, csrf } = {}) {
  const response = await fetch(base + '/api' + path, { method, headers: { Origin: origin,
    ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}),
    ...(csrf ? { 'X-CSRF-Token': csrf } : {}) }, body: body ? JSON.stringify(body) : undefined })
  return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie') }
}
function totp(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = 0, value = 0; const out = []
  for (const char of secret) {
    value = (value << 5) | alphabet.indexOf(char); bits += 5
    if (bits >= 8) out.push((value >>> (bits -= 8)) & 255)
  }
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)))
  const digest = createHmac('sha1', Buffer.from(out)).update(counter).digest()
  const offset = digest[digest.length - 1] & 15
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, '0')
}

test('protección, MFA, publicación y lectura pública', async () => {
  await ready()
  const seeded = await request('/public/blog')
  assert.equal(seeded.status, 200)
  assert.equal(seeded.data.length, 5)
  const firstBlogPage = await request('/public/blog?limit=2')
  assert.equal(firstBlogPage.data.items.length, 2)
  assert.ok(firstBlogPage.data.nextCursor)
  const secondBlogPage = await request(`/public/blog?limit=2&cursor=${firstBlogPage.data.nextCursor}`)
  assert.equal(secondBlogPage.data.items.length, 2)
  assert.notEqual(firstBlogPage.data.items[0].id, secondBlogPage.data.items[0].id)
  assert.equal((await request('/public/blog?limit=101')).status, 400)
  const about = await request('/public/about/sobre-mi')
  assert.equal(about.status, 200)
  assert.match(about.data.data.lead, /automatizo/)
  const importedExperience = await request('/public/experience')
  assert.equal(importedExperience.data.length, 1)
  assert.equal(importedExperience.data[0].data.company, 'Never Off Technology')
  assert.equal((await request('/public/education')).data[0].data.institution, 'Instituto Tecnológico de Santo Domingo · INTEC')
  assert.equal((await request('/public/event')).data.length, 3)
  assert.equal((await request('/public/award')).data.length, 2)
  assert.equal((await request('/public/skill')).data.length, 25)
  const reseed = spawn(process.execPath, ['--input-type=module', '-e', "import('./server/db.js')"], {
    cwd:process.cwd(), env:{ ...process.env, CMS_DB_PATH:join(folder, 'cms.sqlite') }, stdio:'ignore',
  })
  assert.equal((await once(reseed, 'exit'))[0], 0)
  assert.equal((await request('/admin/experience')).status, 401)

  const db = new DatabaseSync(join(folder, 'cms.sqlite'))
  for (const kind of ['about','company','experience','education'])
    assert.equal(db.prepare('SELECT COUNT(*) AS total FROM content WHERE kind=?').get(kind).total, 1)
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM content WHERE kind=?').get('event').total, 3)
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM content WHERE kind=?').get('award').total, 2)
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM content WHERE kind=?').get('skill').total, 25)
  const { salt, value } = passwordHash('temporary-test-password')
  const adminId = randomUUID(), time = new Date().toISOString()
  db.prepare('INSERT INTO admins (id,email,password_hash,password_salt,role,created_at,updated_at) VALUES (?,?,?,?,?,?,?)')
    .run(adminId, 'test@example.invalid', value, salt, 'superadmin', time, time)
  db.close()

  const generic = await request('/password/recovery/request', { method:'POST',
    body:{ email:'missing@example.invalid' } })
  assert.equal(generic.status,200)
  assert.equal((await request('/password/recovery/request', { method:'POST',
    body:{ email:'test@example.invalid' } })).status,200)
  const emailed = JSON.parse(readFileSync(recoveryOutbox,'utf8'))
  assert.equal(emailed.email,'test@example.invalid')
  assert.equal(emailed.code.length,43)
  assert.equal((await request('/password/recovery/confirm', { method:'POST',
    body:{ email:'test@example.invalid',emailCode:'bad',next:'emailed-test-password-long' } })).status,401)
  assert.equal((await request('/password/recovery/confirm', { method:'POST',
    body:{ email:'test@example.invalid',emailCode:emailed.code,next:'emailed-test-password-long' } })).status,200)
  assert.equal((await request('/password/recovery/confirm', { method:'POST',
    body:{ email:'test@example.invalid',emailCode:emailed.code,next:'another-test-password' } })).status,401)

  const login = await request('/login', { method:'POST', body: { email:'test@example.invalid', password:'emailed-test-password-long' } })
  assert.equal(login.status, 200)
  let cookie = login.cookie.split(';')[0], csrf = login.data.csrf
  const publicSiteSession = await fetch(`${base}/api/session`, { headers:{ Origin:publicOrigin, Cookie:cookie } })
  assert.equal(publicSiteSession.status, 403)
  const publicSiteAdminRead = await fetch(`${base}/api/admin/experience`, { headers:{ Origin:publicOrigin, Cookie:cookie } })
  assert.equal(publicSiteAdminRead.status, 403)
  const publicSiteAdminWrite = await fetch(`${base}/api/admin/experience`, { method:'POST',
    headers:{ Origin:publicOrigin, Cookie:cookie, 'X-CSRF-Token':csrf, 'Content-Type':'application/json' },
    body:JSON.stringify({ title:'No permitido', status:'published', data:{} }) })
  assert.equal(publicSiteAdminWrite.status, 403)
  assert.equal((await request('/admin/experience', { cookie })).status, 403)
  const payload = { title:'Experiencia de prueba', slug:'experiencia-de-prueba', status:'draft',
    data:{ company:'Empresa de prueba', role:'Cloud Engineer' } }
  assert.equal((await request('/admin/experience', { method:'POST', body:payload, cookie, csrf })).status, 403)
  const setup = await request('/mfa/setup', { method:'POST', cookie, csrf })
  assert.equal(setup.status, 200)
  const encryptedDb = new DatabaseSync(join(folder, 'cms.sqlite'), { readOnly:true })
  assert.match(encryptedDb.prepare('SELECT totp_secret FROM admins WHERE id=?').get(adminId).totp_secret, /^pending:enc:v1:/)
  encryptedDb.close()
  assert.equal((await request('/mfa/verify', { method:'POST', body:{ code:totp(setup.data.secret) }, cookie, csrf })).status, 200)
  assert.equal((await request('/admin/recovery-code', { method:'POST', cookie, csrf,
    body:{ password:'incorrecta',code:totp(setup.data.secret) } })).status,403)
  const recovery=await request('/admin/recovery-code', { method:'POST', cookie, csrf,
    body:{ password:'emailed-test-password-long',code:totp(setup.data.secret) } })
  assert.equal(recovery.status,200)
  assert.equal(recovery.data.recoveryCode.length,43)
  const foreignRecovery=await fetch(`${base}/api/password/recover`, { method:'POST',
    headers:{ Origin:'https://otro.example','Content-Type':'application/json' },
    body:JSON.stringify({ email:'test@example.invalid',recoveryCode:recovery.data.recoveryCode,
      code:totp(setup.data.secret),next:'new-test-password-long' }) })
  assert.equal(foreignRecovery.status,403)
  assert.equal((await request('/password/recover', { method:'POST', body:{ email:'test@example.invalid',
    recoveryCode:recovery.data.recoveryCode,code:'000000',next:'new-test-password-long' } })).status,401)
  assert.equal((await request('/password/recover', { method:'POST', body:{ email:'test@example.invalid',
    recoveryCode:recovery.data.recoveryCode,code:totp(setup.data.secret),next:'new-test-password-long' } })).status,200)
  assert.equal((await request('/admin/skill', { cookie })).status,401)
  assert.equal((await request('/password/recover', { method:'POST', body:{ email:'test@example.invalid',
    recoveryCode:recovery.data.recoveryCode,code:totp(setup.data.secret),next:'another-test-password' } })).status,401)
  const relogin=await request('/login', { method:'POST', body:{ email:'test@example.invalid',
    password:'new-test-password-long',code:totp(setup.data.secret) } })
  assert.equal(relogin.status,200)
  cookie=relogin.cookie.split(';')[0]; csrf=relogin.data.csrf
  const recoveredDb=new DatabaseSync(join(folder,'cms.sqlite'),{ readOnly:true })
  const recoveredAdmin=recoveredDb.prepare('SELECT recovery_hash,auth_version FROM admins WHERE id=?').get(adminId)
  assert.equal(recoveredAdmin.recovery_hash,null)
  assert.equal(recoveredAdmin.auth_version,2)
  recoveredDb.close()
  assert.equal((await request('/password/recovery/request', { method:'POST',
    body:{ email:'test@example.invalid' } })).status,200)
  const secondEmailCode=JSON.parse(readFileSync(recoveryOutbox,'utf8')).code
  assert.equal((await request('/password/recovery/confirm', { method:'POST',
    body:{ email:'test@example.invalid',emailCode:secondEmailCode,
      next:'emailed-after-mfa-password' } })).status,401)
  assert.equal((await request('/password/recovery/confirm', { method:'POST',
    body:{ email:'test@example.invalid',emailCode:secondEmailCode,code:totp(setup.data.secret),
      next:'emailed-after-mfa-password' } })).status,200)
  assert.equal((await request('/admin/skill', { cookie })).status,401)
  const postEmailLogin=await request('/login', { method:'POST', body:{ email:'test@example.invalid',
    password:'emailed-after-mfa-password',code:totp(setup.data.secret) } })
  assert.equal(postEmailLogin.status,200)
  cookie=postEmailLogin.cookie.split(';')[0]; csrf=postEmailLogin.data.csrf
  assert.equal((await request('/admin/skill?limit=10', { cookie })).data.items.length, 10)
  assert.equal((await request('/admin/summary', { cookie })).data.counts.skill, 25)
  const verifiedDb = new DatabaseSync(join(folder, 'cms.sqlite'), { readOnly:true })
  assert.match(verifiedDb.prepare('SELECT totp_secret FROM admins WHERE id=?').get(adminId).totp_secret, /^enc:v1:/)
  verifiedDb.close()
  const aboutEdited = await request(`/admin/about/${about.data.id}`, { method:'PATCH', cookie, csrf,
    body:{ title:about.data.title, slug:about.data.slug, status:'published',
      data:{ ...about.data.data, lead:'Presentación actualizada desde el CMS.' } } })
  assert.equal(aboutEdited.status, 200)
  assert.equal((await request('/public/about/sobre-mi')).data.data.lead, 'Presentación actualizada desde el CMS.')
  const renamedAbout = await request(`/admin/about/${about.data.id}`, { method:'PATCH', cookie, csrf,
    body:{ title:about.data.title, slug:'perfil-profesional', status:'published', data:aboutEdited.data.data } })
  assert.equal(renamedAbout.status, 200)
  const reseedAfterRename = spawn(process.execPath, ['--input-type=module', '-e', "import('./server/db.js')"], {
    cwd:process.cwd(), env:{ ...process.env, CMS_DB_PATH:join(folder, 'cms.sqlite') }, stdio:'ignore',
  })
  assert.equal((await once(reseedAfterRename, 'exit'))[0], 0)
  assert.equal((await request('/public/about')).data.length, 1)
  assert.equal((await request('/public/about/perfil-profesional')).data.data.lead, 'Presentación actualizada desde el CMS.')
  const company = await request('/admin/company', { method:'POST', cookie, csrf,
    body:{ title:'Empresa de prueba', slug:'empresa-de-prueba', status:'published',
      data:{ city:'Santo Domingo' } } })
  assert.equal(company.status, 201)
  payload.data.companyId = company.data.id
  const draft = await request('/admin/experience', { method:'POST', body:payload, cookie, csrf })
  assert.equal(draft.status, 201)
  assert.equal((await request('/public/experience')).data.length, 1)
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/b9sAAAAASUVORK5CYII=', 'base64')
  const upload = await fetch(`${base}/api/admin/media`, { method:'POST',
    headers:{ Origin:origin, Cookie:cookie, 'X-CSRF-Token':csrf, 'Content-Type':'image/png',
      'X-Filename':'prueba.png' }, body:png })
  assert.equal(upload.status, 201)
  const savedFile = await upload.json()
  const mediaResponse = await fetch(`${base}${savedFile.url}`)
  assert.equal(mediaResponse.status, 200)
  assert.equal(mediaResponse.headers.get('content-type'), 'image/png')
  assert.equal(Buffer.from(await mediaResponse.arrayBuffer()).length, png.length)
  const secondUpload = await fetch(`${base}/api/admin/media`, { method:'POST',
    headers:{ Origin:origin, Cookie:cookie, 'X-CSRF-Token':csrf, 'Content-Type':'image/png',
      'X-Filename':'segunda.png' }, body:png })
  assert.equal(secondUpload.status, 201)
  const firstMediaPage = await request('/admin/media?limit=1', { cookie })
  assert.equal(firstMediaPage.data.items.length, 1)
  assert.ok(firstMediaPage.data.nextCursor)
  const secondMediaPage = await request(`/admin/media?limit=1&cursor=${firstMediaPage.data.nextCursor}`, { cookie })
  assert.equal(secondMediaPage.data.items.length, 1)
  assert.notEqual(firstMediaPage.data.items[0].id, secondMediaPage.data.items[0].id)
  assert.equal((await request('/admin/media?limit=101', { cookie })).status, 400)
  assert.equal((await request('/admin/media?limit=1&cursor=bad', { cookie })).status, 400)
  const project = await request('/admin/project', { method:'POST', cookie, csrf,
    body:{ title:'Proyecto de prueba', slug:'proyecto-de-prueba', status:'published',
      data:{ summary:'Proyecto usado solo para verificar el CMS.', image:savedFile.url } } })
  assert.equal(project.status, 201)
  assert.equal((await request('/public/project/proyecto-de-prueba')).data.data.image, savedFile.url)
  assert.equal((await request(`/admin/project/${project.data.id}`, { method:'PATCH', cookie, csrf,
    body:{ ...project.data, status:'archived' } })).status, 200)
  assert.equal((await request('/public/project/proyecto-de-prueba')).data, null)
  assert.equal((await request(`/admin/project/${project.data.id}`, { method:'PATCH', cookie, csrf,
    body:{ ...project.data, status:'published' } })).status, 200)
  assert.equal((await request('/public/project/proyecto-de-prueba')).data.title, 'Proyecto de prueba')
  assert.equal((await request(`/admin/analytics/project/${project.data.id}`)).status,401)
  assert.equal((await request('/analytics/pageview', { method:'POST',
    body:{ path:'/proyectos/proyecto-de-prueba' } })).status,200)
  const projectStats=await request(`/admin/analytics/project/${project.data.id}`, { cookie })
  assert.equal(projectStats.data.views,1)
  assert.equal(projectStats.data.path,'/proyectos/proyecto-de-prueba')
  assert.equal(projectStats.data.days.length,1)
  assert.equal((await request(`/admin/media/${savedFile.id}`, { method:'PATCH', body:{ alt:'Captura de prueba' } })).status, 401)
  assert.equal((await request(`/admin/media/${savedFile.id}`, { method:'PATCH', cookie, csrf,
    body:{ alt:'Captura de prueba' } })).status, 200)
  assert.equal((await request(`/admin/media/${savedFile.id}`, { method:'DELETE', cookie, csrf })).status, 409)
  assert.equal((await request(`/admin/media/${savedFile.id}`, { method:'PATCH', cookie, csrf,
    body:{ access:'private' } })).status, 409)
  const page = await request('/admin/page', { method:'POST', cookie, csrf,
    body:{ title:'Página de prueba', slug:'pagina-de-prueba', status:'published',
      data:{ blocks:[{ type:'text', title:'Sección', text:'Contenido verificable' }] } } })
  assert.equal(page.status, 201)
  assert.equal((await request('/public/page/pagina-de-prueba')).data.data.blocks[0].text, 'Contenido verificable')
  assert.equal((await request('/analytics/interaction', { method:'POST', body:{ event:'cv_download', path:'/cv/principal' } })).status, 200)
  assert.equal((await request('/analytics/interaction', { method:'POST', body:{ event:'desconocido', path:'/' } })).status, 400)
  assert.equal((await request('/admin/analytics', { cookie })).data.interactions[0].count, 1)
  const sitemap = await fetch(`${base}/sitemap.xml`).then(response => response.text())
  assert.ok(sitemap.includes('https://albertsanfle.com/pagina-de-prueba'))
  const menu = await request('/admin/menu', { method:'POST', cookie, csrf,
    body:{ title:'Menú principal de prueba', slug:'principal', status:'published',
      data:{ blocks:[{ type:'link', title:'Página de prueba', url:'/pagina-de-prueba' }] } } })
  assert.equal(menu.status, 201)
  assert.equal((await request('/public/menu')).data[0].data.blocks[0].url, '/pagina-de-prueba')
  assert.equal((await request('/admin/page', { method:'POST', cookie, csrf,
    body:{ title:'Colisión', slug:'blog', status:'published', data:{} } })).status, 409)
  const contact = await request('/contact', { method:'POST', body:{ name:'Persona de prueba',
    email:'persona@example.invalid', subject:'Consulta', message:'Mensaje de prueba suficientemente largo.' } })
  assert.equal(contact.status, 201)
  const inbox = await request('/admin/messages', { cookie })
  assert.equal(inbox.data.length, 1)
  assert.equal(inbox.data[0].email, 'persona@example.invalid')
  assert.equal((await request(`/admin/messages/${inbox.data[0].id}`, { method:'PATCH',
    cookie, csrf, body:{ status:'archived' } })).status, 200)
  const published = await request(`/admin/experience/${draft.data.id}`, { method:'PATCH',
    body:{ ...payload, status:'published' }, cookie, csrf })
  assert.equal(published.status, 200)
  assert.ok((await request('/public/experience')).data.some(row => row.data.company === 'Empresa de prueba'))
  assert.equal((await request(`/admin/experience/${draft.data.id}/revisions`, { cookie })).data.length, 1)
  assert.equal((await request(`/admin/experience/${draft.data.id}`, { method:'DELETE', cookie, csrf })).status, 200)
  assert.equal((await request('/public/experience')).data.length, 1)
  assert.equal((await request(`/admin/project/${project.data.id}`, { method:'DELETE', cookie, csrf })).status, 200)
  assert.equal((await request(`/admin/media/${savedFile.id}`, { method:'PATCH', cookie, csrf,
    body:{ access:'private', alt:'Captura privada' } })).status, 200)
  assert.equal((await fetch(`${base}${savedFile.url}`)).status, 401)
  assert.equal((await fetch(`${base}${savedFile.url}`, { headers:{ Cookie:cookie } })).status, 200)
  assert.equal((await request(`/admin/media/${savedFile.id}`, { method:'DELETE', cookie, csrf })).status, 200)
  assert.equal((await fetch(`${base}${savedFile.url}`, { headers:{ Cookie:cookie } })).status, 404)
  assert.equal((await request(`/admin/media/${savedFile.id}/restore`, { method:'POST', cookie, csrf })).status, 200)
  assert.equal((await fetch(`${base}${savedFile.url}`, { headers:{ Cookie:cookie } })).status, 200)
  assert.equal((await request('/admin/password', { method:'POST', cookie, csrf:'incorrecto',
    body:{ current:'emailed-after-mfa-password', next:'another-test-password', code:totp(setup.data.secret) } })).status, 403)
  assert.equal((await request('/admin/password', { method:'POST', cookie, csrf,
    body:{ current:'emailed-after-mfa-password', next:'another-test-password', code:totp(setup.data.secret) } })).status, 200)
})
