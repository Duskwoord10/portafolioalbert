export function safeUrl(value) {
  if (typeof value !== 'string') return ''
  if (value.startsWith('/') && !value.startsWith('//')) return value
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? value : '' }
  catch { return '' }
}
