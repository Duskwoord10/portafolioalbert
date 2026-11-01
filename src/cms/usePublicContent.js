import { useEffect, useState } from 'react'
import { peekPublicContent, publicContent, publicContentKey } from './api.js'

export function usePublicContent(kind, fallback, slug, enabled = true) {
  const key = publicContentKey(kind, slug)
  const [loaded, setLoaded] = useState(null)
  const cached = peekPublicContent(kind, slug)
  const data = loaded?.key === key ? loaded.value : cached ?? fallback
  useEffect(() => {
    if (!enabled) return undefined
    let active = true
    publicContent(kind, slug).then(value => { if (active) setLoaded({ key, value }) }).catch(() => {})
    return () => { active = false }
  }, [kind, slug, key, enabled])
  return data
}
