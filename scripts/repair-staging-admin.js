import { randomUUID } from 'node:crypto'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { checkPassword, passwordHash } from '../server/security.js'

if (!process.stdin.isTTY || !process.stdin.setRawMode)
  throw new Error('Este procedimiento exige una terminal local interactiva.')
if (process.env.AWS_PROFILE !== 'default' || process.env.AWS_REGION !== 'us-east-1')
  throw new Error('Perfil o región AWS inesperados.')

const table = 'albert-cms-staging-api-CmsTable-IRPMELF0742D'
const email = 'asanfle@methodicatechnology.com'
const origin = 'https://d34buqdfi1n3fd.cloudfront.net'
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }))

async function probeLogin(password) {
  try {
    const response = await fetch(`${origin}/api/login`, { method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, code: '' }) })
    if (response.status !== 200) {
      console.log(`Comprobación privada contra la API de staging: HTTP ${response.status}.`)
      return
    }
    const data = await response.json()
    const sessionCookie = response.headers.get('set-cookie')?.split(';')[0]
    const logout = sessionCookie && data.csrf ? await fetch(`${origin}/api/logout`, { method: 'POST',
      headers: { Origin: origin, Cookie: sessionCookie, 'X-CSRF-Token': data.csrf } }) : null
    console.log(`La API aceptó la contraseña; MFA configurado: ${data.mfaConfigured ? 'sí' : 'no'}; sesión de comprobación cerrada: ${logout?.status === 200 ? 'sí' : 'no'}.`)
  } catch {
    console.log('No se pudo comprobar HTTPS de staging. La terminal ya indicó si la contraseña local coincidió o se restableció; revisa la conectividad antes de iniciar sesión.')
  }
}

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    let value = ''
    let invalid = false
    process.stdout.write(`${prompt}: `)
    process.stdin.setRawMode(true)
    process.stdin.resume()
    function done(error) {
      process.stdin.off('data', onData)
      process.stdin.setRawMode(false)
      process.stdin.pause()
      process.stdout.write('\n')
      if (error) reject(error)
      else if (invalid) reject(new Error('La entrada contenía caracteres de control. Escribe la contraseña manualmente.'))
      else resolve(value)
      value = ''
    }
    function onData(chunk) {
      for (const char of chunk.toString('utf8')) {
        if (char === '\u0003') return done(new Error('Procedimiento cancelado.'))
        if (char === '\r' || char === '\n') return done()
        if (char === '\u0008' || char === '\u007f') {
          value = [...value].slice(0, -1).join('')
        } else if (char < ' ' || char === '\u007f') invalid = true
        else value += char
      }
    }
    process.stdin.on('data', onData)
  })
}

const guard = await client.send(new GetCommand({ TableName: table,
  Key: { pk: 'ADMIN#SINGLETON', sk: 'LOCK' }, ConsistentRead: true }))
if (!guard.Item?.admin_id) throw new Error('No existe la cuenta administradora esperada.')
const key = { pk: `ADMIN#${guard.Item.admin_id}`, sk: 'PROFILE' }
const profile = await client.send(new GetCommand({ TableName: table, Key: key, ConsistentRead: true }))
const admin = profile.Item
if (!admin || admin.email !== email || admin.role !== 'superadmin' ||
    admin.gsi1pk !== `EMAIL#${email}` ||
    !/^[a-f0-9]{48}$/.test(admin.password_salt || '') ||
    !/^[a-f0-9]{128}$/.test(admin.password_hash || ''))
  throw new Error('La cuenta no coincide con el administrador esperado. No se ha modificado nada.')

let supplied = await readHidden('Contraseña actual para comprobarla')
const matches = checkPassword(supplied, admin.password_salt, admin.password_hash)
if (matches) {
  console.log('La contraseña actual coincide. No se modificó la cuenta.')
  await probeLogin(supplied)
  supplied = ''
  process.exit(0)
}
supplied = ''
console.log('La contraseña introducida no coincide con la cuenta. Se puede restablecer sin crear otro administrador.')
let next = await readHidden('Nueva contraseña (14 a 128 caracteres)')
let confirmation = await readHidden('Repite la nueva contraseña')
if (next.length < 14 || next.length > 128 || next !== confirmation) {
  next = ''; confirmation = ''
  throw new Error('Las contraseñas no coinciden o no cumplen la longitud requerida. No se modificó nada.')
}
const credentials = passwordHash(next)
confirmation = ''
const sessions = await client.send(new QueryCommand({ TableName: table, IndexName: 'gsi1',
  KeyConditionExpression: 'gsi1pk = :pk', ExpressionAttributeValues: {
    ':pk': `SESSIONS#${admin.id}` }, Select: 'COUNT' }))
const auditId = randomUUID()
const now = new Date().toISOString()
await client.send(new TransactWriteCommand({ TransactItems: [
  { Update: { TableName: table, Key: key,
    UpdateExpression: 'SET password_hash=:hash,password_salt=:salt,updated_at=:date ADD auth_version :one',
    ConditionExpression: 'email=:email AND password_hash=:previous AND password_salt=:oldSalt',
    ExpressionAttributeValues: { ':hash': credentials.value, ':salt': credentials.salt,
      ':date': now, ':one': 1, ':email': email, ':previous': admin.password_hash,
      ':oldSalt': admin.password_salt } } },
  { Put: { TableName: table, Item: { pk: `AUDIT#${auditId}`, sk: 'META', entity: 'audit',
    id: auditId, admin_id: admin.id, action: 'owner_password_reset_offline',
    target: 'staging-admin', created_at: now }, ConditionExpression: 'attribute_not_exists(pk)' } },
] }))
console.log(`Contraseña restablecida de forma condicional y auditada. Sesiones previas invalidadas: ${sessions.Count || 0}. MFA no se modificó.`)
await probeLogin(next)
next = ''
