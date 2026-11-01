import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { cpSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

if (!process.argv[2]) throw new Error('Uso: npm run backup:restore -- RUTA_DEL_RESPALDO')
const backup = resolve(process.argv[2])
const verify = spawnSync(process.execPath, ['server/verify-backup.js', backup], {
  cwd:process.cwd(), encoding:'utf8',
})
if (verify.status !== 0) throw new Error(`Respaldo inválido: ${verify.stderr.trim()}`)

const root = resolve(process.env.CMS_RESTORE_DIR || '.cms-restores')
mkdirSync(root, { recursive:true })
const destination = join(root, `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`)
cpSync(backup, destination, { recursive:true, errorOnExist:true, force:false })
const restored = spawnSync(process.execPath, ['server/verify-backup.js', destination], {
  cwd:process.cwd(), encoding:'utf8',
})
if (restored.status !== 0) throw new Error(`La copia restaurada no superó la verificación: ${restored.stderr.trim()}`)
console.log(`Restaurado en directorio nuevo y verificado: ${destination}`)
console.log('Prueba la API de staging con CMS_DB_PATH y CMS_MEDIA_DIR apuntando a esta copia antes de usarla.')
