import { readFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { URL } from 'node:url'

const dir = resolve(process.argv[2] || '')
if (!process.argv[2]) throw new Error('Uso: node scripts/audit-production-candidate.js RUTA_EXPORTACION')
const manifest = JSON.parse(readFileSync(join(dir,'manifest.json'),'utf8'))
const records = readFileSync(join(dir,'items.jsonl'),'utf8').trim().split('\n').map(JSON.parse)
const content = records.filter(row => row.entity === 'content')
const guards = records.filter(row => row.entity === 'slug_guard')
const warnings = []
const errors = []
const byId = new Map(content.map(row => [row.attributes.id,row.attributes]))
const slugs = new Set()
for (const row of content) {
  const item = row.attributes
  const slug = `${item.kind}/${item.slug}`
  if (slugs.has(slug)) errors.push(`URL duplicada: ${slug}`)
  slugs.add(slug)
  if (item.status !== 'published' || !item.title?.trim()) errors.push(`Contenido incompleto: ${slug}`)
  const data = JSON.parse(item.data_json)
  if (item.kind === 'experience' && data.companyId &&
      byId.get(data.companyId)?.kind !== 'company') errors.push(`Empresa ausente: ${slug}`)
  if (item.kind === 'company' && item.slug === 'never-off-technology' &&
      item.title !== 'Never Off Technology') errors.push('Nombre Never Off Technology incorrecto')
  if (item.kind === 'home' && !data.photo) errors.push('Inicio sin fotografía')
  if (item.kind === 'about' && data.name !== 'Albert Javier Sanfle Lopez')
    errors.push('Nombre de Sobre mí no coincide con la identidad publicada original')
  if (item.kind === 'blog' && !data.category) warnings.push(`Artículo sin categoría: ${slug}`)
  if (item.kind === 'certification' && !data.issuer) warnings.push(`Certificación sin emisor: ${slug}`)
  if (item.kind === 'certification' && data.inProgress)
    warnings.push(`Certificación indicada como en progreso: ${slug}`)
}
for (const guard of guards) {
  const id = guard.attributes.content_id
  const item = byId.get(id)
  if (!item || guard.pk !== `SLUG#${item.kind}#${item.slug}`)
    errors.push(`Guarda de URL inválida: ${guard.pk}`)
}
if (guards.length !== content.length || manifest.items !== records.length)
  errors.push('Conteo de registros o guardas incorrecto')
const urls = JSON.parse(readFileSync(join(dir,'asset-references.json'),'utf8'))
const publicBackup = resolve('.cms-backups/public-pre-cms-20261021')
for (const value of urls) {
  let path
  if (value.startsWith('/blog/')) path = value.slice(1)
  else if (value.startsWith('https://albertsanflepage.s3.us-east-1.amazonaws.com/'))
    path = new URL(value).pathname.slice(1)
  if (path && !existsSync(join(publicBackup,path)) && !existsSync(join('public',path)))
    errors.push(`Archivo público ausente: ${path}`)
}
console.log(JSON.stringify({ content:content.length,guards:guards.length,media:records.filter(row => row.entity === 'media').length,
  checkedAssets:urls.length,errors,warnings },null,2))
if (errors.length) process.exitCode=1
