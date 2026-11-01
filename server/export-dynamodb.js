import { DatabaseSync } from 'node:sqlite'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

if (!process.argv[2]) throw new Error('Uso: npm run migration:export -- RUTA_DEL_RESPALDO_VERIFICADO')
const backup = resolve(process.argv[2])
const backupManifest = JSON.parse(readFileSync(join(backup, 'manifest.json'), 'utf8'))
if (backupManifest.format !== 1) throw new Error('Formato de respaldo desconocido.')
const databasePath = join(backup, 'cms.sqlite')
const expected = backupManifest.files.find(entry => entry.path === 'cms.sqlite')
if (!expected || createHash('sha256').update(readFileSync(databasePath)).digest('hex') !== expected.sha256)
  throw new Error('La base no coincide con el respaldo. Ejecuta backup:verify.')

const database = new DatabaseSync(databasePath, { readOnly: true })
const records = []
const counts = {}
const keys = {
  admins: row => [`ADMIN#${row.id}`, 'PROFILE'],
  content: row => [`CONTENT#${row.id}`, 'META'],
  seed_imports: row => [`SEED#${row.source_key}`, 'META'],
  revisions: row => [`CONTENT#${row.content_id}`, `REV#${row.created_at}#${row.id}`],
  media: row => [`MEDIA#${row.id}`, 'META'],
  audit: row => [`AUDIT#${row.id}`, 'META'],
  messages: row => [`MESSAGE#${row.id}`, 'META'],
  pageviews: row => [`ANALYTICS#${row.day}`, `PAGE#${row.path}`],
  interactions: row => [`ANALYTICS#${row.day}`, `EVENT#${row.event}#${row.path}`],
}
try {
  if (Object.values(database.prepare('PRAGMA quick_check').get())[0] !== 'ok')
    throw new Error('La copia de la base no es íntegra.')
  const existing = new Set(database.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row => row.name))
  for (const [table, key] of Object.entries(keys)) {
    if (!existing.has(table)) continue
    const rows = database.prepare(`SELECT * FROM ${table}`).all()
    if (backupManifest.counts[table] !== undefined && backupManifest.counts[table] !== rows.length)
      throw new Error(`Conteo alterado: ${table}`)
    counts[table] = rows.length
    for (const row of rows) {
      const [pk, sk] = key(row)
      records.push({ pk, sk, entity: table, attributes: row })
      if (table === 'content') records.push({ pk:`SLUG#${row.kind}#${row.slug}`, sk:'LOCK',
        entity:'slug_guard', attributes:{ content_id:row.id } })
    }
  }
} finally { database.close() }

const uniqueKeys = new Set(records.map(record => `${record.pk}\0${record.sk}`))
if (uniqueKeys.size !== records.length) throw new Error('Colisión de claves en la exportación.')
const root = resolve(process.env.CMS_EXPORT_DIR || '.cms-exports')
mkdirSync(root, { recursive:true })
const destination = join(root, `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`)
mkdirSync(destination)
const lines = records.map(record => JSON.stringify(record)).join('\n') + '\n'
writeFileSync(join(destination, 'items.jsonl'), lines, { flag:'wx' })
writeFileSync(join(destination, 'manifest.json'), JSON.stringify({ format:1, sourceBackup:basename(backup),
  counts, items:records.length, sha256:createHash('sha256').update(lines).digest('hex'),
  note:'Incluye hashes de contraseña, secretos MFA y mensajes privados. Las sesiones se omiten para exigir nuevo inicio de sesión tras la migración. Proteger y borrar según política de retención. No importar directamente sin validar el adaptador de producción.',
}, null, 2) + '\n', { flag:'wx' })
if (!existsSync(join(destination, 'items.jsonl'))) throw new Error('No se escribió el archivo de salida.')
console.log(`Exportación local creada: ${destination} (${records.length} elementos; revisar manifiesto sin abrir datos privados)`)
