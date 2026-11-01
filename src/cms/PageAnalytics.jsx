import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getCookiePreferences } from '../components/cookieConsent.js'
import { cmsFetch } from './api.js'

export default function PageAnalytics() {
  const { pathname } = useLocation()
  useEffect(() => {
    const record = () => {
      if (getCookiePreferences()?.analytics !== true) return
      const key = `as-pageview:${pathname}`
      let eventId = crypto.randomUUID()
      try {
        const previous = JSON.parse(sessionStorage.getItem(key) || 'null')
        if (previous && Date.now() - previous.at < 30_000) eventId = previous.id
        else sessionStorage.setItem(key, JSON.stringify({ id:eventId,at:Date.now() }))
      } catch { /* almacenamiento de sesión no disponible */ }
      cmsFetch('/analytics/pageview', { method: 'POST',
        body: JSON.stringify({ path:pathname,eventId }) }).catch(() => {})
    }
    record()
    window.addEventListener('as-cookie-choice', record)
    return () => window.removeEventListener('as-cookie-choice', record)
  }, [pathname])
  return null
}
