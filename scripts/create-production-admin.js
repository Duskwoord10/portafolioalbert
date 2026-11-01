import { randomUUID } from 'node:crypto'
import { passwordHash } from '../server/password.js'

const table = process.env.CMS_DYNAMODB_TABLE || ''
if (process.env.AWS_PROFILE !== 'default' || process.env.AWS_REGION !== 'us-east-1' ||
    process.env.NODE_ENV !== 'production' || process.env.CMS_DATA_BACKEND !== 'dynamodb' ||
    !table.startsWith('albert-cms-production-api-CmsTable-'))
  throw new Error('Entorno de producción inesperado.')
if (!['--check', '--create'].includes(process.argv[2]) || process.argv.length !== 3)
  throw new Error('Modo no válido.')

const { store } = await import('../server/store/dynamo.js')
await store.ready()
if (await store.adminCount()) throw new Error('Ya existe un administrador de producción.')
if (process.argv[2] === '--check') {
  console.log('Cuenta de producción disponible para crear.')
  process.exit(0)
}

let password = ''
for await (const chunk of process.stdin) {
  password += chunk.toString('utf8')
  if (password.length > 130) throw new Error('Longitud de contraseña no válida.')
}
password = password.replace(/\r?\n$/, '')
if (password.length < 28 || password.length > 128 || /[\r\n]/.test(password))
  throw new Error('Longitud de contraseña no válida.')
const credentials = passwordHash(password)
password = ''
const at = new Date().toISOString()
await store.createAdmin({ id: randomUUID(), email: 'asanfle@methodicatechnology.com',
  password_hash: credentials.value, password_salt: credentials.salt,
  role: 'superadmin', created_at: at, updated_at: at })
console.log('Administrador de producción creado; MFA pendiente de configuración personal.')
