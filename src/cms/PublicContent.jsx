import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin } from 'lucide-react'
import { usePublicContent } from './usePublicContent.js'
import { safeUrl } from './safeUrl.js'
import { cmsFetch } from './api.js'
import { getCookiePreferences } from '../components/cookieConsent.js'
import { usePageMetadata } from './usePageMetadata.js'
import './public.css'

const labels = { experience:'Experiencia profesional', project:'Proyectos', event:'Eventos', cv:'Currículum',
  album:'Galería', education:'Educación', award:'Reconocimientos', skill:'Habilidades' }
const descriptions = { experience:'Trayectoria y responsabilidades profesionales.',
  project:'Soluciones, arquitecturas y resultados.', event:'Actividades y participaciones profesionales.',
  album:'Fotografías de eventos y experiencias.', cv:'Versiones públicas del currículum.', education:'Formación académica.',
  award:'Distinciones y logros profesionales.', skill:'Tecnologías y competencias.' }
function Cover({ data, title }) {
  const src = safeUrl(data.image || data.cover || data.companyLogo || data.logo || data.badge)
  return src ? <img className="cms-public-cover" src={src} alt={title} loading="lazy" /> : null
}
function ContentCard({ row, kind }) {
  const data = row.data
  const href = kind === 'experience' ? `/experiencia/${row.slug}` : kind === 'project' ? `/proyectos/${row.slug}` : kind === 'event' ? `/eventos/${row.slug}` :
    kind === 'album' ? `/galeria/${row.slug}` : null
  const inner = <><Cover data={data} title={row.title} /><div className="cms-public-card-body">
    <span className="cms-public-kicker">{data.company || data.institution || data.category || labels[kind]}</span>
    <h2>{row.title}</h2><p>{data.summary || data.description || data.role || ''}</p>
    {(data.startDate || data.date) && <small><CalendarDays size={15} /> {data.startDate || data.date}{data.endDate && ` — ${data.endDate}`}</small>}
    {data.location && <small><MapPin size={15} /> {data.location}</small>}
    {href && <span className="cms-public-open">Ver detalle <ArrowUpRight size={16} /></span>}
    {kind === 'cv' && safeUrl(data.file) && <a href={safeUrl(data.file)} target="_blank" rel="noreferrer" className="cms-public-open"
      onClick={() => { if (getCookiePreferences()?.analytics === true) cmsFetch('/analytics/interaction', {
        method: 'POST', body: JSON.stringify({ event: 'cv_download', path: `/cv/${row.slug}`,
          eventId:crypto.randomUUID() }),
      }).catch(() => {}) }}>{data.buttonText || 'Abrir PDF'} <ArrowUpRight size={16} /></a>}
  </div></>
  return href ? <Link className="cms-public-card" to={href}>{inner}</Link> : <article className="cms-public-card">{inner}</article>
}
export function CollectionPage({ kind }) {
  const records = usePublicContent(kind, [])
  const companies = usePublicContent('company', [], undefined, kind === 'experience')
  const companyById = new Map(companies.map(company => [company.id, company]))
  const displayRecords = kind === 'experience' ? records.map(record => {
    const company = companyById.get(record.data.companyId)
    return company ? { ...record, data: { ...record.data, company:company.title,
      companyLogo:company.data.logo, companyWebsite:company.data.website } } : record
  }) : records
  return <section className="cms-public"><div className="cms-public-container">
    <header className="cms-public-heading"><span className="cms-public-kicker">ALBERT SANFLE / PORTAFOLIO</span>
      <h1>{labels[kind]}</h1><p>{descriptions[kind]}</p></header>
    {displayRecords.length ? <div className="cms-public-grid">{displayRecords.map(row => <ContentCard kind={kind} row={row} key={row.id} />)}</div> :
      <p className="cms-public-empty">Aún no hay contenido publicado en esta sección.</p>}
  </div></section>
}
export function ContentBlocks({ blocks = [] }) {
  return blocks.map((block, index) => <section id={`seccion-${index}`} className={`cms-public-block cms-public-block--${block.type}`} key={index}>
    {block.title && <h2>{block.title}</h2>}
    {block.text && !['code','quote','list','table'].includes(block.type) && <p>{block.text}</p>}
    {block.type === 'code' && <pre><code>{block.text}</code></pre>}
    {block.type === 'quote' && <blockquote>{block.text}</blockquote>}
    {block.type === 'list' && <ul>{(block.text || '').split('\n').filter(Boolean).map((item, i) => <li key={i}>{item}</li>)}</ul>}
    {block.type === 'table' && <div className="cms-public-table-wrap"><table><tbody>{(block.text || '').split('\n').filter(Boolean).map((line, i) =>
      <tr key={i}>{line.split('|').map((cell, j) => <td key={j}>{cell.trim()}</td>)}</tr>)}</tbody></table></div>}
    {['image','hero'].includes(block.type) && safeUrl(block.url) && <img src={safeUrl(block.url)} alt={block.title || ''} loading="lazy" />}
    {block.type === 'gallery' && <div className="cms-public-grid">{(block.url || '').split('\n').map(src => safeUrl(src) && <img key={src} src={safeUrl(src)} alt={block.title || ''} loading="lazy" />)}</div>}
    {block.type === 'video' && safeUrl(block.url) && <a href={safeUrl(block.url)} target="_blank" rel="noreferrer">Ver video <ArrowUpRight size={15} /></a>}
    {block.type === 'document' && safeUrl(block.url) && <a href={safeUrl(block.url)} target="_blank" rel="noreferrer">Abrir documento <ArrowUpRight size={15} /></a>}
    {block.type === 'link' && safeUrl(block.url) && <a href={safeUrl(block.url)}>{block.title || 'Abrir enlace'} <ArrowUpRight size={15} /></a>}
  </section>)
}
export function DetailPage({ kind }) {
  const { slug } = useParams()
  const row = usePublicContent(kind, null, slug)
  const companies = usePublicContent('company', [], undefined, kind === 'experience')
  const company = companies.find(item => item.id === row?.data.companyId)
  const data = row ? { ...row.data, company:company?.title || row.data.company,
    companyLogo:company?.data.logo || row.data.companyLogo } : null
  usePageMetadata(row?.data.seoTitle || row?.title, row?.data.seoDescription || row?.data.summary || row?.data.description,
    kind === 'experience' ? `/experiencia/${slug}` : kind === 'project' ? `/proyectos/${slug}` : kind === 'event' ? `/eventos/${slug}` : `/galeria/${slug}`, row?.data.image)
  const back = kind === 'experience' ? '/experiencia' : kind === 'project' ? '/proyectos' : kind === 'event' ? '/eventos' : '/galeria'
  return <section className="cms-public"><div className="cms-public-container">
    <Link className="cms-public-back" to={back}><ArrowLeft size={17} /> Volver</Link>
    {!row ? <div className="cms-public-empty"><h1>Contenido no disponible</h1><p>Comprueba la dirección o vuelve al listado.</p></div> : <>
      <header className="cms-public-heading"><span className="cms-public-kicker">{data.company || labels[kind]}</span><h1>{row.title}</h1>
        <p>{data.summary || data.description}</p></header><Cover data={data} title={row.title} />
      <div className="cms-public-detail">
        {data.startDate && <p><strong>Período:</strong> {data.startDate} — {data.current ? 'Actualidad' : data.endDate || 'Fecha no indicada'}</p>}
        {data.location && <p><strong>Ubicación:</strong> {data.location} · {data.workMode}</p>}
        {['problem','objective','architecture','description','responsibilities','results','achievements','challenges','learning'].map(key => data[key] &&
          <section key={key}><h2>{{ problem:'Problema', objective:'Objetivo', architecture:'Arquitectura',
            description:'Descripción', responsibilities:'Responsabilidades', results:'Resultados', achievements:'Logros',
            challenges:'Retos técnicos', learning:'Aprendizajes' }[key]}</h2><p>{data[key]}</p></section>)}
        {data.technologies && <p><strong>Tecnologías:</strong> {data.technologies}</p>}
        {data.tools && <p><strong>Herramientas:</strong> {data.tools}</p>}
        {Array.isArray(row.data.photos) && <div className="cms-public-grid">{row.data.photos.map(src => safeUrl(src) && <img key={src} src={safeUrl(src)} alt={row.title} loading="lazy" />)}</div>}
        {typeof row.data.photos === 'string' && <div className="cms-public-grid">{row.data.photos.split('\n').map(src => safeUrl(src) && <img key={src} src={safeUrl(src)} alt={row.title} loading="lazy" />)}</div>}
        {row.data.github && safeUrl(row.data.github) && <a href={safeUrl(row.data.github)} target="_blank" rel="noreferrer">Ver repositorio <ArrowUpRight size={16} /></a>}
        {row.data.demo && safeUrl(row.data.demo) && <a href={safeUrl(row.data.demo)} target="_blank" rel="noreferrer">Abrir demostración <ArrowUpRight size={16} /></a>}
        <ContentBlocks blocks={row.data.blocks} />
      </div></>}
  </div></section>
}
export function CustomPage() {
  const { slug } = useParams()
  const row = usePublicContent('page', null, slug)
  usePageMetadata(row?.data.seoTitle || row?.title, row?.data.seoDescription || row?.data.description,
    `/${slug}`, row?.data.image)
  return <section className="cms-public"><div className="cms-public-container">
    {!row ? <div className="cms-public-empty"><h1>Página no encontrada</h1><Link to="/">Ir al inicio</Link></div> : <>
      <header className="cms-public-heading"><span className="cms-public-kicker">ALBERT SANFLE</span><h1>{row.title}</h1><p>{row.data.description}</p></header>
      <div className="cms-public-detail"><ContentBlocks blocks={row.data.blocks} /></div></>}
  </div></section>
}
