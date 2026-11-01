const COOKIE_NAME = 'as_cookie_choice'
const COOKIE_DAYS = 180
const ESSENTIAL_ONLY = Object.freeze({ essential:true, analytics:false, externalMedia:false })

export function getCookiePreferences() {
  if (typeof document === 'undefined') return null
  const raw = document.cookie.split('; ').find(part => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1)
  if (!raw) return null
  try {
    const value = decodeURIComponent(raw)
    if (value === 'all') return { essential:true, analytics:true, externalMedia:true }
    if (value === 'essential') return ESSENTIAL_ONLY
    const parsed = JSON.parse(value)
    return { essential:true, analytics:parsed.analytics === true, externalMedia:parsed.externalMedia === true }
  } catch { return null }
}

// Backwards-compatible shorthand for older components.
export function getCookieChoice() {
  const preferences = getCookiePreferences()
  if (!preferences) return null
  return preferences.analytics || preferences.externalMedia ? 'all' : 'essential'
}

export function saveCookiePreferences(preferences) {
  const normalized = {
    essential:true,
    analytics:preferences?.analytics === true,
    externalMedia:preferences?.externalMedia === true,
  }
  const maxAge = COOKIE_DAYS * 24 * 60 * 60
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(normalized))}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
  window.dispatchEvent(new CustomEvent('as-cookie-choice', { detail:normalized }))
}

export function saveCookieChoice(choice) {
  if (choice === 'all') return saveCookiePreferences({ analytics:true, externalMedia:true })
  return saveCookiePreferences(ESSENTIAL_ONLY)
}
