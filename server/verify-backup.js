import { DatabaseSync } from 'node:sqlite'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, statSync } from 'node:fs'
import { isAbsolute, resolve, sep } from 'node:path'

if (!process.argv[2]) throw new Error('Uso: npm run backup:verify -- RUTA_DEL_RESPALDO')
const directory = resolve(process.argv[2])
const manifest = JSON.parse(readFileSync(resolve(directory, 'manifest.json'), 'utf8'))
if (manifest.format !== 1 || !Array.isArray(manifest.files)) throw new Error('Manifiesto no compatible.')
for (const entry of manifest.files) {
  if (isAbsolute(entry.path) || entry.path.split('/').includes('..')) throw new Error('Ruta insegura en el manifiesto.')
  const path = resolve(directory, entry.path)
  if (!path.startsWith(directory + sep) || !existsSync(path) || lstatSync(path).isSymbolicLink() ||
      statSync(path).size !== entry.bytes ||
      createHash('sha256').update(readFileSync(path)).digest('hex') !== entry.sha256)
    throw new Error(`Archivo ausente o alterado: ${entry.path}`)
}
const database = new DatabaseSync(resolve(directory, 'cms.sqlite'), { readOnly: true })
try {
  if (Object.values(database.prepare('PRAGMA quick_check').get())[0] !== 'ok')
    throw new Error('La copia SQLite no supera quick_check.')
  for (const [table, count] of Object.entries(manifest.counts)) {
    if (!['admins','content','seed_imports','media','messages','pageviews','interactions'].includes(table) ||
        database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count !== count)
      throw new Error(`Conteo inesperado: ${table}`)
  }
  for (const asset of database.prepare('SELECT stored_name FROM media').all()) {
    if (!/^[a-f0-9-]+\.(?:jpg|png|webp|avif|pdf)$/.test(asset.stored_name) ||
        !existsSync(resolve(directory, 'media', asset.stored_name)))
      throw new Error(`Falta archivo multimedia: ${asset.stored_name}`)
  }
} finally { database.close() }
console.log(`Respaldo íntegro: ${directory} (${manifest.files.length} archivos)`)
