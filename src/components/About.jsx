import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container } from "./ui.jsx";
import { usePublicContent } from "../cms/usePublicContent.js";
import { ABOUT_FALLBACK_ROWS, HOME_FALLBACK_ROWS } from "../content/publicFallbacks.js";
import "./About.css";

import {
  ArrowUpRight,
  Award,
  CalendarDays,
  Bot,
  CheckCircle2,
  Cloud,
  Code2,
  Cpu,
  ExternalLink,
  Github,
  GraduationCap,
  Layers3,
  Linkedin,
  MapPin,
  Medal,
  MonitorCog,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Workflow,
  X,
} from "lucide-react";

const SKILL_ICONS = { Cloud, DevOps:Workflow, 'IA y comunicaciones':Bot, Desarrollo:Code2 };

function SectionHeading({ icon: Icon, eyebrow, title, description, align = "left" }) {
  return (
    <header className={`about-heading about-heading--${align}`}>
      <span className="section-eyebrow">
        <Icon size={14} strokeWidth={2.2} />
        {eyebrow}
      </span>

      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </header>
  );
}

function RemoteImage({ src, alt, className, loading = "lazy", style }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      style={style}
    />
  );
}

export default function About() {
  const aboutRows = usePublicContent('about', ABOUT_FALLBACK_ROWS);
  const homeRows = usePublicContent('home', HOME_FALLBACK_ROWS);
  const educationRows = usePublicContent('education', []);
  const eventRows = usePublicContent('event', []);
  const awardRows = usePublicContent('award', []);
  const skillRows = usePublicContent('skill', []);
  const about = aboutRows[0]?.data || {};
  const copy = about;
  const serviceIcons = [Cloud, Workflow, Bot, MonitorCog];
  const services = Array.isArray(copy.services) ? copy.services : [];
  const home = homeRows[0]?.data || {};
  const education = educationRows[0];
  const events = eventRows;
  const awards = awardRows;
  const [selectedAward, setSelectedAward] = useState(null);
  const stackGroups = [...skillRows.reduce((groups, skill) => {
    const category = skill.data.category || 'Otras habilidades';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(skill.title);
    return groups;
  }, new Map())].map(([title, items]) => ({ title, items, icon:SKILL_ICONS[title] || Cpu }));
  const fullName = about.name?.trim() || '';
  const [firstName, ...lastNameParts] = fullName.split(/\s+/);
  const remainingName = lastNameParts.join(" ");

  useEffect(() => {
    if (!selectedAward) return undefined;
    const closeOnEscape = event => { if (event.key === 'Escape') setSelectedAward(null); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedAward]);

  if (aboutRows.length === 0) return null;

  const metrics = [
    awards.length > 0 && { icon:Trophy, value:String(awards.length), label:'Hackathons y competencias' },
    education && { icon:GraduationCap, value:education.data.institution?.includes('INTEC') ? 'INTEC' : education.data.institution, label:education.data.degree || education.title },
  ].filter(Boolean);
  const selectedAwardData = selectedAward?.data || {};
  const awardHighlights = Array.isArray(selectedAwardData.highlights) ? selectedAwardData.highlights :
    String(selectedAwardData.highlights || '').split('\n').filter(Boolean);
  const awardDetails = [
    ['Organización', selectedAwardData.institution || selectedAwardData.organizer],
    ['Fecha', selectedAwardData.date],
    ['Resultado', selectedAwardData.rank],
    ['Participación', selectedAwardData.participation],
    ['Ubicación', selectedAwardData.location],
    ['Equipo', selectedAwardData.team || selectedAwardData.teamContextTitle],
    ['Proyecto', selectedAwardData.project],
    ['Tecnologías', selectedAwardData.technologies],
    ['Premio', selectedAwardData.prize],
    ['Duración', selectedAwardData.duration],
  ].filter(([, value]) => value);

  return (
    <section id="about" className="about-section" aria-labelledby="about-title">
      <div className="about-grid-pattern" aria-hidden="true" />
      <div className="about-noise" aria-hidden="true" />
      <div className="about-glow about-glow--one" aria-hidden="true" />
      <div className="about-glow about-glow--two" aria-hidden="true" />

      <Container>
        <div className="about-root">
          <div className="eyebrow-row">
            <span className="eyebrow-line" />
            <span className="eyebrow-label">
              <Sparkles size={14} />
              {about.eyebrow || 'Perfil profesional'}
            </span>
            <span className="eyebrow-count">01 / ABOUT</span>
          </div>

          <div className="about-hero">
            <div className="about-hero__content">
              <span className="availability-badge">
                <span className="availability-dot" />
                {about.available}
              </span>

              <h1 id="about-title" className="about-name">
                <span className="about-name__first">{firstName}</span>
                {remainingName && (
                  <span className="about-name__rest">{remainingName}</span>
                )}
              </h1>

              <div className="about-role-row">
                {(about.roles || '').split(',').map(role => <span key={role.trim()}>{role.trim()}</span>)}
              </div>

              <p className="about-lead">
                {about.lead}
              </p>

              <p className="about-bio">
                {about.bio}
              </p>

              <div className="about-highlight-grid">
                <article>
                  <ShieldCheck size={18} />
                  <div>
                    <strong>{about.highlightOneTitle || 'Producción primero'}</strong>
                    <span>{about.highlightOneText || 'Seguridad, estabilidad y observabilidad desde el diseño.'}</span>
                  </div>
                </article>
                <article>
                  <Rocket size={18} />
                  <div>
                    <strong>{about.highlightTwoTitle || 'Entrega continua'}</strong>
                    <span>{about.highlightTwoText || 'Automatización para construir y desplegar con confianza.'}</span>
                  </div>
                </article>
              </div>
              <div className="about-actions">
                <Link to="/contacto" className="about-button about-button--primary">
                  Contactarme
                  <ArrowUpRight size={18} />
                </Link>

                {home.linkedin && (
                  <a
                    href={home.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="about-button about-button--secondary"
                  >
                    <Linkedin size={18} />
                    LinkedIn
                  </a>
                )}

                {home.github && (
                  <a
                    href={home.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="about-button about-button--secondary"
                  >
                    <Github size={18} />
                    GitHub
                  </a>
                )}
              </div>
            </div>

            <div className="about-hero__visual">
              <div className="profile-orbit profile-orbit--one" aria-hidden="true" />
              <div className="profile-orbit profile-orbit--two" aria-hidden="true" />

              <article className="profile-card">
                <div className="profile-card__topbar">
                  <div className="window-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>{about.profileCardLabel || 'albert.profile'}</span>
                </div>

                <div className="profile-card__image-wrap">
                  {about.photo ? <RemoteImage
                    src={about.photo}
                    alt={`${fullName}, Cloud Engineer`}
                    className="profile-card__image"
                    loading="eager"
                    fetchPriority="high"
                  /> : <div className="profile-card__image-placeholder" aria-label="No hay fotografía seleccionada">
                    <span>{fullName.split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</span>
                  </div>}

                  <div className="profile-card__image-label">
                    <span>{about.profileCardExpertise || 'Cloud / DevOps / SRE'}</span>
                    <strong>{about.profileCardHeadline || 'Construyendo soluciones confiables.'}</strong>
                  </div>
                </div>

                <footer className="profile-card__footer">
                  <div>
                    <small>{about.locationLabel || 'Ubicación'}</small>
                    <strong>
                      <MapPin size={14} />
                      {about.location}
                    </strong>
                  </div>

                  <div className="profile-card__status">
                    <span />
                    Disponible
                  </div>
                </footer>
              </article>

              <div className="floating-tech-card floating-tech-card--cloud">
                <Cloud size={20} />
                <div>
                  <span>Especialidad</span>
                  <strong>Cloud Engineering</strong>
                </div>
              </div>

              <div className="floating-tech-card floating-tech-card--code">
                <Code2 size={20} />
                <div>
                  <span>Enfoque</span>
                  <strong>Build · Automate · Operate</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="metrics-strip">
            {metrics.map(({ icon: Icon, value, label }, index) => (
              <article className="metric-item" key={label}>
                <span className="metric-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="metric-icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <div>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              </article>
            ))}
          </div>

          <nav className="about-section-nav" aria-label="Explorar secciones del perfil">
            <span>Explorar</span>
            <a href="#about-details">Formación</a>
            {awards.length > 0 && <a href="#about-achievements">Competencias</a>}
            {events.length > 0 && <a href="#about-events">Eventos</a>}
            {services.length > 0 && <a href="#about-services">Servicios</a>}
            {stackGroups.length > 0 && <a href="#about-stack">Tecnologías</a>}
          </nav>

          <section id="about-details" className="about-details-section">
            <SectionHeading
              icon={GraduationCap}
              eyebrow={copy.detailsEyebrow || 'Perfil y formación'}
              title={copy.detailsHeadline || 'Formación y forma de trabajo'}
              description={copy.detailsDescription}
            />

            <div className="about-details-grid">
              {education && <article className="side-card side-card--education">
                <span className="side-card__icon"><GraduationCap size={23} /></span>
                <small>Formación académica</small>
                <h3>{education.data.degree || education.title}</h3>
                <p>{education.data.institution}</p>
                <span className="side-card__meta">
                  {education.data.startYear || education.data.startDate} — {education.data.endYear || education.data.endDate}
                  {education.data.status && ` · ${education.data.status}`}
                </span>
              </article>}

              {copy.principleHeadline && <article className="side-card">
                <span className="side-card__icon"><ShieldCheck size={22} /></span>
                <small>Principios de trabajo</small>
                <h3>{copy.principleHeadline}</h3>
                <p>{copy.principleDescription}</p>
              </article>}

              {copy.learningHeadline && <article className="side-card side-card--accent">
                <span className="side-card__icon"><Award size={22} /></span>
                <small>Aprendizaje continuo</small>
                <h3>{copy.learningHeadline}</h3>
                <p>{copy.learningDescription}</p>
              </article>}
            </div>
          </section>
          {awards.length > 0 && <section id="about-achievements" className="achievements-section">
            <SectionHeading
              icon={Medal}
              eyebrow={copy.achievementsEyebrow || 'Hackathons y competencias'}
              title={copy.achievementsHeadline || 'Reconocimientos y competencias'}
              description={copy.achievementsDescription}
            />

            <div className="achievement-grid">
              {awards.map(award => <article className="achievement-card" key={award.id || award.slug}>
                <div className="achievement-card__media">
                  {award.data.image ? <RemoteImage src={award.data.image} alt={award.title} /> :
                    <div className="achievement-card__placeholder" aria-hidden="true"><Trophy size={54} /></div>}
                  <div className="achievement-card__media-shade" />
                  {(award.data.rank || award.data.category) && <div className="achievement-card__badge">
                    <Trophy size={15} />{award.data.rank || award.data.category}
                  </div>}
                  <div className="achievement-card__media-title">
                    <span>{award.data.institution || award.data.organizer || award.data.category || 'Participación'}</span>
                    <strong>{award.title}</strong>
                  </div>
                </div>
                <div className="achievement-card__content">
                  {award.data.category && <span className="achievement-card__kicker"><Medal size={14} />{award.data.category}</span>}
                  <h3>{award.data.headline || award.title}</h3>
                  {award.data.description && <p>{award.data.description}</p>}
                  {(award.data.date || award.data.participation || award.data.location) && <div className="achievement-list">
                    {award.data.date && <span><CalendarDays size={15} />{award.data.date}</span>}
                    {award.data.participation && <span><Users size={15} />{award.data.participation}</span>}
                    {award.data.location && <span><MapPin size={15} />{award.data.location}</span>}
                  </div>}
                  <button type="button" className="achievement-card__details-button" onClick={() => setSelectedAward(award)}>
                    Ver detalles de la participación <ArrowUpRight size={16} />
                  </button>
                </div>
              </article>)}
            </div>
          </section>}          <section id="about-events" className="events-section">
            <SectionHeading
              icon={Rocket}
              eyebrow="Eventos y comunidad"
              title={copy.eventsHeadline}
              description={copy.eventsDescription}
            />

            <div className="event-photo-grid">
              {events.map((event, index) => (
                <figure className="event-photo-card" key={event.id || event.slug}>
                  <div className="event-photo-card__media">
                    <RemoteImage
                      src={event.data.image}
                      alt={`${event.title}: ${event.data.description}`}
                      style={{ objectPosition: event.data.position }}
                    />

                    <span className="event-photo-card__brand">{event.data.brand}</span>
                    <div className="event-photo-card__index" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                  </div>

                  <figcaption>
                    <small>{event.data.eyebrow}</small>
                    <h3>{event.title}</h3>
                    <p>{event.data.description}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section id="about-services" className="services-section">
            <SectionHeading
              icon={Layers3}
              eyebrow="Lo que hago"
              title={copy.servicesHeadline}
              description={copy.servicesDescription}
            />

            <div className="services-grid">
              {services.map(({ title, text }, index) => {
                const Icon = serviceIcons[index % serviceIcons.length];
                return (
                <article className="service-card" key={title}>
                  <div className="service-card__top">
                    <span className="service-card__icon">
                      <Icon size={22} />
                    </span>
                    <span className="service-card__number">{String(index + 1).padStart(2, '0')}</span>
                  </div>

                  <h3>{title}</h3>
                  <p>{text}</p>
                  <span className="service-card__line" aria-hidden="true" />
                </article>
              )})}
            </div>
          </section>

          <section id="about-stack" className="stack-section">
            <SectionHeading
              icon={Cpu}
              eyebrow="Stack principal"
              title={copy.stackHeadline}
              description={copy.stackDescription}
            />

            <div className="stack-groups">
              {stackGroups.map(({ icon: Icon, title, items }, groupIndex) => (
                <article className="stack-group" key={title}>
                  <header>
                    <span className="stack-group__icon">
                      <Icon size={19} />
                    </span>
                    <div>
                      <small>{String(groupIndex + 1).padStart(2, "0")}</small>
                      <h3>{title}</h3>
                    </div>
                  </header>

                  <div className="stack-tags" aria-label={`Tecnologías de ${title}`}>
                    {items.map((item) => (
                      <span className="stack-tag" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="about-cta">
            <div className="about-cta__icon" aria-hidden="true">
              <Server size={28} />
            </div>

            <div className="about-cta__content">
              <span className="section-eyebrow section-eyebrow--light">
                <Sparkles size={14} />
                Construyamos algo útil
              </span>

              <h2>{copy.ctaHeadline}</h2>

              <p>{copy.ctaDescription}</p>
            </div>

            <Link to="/contacto" className="about-button about-button--light">
              Ir a contacto
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </Container>
      {selectedAward && <div className="award-dialog-backdrop" role="presentation" onMouseDown={event => {
        if (event.target === event.currentTarget) setSelectedAward(null);
      }}>
        <section className="award-dialog" role="dialog" aria-modal="true" aria-labelledby="award-dialog-title">
          <button type="button" className="award-dialog__close" aria-label="Cerrar detalles" onClick={() => setSelectedAward(null)}><X size={20} /></button>
          {selectedAwardData.image && <RemoteImage src={selectedAwardData.image} alt={selectedAward.title} className="award-dialog__image" loading="eager" />}
          <div className="award-dialog__body">
            <span className="section-eyebrow"><Trophy size={15} />{selectedAwardData.category || 'Participación y reconocimiento'}</span>
            <h2 id="award-dialog-title">{selectedAward.title}</h2>
            {selectedAwardData.headline && <h3>{selectedAwardData.headline}</h3>}
            {selectedAwardData.description && <p>{selectedAwardData.description}</p>}
            {selectedAwardData.details && <p>{selectedAwardData.details}</p>}
            {awardDetails.length > 0 && <dl className="award-dialog__facts">
              {awardDetails.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>}
            {selectedAwardData.teamContextDescription && <p>{selectedAwardData.teamContextDescription}</p>}
            {selectedAwardData.prizeDescription && <p>{selectedAwardData.prizeDescription}</p>}
            {awardHighlights.length > 0 && <ul className="award-dialog__highlights">
              {awardHighlights.map((item, index) => <li key={`${index}-${item}`}><CheckCircle2 size={16} />{item}</li>)}
            </ul>}
            <div className="award-dialog__links">
              {selectedAwardData.link?.startsWith('https://') && <a href={selectedAwardData.link} target="_blank" rel="noopener noreferrer">Publicación oficial <ExternalLink size={15} /></a>}
              {selectedAwardData.document?.startsWith('https://') && <a href={selectedAwardData.document} target="_blank" rel="noopener noreferrer">Ver documento <ExternalLink size={15} /></a>}
            </div>
          </div>
        </section>
      </div>}
    </section>
  );
}
