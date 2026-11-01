import { safeUrl } from './safeUrl.js'

// Rutas que ya estaban en el sitio público antes de activar la gestión de menús.
export const existingNavigation = [
  { to:'/', label:'Inicio', end:true },
  { to:'/sobre-mi', label:'Sobre mí' },
  { to:'/experiencia', label:'Experiencia' },
  { to:'/certificaciones', label:'Certificaciones' },
  { to:'/blog', label:'Blog' },
  { to:'/cv', label:'CV' },
]

export function publishedNavigation(records, fallback = existingNavigation) {
  const record = records?.find(item => item.slug === 'principal') || records?.[0]
  if (!record) return fallback
  return (record.data?.blocks || [])
    .filter(block => block.type === 'link' && block.title?.trim() && safeUrl(block.url))
    .map(block => ({ to:block.url, label:block.title.trim(), end:block.url === '/' }))
}
