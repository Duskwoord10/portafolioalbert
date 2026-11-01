import { useEffect, useState } from 'react'
import { ArrowLeft, BarChart3, BookOpen, BriefcaseBusiness, Building2, ChevronRight, FileText, Mail,
  FolderOpen, GraduationCap, Home, Image, LogOut, Menu, Plus, Save, ShieldCheck,
  Sparkles, Trash2, Upload, X } from 'lucide-react'
import { cmsFetch, mediaUrl } from './api.js'
import './admin.css'

const modules = [
  { kind: 'about', label: 'Sobre mí', icon: Home, fields: [
    ['name','Nombre'], ['roles','Especialidades (separadas por coma)'],
    ['lead','Presentación','textarea'], ['bio','Biografía','textarea'],
    ['photo','Fotografía de perfil','image-picker'], ['location','Ubicación'],
    ['available','Estado de disponibilidad'], ['eyebrow','Etiqueta de perfil'],
    ['profileCardLabel','Etiqueta de tarjeta de perfil'], ['profileCardExpertise','Especialidades sobre la fotografía'],
    ['profileCardHeadline','Frase sobre la fotografía'], ['locationLabel','Etiqueta de ubicación'],
    ['highlightOneTitle','Titular de principio 1'], ['highlightOneText','Descripción de principio 1','textarea'],
    ['highlightTwoTitle','Titular de principio 2'], ['highlightTwoText','Descripción de principio 2','textarea'] ] },
  { kind: 'company', label: 'Empresas', icon: Building2, fields: [
    ['website','Sitio web','url'], ['country','País'], ['city','Ciudad'], ['sector','Sector'],
    ['description','Descripción','textarea'], ['logo','Logotipo','url'] ] },
  { kind: 'experience', label: 'Experiencia', icon: BriefcaseBusiness, fields: [
    ['companyId','Empresa','company'], ['role','Cargo'], ['employmentType','Tipo de empleo'],
    ['workMode','Modalidad'], ['location','Ubicación'], ['startDate','Fecha de inicio','date'],
    ['endDate','Fecha de finalización','date'], ['startMonth','Mes de inicio','month'],
    ['endMonth','Mes de finalización','month'], ['current','Actualmente trabajo aquí','checkbox'], ['description','Descripción','textarea'],
    ['responsibilities','Responsabilidades','textarea'], ['achievements','Logros','textarea'],
    ['results','Resultados','textarea'], ['tools','Herramientas'],
    ['technologies','Tecnologías (separadas por coma)'] ] },
  { kind: 'project', label: 'Proyectos', icon: FolderOpen, fields: [
    ['summary','Resumen','textarea'], ['description','Descripción','textarea'],
    ['problem','Problema que resuelve','textarea'], ['objective','Objetivo','textarea'],
    ['architecture','Arquitectura','textarea'], ['results','Resultados','textarea'],
    ['challenges','Retos técnicos','textarea'], ['learning','Aprendizajes','textarea'],
    ['technologies','Tecnologías (separadas por coma)'], ['image','Imagen de portada','url'],
    ['photos','Galería (una imagen por línea)','media-list'],
    ['github','Repositorio GitHub','url'], ['demo','Demostración','url'], ['date','Fecha','date'] ] },
  { kind: 'certification', label: 'Certificaciones', icon: ShieldCheck, fields: [
    ['issuer','Institución emisora'], ['level','Nivel'], ['description','Descripción','textarea'],
    ['issuedAt','Fecha de emisión','date'], ['expiresAt','Fecha de expiración','date'],
    ['credentialId','Identificador de credencial'], ['link','URL de verificación','url'],
    ['badge','Imagen del certificado','url'], ['pdf','PDF','url'], ['category','Categoría'] ] },
  { kind: 'event', label: 'Eventos', icon: Sparkles, fields: [
    ['organizer','Organizador'], ['location','Lugar'], ['country','País'], ['city','Ciudad'],
    ['startDate','Fecha inicial','date'], ['endDate','Fecha final','date'],
    ['participation','Tipo de participación'], ['description','Descripción','textarea'],
    ['image','Imagen de portada','url'], ['brand','Marca u organización'],
    ['eyebrow','Etiqueta visual'], ['position','Posición de imagen'],
    ['photos','Fotografías (una por línea)','media-list'] ] },
  { kind: 'album', label: 'Álbumes', icon: Image, fields: [
    ['description','Descripción','textarea'], ['cover','Portada','url'],
    ['date','Fecha','date'], ['photos','URLs de fotos (una por línea)','media-list'] ] },
  { kind: 'blog', label: 'Blog', icon: BookOpen, fields: [
    ['excerpt','Resumen','textarea'], ['intro','Introducción','textarea'],
    ['category','Categoría'], ['tags','Etiquetas (separadas por coma)'],
    ['image','Imagen principal','url'], ['imageAlt','Texto alternativo'],
    ['readTime','Minutos de lectura','number'] ] },
  { kind: 'page', label: 'Páginas', icon: FileText, fields: [
    ['description','Descripción','textarea'], ['seoTitle','Título SEO'],
    ['seoDescription','Descripción SEO','textarea'] ] },
  { kind: 'home', label: 'Inicio', icon: Home, fields: [
    ['name','Nombre'], ['title','Título profesional'], ['summary','Presentación','textarea'],
    ['photo','Fotografía principal','url'], ['linkedin','LinkedIn','url'],
    ['github','GitHub','url'], ['youtube','YouTube','url'], ['instagram','Instagram','url'],
    ['quoteImage','Imagen de cita','url'], ['quoteText','Cita','textarea'],
    ['quoteSubtext','Texto bajo la cita','textarea'], ['quoteAuthor','Autor de la cita'],
    ['quoteAuthorTitle','Descripción del autor'],
    ['socialHeading','Título de redes sociales'], ['socialSubtitle','Texto de redes sociales','textarea'],
    ['instagramPhoto','Imagen de Instagram','url'], ['instagramHandle','Usuario de Instagram'],
    ['instagramDescription','Descripción de Instagram'], ['linkedinPhoto','Imagen de LinkedIn','url'],
    ['linkedinVanity','Identificador público de LinkedIn'],
    ['linkedinDescription','Descripción de tarjeta LinkedIn'],
    ['contactEmail','Correo de contacto'], ['contactPhoneDisplay','Teléfono visible'],
    ['contactPhoneRaw','Teléfono para enlaces (sólo dígitos)'],
    ['chatWelcome','Saludo del asistente','textarea'],
    ['chatQuestionProfile','Pregunta sugerida: perfil'],
    ['chatQuestionExperience','Pregunta sugerida: experiencia'],
    ['chatQuestionProjects','Pregunta sugerida: proyectos'],
    ['chatWhatsappMessage','Mensaje inicial de WhatsApp','textarea'],
    ['chatEmailSubject','Asunto de correo desde el asistente'],
    ['chatEmailBody','Mensaje de correo desde el asistente','textarea'],
    ['contactHeadline','Titular de contacto'], ['contactIntro','Introducción de contacto','textarea'],
    ['contactCardHeadline','Titular de tarjeta de contacto'],
    ['contactCardDescription','Descripción de tarjeta de contacto','textarea'],
    ['contactFormHeadline','Titular del formulario de contacto'],
    ['featuredTechnologies','Tecnologías destacadas (separadas por coma)'],
    ['heroAvailability','Disponibilidad de portada'], ['heroResponseNote','Nota de respuesta'],
    ['heroCtaNote','Texto de invitación de portada','textarea'],
    ['footerHeading','Título del pie de página'],
    ['footerHeadingAccent','Texto destacado del título'],
    ['footerDescription','Descripción del pie de página','textarea'],
    ['footerProfileDescription','Perfil del pie de página','textarea'],
    ['footerLocation','Ubicación del pie de página'],
    ['footerDisplayName','Nombre corto del pie de página'],
    ['footerRoleLine','Especialidades del pie de página'],
    ['footerContactHeadline','Titular de contacto en el pie de página'],
    ['footerContactDescription','Descripción de contacto en el pie de página','textarea'],
    ['yearsExperience','Años de experiencia comprobados','number'],
    ['projectsDelivered','Proyectos entregados comprobados','number'],
    ['showQuote','Mostrar cita actual','checkbox'], ['showSocial','Mostrar redes sociales','checkbox'] ] },
  { kind: 'education', label: 'Educación', icon: GraduationCap, fields: [
    ['institution','Institución'], ['degree','Título'], ['startDate','Fecha inicial','date'],
    ['endDate','Fecha final','date'], ['startYear','Año inicial'], ['endYear','Año final'],
    ['status','Estado académico'], ['description','Descripción','textarea'], ['logo','Logotipo','url'] ] },
  { kind: 'skill', label: 'Habilidades', icon: Sparkles, fields: [
    ['category','Categoría'], ['description','Descripción'], ['logo','Logotipo','url'] ] },
  { kind: 'award', label: 'Reconocimientos', icon: Sparkles, fields: [
    ['institution','Institución'], ['date','Fecha','date'], ['description','Descripción','textarea'],
    ['image','Imagen','url'], ['document','Documento','url'], ['link','Publicación externa','url'],
    ['rank','Posición o premio'], ['category','Categoría'], ['headline','Titular'],
    ['prize','Premio grupal documentado'], ['teamContextTitle','Título de trabajo en equipo'],
    ['teamContextDescription','Descripción del equipo'], ['prizeDescription','Descripción del premio'],
    ['participation','Tipo de participación'], ['location','Ubicación'], ['team','Nombre del equipo'],
    ['project','Proyecto presentado'], ['technologies','Tecnologías utilizadas'], ['duration','Duración'],
    ['results','Resultados','textarea'], ['details','Detalles de la participación','textarea'],
    ['presentationLabel','Etiqueta de presentación'], ['highlights','Aspectos destacados (uno por línea)','textarea'] ] },
  { kind: 'cv', label: 'Currículum', icon: FileText, fields: [
    ['language','Idioma'], ['date','Fecha','date'], ['file','URL del PDF','url'],
    ['buttonText','Texto del botón'] ] },
  { kind: 'menu', label: 'Menús', icon: Menu, fields: [
    ['description','Descripción'] ] },
]
const info = kind => modules.find(item => item.kind === kind)
const methodicaFields = [
  ['headline','Titular principal'], ['introduction','Presentación','textarea'],
  ['location','Ubicación visible'], ['mainHeadline','Titular de empresa'],
  ['mainDescription','Descripción de empresa','textarea'],
  ['sideHeadline','Titular lateral'], ['sideDescription','Descripción lateral','textarea'],
  ['points','Puntos destacados (uno por línea)','textarea'],
  ['tags','Etiquetas (separadas por coma)'],
  ['instagram','Instagram','url'], ['linkedin','LinkedIn','url'],
  ['servicesHeadline','Titular de servicios'], ['galleryHeadline','Titular de galería'],
  ['ctaHeadline','Titular de contacto'], ['ctaDescription','Descripción de contacto','textarea'],
]
const aboutCopyFields = [
  ['detailsEyebrow','Etiqueta de formación y perfil'], ['detailsHeadline','Titular de formación y perfil'],
  ['detailsDescription','Descripción de formación y perfil'], ['principleHeadline','Principio de trabajo'],
  ['principleDescription','Descripción del principio'], ['learningHeadline','Titular de aprendizaje'],
  ['learningDescription','Descripción de aprendizaje'], ['achievementsEyebrow','Etiqueta de reconocimientos'],
  ['achievementsHeadline','Titular de reconocimientos'], ['achievementsDescription','Descripción de reconocimientos'],
  ['eventsHeadline','Titular de eventos'], ['eventsDescription','Descripción de eventos'],
  ['servicesHeadline','Titular de servicios'], ['servicesDescription','Descripción de servicios'],
  ['stackHeadline','Titular del stack'], ['stackDescription','Descripción del stack'],
  ['ctaHeadline','Titular final'], ['ctaDescription','Descripción final'],
]
const mediaFields = new Set(['photo','logo','image','cover','badge','pdf','file','document',
  'quoteImage','instagramPhoto','linkedinPhoto'])
const empty = () => ({ title: '', slug: '', status: 'draft', sort_order: 0, data: {} })
const ABOUT_EDITOR_DEFAULTS = {
  eyebrow:'Perfil profesional', profileCardLabel:'albert.profile',
  profileCardExpertise:'Cloud / DevOps / SRE', profileCardHeadline:'Construyendo soluciones confiables.',
  locationLabel:'Ubicación', highlightOneTitle:'Producción primero',
  highlightOneText:'Seguridad, estabilidad y observabilidad desde el diseño.',
  highlightTwoTitle:'Entrega continua',
  highlightTwoText:'Automatización para construir y desplegar con confianza.',
  detailsEyebrow:'Perfil y formación', detailsHeadline:'Formación y forma de trabajo',
  detailsDescription:'Formación, principios de trabajo y aprendizaje continuo.',
  achievementsEyebrow:'Hackathons y competencias',
}
const labelStatus = { draft: 'Borrador', published: 'Publicado', archived: 'Archivado', trash: 'Papelera' }

function Login({ onLogin, sessionExpired = false }) {
  const [email, setEmail] = useState(''), [password, setPassword] = useState('')
  const [code, setCode] = useState(''), [message, setMessage] = useState(sessionExpired ? 'Tu sesión expiró. Inicia sesión de nuevo para continuar.' : '')
  const [messageIsError, setMessageIsError] = useState(false), [busy, setBusy] = useState(false)
  const [recovering, setRecovering] = useState(null), [emailRequested, setEmailRequested] = useState(false)
  const [emailCode, setEmailCode] = useState(''), [recoveryCode, setRecoveryCode] = useState('')
  const [nextPassword, setNextPassword] = useState('')
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage(''); setMessageIsError(false)
    try {
      if (recovering === 'email' && !emailRequested) {
        const result = await cmsFetch('/password/recovery/request', { method:'POST',
          body:JSON.stringify({ email }) })
        setEmailRequested(true); setMessage(result.message)
      } else if (recovering) {
        await cmsFetch(recovering === 'email' ? '/password/recovery/confirm' : '/password/recover', {
          method:'POST', body:JSON.stringify({ email,emailCode,recoveryCode,code,next:nextPassword }) })
        setRecovering(null); setEmailRequested(false); setEmailCode(''); setRecoveryCode('')
        setNextPassword(''); setCode('')
        setMessage('Contraseña actualizada. Inicia sesión con la nueva contraseña y MFA si ya lo activaste.')
      } else onLogin(await cmsFetch('/login', { method: 'POST', body: JSON.stringify({ email, password, code }) }))
    }
    catch (err) { setMessage(err.message); setMessageIsError(true) }
    finally { setBusy(false) }
  }
  return <main className="cms-login"><div className="cms-login-card">
    <span className="cms-brand-mark">AS<span>.</span></span>
    <span className="cms-eyebrow">CENTRO ADMINISTRATIVO</span>
    <h1>{recovering ? 'Recuperar acceso.' : 'Bienvenido de nuevo.'}</h1>
    <p>{recovering === 'email' ? 'Solicita un código por correo. Vence en 15 minutos y solo puede utilizarse una vez.' :
      recovering === 'backup' ? 'Introduce el código de recuperación que guardaste desde Seguridad y tu código MFA.' :
      'Gestiona el contenido de tu portafolio en un espacio privado.'}</p>
    {recovering === 'backup' && <p>Este método requiere que MFA ya esté activado. El código guardado no se envía por correo.</p>}
    <form onSubmit={submit}>
      <label>Correo electrónico<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      {recovering === 'email' && emailRequested && <>
        <label>Código recibido por correo<input type="text" autoComplete="one-time-code" required value={emailCode} onChange={e => setEmailCode(e.target.value.trim())} /></label>
        <label>Contraseña nueva · mínimo 14 caracteres<input type="password" autoComplete="new-password" minLength={14} required value={nextPassword} onChange={e => setNextPassword(e.target.value)} /></label>
      </>}
      {recovering === 'backup' && <>
        <label>Código de recuperación<input type="text" autoComplete="off" required value={recoveryCode} onChange={e => setRecoveryCode(e.target.value.trim())} /></label>
        <label>Contraseña nueva · mínimo 14 caracteres<input type="password" autoComplete="new-password" minLength={14} required value={nextPassword} onChange={e => setNextPassword(e.target.value)} /></label>
      </>}
      {!recovering && <label>Contraseña<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>}
      {(!recovering || recovering === 'backup' || emailRequested) &&
        <label>Código de autenticación{recovering === 'backup' ? '' : ', si ya activaste MFA'}<input inputMode="numeric" pattern="[0-9]*" maxLength={6} required={recovering === 'backup'} value={code} onChange={e => setCode(e.target.value)} /></label>}
      {message && <p className={messageIsError ? 'cms-error' : 'cms-info'} role={messageIsError ? 'alert' : 'status'}>{message}</p>}
      <button className="cms-primary" disabled={busy}>{busy ? 'Verificando…' :
        recovering === 'email' && !emailRequested ? 'Enviar código al correo' :
          recovering ? 'Restablecer contraseña' : 'Iniciar sesión'} <ChevronRight size={17} /></button>
      {recovering === 'email' && !emailRequested && <button type="button" className="cms-login-switch"
        onClick={() => { setEmailRequested(true); setMessage('Introduce el código más reciente que recibiste.') }}>
        Ya tengo un código por correo</button>}
      {recovering === 'email' && emailRequested && <button type="button" className="cms-login-switch"
        onClick={() => { setEmailRequested(false); setMessage('') }}>Solicitar otro código</button>}
      {recovering === 'email' && <button type="button" className="cms-login-switch"
        onClick={() => { setRecovering('backup'); setMessage('') }}>Usar código de recuperación guardado</button>}
      <button type="button" className="cms-login-switch" onClick={() => {
        setRecovering(recovering ? null : 'email'); setEmailRequested(false); setMessage('') }}>
        {recovering ? 'Volver al inicio de sesión' : 'Olvidé mi contraseña'}</button>
    </form>
  </div></main>
}

function MfaSetup({ session, onDone }) {
  const [secret, setSecret] = useState(''), [code, setCode] = useState(''), [error, setError] = useState('')
  async function setup() { try { setSecret((await cmsFetch('/mfa/setup', { method: 'POST' }, session.csrf)).secret) } catch (err) { setError(err.message) } }
  async function verify(event) { event.preventDefault(); try {
    await cmsFetch('/mfa/verify', { method: 'POST', body: JSON.stringify({ code }) }, session.csrf)
    onDone({ ...session, mfaConfigured: true })
  } catch (err) { setError(err.message) } }
  return <main className="cms-login"><div className="cms-login-card"><ShieldCheck size={38} />
    <span className="cms-eyebrow">SEGURIDAD DE LA CUENTA</span><h1>Activa la verificación en dos pasos.</h1>
    <p>Necesitas una aplicación autenticadora antes de publicar o modificar contenido.</p>
    {!secret ? <button className="cms-primary" onClick={setup}>Generar clave MFA</button> : <form onSubmit={verify}>
      <p>Agrega una cuenta TOTP en tu aplicación autenticadora con esta clave. Guárdala en un lugar seguro.</p>
      <code className="cms-secret">{secret}</code>
      <label>Código de 6 dígitos<input value={code} onChange={e => setCode(e.target.value)} maxLength={6} inputMode="numeric" required /></label>
      <button className="cms-primary">Verificar y activar</button>
    </form>}
    {error && <p className="cms-error" role="alert">{error}</p>}
  </div></main>
}

function Editor({ kind, value, session, onSaved, onCancel }) {
  const [form, setForm] = useState(() => kind === 'about' ? {
    ...(value || empty()), data:{ ...ABOUT_EDITOR_DEFAULTS, ...(value?.data || {}) },
  } : value || empty())
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [preview, setPreview] = useState(false), [revisions, setRevisions] = useState([])
  const [contentAnalytics, setContentAnalytics] = useState(null)
  const [picker, setPicker] = useState(null), [assets, setAssets] = useState([])
  const [assetCursor, setAssetCursor] = useState(null), [assetLoading, setAssetLoading] = useState(false)
  const [companies, setCompanies] = useState([])
  const module = info(kind)
  useEffect(() => { if (form.id) cmsFetch(`/admin/${kind}/${form.id}/revisions`).then(setRevisions).catch(() => {}) }, [form.id, kind])
  useEffect(() => { if (!form.id || !['project','blog'].includes(kind)) return
    let active=true
    cmsFetch(`/admin/analytics/${kind}/${form.id}`).then(stats => { if (active) setContentAnalytics(stats) })
      .catch(() => { if (active) setContentAnalytics(null) })
    return () => { active=false }
  }, [form.id,kind])
  useEffect(() => { if (kind === 'experience') cmsFetch('/admin/company').then(setCompanies).catch(() => {}) }, [kind])
  const change = (key, value) => setForm(previous => ({ ...previous, [key]: value }))
  const dataChange = (key, value) => setForm(previous => ({ ...previous,
    data: { ...previous.data, [key]: value } }))
  async function save(status = form.status) {
    setBusy(true); setError('')
    try {
      const payload = { ...form, status, title: form.title.trim(),
        slug: form.slug.trim() || form.title.trim(), data: form.data }
      const saved = await cmsFetch(`/admin/${kind}${form.id ? '/' + form.id : ''}`,
        { method: form.id ? 'PATCH' : 'POST', body: JSON.stringify(payload) }, session.csrf)
      onSaved(saved)
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  const isBlocks = kind === 'page' || kind === 'blog' || kind === 'menu' || kind === 'home'
  const blocks = form.data.blocks || []
  function editBlocks(next) { dataChange('blocks', next) }
  function openPicker(target) { setPicker(target); setAssets([]); setAssetCursor(null)
    cmsFetch('/admin/media?limit=50').then(page => { setAssets(page.items); setAssetCursor(page.nextCursor) })
      .catch(err => setError(err.message)) }
  async function moreAssets() { if (!assetCursor || assetLoading) return
    setAssetLoading(true)
    try { const page=await cmsFetch(`/admin/media?limit=50&cursor=${encodeURIComponent(assetCursor)}`)
      setAssets(previous => [...previous,...page.items]); setAssetCursor(page.nextCursor)
    } catch (err) { setError(err.message) } finally { setAssetLoading(false) }
  }
  function pick(asset) { const url = mediaUrl(asset.id)
    if (picker.append) dataChange(picker.key, [form.data[picker.key], url].filter(Boolean).join('\n'))
    else if (picker.objectField) dataChange(picker.key, (form.data[picker.key] || []).map((item, index) =>
      index === picker.index ? { ...item, [picker.objectField]: url } : item))
    else if (picker.index === undefined) dataChange(picker.key, url)
    else editBlocks(blocks.map((block, index) => index === picker.index ? { ...block, url } : block))
    setPicker(null)
  }
  return <div className="cms-editor">
    <div className="cms-page-head cms-editor-head"><div><button className="cms-back" onClick={onCancel}><ArrowLeft size={17} /> Volver</button>
      <span className="cms-eyebrow">{module.label.toUpperCase()} / EDITOR</span><h1>{form.id ? 'Editar contenido' : 'Nuevo contenido'}</h1></div>
      <div className="cms-actions"><button onClick={() => setPreview(!preview)}>{preview ? 'Cerrar vista previa' : 'Vista previa'}</button>
        <button onClick={() => save('draft')} disabled={busy}><Save size={16} /> Guardar borrador</button>
        {form.id && form.status !== 'archived' && <button onClick={() => save('archived')} disabled={busy}>Archivar</button>}
        <button className="cms-primary" onClick={() => save('published')} disabled={busy}>Publicar <ChevronRight size={16} /></button></div></div>
    {error && <p className="cms-error" role="alert">{error}</p>}
    {preview && <div className="cms-panel cms-preview"><span className="cms-eyebrow">VISTA PREVIA PRIVADA</span><h1>{form.title || 'Sin título'}</h1>
      {form.data.image && <img src={form.data.image} alt="Portada" />}
      <p>{form.data.summary || form.data.description || form.data.intro || ''}</p>
      {(form.data.blocks || []).map((block, index) => <section key={index}><h2>{block.title}</h2><p>{block.text}</p></section>)}</div>}
    <div className="cms-form-grid"><section className="cms-panel cms-form-panel"><h2>Información principal</h2>
      <label>Título<input required value={form.title} onChange={e => change('title', e.target.value)} /></label>
      <label>URL / slug<input value={form.slug} onChange={e => change('slug', e.target.value)} placeholder="Se genera desde el título" /></label>
      {module.fields.map(([key, label, type]) => <label key={key}>{label}
        {type === 'company' ? <select value={form.data[key] || ''} onChange={e => dataChange(key, e.target.value)}>
          <option value="">Selecciona una empresa creada en Empresas</option>
          {companies.filter(company => company.status !== 'trash').map(company => <option value={company.id} key={company.id}>{company.title}</option>)}</select> :
        type === 'checkbox' ? <input type="checkbox" checked={['showQuote','showSocial'].includes(key) ? form.data[key] !== false : Boolean(form.data[key])} onChange={e => dataChange(key, e.target.checked)} /> :
        type === 'image-picker' ? <div className="cms-image-field">
          {form.data[key] ? <img className="cms-image-field__preview" src={form.data[key]} alt="Vista previa de la fotografía de perfil" /> :
            <div className="cms-image-field__empty"><Image size={22} /><span>Aún no has elegido una fotografía.</span></div>}
          <div className="cms-image-field__actions">
            <button type="button" className="cms-media-pick" onClick={() => openPicker({ key })}>
              {form.data[key] ? 'Cambiar fotografía' : 'Elegir fotografía de la biblioteca'}</button>
            {form.data[key] && <button type="button" className="cms-image-field__remove" onClick={() => dataChange(key, '')}>Quitar fotografía</button>}
          </div>
        </div> :
        type === 'media-list' ? <><textarea rows={4} value={form.data[key] || ''} onChange={e => dataChange(key, e.target.value)} />
          <button type="button" className="cms-media-pick" onClick={() => openPicker({ key, append:true })}>Agregar desde biblioteca</button></> :
        type === 'textarea' ? <textarea rows={4} value={form.data[key] || ''} onChange={e => dataChange(key, e.target.value)} /> :
          <><input type={type || 'text'} value={form.data[key] || ''} onChange={e => dataChange(key, e.target.value)} />
            {type === 'url' && mediaFields.has(key) && <button type="button" className="cms-media-pick" onClick={() => openPicker({ key })}>Elegir de la biblioteca</button>}</>}
      </label>)}
      {kind === 'home' && <div className="cms-blocks"><div className="cms-inline-head"><h2>Especialidades del pie de página</h2>
        <button type="button" onClick={() => dataChange('footerSpecialties',[...(form.data.footerSpecialties || []),{title:'',text:''}])}>
          <Plus size={15} /> Añadir</button></div>
        {(form.data.footerSpecialties || []).map((item,index) => <div className="cms-block" key={index}>
          <div className="cms-block-top"><strong>{item.title || `Especialidad ${index+1}`}</strong>
            <button type="button" aria-label="Quitar" onClick={() => dataChange('footerSpecialties',form.data.footerSpecialties.filter((_,i) => i !== index))}><X size={16} /></button></div>
          <input placeholder="Título" value={item.title || ''} onChange={e => dataChange('footerSpecialties',form.data.footerSpecialties.map((row,i) => i===index ? {...row,title:e.target.value} : row))} />
          <textarea placeholder="Descripción" value={item.text || ''} onChange={e => dataChange('footerSpecialties',form.data.footerSpecialties.map((row,i) => i===index ? {...row,text:e.target.value} : row))} />
        </div>)}
      </div>}
      {kind === 'about' && <>
        <h2>Textos de secciones</h2>
        {aboutCopyFields.map(([key,label]) => <label key={key}>{label}
          <textarea rows={key.endsWith('Description') ? 3 : 2} value={form.data[key] || ''}
            onChange={e => dataChange(key,e.target.value)} />
        </label>)}
        <div className="cms-blocks"><div className="cms-inline-head"><h2>Servicios destacados</h2>
          <button type="button" onClick={() => dataChange('services', [...(form.data.services || []), { title:'',text:'' }])}>
            <Plus size={15} /> Añadir</button></div>
          {(form.data.services || []).map((item,index) => <div className="cms-block" key={index}>
            <div className="cms-block-top"><strong>{item.title || `Servicio ${index+1}`}</strong>
              <button type="button" aria-label="Quitar" onClick={() => dataChange('services',form.data.services.filter((_,i) => i !== index))}><X size={16} /></button></div>
            <input placeholder="Título" value={item.title || ''} onChange={e => dataChange('services',form.data.services.map((row,i) => i===index ? {...row,title:e.target.value} : row))} />
            <textarea placeholder="Descripción" value={item.text || ''} onChange={e => dataChange('services',form.data.services.map((row,i) => i===index ? {...row,text:e.target.value} : row))} />
          </div>)}
        </div>
      </>}
      {kind === 'company' && (form.slug === 'methodica-technology' || value?.slug === 'methodica-technology') && <>
        <h2>Página Methodica</h2>
        {methodicaFields.map(([key, label, type]) => <label key={key}>{label}
          {type === 'textarea' ? <textarea rows={4} value={form.data[key] || ''} onChange={e => dataChange(key, e.target.value)} /> :
            <input type={type || 'text'} value={form.data[key] || ''} onChange={e => dataChange(key, e.target.value)} />}
        </label>)}
        {['services','gallery'].map(key => <div className="cms-blocks" key={key}>
          <div className="cms-inline-head"><h2>{key === 'services' ? 'Servicios' : 'Galería'}</h2>
            <button type="button" onClick={() => dataChange(key, [...(form.data[key] || []),
              key === 'services' ? { title:'', text:'' } : { src:'', title:'', text:'' }])}><Plus size={15} /> Añadir</button></div>
          {(form.data[key] || []).map((item, index) => <div className="cms-block" key={index}>
            <div className="cms-block-top"><strong>{item.title || `Elemento ${index + 1}`}</strong>
              <button type="button" aria-label="Subir" disabled={!index} onClick={() => { const next=[...form.data[key]];
                [next[index-1],next[index]]=[next[index],next[index-1]];dataChange(key,next) }}>↑</button>
              <button type="button" aria-label="Bajar" disabled={index === form.data[key].length-1} onClick={() => { const next=[...form.data[key]];
                [next[index+1],next[index]]=[next[index],next[index+1]];dataChange(key,next) }}>↓</button>
              <button type="button" aria-label="Quitar" onClick={() => dataChange(key, form.data[key].filter((_, i) => i !== index))}><X size={16} /></button></div>
            <input placeholder="Título" value={item.title || ''} onChange={e => dataChange(key, form.data[key].map((row,i) => i === index ? {...row,title:e.target.value} : row))} />
            <textarea placeholder="Descripción" value={item.text || ''} onChange={e => dataChange(key, form.data[key].map((row,i) => i === index ? {...row,text:e.target.value} : row))} />
            {key === 'gallery' && <><input placeholder="URL de imagen" value={item.src || ''} onChange={e => dataChange(key, form.data[key].map((row,i) => i === index ? {...row,src:e.target.value} : row))} />
              <button type="button" className="cms-media-pick" onClick={() => openPicker({ key, index, objectField:'src' })}>Elegir de la biblioteca</button></>}
          </div>)}
        </div>)}
      </>}
      {isBlocks && <div className="cms-blocks"><div className="cms-inline-head"><h2>{kind === 'menu' ? 'Enlaces' : 'Bloques de contenido'}</h2>
        <button onClick={() => editBlocks([...blocks, { type: kind === 'menu' ? 'link' : 'text', title: '', text: '', url: '' }])}><Plus size={15} /> Añadir</button></div>
        {blocks.map((block, index) => <div className="cms-block" key={index}>
          <div className="cms-block-top"><select value={block.type} onChange={e => editBlocks(blocks.map((b, i) => i === index ? { ...b, type: e.target.value } : b))}>
            {(kind === 'menu' ? ['link'] : ['text','heading','image','hero','list','quote','code','table','cards','gallery','video','document','divider','link']).map(type => <option key={type}>{type}</option>)}</select>
            <button aria-label="Subir bloque" disabled={!index} onClick={() => { const next = [...blocks]; [next[index-1], next[index]] = [next[index], next[index-1]]; editBlocks(next) }}>↑</button>
            <button aria-label="Bajar bloque" disabled={index === blocks.length - 1} onClick={() => { const next = [...blocks]; [next[index+1], next[index]] = [next[index], next[index+1]]; editBlocks(next) }}>↓</button>
            <button aria-label="Quitar bloque" onClick={() => editBlocks(blocks.filter((_, i) => i !== index))}><X size={16} /></button></div>
          <input placeholder="Título" value={block.title || ''} onChange={e => editBlocks(blocks.map((b, i) => i === index ? { ...b, title: e.target.value } : b))} />
          <textarea placeholder="Texto o descripción" value={block.text || ''} onChange={e => editBlocks(blocks.map((b, i) => i === index ? { ...b, text: e.target.value } : b))} />
          <input placeholder="URL de imagen, video, documento o enlace" value={block.url || ''} onChange={e => editBlocks(blocks.map((b, i) => i === index ? { ...b, url: e.target.value } : b))} />
          {block.type !== 'link' && <button type="button" className="cms-media-pick" onClick={() => openPicker({ index })}>Elegir archivo</button>}
        </div>)}
      </div>}
    </section><aside className="cms-panel cms-sidebar-panel"><h2>Publicación</h2>
      <p>Estado: <strong>{labelStatus[form.status]}</strong></p>
      <label>Orden<input type="number" value={form.sort_order} onChange={e => change('sort_order', Number(e.target.value))} /></label>
      <p>Los borradores y contenidos archivados no aparecen en el portafolio público.</p>
      {contentAnalytics && <div className="cms-revisions"><h2>Interés · 30 días</h2>
        <p>{contentAnalytics.views} vistas registradas con consentimiento</p>
        <small>{contentAnalytics.path}</small></div>}
      {form.id && <><p>Última actualización: {new Date(form.updated_at).toLocaleString('es-DO')}</p>
        <button type="button" className="cms-duplicate" onClick={async () => { setBusy(true); setError('')
          try { const copy = await cmsFetch(`/admin/${kind}`, { method:'POST', body:JSON.stringify({
            title:`Copia de ${form.title}`, slug:`${form.slug}-copia-${Date.now().toString(36)}`,
            status:'draft', sort_order:form.sort_order, data:form.data }) }, session.csrf)
            onSaved(copy) } catch (err) { setError(err.message) } finally { setBusy(false) }
        }}>Duplicar como borrador</button>
        {revisions.length > 0 && <div className="cms-revisions"><h2>Versiones anteriores</h2>{revisions.map(revision =>
          <button key={revision.id} onClick={async () => { if (!window.confirm('¿Restaurar esta versión como borrador?')) return
            try { await cmsFetch(`/admin/${kind}/${form.id}/restore`, { method:'POST', body:JSON.stringify({ revisionId:revision.id }) }, session.csrf)
              const restored = await cmsFetch(`/admin/${kind}/${form.id}`); setForm(restored) } catch (err) { setError(err.message) } }}>
            {new Date(revision.created_at).toLocaleString('es-DO')}</button>)}</div>}
        <button className="cms-danger" onClick={async () => { if (!window.confirm('¿Mover a la papelera?')) return
          try { await cmsFetch(`/admin/${kind}/${form.id}`, { method: 'DELETE' }, session.csrf); onCancel() } catch (err) { setError(err.message) } }}><Trash2 size={15} /> Mover a papelera</button></>}
    </aside></div>
    {picker && <div className="cms-modal-backdrop" role="presentation" onClick={() => setPicker(null)}><div className="cms-modal cms-panel" role="dialog" aria-modal="true" aria-label="Seleccionar archivo" onClick={event => event.stopPropagation()}>
      <div className="cms-inline-head"><h2>Seleccionar archivo</h2><button onClick={() => setPicker(null)} aria-label="Cerrar"><X size={18} /></button></div>
      <div className="cms-picker-grid">{assets.filter(asset => asset.access === 'public' && !asset.deleted_at).map(asset => <button key={asset.id} onClick={() => pick(asset)}>
        {asset.mime.startsWith('image/') ? <img src={mediaUrl(asset.id)} alt={asset.alt || asset.filename} /> : <FileText size={38} />}
        <span>{asset.filename}</span></button>)}</div>
      {!assets.length && <p>Sube un archivo desde la biblioteca multimedia primero.</p>}
      {assetCursor && <button disabled={assetLoading} onClick={moreAssets}>{assetLoading ? 'Cargando…' : 'Cargar más archivos'}</button>}
    </div></div>}
  </div>
}

function MediaLibrary({ session }) {
  const [items, setItems] = useState([]), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const [nextCursor, setNextCursor] = useState(null), [loadingMore, setLoadingMore] = useState(false)
  const [uploadAccess, setUploadAccess] = useState('public')
  const maxUploadBytes = ['localhost','127.0.0.1'].includes(window.location.hostname) ? 10_000_000 : 4_000_000
  const load = () => cmsFetch('/admin/media?limit=50').then(page => {
    setItems(page.items); setNextCursor(page.nextCursor)
  }).catch(err => setError(err.message))
  async function more() { if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try { const page=await cmsFetch(`/admin/media?limit=50&cursor=${encodeURIComponent(nextCursor)}`)
      setItems(previous => [...previous,...page.items]); setNextCursor(page.nextCursor)
    } catch (err) { setError(err.message) } finally { setLoadingMore(false) }
  }
  useEffect(() => { load() }, [])
  async function upload(event) {
    const files = [...event.target.files]; if (!files.length) return
    setBusy(true); setError('')
    try { for (const file of files) {
      if (file.size > maxUploadBytes) throw new Error(`El archivo ${file.name} supera el límite de ${maxUploadBytes / 1_000_000} MB.`)
      await cmsFetch('/admin/media', {
      method: 'POST', body: file, headers: { 'Content-Type': file.type,
        'X-Filename': file.name, 'X-Media-Access': uploadAccess } }, session.csrf)
    }
      await load()
    } catch (err) { setError(err.message) } finally { event.target.value = ''; setBusy(false) }
  }
  async function update(item, change) {
    setBusy(true); setError('')
    try { await cmsFetch(`/admin/media/${item.id}`, { method:'PATCH', body:JSON.stringify({
      alt:item.alt, access:item.access, ...change,
    }) }, session.csrf); await load() } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  async function trash(item) {
    if (!window.confirm(`¿Mover ${item.filename} a la papelera?`)) return
    setBusy(true); setError('')
    try { await cmsFetch(`/admin/media/${item.id}`, { method:'DELETE' }, session.csrf); await load() }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  async function restore(item) {
    setBusy(true); setError('')
    try { await cmsFetch(`/admin/media/${item.id}/restore`, { method:'POST' }, session.csrf); await load() }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <><div className="cms-page-head"><div><span className="cms-eyebrow">BIBLIOTECA</span><h1>Archivos y medios</h1><p>Imágenes y PDF guardados fuera del directorio de despliegue. Máximo {maxUploadBytes / 1_000_000} MB por archivo.</p></div>
    <div className="cms-actions"><label>Acceso<select value={uploadAccess} onChange={event => setUploadAccess(event.target.value)}>
      <option value="public">Público</option><option value="private">Privado</option></select></label>
      <label className="cms-primary cms-upload"><Upload size={16} /> {busy ? 'Subiendo…' : 'Subir archivos'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,application/pdf" multiple onChange={upload} hidden disabled={busy} /></label></div></div>
    {error && <p className="cms-error">{error}</p>}
    <div className="cms-media-grid">{items.map(item => <article className="cms-panel cms-media" key={item.id}>
      {!item.deleted_at && item.mime.startsWith('image/') ? <img src={mediaUrl(item.id)} alt={item.alt || item.filename} /> : <FileText size={42} />}
      <strong>{item.filename}</strong><span>{(item.bytes / 1024).toFixed(1)} KB · {item.deleted_at ? 'Papelera' : item.access === 'public' ? 'Público' : 'Privado'}</span>
      {item.deleted_at ? <button disabled={busy} onClick={() => restore(item)}>Restaurar</button> : <>
        <label>Texto alternativo<input value={item.alt || ''} maxLength={250} onChange={event => setItems(previous => previous.map(asset =>
          asset.id === item.id ? { ...asset, alt:event.target.value } : asset))} /></label>
        <button disabled={busy} onClick={() => update(item, {})}>Guardar texto alternativo</button>
        <button disabled={busy} onClick={() => update(item, { access:item.access === 'public' ? 'private' : 'public' })}>
          {item.access === 'public' ? 'Cambiar a privado' : 'Cambiar a público'}</button>
        {item.access === 'public' && <button onClick={() => navigator.clipboard.writeText(new URL(mediaUrl(item.id), window.location.origin).href)}>Copiar URL</button>}
        <button className="cms-danger" disabled={busy} onClick={() => trash(item)}>Mover a papelera</button>
      </>}
    </article>)}</div>{!items.length && <p className="cms-empty">Todavía no hay archivos.</p>}
    {nextCursor && <button className="cms-primary" disabled={loadingMore} onClick={more}>
      {loadingMore ? 'Cargando…' : 'Cargar más archivos'}</button>}</>
}

function Analytics({ session }) {
  const [stats, setStats] = useState(null), [error, setError] = useState('')
  useEffect(() => { cmsFetch('/admin/analytics').then(setStats).catch(err => setError(err.message)) }, [session])
  const total = stats?.days.reduce((sum, day) => sum + day.views, 0) || 0
  const maxDay = Math.max(1, ...(stats?.days.map(day => day.views) || []))
  function downloadCsv() {
    if (!stats) return
    const lines = ['fecha,vistas', ...stats.days.map(day => `${day.day},${day.views}`)]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type:'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'analitica-albert-sanfle.csv'; anchor.click()
    URL.revokeObjectURL(url)
  }
  return <><div className="cms-page-head"><div><span className="cms-eyebrow">TRÁFICO REAL</span><h1>Analítica web</h1>
    <p>Visualizaciones de páginas registradas con consentimiento, últimos 30 días.</p></div>
    {stats && <button className="cms-primary" onClick={downloadCsv}>Exportar CSV</button>}</div>
    {error && <p className="cms-error">{error}</p>}
    {stats && <><div className="cms-stat-grid"><div className="cms-panel cms-stat"><span>Vistas · 30 días</span><strong>{total}</strong></div>
      <div className="cms-panel cms-stat"><span>Vistas · hoy (UTC)</span><strong>{stats.days.find(day => day.day === new Date().toISOString().slice(0,10))?.views || 0}</strong></div>
      <div className="cms-panel cms-stat"><span>Páginas con actividad</span><strong>{stats.pages.length}</strong></div></div>
      <div className="cms-panel"><h2>Métricas aún no disponibles</h2>
        <p>Visitantes únicos, sesiones, países y fuentes de tráfico no se recogen en este sistema. Las vistas mostradas corresponden únicamente a eventos registrados con consentimiento.</p></div>
      {!total ? <p className="cms-empty">Aún no hay estadísticas disponibles.</p> : <><div className="cms-panel cms-chart"><h2>Vistas por día</h2>
        <div className="cms-chart-bars">{stats.days.map(day => <div className="cms-chart-col" key={day.day} title={`${day.day}: ${day.views} vistas`}>
          <strong>{day.views}</strong><span style={{ height:`${Math.max(4, day.views / maxDay * 170)}px` }} /><small>{day.day.slice(5)}</small></div>)}</div></div>
      <div className="cms-panel"><h2>Páginas populares</h2>
        {stats.pages.map(page => <div className="cms-list-row" key={page.path}><span>{page.path}</span><strong>{page.views}</strong></div>)}</div>
      <div className="cms-panel"><h2>Interacciones consentidas</h2>
        {(stats.interactions || []).length ? stats.interactions.map(item => <div className="cms-list-row" key={`${item.event}:${item.path}`}>
          <span>{item.event === 'cv_download' ? 'Apertura de CV' : item.event} · {item.path}</span><strong>{item.count}</strong></div>) :
          <p className="cms-empty">Aún no hay interacciones registradas.</p>}</div></>}</>}
  </>
}

function SecurityPage({ session }) {
  const [sessions, setSessions] = useState([]), [current, setCurrent] = useState('')
  const [next, setNext] = useState(''), [code, setCode] = useState('')
  const [notice, setNotice] = useState(''), [recoveryCode, setRecoveryCode] = useState('')
  const reload = () => cmsFetch('/admin/sessions').then(setSessions).catch(err => setNotice(err.message))
  useEffect(() => { reload() }, [])
  async function changePassword(event) { event.preventDefault(); setNotice('')
    try { await cmsFetch('/admin/password', { method:'POST', body:JSON.stringify({ current, next, code }) }, session.csrf)
      setCurrent(''); setNext(''); setCode(''); setNotice('Contraseña actualizada. Las demás sesiones se cerraron.'); reload()
    } catch (err) { setNotice(err.message) } }
  async function generateRecoveryCode() { setNotice(''); setRecoveryCode('')
    try { const result=await cmsFetch('/admin/recovery-code', { method:'POST',
      body:JSON.stringify({ password:current,code }) },session.csrf)
      setRecoveryCode(result.recoveryCode); setNotice('Guarda este código ahora. El anterior ya no sirve.')
    } catch (err) { setNotice(err.message) }
  }
  return <><div className="cms-page-head"><div><span className="cms-eyebrow">CUENTA</span><h1>Seguridad y sesiones</h1>
    <p>Administra tu contraseña y las sesiones abiertas.</p></div></div>
    {notice && <p className="cms-panel cms-notice" role="status">{notice}</p>}
    <div className="cms-form-grid"><form className="cms-panel cms-form-panel" onSubmit={changePassword}><h2>Cambiar contraseña</h2>
      <label>Contraseña actual<input type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} required /></label>
      <label>Contraseña nueva · mínimo 14 caracteres<input type="password" autoComplete="new-password" minLength={14} value={next} onChange={e => setNext(e.target.value)} required /></label>
      <label>Código MFA<input inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value)} required /></label>
      <button className="cms-primary">Guardar contraseña</button></form>
      <aside className="cms-panel cms-sidebar-panel"><h2>Sesiones activas</h2>
        {sessions.map(item => <p key={item.token_hash}>{item.current ? 'Este dispositivo' : 'Otra sesión'}<br />
          Iniciada: {new Date(item.created_at).toLocaleString('es-DO')}</p>)}
        {sessions.length > 1 && <button className="cms-danger" onClick={async () => { try {
          await cmsFetch('/admin/sessions', { method:'DELETE' }, session.csrf); reload()
        } catch (err) { setNotice(err.message) } }}>Cerrar otras sesiones</button>}
        <h2>Código de recuperación</h2>
        <p>Introduce tu contraseña actual y MFA en el formulario para generar un código de un solo uso. Guárdalo fuera de este dispositivo.</p>
        <button type="button" disabled={!current || !code} onClick={generateRecoveryCode}>Generar o renovar código</button>
        {recoveryCode && <p><strong>Código nuevo (se muestra una vez):</strong><br /><code className="cms-secret">{recoveryCode}</code></p>}
      </aside></div></>
}

function Inbox({ session }) {
  const [messages, setMessages] = useState([]), [selected, setSelected] = useState(null), [error, setError] = useState('')
  const load = () => cmsFetch('/admin/messages').then(setMessages).catch(err => setError(err.message))
  useEffect(() => { load() }, [])
  async function status(id, next) { try {
    await cmsFetch(`/admin/messages/${id}`, { method:'PATCH', body:JSON.stringify({ status:next }) }, session.csrf)
    setSelected(previous => previous && previous.id === id ? { ...previous, status:next } : previous); load()
  } catch (err) { setError(err.message) } }
  return <><div className="cms-page-head"><div><span className="cms-eyebrow">CONTACTO</span><h1>Bandeja de entrada</h1>
    <p>Mensajes recibidos desde el formulario del portafolio.</p></div></div>
    {error && <p className="cms-error">{error}</p>}
    <div className="cms-form-grid"><div className="cms-panel cms-table">{messages.length ? messages.map(item =>
      <button className="cms-list-row" key={item.id} onClick={() => { setSelected(item); if (item.status === 'pending') status(item.id, 'read') }}>
        <span><strong>{item.subject}</strong><small>{item.name} · {item.email} · {new Date(item.created_at).toLocaleString('es-DO')}</small></span>
        <span className={`cms-status cms-status--${item.status}`}>{item.status}</span></button>) :
        <p className="cms-empty">Aún no hay mensajes recibidos.</p>}</div>
      {selected && <aside className="cms-panel cms-sidebar-panel"><h2>{selected.subject}</h2><p>{selected.name}<br />{selected.email}</p>
        <p className="cms-message-body">{selected.message}</p>
        <button onClick={() => status(selected.id, 'pending')}>Marcar pendiente</button>
        <button onClick={() => status(selected.id, 'archived')}>Archivar</button>
        <button className="cms-danger" onClick={() => { if (window.confirm('¿Enviar a papelera?')) status(selected.id, 'trash') }}>Mover a papelera</button></aside>}</div></>
}

export default function AdminApp() {
  const [session, setSession] = useState(null), [loading, setLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [section, setSection] = useState('dashboard'), [items, setItems] = useState([])
  const [editing, setEditing] = useState(null), [error, setError] = useState('')
  const [counts, setCounts] = useState(null)
  const [nextCursor, setNextCursor] = useState(null), [loadingMore, setLoadingMore] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useEffect(() => { cmsFetch('/session').then(setSession).catch(() => setSession({ authenticated: false })).finally(() => setLoading(false)) }, [])
  useEffect(() => {
    const expire = () => { setSessionExpired(true); setSession({ authenticated:false }) }
    window.addEventListener('cms:session-expired', expire)
    return () => window.removeEventListener('cms:session-expired', expire)
  }, [])
  useEffect(() => { if (!info(section) || !session?.mfaConfigured) return
    let active = true
    cmsFetch(`/admin/${section}?limit=50`).then(page => { if (active) {
      setItems(page.items);setNextCursor(page.nextCursor) } }).catch(err => { if (active) setError(err.message) })
    return () => { active = false }
  }, [section, session])
  useEffect(() => { if (section !== 'dashboard' || !session?.mfaConfigured) return
    cmsFetch('/admin/summary').then(summary => setCounts(summary.counts)).catch(err => setError(err.message))
  }, [section, session])
  useEffect(() => { const meta = document.createElement('meta'); meta.name = 'robots'; meta.content = 'noindex,nofollow'; document.head.append(meta)
    return () => meta.remove() }, [])
  const select = next => { setSection(next); setEditing(null); setError(''); setItems([]);setNextCursor(null);setSidebarOpen(false) }
  async function loadMore() { if (!nextCursor || loadingMore) return
    setLoadingMore(true);setError('')
    try { const page=await cmsFetch(`/admin/${section}?limit=50&cursor=${encodeURIComponent(nextCursor)}`)
      setItems(previous => [...previous,...page.items.filter(item => !previous.some(existing => existing.id === item.id))])
      setNextCursor(page.nextCursor)
    } catch (err) { setError(err.message) } finally { setLoadingMore(false) }
  }
  async function logout() { await cmsFetch('/logout', { method: 'POST' }, session.csrf); setSession({ authenticated: false }) }
  if (loading) return <div className="cms-loading">Cargando administración…</div>
  if (!session?.authenticated) return <Login sessionExpired={sessionExpired} onLogin={value => {
    setSessionExpired(false); setSession(value)
  }} />
  if (!session.mfaConfigured) return <MfaSetup session={session} onDone={setSession} />
  return <div className="cms-app"><aside className={`cms-sidebar ${sidebarOpen ? 'cms-sidebar--open' : ''}`}>
    <div className="cms-sidebar-brand"><span className="cms-brand-mark">AS<span>.</span></span><div><strong>Albert Sanfle</strong><small>Portfolio Manager</small></div></div>
    <span className="cms-nav-label">ESPACIO DE TRABAJO</span>
    <button className={section === 'dashboard' ? 'active' : ''} onClick={() => select('dashboard')}><Home size={18} /> Vista general</button>
    <button className={section === 'analytics' ? 'active' : ''} onClick={() => select('analytics')}><BarChart3 size={18} /> Analítica web</button>
    <button className={section === 'messages' ? 'active' : ''} onClick={() => select('messages')}><Mail size={18} /> Mensajes</button>
    <span className="cms-nav-label">CONTENIDO</span>
    {modules.map(module => <button key={module.kind} className={section === module.kind ? 'active' : ''} onClick={() => select(module.kind)}>
      <module.icon size={18} /> {module.label}</button>)}
    <span className="cms-nav-label">RECURSOS</span><button className={section === 'media' ? 'active' : ''} onClick={() => select('media')}><Image size={18} /> Biblioteca multimedia</button>
    <div className="cms-sidebar-bottom"><span>{session.email}</span><button onClick={() => select('security')}><ShieldCheck size={17} /> Seguridad</button><button onClick={logout}><LogOut size={17} /> Cerrar sesión</button></div>
  </aside><div className="cms-main"><header className="cms-topbar"><button className="cms-mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={20} /></button>
    <span>Panel administrativo <ChevronRight size={14} /> {section === 'dashboard' ? 'Vista general' : section === 'analytics' ? 'Analítica web' : info(section)?.label || 'Biblioteca'}</span>
    <div className="cms-avatar">AS</div></header><main className="cms-content">
      {editing ? <Editor key={editing.id || 'new'} kind={section} value={editing.id ? editing : null} session={session}
        onSaved={saved => { setEditing(null); setItems(previous => [saved, ...previous.filter(item => item.id !== saved.id)]) }} onCancel={() => setEditing(null)} /> :
      section === 'analytics' ? <Analytics session={session} /> : section === 'messages' ? <Inbox session={session} /> : section === 'security' ? <SecurityPage session={session} /> : section === 'media' ? <MediaLibrary session={session} /> :
      section === 'dashboard' ? <><div className="cms-welcome"><span className="cms-eyebrow">PORTAFOLIO / CENTRO DE CONTROL</span>
        <h1>Tu contenido, bajo control.</h1><p>Publica novedades, revisa tus secciones y mantén tu presencia profesional al día.</p></div>
        <div className="cms-dashboard-grid">{modules.slice(0, 8).map(module => <button className="cms-panel cms-dashboard-card" key={module.kind} onClick={() => select(module.kind)}>
          <module.icon size={22} /><strong>{module.label}</strong><span>{counts ? (counts[module.kind] || 0) : '—'} registros · Gestionar <ChevronRight size={14} /></span></button>)}</div>
        <div className="cms-panel cms-callout"><div><strong>Contenido real y publicación inmediata</strong><p>Los cambios se almacenan en la base de datos y las páginas públicas los consultan mediante la API.</p></div><button onClick={() => select('experience')}>Empezar con experiencia <ChevronRight size={16} /></button></div></> :
      <><div className="cms-page-head"><div><span className="cms-eyebrow">GESTIÓN DE CONTENIDO</span><h1>{info(section)?.label}</h1>
        <p>Crea, edita y publica contenido sin modificar el código del sitio.</p></div>
        <button className="cms-primary" onClick={() => setEditing(empty())}><Plus size={17} /> Nuevo registro</button></div>
        {error && <p className="cms-error">{error}</p>}
        <div className="cms-panel cms-table">{items.length ? items.map(item => <button className="cms-list-row" key={item.id} onClick={() => setEditing(item)}>
          <span><strong>{item.title}</strong><small>/{item.slug} · {new Date(item.updated_at).toLocaleDateString('es-DO')}</small></span>
          <span className={`cms-status cms-status--${item.status}`}>{labelStatus[item.status]}</span><ChevronRight size={17} /></button>) :
          <div className="cms-empty">Aún no hay registros en esta sección.</div>}</div>
        {nextCursor && <button className="cms-primary" disabled={loadingMore} onClick={loadMore}>
          {loadingMore ? 'Cargando…' : 'Cargar más registros'}</button>}</>}
    </main></div></div>
}
