import { randomUUID } from 'node:crypto'
import { passwordHash } from './security.js'

const backend = process.env.CMS_DATA_BACKEND === 'dynamodb' ? 'dynamo' : 'sqlite'
const { store } = await import(`./store/${backend}.js`)
await store.ready(process.env.NODE_ENV === 'production')

const email = process.argv[2]?.trim().toLowerCase()
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Uso: node server/create-admin.js correo@dominio.com')
  process.exit(1)
}
if (await store.adminCount()) {
  console.error('Ya existe un administrador. No se crea una segunda cuenta desde este comando.')
  process.exit(1)
}
if (!process.stdin.isTTY || !process.stdin.setRawMode) {
  console.error('Ejecuta este comando en una terminal interactiva para introducir la contraseña sin mostrarla.')
  process.exit(1)
}
process.stdout.write('Nueva contraseña (mínimo 14 caracteres): ')
process.stdin.setRawMode(true)
process.stdin.resume()
let password = ''
let firstPassword = null
let invalidInput = false
process.stdin.on('data', async chunk => {
  for (const char of chunk.toString()) {
    if (char === '\u0003') process.exit(130)
    if (char === '\r' || char === '\n') {
      process.stdout.write('\n')
      if (invalidInput || password.length < 14 || password.length > 128) {
        process.stdin.setRawMode(false); process.stdin.pause()
        console.error('La contraseña debe tener entre 14 y 128 caracteres, sin caracteres de control.')
        process.exitCode = 1; return
      }
      if (firstPassword === null) {
        firstPassword = password; password = ''; invalidInput = false
        process.stdout.write('Repite la contraseña: ')
        return
      }
      process.stdin.setRawMode(false)
      process.stdin.pause()
      if (password !== firstPassword) {
        console.error('Las contraseñas no coinciden. No se creó la cuenta.')
        password = ''; firstPassword = ''; process.exitCode = 1; return
      }
      const { salt, value } = passwordHash(password)
      const now = new Date().toISOString()
      try { await store.createAdmin({ id:randomUUID(),email,password_hash:value,password_salt:salt,
        role:'superadmin',created_at:now,updated_at:now }) }
      catch (error) { console.error(error);process.exitCode=1;return }
      password = ''; firstPassword = ''
      console.log('Administrador creado. Inicia sesión y configura MFA antes de editar contenido.')
      return
    }
    if (char === '\u0008' || char === '\u007f') password = [...password].slice(0, -1).join('')
    else if (char < ' ') invalidInput = true
    else password += char
  }
})
