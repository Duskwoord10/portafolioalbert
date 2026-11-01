import { DatabaseSync } from 'node:sqlite'
import { createHash, randomUUID } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { basename, join, relative, resolve, sep } from 'node:path'

const sourceDb = resolve(process.env.CMS_DB_PATH || '.cms-data/cms.sqlite')
const sourceMedia = resolve(process.env.CMS_MEDIA_DIR || '.cms-data/media')
const backupRoot = resolve(process.env.CMS_BACKUP_DIR || '.cms-backups')
if (!existsSync(sourceDb)) throw new Error(`No existe la base de datos: ${sourceDb}`)
mkdirSync(backupRoot, { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const destination = join(backupRoot, `${stamp}-${randomUUID().slice(0, 8)}`)
mkdirSync(destination)
const backupDb = join(destination, 'cms.sqlite')

// VACUUM INTO toma una instantánea consistente incluso si la API mantiene WAL activo.
const database = new DatabaseSync(sourceDb, { readOnly: true })
try {
  const integrity = database.prepare('PRAGMA quick_check').get()
  if (Object.values(integrity)[0] !== 'ok') throw new Error('Falló la comprobación de integridad de SQLite.')
  database.exec(`VACUUM INTO '${backupDb.replaceAll("'", "''")}'`)
} finally { database.close() }

if (existsSync(sourceMedia)) cpSync(sourceMedia, join(destination, 'media'), { recursive: true })

function filesUnder(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`No se respaldan enlaces simbólicos: ${path}`)
    return entry.isDirectory() ? filesUnder(path) : [path]
  })
}

const files = filesUnder(destination).map(path => ({
  path: relative(destination, path).split(sep).join('/'),
  bytes: statSync(path).size,
  sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
}))
const snapshot = new DatabaseSync(backupDb, { readOnly: true })
let counts
try {
  const tables = new Set(snapshot.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row => row.name))
  counts = Object.fromEntries(['admins','content','seed_imports','media','messages','pageviews','interactions']
    .filter(table => tables.has(table)).map(table =>
      [table, snapshot.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count]))
  for (const asset of snapshot.prepare('SELECT stored_name FROM media').all()) {
    if (!/^[a-f0-9-]+\.(?:jpg|png|webp|avif|pdf)$/.test(asset.stored_name) ||
        !existsSync(join(destination, 'media', asset.stored_name)))
      throw new Error(`Falta un archivo multimedia asociado: ${asset.stored_name}`)
  }
} finally { snapshot.close() }
writeFileSync(join(destination, 'manifest.json'), JSON.stringify({
  format: 1, createdAt: new Date().toISOString(), sourceDatabase: basename(sourceDb), counts, files,
}, null, 2) + '\n', { flag: 'wx' })
console.log(`Respaldo creado y comprobado: ${destination}`)
