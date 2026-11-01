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
  const response = await cachedPublicRequest(publicContentKey(kind, slug), () => cmsFetch(
    `/public/${kind}${slug ? `/${encodeURIComponent(slug)}` : ''}`,
    { credentials: 'omit' }), 10_000)
  return withMediaOrigin(response)
}
export function publicContentKey(kind, slug) {
  return `${root}/public/${kind}/${slug || ''}`
}
export function peekPublicContent(kind, slug) {
  const response = peekPublicRequest(publicContentKey(kind, slug))
  return response === undefined ? undefined : withMediaOrigin(response)
}
