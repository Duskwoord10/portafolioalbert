import { cachedPublicRequest, peekPublicRequest } from './publicRequests.js'
const root = (import.meta.env.VITE_CMS_API_URL || '').replace(/\/$/, '')
export const mediaUrl = id => `${root}/api/media/${encodeURIComponent(id)}`
function withMediaOrigin(value) {
  if (typeof value === 'string')
    return root && value.startsWith('/api/media/') ? `${root}${value}` : value
  if (Array.isArray(value)) return value.map(withMediaOrigin)
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, withMediaOrigin(entry)]))
  return value
}
export async function cmsFetch(path, options = {}, csrf = '') {
  const headers = { ...(options.headers || {}) }
  if (csrf) headers['X-CSRF-Token'] = csrf
  if (options.body && typeof options.body === 'string' && !headers['Content-Type'])
    headers['Content-Type'] = 'application/json'
  const response = await fetch(`${root}/api${path}`, {
    credentials: 'include', ...options, headers,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && /^\/admin(?:\/|$)/.test(path))
      window.dispatchEvent(new Event('cms:session-expired'))
    const error = new Error(payload?.error || `Error ${response.status}`)
    error.status = response.status
    throw error
  }
  return payload
}
export async function publicContent(kind, slug) {
  const routeKinds = publicKindsForPath(window.location.pathname)
  if (routeKinds.includes(kind)) {
    const batchKey = routeKinds.join(',')
    const response = await cachedPublicRequest(publicContentKey(kind, slug), async () => {
      try {
        const batch = await cachedPublicRequest(`${root}/public/bootstrap/${batchKey}`, () => cmsFetch(
          `/public/bootstrap?kinds=${encodeURIComponent(batchKey)}`, { credentials:'omit' }), 10_000)
        const rows = batch.contents?.[kind] || []
        return slug ? rows.find(row => row.slug === slug) || null : rows
      } catch {
        // Keep compatibility during staged rollouts or when the aggregate API is unavailable.
        return cmsFetch(`/public/${kind}${slug ? `/${encodeURIComponent(slug)}` : ''}`, { credentials:'omit' })
      }
    }, 10_000)
    return withMediaOrigin(response)
  }
  const response = await cachedPublicRequest(publicContentKey(kind, slug), () => cmsFetch(
    `/public/${kind}${slug ? `/${encodeURIComponent(slug)}` : ''}`, { credentials:'omit' }), 10_000)
  return withMediaOrigin(response)
}

function publicKindsForPath(path) {
  // Hero renders across all routes, so include its published certifications in every page batch.
  const common = ['home','menu','certification']
  if (path === '/') return common
  if (path === '/sobre-mi') return [...common,'about','education','event','award','skill']
  if (path === '/certificaciones') return [...common,'about','company','project','skill']
  if (path === '/methodica') return [...common,'company']
  if (path === '/blog' || path.startsWith('/blog/')) return [...common,'blog']
  if (path === '/experiencia' || path.startsWith('/experiencia/')) return [...common,'experience','company']
  if (path === '/proyectos' || path.startsWith('/proyectos/')) return [...common,'project']
  if (path === '/eventos' || path.startsWith('/eventos/')) return [...common,'event']
  if (path === '/galeria' || path.startsWith('/galeria/')) return [...common,'album']
  if (path === '/educacion') return [...common,'education']
  if (path === '/reconocimientos') return [...common,'award']
  if (path === '/habilidades') return [...common,'skill']
  if (path === '/cv') return [...common,'cv']
  return common
}
export function publicContentKey(kind, slug) {
  return `${root}/public/${kind}/${slug || ''}`
}
export function peekPublicContent(kind, slug) {
  const response = peekPublicRequest(publicContentKey(kind, slug))
  return response === undefined ? undefined : withMediaOrigin(response)
}
