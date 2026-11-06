import { createServer } from 'node:http'
import { randomBytes, randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import { createMediaStorage } from './aws/storage.js'
import { sendPasswordRecovery } from './aws/email.js'
import { translateTexts } from './aws/translation.js'
import { LambdaClient } from '@aws-sdk/client-lambda'
import { createChatbotService, validateChatMessage } from './aws/chatbot.js'
import { checkPassword, encryptTotp, hash, newTotpSecret, passwordHash, readTotp, verifyTotp } from './security.js'

const port = Number(process.env.CMS_PORT || 8787)
const backend = process.env.CMS_DATA_BACKEND || 'sqlite'
if (!['sqlite','dynamodb'].includes(backend)) throw new Error('CMS_DATA_BACKEND inválido.')
if (process.env.NODE_ENV === 'production' && process.env.CMS_LAMBDA_MODE === 'true' &&
    (backend !== 'dynamodb' || process.env.CMS_MEDIA_BACKEND !== 's3'))
  throw new Error('Lambda de producción requiere DynamoDB y S3 persistentes.')
const { store } = backend === 'sqlite' ? await import('./store/sqlite.js') : await import('./store/dynamo.js')
await store.ready(process.env.NODE_ENV === 'production')
const mediaStorage = createMediaStorage()
const chatbot = createChatbotService(new LambdaClient({ region:process.env.AWS_REGION || 'us-east-1' }),
  process.env.CMS_CHATBOT_FUNCTION_ARN || '')
if (process.env.NODE_ENV === 'production') {
  for (const key of ['CMS_PUBLIC_ORIGIN','CMS_ADMIN_ORIGIN']) {
    if (!process.env[key] || !/^https:\/\/[^/]+$/i.test(process.env[key]))
      throw new Error(`${key} debe ser un origen HTTPS explícito en producción.`)
  }
  if (process.env.CMS_ADDITIONAL_PUBLIC_ORIGIN &&
      !/^https:\/\/[^/]+$/i.test(process.env.CMS_ADDITIONAL_PUBLIC_ORIGIN))
    throw new Error('CMS_ADDITIONAL_PUBLIC_ORIGIN debe ser un origen HTTPS explícito.')
  if (process.env.CMS_TEMP_ADMIN_ORIGIN &&
      !/^https:\/\/d[a-z0-9]+\.cloudfront\.net$/i.test(process.env.CMS_TEMP_ADMIN_ORIGIN))
    throw new Error('CMS_TEMP_ADMIN_ORIGIN debe ser el dominio HTTPS de CloudFront.')
  if (process.env.CMS_SECURE_COOKIES === 'false')
    throw new Error('No se permiten cookies administrativas sin Secure en producción.')
}
const allowedOrigins = new Set([
  process.env.CMS_PUBLIC_ORIGIN || 'http://localhost:5173',
  ...(process.env.CMS_ADDITIONAL_PUBLIC_ORIGIN ? [process.env.CMS_ADDITIONAL_PUBLIC_ORIGIN] : []),
  process.env.CMS_ADMIN_ORIGIN || 'http://localhost:5173',
  ...(process.env.CMS_TEMP_ADMIN_ORIGIN ? [process.env.CMS_TEMP_ADMIN_ORIGIN] : []),
  ...(process.env.NODE_ENV === 'production' ? [] : ['http://127.0.0.1:5173']),
])
const adminOrigins = new Set([
  process.env.CMS_ADMIN_ORIGIN || 'http://localhost:5173',
  ...(process.env.CMS_TEMP_ADMIN_ORIGIN ? [process.env.CMS_TEMP_ADMIN_ORIGIN] : []),
  ...(process.env.NODE_ENV === 'production' ? [] : ['http://127.0.0.1:5173']),
])
const kinds = new Set(['home','about','company','experience','project','certification','event','album','blog',
  'page','education','skill','award','cv','menu','setting'])
const publicKinds = new Set([...kinds].filter(kind => kind !== 'setting'))
const reservedSlugs = new Set(['sobre-mi','certificaciones','blog','contacto','methodica','admin','api',
  'experiencia','proyectos','eventos','galeria','educacion','reconocimientos','habilidades'])
const loginAttempts = new Map()
const recoveryAttempts = new Map()
const recoveryRequestAttempts = new Map()
const pageviewThrottle = new Map()
const interactionThrottle = new Map()
const contactThrottle = new Map()
const translationThrottle = new Map()
const translationCharacterThrottle = new Map()
const chatThrottle = new Map()
const chatDailyThrottle = new Map()
const now = () => new Date().toISOString()
const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff' })
  res.end(JSON.stringify(body))
}
const error = (res, status, message) => json(res, status, { error: message })
const audit = (adminId, action, target) => store.audit(adminId, action, target)
const cookies = req => Object.fromEntries((req.headers.cookie || '').split(';').map(part => {
  const [key, ...value] = part.trim().split('='); return [key, value.join('=')]
}).filter(([key]) => key))
const secure = process.env.NODE_ENV === 'production' || process.env.CMS_SECURE_COOKIES === 'true' ||
  (process.env.CMS_SECURE_COOKIES !== 'false' && !allowedOrigins.has('http://localhost:5173'))
const cookieOptions = `HttpOnly; SameSite=Strict; Path=/api; ${secure ? 'Secure; ' : ''}`
async function session(req) {
  const token = cookies(req).cms_session
  if (!token) return null
  const found = await store.session(hash(token))
  return found ? { ...found, totp_secret:readTotp(found.totp_secret) } : null
}
async function requireAdmin(req, res, mutate = false, allowMfaSetup = false) {
  if (req.headers.origin && !adminOrigins.has(req.headers.origin)) {
    error(res, 403, 'Origen administrativo no autorizado.'); return null
  }
  const auth = await session(req)
  if (!auth) { error(res, 401, 'Inicia sesión para continuar.'); return null }
  if (!allowMfaSetup && (!auth.totp_secret || auth.totp_secret.startsWith('pending:'))) {
    error(res, 403, 'Configura MFA antes de acceder al panel.'); return null
  }
  if (mutate && (!req.headers.origin || !adminOrigins.has(req.headers.origin) ||
    req.headers['x-csrf-token'] !== auth.csrf_token)) {
    error(res, 403, 'Solicitud no autorizada.'); return null
  }
  if (mutate && auth.role === 'reader') { error(res, 403, 'Permiso insuficiente.'); return null }
  return auth
}
async function body(req, max = 1_000_000) {
  const parts = []; let size = 0
  for await (const part of req) {
    size += part.length
    if (size > max) throw Object.assign(new Error('Archivo o solicitud demasiado grande.'), { status: 413 })
    parts.push(part)
  }
  return Buffer.concat(parts)
}
const parseJson = async req => JSON.parse((await body(req)).toString('utf8') || '{}')
const publicRow = row => {
  const { pk,sk,entity,gsi1pk,gsi1sk,migration_sha256,version,data_json,...visible } = row
  void pk; void sk; void entity; void gsi1pk; void gsi1sk; void migration_sha256; void version
  return { ...visible,data:JSON.parse(data_json) }
}
const slugify = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100)
const eventIdOf = input => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  .test(String(input.eventId || '')) ? input.eventId.toLowerCase() : null
const pageLimit = url => {
  const raw=url.searchParams.get('limit')
  if (!raw) return null
  const limit=Number(raw)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100)
    throw Object.assign(new Error('Límite inválido (1 a 100).'),{ status:400 })
  return limit
}
async function validate(kind, input) {
  if (!kinds.has(kind)) throw Object.assign(new Error('Tipo de contenido inválido.'), { status: 400 })
  const title = String(input.title || '').trim().slice(0, 180)
  const slug = slugify(input.slug || title)
  const status = input.status || 'draft'
  if (!title || !slug || !['draft','published','archived','trash'].includes(status))
    throw Object.assign(new Error('Título, URL o estado inválido.'), { status: 400 })
  if (kind === 'page' && reservedSlugs.has(slug))
    throw Object.assign(new Error('La URL está reservada por una página existente.'), { status: 409 })
  if (!input.data || typeof input.data !== 'object' || Array.isArray(input.data))
    throw Object.assign(new Error('Los datos del contenido deben ser un objeto.'), { status: 400 })
  const dataJson = JSON.stringify(input.data)
  if (kind === 'experience' && input.data.companyId &&
    !await store.companyExists(input.data.companyId))
    throw Object.assign(new Error('La empresa seleccionada no existe.'), { status: 400 })
  if (dataJson.length > 100_000) throw Object.assign(new Error('Contenido demasiado grande.'), { status: 413 })
  // El público renderiza texto React; no se permite HTML arbitrario almacenado.
  if (/<\s*(script|iframe|object|embed|style)\b|(?:javascript|vbscript|data)\s*:/i.test(dataJson))
    throw Object.assign(new Error('No se permite HTML ejecutable.'), { status: 400 })
  return { title, slug, status, dataJson, sortOrder: Number.isFinite(Number(input.sort_order)) ? Number(input.sort_order) : 0 }
}
async function rateLimit(map, key, limit, interval, weight = 1) {
  if (backend === 'dynamodb') {
    const scope = map === loginAttempts ? 'login' : map === recoveryAttempts ? 'recovery' :
      map === recoveryRequestAttempts ? 'recovery-request' :
      map === contactThrottle ? 'contact' :
      map === pageviewThrottle ? 'pageview' :
      map === translationThrottle ? 'translation-v3' :
      map === translationCharacterThrottle ? 'translation-daily-v1' :
      map === chatThrottle ? 'public-chat-minute-v1' :
      map === chatDailyThrottle ? 'public-chat-daily-v1' : 'interaction'
    return store.rateLimit(scope, hash(key), limit, interval, weight)
  }
  const item = map.get(key)
  const current = Date.now()
  if (!item || item.until < current) { map.set(key, { count: 1, until: current + interval }); return false }
  item.count += weight
  return item.count > limit
}
function originHeaders(req, res) {
  const origin = req.headers.origin
  if (allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-CSRF-Token,X-Filename,X-Media-Access')
    res.setHeader('Vary', 'Origin')
  }
}
const route = async (req, res) => {
  originHeaders(req, res)
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
  const url = new URL(req.url, 'http://localhost')
  const path = url.pathname
  if (path === '/sitemap.xml' && req.method === 'GET') {
    const site = (process.env.CMS_SITE_URL || 'https://albertsanfle.com').replace(/\/$/, '')
    const staticPaths = ['/', '/sobre-mi', '/experiencia', '/certificaciones', '/blog', '/contacto']
    const entries = await store.sitemapEntries()
    const routes = [...staticPaths.map(route => ({ path:route })), ...entries.map(entry => ({
      path:entry.kind === 'blog' ? `/blog/${entry.slug}` : entry.kind === 'experience' ? `/experiencia/${entry.slug}` : entry.kind === 'project' ? `/proyectos/${entry.slug}` :
        entry.kind === 'event' ? `/eventos/${entry.slug}` : entry.kind === 'album' ? `/galeria/${entry.slug}` : `/${entry.slug}`,
      updated:entry.updated_at,
    }))]
    const xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      routes.map(route => `<url><loc>${site}${route.path}</loc>${route.updated ? `<lastmod>${route.updated.slice(0,10)}</lastmod>` : ''}</url>`).join('') + '</urlset>'
    res.writeHead(200, { 'Content-Type':'application/xml; charset=utf-8', 'Cache-Control':'public,max-age=300' })
    res.end(xml); return
  }
  if (path === '/api/health') return json(res, 200, { ok: true })
  if (path === '/api/public/chat' && req.method === 'POST') {
    const origin = req.headers.origin || ''
    const publicOrigins = new Set([process.env.CMS_PUBLIC_ORIGIN || 'http://localhost:5173',
      ...(process.env.CMS_ADDITIONAL_PUBLIC_ORIGIN ? [process.env.CMS_ADDITIONAL_PUBLIC_ORIGIN] : [])])
    if (!publicOrigins.has(origin)) return error(res, 403, 'Origen del portafolio no autorizado.')
    const input = await parseJson(req, 2_000)
    const message = validateChatMessage(input)
    if (!message) return error(res, 400, 'Escribe un mensaje válido de hasta 800 caracteres.')
    const address = req.socket?.remoteAddress || 'unknown'
    if (await rateLimit(chatThrottle, address, 5, 60_000) ||
        await rateLimit(chatDailyThrottle, address, 30, 24 * 60 * 60_000))
      return error(res, 429, 'Has alcanzado el límite temporal del asistente.')
    try { return json(res, 200, { message:await chatbot(message) }) }
    catch (chatError) {
      return error(res, chatError.status === 503 ? 503 : 502,
        'El asistente no está disponible temporalmente.')
    }
  }
  if (path === '/api/public/translate' && req.method === 'POST') {
    const input = await parseJson(req, 20_000)
    if (!input || typeof input !== 'object' || Array.isArray(input))
      return error(res, 400, 'La solicitud de traducción no es válida.')
    const { texts, sourceLanguage, targetLanguage } = input
    if (!Array.isArray(texts) || texts.length < 1 || texts.length > 30 ||
        !['es','en'].includes(sourceLanguage) || !['es','en'].includes(targetLanguage) ||
        sourceLanguage === targetLanguage || texts.some(text => typeof text !== 'string' ||
          !text.trim() || text.length > 1500) || texts.reduce((sum,text) => sum + text.length,0) > 6000)
      return error(res, 400, 'La solicitud de traducción no es válida.')
    const address = req.socket?.remoteAddress || 'unknown'
    if (await rateLimit(translationThrottle, address, 100, 60 * 60_000))
      return error(res, 429, 'Se alcanzó el límite temporal de traducción. Intenta más tarde.')
    const characterCount = texts.reduce((sum,text) => sum + text.length,0)
    if (await rateLimit(translationCharacterThrottle, 'all-visitors', 25_000, 24 * 60 * 60_000, characterCount))
      return error(res, 429, 'Se alcanzÃ³ el lÃ­mite diario de traducciÃ³n. Intenta maÃ±ana.')
    try {
      return json(res, 200, { translations:await translateTexts(texts,sourceLanguage,targetLanguage) })
    } catch (translateError) {
      if (translateError.status === 400) return error(res, 400, 'La solicitud de traducción no es válida.')
      return error(res, 503, 'Amazon Translate no está disponible temporalmente.')
    }
  }
  if (path === '/api/session' && req.method === 'GET') {
    if (req.headers.origin && !adminOrigins.has(req.headers.origin))
      return error(res, 403, 'Origen administrativo no autorizado.')
    const auth = await session(req)
    return json(res, 200, auth ? { authenticated: true, email: auth.email, role: auth.role,
      mfaConfigured: Boolean(auth.totp_secret && !auth.totp_secret.startsWith('pending:')),
      csrf: auth.csrf_token } : { authenticated: false })
  }
  if (path === '/api/login' && req.method === 'POST') {
    if (!adminOrigins.has(req.headers.origin)) return error(res, 403, 'Origen no autorizado.')
    const input = await parseJson(req)
    const email = String(input.email || '').trim().toLowerCase()
    if (email.length > 254 || String(input.password || '').length > 128)
      return error(res, 401, 'Credenciales inválidas.')
    const key = backend === 'dynamodb' ? email || req.socket.remoteAddress || 'unknown' :
      req.socket.remoteAddress || 'unknown'
    if (await rateLimit(loginAttempts, key, 8, 15 * 60_000)) return error(res, 429, 'Demasiados intentos. Intenta más tarde.')
    const admin = await store.adminByEmail(email)
    const totp = readTotp(admin?.totp_secret)
    if (!admin || !checkPassword(String(input.password || ''), admin.password_salt, admin.password_hash) ||
      (totp && !totp.startsWith('pending:') && !verifyTotp(totp, input.code)))
      return error(res, 401, 'Credenciales inválidas.')
    loginAttempts.delete(key)
    const token = randomBytes(32).toString('base64url')
    const csrf = randomBytes(24).toString('base64url')
    const expires = new Date(Date.now() + 8 * 60 * 60_000).toISOString()
    await store.createSession({ token_hash:hash(token),admin_id:admin.id,csrf_token:csrf,
      expires_at:expires,created_at:now(),auth_version:admin.auth_version || 0 })
    res.setHeader('Set-Cookie', `cms_session=${token}; ${cookieOptions}Max-Age=28800`)
    await audit(admin.id, 'login', null)
    return json(res, 200, { authenticated: true, email, role: admin.role,
      mfaConfigured: Boolean(admin.totp_secret && !admin.totp_secret.startsWith('pending:')), csrf })
  }
  if (path === '/api/logout' && req.method === 'POST') {
    const auth = await session(req)
    if (!auth || !adminOrigins.has(req.headers.origin) ||
      req.headers['x-csrf-token'] !== auth.csrf_token) return error(res, 403, 'Solicitud no autorizada.')
    await store.deleteSession(auth.token_hash)
    res.setHeader('Set-Cookie', `cms_session=; ${cookieOptions}Max-Age=0`)
    await audit(auth.admin_id, 'logout', null)
    return json(res, 200, { ok: true })
  }
  if (path === '/api/password/recovery/request' && req.method === 'POST') {
    if (!adminOrigins.has(req.headers.origin)) return error(res, 403, 'Origen no autorizado.')
    if (!process.env.CMS_RECOVERY_FROM_EMAIL)
      return error(res, 503, 'La recuperación por correo no está disponible ahora.')
    const input = await parseJson(req)
    const email = String(input.email || '').trim().toLowerCase()
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return error(res, 400, 'Correo inválido.')
    const address = req.socket.remoteAddress || 'unknown'
    if (await rateLimit(recoveryRequestAttempts, `email:${email}`, 3, 60 * 60_000) ||
      await rateLimit(recoveryRequestAttempts, `ip:${address}`, 20, 60 * 60_000))
      return error(res, 429, 'Demasiadas solicitudes. Intenta más tarde.')
    const admin = await store.adminByEmail(email)
    if (admin) {
      const code = randomBytes(32).toString('base64url')
      const codeHash = hash(code)
      await store.setEmailRecoveryCode(admin.id, codeHash,
        new Date(Date.now() + 15 * 60_000).toISOString(), now())
      try { await sendPasswordRecovery(email, code) }
      catch (sendError) {
        try { await store.clearEmailRecoveryCode(admin.id, codeHash) } catch { /* Replaced by another request. */ }
        console.error('No se pudo enviar el correo de recuperación:', sendError.name)
        return error(res, 503, 'La recuperación por correo no está disponible ahora.')
      }
      await audit(admin.id, 'email_recovery_requested', null)
    }
    return json(res, 200, { ok: true,
      message: 'Si el correo pertenece a una cuenta, recibirás un código válido durante 15 minutos.' })
  }
  if (path === '/api/password/recovery/confirm' && req.method === 'POST') {
    if (!adminOrigins.has(req.headers.origin)) return error(res, 403, 'Origen no autorizado.')
    const input = await parseJson(req)
    const email = String(input.email || '').trim().toLowerCase()
    const code = String(input.emailCode || '').trim()
    const address = req.socket.remoteAddress || 'unknown'
    if (await rateLimit(recoveryAttempts, `email:${email}`, 8, 60 * 60_000) ||
      await rateLimit(recoveryAttempts, `ip:${address}`, 40, 60 * 60_000))
      return error(res, 429, 'Demasiados intentos. Intenta más tarde.')
    const admin = email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? await store.adminByEmail(email) : null
    const totp = readTotp(admin?.totp_secret)
    if (!admin || !/^[A-Za-z0-9_-]{43}$/.test(code) ||
      !admin.email_recovery_hash || admin.email_recovery_expires_at <= now() ||
      (totp && !totp.startsWith('pending:') && !verifyTotp(totp, input.code)) ||
      typeof input.next !== 'string' || input.next.length < 14 || input.next.length > 128)
      return error(res, 401, 'Datos de recuperación inválidos.')
    const changed = await store.recoverPasswordByEmail(admin.id, hash(code), passwordHash(input.next), now())
    if (!changed) return error(res, 401, 'Datos de recuperación inválidos.')
    await audit(admin.id, 'password_recovered_by_email', null)
    return json(res, 200, { ok: true })
  }
  if (path === '/api/password/recover' && req.method === 'POST') {
    if (!adminOrigins.has(req.headers.origin))
      return error(res, 403, 'Origen no autorizado.')
    const input = await parseJson(req)
    const email=String(input.email || '').trim().toLowerCase()
    if (email.length > 254) return error(res, 401, 'Datos de recuperación inválidos.')
    const key=`${email}:${req.socket.remoteAddress || 'unknown'}`
    if (await rateLimit(recoveryAttempts,key,5,60 * 60_000))
      return error(res, 429, 'Demasiados intentos. Intenta más tarde.')
    const code=String(input.recoveryCode || '').trim()
    const admin=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? await store.adminByEmail(email) : null
    if (!admin || !admin.recovery_hash || !admin.totp_secret ||
      admin.totp_secret.startsWith('pending:') || !/^[A-Za-z0-9_-]{43}$/.test(code) ||
      !verifyTotp(readTotp(admin.totp_secret),input.code) ||
      typeof input.next !== 'string' || input.next.length < 14 || input.next.length > 128)
      return error(res, 401, 'Datos de recuperación inválidos.')
    const changed=await store.recoverPassword(admin.id,hash(code),passwordHash(input.next),now())
    if (!changed) return error(res, 401, 'Datos de recuperación inválidos.')
    await audit(admin.id,'password_recovered',null)
    return json(res, 200, { ok:true })
  }
  if (path === '/api/mfa/setup' && req.method === 'POST') {
    const auth = await requireAdmin(req, res, false, true); if (!auth) return
    if (req.headers['x-csrf-token'] !== auth.csrf_token || !adminOrigins.has(req.headers.origin))
      return error(res, 403, 'Solicitud no autorizada.')
    if (auth.totp_secret && !auth.totp_secret.startsWith('pending:'))
      return error(res, 409, 'MFA ya está configurado.')
    const secret = newTotpSecret()
    await store.setTotp(auth.admin_id, `pending:${encryptTotp(secret)}`, now())
    return json(res, 200, { secret, otpauth: `otpauth://totp/AlbertSanfle:${encodeURIComponent(auth.email)}?secret=${secret}&issuer=AlbertSanfle` })
  }
  if (path === '/api/mfa/verify' && req.method === 'POST') {
    const auth = await requireAdmin(req, res, false, true); if (!auth) return
    if (req.headers['x-csrf-token'] !== auth.csrf_token || !adminOrigins.has(req.headers.origin))
      return error(res, 403, 'Solicitud no autorizada.')
    if (!auth.totp_secret?.startsWith('pending:')) return error(res, 409, 'No hay configuración pendiente.')
    const { code } = await parseJson(req)
    const secret = auth.totp_secret.slice(8)
    if (!verifyTotp(secret, code)) return error(res, 400, 'Código MFA inválido.')
    await store.setTotp(auth.admin_id, encryptTotp(secret), now())
    await audit(auth.admin_id, 'mfa_enabled', null)
    return json(res, 200, { ok: true })
  }
  if (path === '/api/analytics/pageview' && req.method === 'POST') {
    if (!allowedOrigins.has(req.headers.origin) || /bot|crawler|spider|headless/i.test(req.headers['user-agent'] || ''))
      return error(res, 403, 'Origen no autorizado.')
    const input = await parseJson(req)
    const page = String(input.path || '').split('?')[0]
    if (!page.startsWith('/') || page.startsWith('/admin') || page.length > 180)
      return error(res, 400, 'Ruta inválida.')
    const key = `${req.socket.remoteAddress}:${page}`
    const eventId = backend === 'dynamodb' ? eventIdOf(input) : null
    if (!eventId && await rateLimit(pageviewThrottle, key, 1, 30_000)) return json(res, 200, { ok: true })
    await store.pageview(now().slice(0, 10), page, eventId)
    return json(res, 200, { ok: true })
  }
  if (path === '/api/analytics/interaction' && req.method === 'POST') {
    if (!allowedOrigins.has(req.headers.origin) || /bot|crawler|spider|headless/i.test(req.headers['user-agent'] || ''))
      return error(res, 403, 'Origen no autorizado.')
    const input = await parseJson(req)
    const event = String(input.event || '')
    const page = String(input.path || '').split('?')[0]
    if (!['cv_download'].includes(event) || !page.startsWith('/') || page.startsWith('/admin') || page.length > 180)
      return error(res, 400, 'Evento inválido.')
    const key = `${req.socket.remoteAddress}:${event}:${page}`
    const eventId = backend === 'dynamodb' ? eventIdOf(input) : null
    if (!eventId && await rateLimit(interactionThrottle, key, 1, 30_000)) return json(res, 200, { ok: true })
    await store.interaction(now().slice(0, 10), event, page, eventId)
    return json(res, 200, { ok: true })
  }
  if (path === '/api/contact' && req.method === 'POST') {
    if (!allowedOrigins.has(req.headers.origin)) return error(res, 403, 'Origen no autorizado.')
    const input = await parseJson(req)
    if (input.website) return json(res, 200, { ok: true })
    const name = String(input.name || '').trim(), email = String(input.email || '').trim(),
      subject = String(input.subject || '').trim(), message = String(input.message || '').trim()
    if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200 ||
      !subject || subject.length > 180 || message.length < 10 || message.length > 2000)
      return error(res, 400, 'Revisa los campos del mensaje.')
    const contactKey = backend === 'dynamodb' ? email.toLowerCase() : req.socket.remoteAddress || 'unknown'
    if (await rateLimit(contactThrottle, contactKey, 3, 60 * 60_000))
      return error(res, 429, 'Demasiados mensajes. Intenta más tarde.')
    await store.createMessage({ id:randomUUID(),name,email,subject,message,status:'pending',created_at:now() })
    return json(res, 201, { ok: true })
  }
  if (path === '/api/admin/messages' && req.method === 'GET') {
    if (!await requireAdmin(req, res)) return
    return json(res, 200, await store.messages())
  }
  const messageMatch = path.match(/^\/api\/admin\/messages\/([a-f0-9-]+)$/)
  if (messageMatch && req.method === 'PATCH') {
    const auth = await requireAdmin(req, res, true); if (!auth) return
    const status = (await parseJson(req)).status
    if (!['pending','read','archived','trash'].includes(status)) return error(res, 400, 'Estado inválido.')
    const changed = await store.updateMessage(messageMatch[1], status)
    if (!changed) return error(res, 404, 'Mensaje no encontrado.')
    await audit(auth.admin_id, 'message_status', messageMatch[1])
    return json(res, 200, { ok: true })
  }
  if (path === '/api/admin/analytics' && req.method === 'GET') {
    const auth = await requireAdmin(req, res); if (!auth) return
    const since = new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10)
    return json(res, 200, await store.analytics(since))
  }
  const contentAnalytics=path.match(/^\/api\/admin\/analytics\/(project|blog)\/([a-f0-9-]+)$/)
  if (contentAnalytics && req.method === 'GET') {
    if (!await requireAdmin(req,res)) return
    const [,kind,id]=contentAnalytics
    const item=await store.content(kind,id)
    if (!item) return error(res,404,'Contenido no encontrado.')
    const since=new Date(Date.now()-29*86_400_000).toISOString().slice(0,10)
    const publicPath=`/${kind === 'project' ? 'proyectos' : 'blog'}/${item.slug}`
    return json(res,200,{ path:publicPath,...await store.analyticsPath(since,publicPath) })
  }
  if (path === '/api/admin/sessions' && req.method === 'GET') {
    const auth = await requireAdmin(req, res); if (!auth) return
    return json(res, 200, await store.sessions(auth.admin_id, auth.token_hash))
  }
  if (path === '/api/admin/summary' && req.method === 'GET') {
    if (!await requireAdmin(req, res)) return
    return json(res, 200, { counts:await store.contentCounts() })
  }
  if (path === '/api/admin/sessions' && req.method === 'DELETE') {
    const auth = await requireAdmin(req, res, true); if (!auth) return
    await store.revokeOtherSessions(auth.admin_id, auth.token_hash)
    await audit(auth.admin_id, 'sessions_revoked', null)
    return json(res, 200, { ok: true })
  }
  if (path === '/api/admin/password' && req.method === 'POST') {
    const auth = await requireAdmin(req, res, true); if (!auth) return
    const input = await parseJson(req)
    const admin = await store.adminById(auth.admin_id)
    if (!checkPassword(String(input.current || ''), admin.password_salt, admin.password_hash) ||
      !verifyTotp(readTotp(admin.totp_secret), input.code)) return error(res, 403, 'Contraseña o código MFA inválidos.')
    if (typeof input.next !== 'string' || input.next.length < 14 || input.next.length > 128)
      return error(res, 400, 'La contraseña nueva debe tener entre 14 y 128 caracteres.')
    const next = passwordHash(input.next)
    await store.setPassword(auth.admin_id, next, now())
    await store.revokeOtherSessions(auth.admin_id, auth.token_hash)
    await audit(auth.admin_id, 'password_changed', null)
    return json(res, 200, { ok: true })
  }
  if (path === '/api/admin/recovery-code' && req.method === 'POST') {
    const auth=await requireAdmin(req,res,true); if (!auth) return
    const input=await parseJson(req)
    const admin=await store.adminById(auth.admin_id)
    if (!checkPassword(String(input.password || ''),admin.password_salt,admin.password_hash) ||
      !verifyTotp(readTotp(admin.totp_secret),input.code))
      return error(res, 403, 'Contraseña o código MFA inválidos.')
    const recoveryCode=randomBytes(32).toString('base64url')
    await store.setRecoveryCode(auth.admin_id,hash(recoveryCode),now())
    await audit(auth.admin_id,'recovery_code_rotated',null)
    return json(res,200,{ recoveryCode })
  }
  if (path === '/api/public/bootstrap' && req.method === 'GET') {
    const requested = [...new Set((url.searchParams.get('kinds') || '').split(',').filter(Boolean))]
    if (!requested.length || requested.length > 12 || requested.some(kind => !publicKinds.has(kind)))
      return error(res, 400, 'Secciones pÃºblicas no vÃ¡lidas.')
    const contents = Object.fromEntries(await Promise.all(requested.map(async kind =>
      [kind, (await store.publicContent(kind)).map(publicRow)])))
    return json(res, 200, { contents })
  }
  const publicMatch = path.match(/^\/api\/public\/(\w+)(?:\/([^/]+))?$/)
  if (publicMatch && req.method === 'GET') {
    const [, kind, slug] = publicMatch
    if (!publicKinds.has(kind)) return error(res, 404, 'Contenido no encontrado.')
    if (!slug && pageLimit(url)) {
      const page=await store.publicContentPage(kind,pageLimit(url),url.searchParams.get('cursor'))
      return json(res,200,{ items:page.items.map(publicRow),nextCursor:page.nextCursor })
    }
    const rows = await store.publicContent(kind, slug)
    return json(res, 200, slug ? (rows[0] ? publicRow(rows[0]) : null) : rows.map(publicRow))
  }
  const mediaMatch = path.match(/^\/api\/media\/([a-f0-9-]+)$/)
  if (mediaMatch && req.method === 'GET') {
    const file = await store.media(mediaMatch[1])
    if (!file || file.deleted_at) return error(res, 404, 'Archivo no encontrado.')
    if (file.access === 'private' && !await requireAdmin(req, res)) return
    const object = await mediaStorage.get(file.stored_name)
    if (!object) return error(res, 404, 'Archivo no disponible.')
    if (object.url) {
      res.writeHead(302, { Location: object.url, 'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' })
      return res.end()
    }
    res.writeHead(200, { 'Content-Type': file.mime, 'Content-Length': file.bytes,
      'X-Content-Type-Options': 'nosniff',
      ...(file.mime === 'application/pdf' ? { 'Content-Disposition':'attachment' } : {}),
      'Cache-Control': file.access === 'public' ? 'public,max-age=3600' : 'no-store' })
    return object.stream.pipe(res)
  }
  if (path === '/api/admin/media' && req.method === 'GET') {
    if (!await requireAdmin(req, res)) return
    const limit=pageLimit(url)
    return json(res, 200, limit ? await store.mediaPage(limit,url.searchParams.get('cursor')) : await store.mediaList())
  }
  if (path === '/api/admin/media' && req.method === 'POST') {
    const auth = await requireAdmin(req, res, true); if (!auth) return
    const mime = String(req.headers['content-type'] || '').split(';')[0]
    const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp',
      'image/avif': '.avif', 'application/pdf': '.pdf' }
    if (!extensions[mime]) return error(res, 415, 'Formato no admitido.')
    const bytes = await body(req, process.env.CMS_LAMBDA_MODE === 'true' ? 4_000_000 : 10_000_000)
    const valid = mime === 'application/pdf' ? bytes.subarray(0, 5).toString() === '%PDF-' :
      mime === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) :
      mime === 'image/jpeg' ? bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex')) :
      mime === 'image/webp' ? bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP' :
      bytes.subarray(4, 12).toString().includes('avif')
    if (!valid) return error(res, 415, 'El archivo no coincide con su formato declarado.')
    const id = randomUUID(), stored = id + extensions[mime]
    const filename = String(req.headers['x-filename'] || `archivo${extname(stored)}`).replace(/[\\/]/g, '').slice(0, 180)
    const access = req.headers['x-media-access'] === 'private' ? 'private' : 'public'
    await mediaStorage.put(stored, bytes, mime)
    await store.createMedia({ id,filename,stored_name:stored,mime,bytes:bytes.length,access,
      alt:'',created_at:now(),admin_id:auth.admin_id })
    await audit(auth.admin_id, 'media_upload', id)
    return json(res, 201, { id, url: `/api/media/${id}`, filename, access })
  }
  const adminMedia = path.match(/^\/api\/admin\/media\/([a-f0-9-]+)(?:\/(restore))?$/)
  if (adminMedia) {
    const auth = await requireAdmin(req, res, true); if (!auth) return
    const [, id, action] = adminMedia
    const file = await store.media(id)
    if (!file) return error(res, 404, 'Archivo no encontrado.')
    if (req.method === 'POST' && action === 'restore') {
      await store.mediaRestore(id)
      await audit(auth.admin_id, 'media_restore', id)
      return json(res, 200, { ok:true })
    }
    if (file.deleted_at) return error(res, 409, 'Restaura primero el archivo.')
    if (req.method === 'PATCH' && !action) {
      const input = await parseJson(req)
      const alt = String(input.alt ?? file.alt).trim()
      const access = input.access ?? file.access
      if (alt.length > 250 || !['public','private'].includes(access)) return error(res, 400, 'Metadatos inválidos.')
      if (access === 'private' && file.access === 'public' && await store.mediaReferenced(id))
        return error(res, 409, 'El archivo está asociado a contenido; retira primero su referencia.')
      await store.updateMedia(id, alt, access)
      await audit(auth.admin_id, 'media_update', id)
      return json(res, 200, { id, alt, access })
    }
    if (req.method === 'DELETE' && !action) {
      if (await store.mediaReferenced(id))
        return error(res, 409, 'El archivo está asociado a contenido; retira primero su referencia.')
      await store.mediaTrash(id, now())
      await audit(auth.admin_id, 'media_trash', id)
      return json(res, 200, { ok:true })
    }
  }
  const adminMatch = path.match(/^\/api\/admin\/(\w+)(?:\/([a-f0-9-]+))?(?:\/(revisions|restore))?$/)
  if (adminMatch) {
    let [, kind, id, sub] = adminMatch
    if (!kinds.has(kind)) return error(res, 404, 'Tipo desconocido.')
    const mutate = req.method !== 'GET'
    const auth = await requireAdmin(req, res, mutate); if (!auth) return
    if (req.method === 'GET' && sub === 'revisions' && id)
      return json(res, 200, (await store.revisions(id)).map(publicRow))
    if (req.method === 'GET' && id) {
      const row = await store.content(kind, id)
      return row ? json(res, 200, publicRow(row)) : error(res, 404, 'No encontrado.')
    }
    if (req.method === 'GET') {
      if (pageLimit(url)) {
        const page=await store.contentPage(kind,pageLimit(url),url.searchParams.get('cursor'))
        return json(res,200,{ items:page.items.map(publicRow),nextCursor:page.nextCursor })
      }
      const rows = await store.contentList(kind)
      return json(res, 200, rows.map(publicRow))
    }
    if (req.method === 'POST' && id && sub === 'restore') {
      const revision = await store.revision((await parseJson(req)).revisionId, id)
      if (!revision) return error(res, 404, 'Versión no encontrada.')
      const current = await store.content(kind, id)
      if (!current) return error(res, 404, 'Contenido no encontrado.')
      await store.restoreContent(kind, id, revision.id, auth.admin_id)
      await audit(auth.admin_id, 'restore', id)
      return json(res, 200, { ok: true })
    }
    if (req.method === 'DELETE' && id) {
      const row = await store.content(kind, id)
      if (!row) return error(res, 404, 'Contenido no encontrado.')
      await store.trashContent(kind, id, auth.admin_id)
      await audit(auth.admin_id, 'trash', id)
      return json(res, 200, { ok: true })
    }
    if ((req.method === 'POST' && !id) || (req.method === 'PATCH' && id)) {
      const isCreate = !id
      const input = await parseJson(req)
      const value = await validate(kind, input)
      const existingSlug = await store.slugOwner(kind, value.slug)
      if (existingSlug && existingSlug !== id) return error(res, 409, 'Esta URL ya existe.')
      const row = await store.saveContent(kind, id, value, auth.admin_id)
      if (!row) return error(res, 404, 'Contenido no encontrado.')
      id = row.id
      await audit(auth.admin_id, isCreate ? 'content_create' : 'content_save', id)
      return json(res, isCreate ? 201 : 200, publicRow(row))
    }
  }
  return error(res, 404, 'Ruta no encontrada.')
}

export const handleError = (res, err) => {
  if (err instanceof SyntaxError) return error(res, 400, 'JSON inválido.')
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return error(res, 409, 'Registro duplicado.')
  console.error(err)
  return error(res, err.status || 500, err.status ? err.message : 'Error interno.')
}
export { route }
if (process.env.CMS_LAMBDA_MODE !== 'true')
  createServer((req, res) => route(req, res).catch(err => handleError(res, err)))
    .listen(port, () => console.log(`CMS API: http://localhost:${port}`))
