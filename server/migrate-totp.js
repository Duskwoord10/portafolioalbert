import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { encryptTotp, hasTotpEncryptionKey } from './security.js'

if (!process.argv[2]) throw new Error('Uso: npm run security:migrate-totp -- RUTA_RESPALDO [--apply]')
if (!hasTotpEncryptionKey) throw new Error('Configura CMS_TOTP_ENCRYPTION_KEY antes de migrar.')
const backupDir = resolve(process.argv[2])
const backupManifest = JSON.parse(readFileSync(join(backupDir, 'manifest.json'), 'utf8'))
const backupFile = join(backupDir, 'cms.sqlite')
const expected = backupManifest.files?.find(file => file.path === 'cms.sqlite')
if (!expected || createHash('sha256').update(readFileSync(backupFile)).digest('hex') !== expected.sha256)
  throw new Error('El respaldo no supera la comprobación SHA-256.')

const source = new DatabaseSync(resolve(process.env.CMS_DB_PATH || '.cms-data/cms.sqlite'))
const backup = new DatabaseSync(backupFile, { readOnly:true })
try {
  if (Object.values(backup.prepare('PRAGMA quick_check').get())[0] !== 'ok')
    throw new Error('El respaldo SQLite no es íntegro.')
  const backupAdmins = new Map(backup.prepare('SELECT id,totp_secret FROM admins').all().map(row => [row.id, row.totp_secret]))
  const admins = source.prepare('SELECT id,totp_secret FROM admins').all()
  const pending = admins.filter(row => row.totp_secret && !row.totp_secret.startsWith('enc:v1:') &&
    !row.totp_secret.startsWith('pending:enc:v1:'))
  for (const row of pending) {
    if (!backupAdmins.has(row.id) || backupAdmins.get(row.id) !== row.totp_secret)
      throw new Error('El respaldo no coincide con los secretos MFA actuales.')
  }
  if (process.argv[3] !== '--apply') {
    console.log(`Simulación: ${pending.length} secreto(s) MFA por cifrar. Para aplicar: añadir --apply.`)
  } else {
    source.exec('BEGIN IMMEDIATE')
    try {
      const update = source.prepare('UPDATE admins SET totp_secret=?,updated_at=? WHERE id=? AND totp_secret=?')
      for (const row of pending) {
        const value = row.totp_secret.startsWith('pending:') ?
          `pending:${encryptTotp(row.totp_secret.slice(8))}` : encryptTotp(row.totp_secret)
        if (update.run(value, new Date().toISOString(), row.id, row.totp_secret).changes !== 1)
          throw new Error('El secreto MFA cambió durante la migración.')
      }
      source.exec('COMMIT')
    } catch (error) { source.exec('ROLLBACK'); throw error }
    console.log(`Migración completada: ${pending.length} secreto(s) cifrados.`)
  }
} finally { backup.close(); source.close() }
