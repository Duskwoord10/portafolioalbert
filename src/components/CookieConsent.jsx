import { useEffect, useState } from 'react'
import { Cookie, ShieldCheck, X } from 'lucide-react'
import { getCookiePreferences, saveCookiePreferences } from './cookieConsent.js'
import './CookieConsent.css'

const defaults = { essential:true, analytics:false, externalMedia:false }

export default function CookieConsent() {
  const [preferences, setPreferences] = useState(() => getCookiePreferences() || defaults)
  const [open, setOpen] = useState(() => getCookiePreferences() === null)

  useEffect(() => {
    const openPreferences = () => { setPreferences(getCookiePreferences() || defaults); setOpen(true) }
    window.addEventListener('as-cookie-open', openPreferences)
    return () => window.removeEventListener('as-cookie-open', openPreferences)
  }, [])

  function save(next) {
    saveCookiePreferences(next)
    setPreferences(next)
    setOpen(false)
  }

  return <>
    {open ? <section className="cookie-panel" aria-label="Preferencias de cookies">
      <div className="cookie-panel__icon"><Cookie size={23} aria-hidden="true" /></div>
      <div className="cookie-panel__content">
        <div className="cookie-panel__heading"><h2>Elige tus preferencias de privacidad</h2>
          {getCookiePreferences() && <button type="button" className="cookie-panel__close" onClick={() => setOpen(false)} aria-label="Cerrar preferencias"><X size={19} /></button>}
        </div>
        <p>Las cookies necesarias guardan esta elección. Las opciones adicionales son voluntarias y puedes cambiarlas cuando quieras.</p>
        <div className="cookie-panel__detail"><ShieldCheck size={15} aria-hidden="true" /> No vendemos ni usamos estos datos para identificarte.</div>
        <div className="cookie-options">
          <label><input type="checkbox" checked disabled /> <span><strong>Necesarias</strong><small>Seguridad y preferencias básicas</small></span></label>
          <label><input type="checkbox" checked={preferences.analytics} onChange={e => setPreferences(p => ({ ...p, analytics:e.target.checked }))} />
            <span><strong>Analítica</strong><small>Mediciones agregadas de páginas y descargas</small></span></label>
          <label><input type="checkbox" checked={preferences.externalMedia} onChange={e => setPreferences(p => ({ ...p, externalMedia:e.target.checked }))} />
            <span><strong>Contenido externo</strong><small>Insignias y recursos de terceros, como LinkedIn</small></span></label>
        </div>
      </div>
      <div className="cookie-panel__actions">
        <button type="button" className="cookie-panel__secondary" onClick={() => save(defaults)}>Rechazar opcionales</button>
        <button type="button" className="cookie-panel__secondary" onClick={() => save(preferences)}>Guardar selección</button>
        <button type="button" className="cookie-panel__primary" onClick={() => save({ essential:true, analytics:true, externalMedia:true })}>Aceptar todas</button>
      </div>
    </section> : <button type="button" className="cookie-preferences" onClick={() => setOpen(true)} aria-label="Cambiar preferencias de cookies"><Cookie size={16} aria-hidden="true" /> Cookies</button>}
  </>
}
