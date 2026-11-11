import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  Cloud,
  ExternalLink,
  Globe2,
  Instagram,
  Layers3,
  Linkedin,
  MessageSquare,
  Server,
  Sparkles,
  Workflow,
} from "lucide-react";
import { publicContent } from "../cms/api.js";
import { safeUrl } from "../cms/safeUrl.js";

export default function Company() {
  const [companyRows, setCompanyRows] = useState(null);
  useEffect(() => {
    let active = true;
    publicContent('company').then(rows => { if (active) setCompanyRows(rows); })
      .catch(() => { if (active) setCompanyRows([]); });
    return () => { active = false; };
  }, []);
  const methodica = companyRows?.find(row => row.slug === 'methodica-technology');
  const content = methodica ? { ...methodica.data, name: methodica.title } : null;
  if (!content) return <section id="company" className="mc-section"><div className="mc-wrap">
    {companyRows ? <p>Contenido no disponible.</p> : <p>Cargando…</p>}
  </div></section>;
  const points = String(content.points || '').split('\n').map(value => value.trim()).filter(Boolean);
  const tags = String(content.tags || '').split(',').map(value => value.trim()).filter(Boolean);
  const services = Array.isArray(content.services) ? content.services : [];
  const gallery = Array.isArray(content.gallery) ? content.gallery : [];
  const socialLinks = [
    { label:'Website', href:safeUrl(content.website), icon:<Globe2 size={16} /> },
    { label:'Instagram', href:safeUrl(content.instagram), icon:<Instagram size={16} /> },
    { label:'LinkedIn', href:safeUrl(content.linkedin), icon:<Linkedin size={16} /> },
  ].filter(link => link.href);
  const serviceIcons = [<Layers3 size={20} />, <Cloud size={20} />,
    <Workflow size={20} />, <Bot size={20} />];
  return (
    <>
      <section id="company" className="mc-section">
        <div className="mc-wrap">

          {/* ── Header ───────────────────────────────────── */}
          <header className="mc-header">
            <div className="mc-pill">
              <Sparkles size={12} />
              <span>{content.name}</span>
            </div>
            <h2 className="mc-headline">
              {content.headline}
            </h2>
            <p className="mc-sub">
              {content.introduction}
            </p>
          </header>

          {/* ── Hero grid ────────────────────────────────── */}
          <div className="mc-hero">

            {/* Main card */}
            <div className="mc-card mc-card-main">
              <div className="mc-logo-box">
                {safeUrl(content.logo) && <img src={safeUrl(content.logo)} alt={content.name} />}
              </div>

              <div className="mc-info">
                <div className="mc-location">
                  <Building2 size={13} />
                  <span>{content.location || [content.city, content.country].filter(Boolean).join(', ')}</span>
                </div>

                <h3>{content.mainHeadline}</h3>

                <p>
                  {content.mainDescription}
                </p>

                <ul className="mc-checklist">
                  {points.map((p) => (
                    <li key={p}>
                      <CheckCircle2 size={15} />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>

                <div className="mc-links">
                  {socialLinks.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mc-link"
                    >
                      {s.icon}
                      <span>{s.label}</span>
                      <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Side card */}
            <div className="mc-card mc-card-side">
              <span className="mc-label">Qué hacemos</span>
              <h3>{content.sideHeadline}</h3>
              <p>
                {content.sideDescription}
              </p>
              <div className="mc-tags">
                {tags.map((t) => <span key={t}>{t}</span>)}
              </div>
              {safeUrl(content.website) && <a
                href={content.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mc-btn"
              >
                <span>Ver Methodica</span>
                <ArrowRight size={16} />
              </a>}
            </div>
          </div>

          {/* ── Services ─────────────────────────────────── */}
          <div className="mc-block">
            <div className="mc-block-header">
              <span className="mc-label">Servicios</span>
              <h3>{content.servicesHeadline}</h3>
            </div>
            <div className="mc-services">
              {services.map((s, index) => (
                <div className="mc-service" key={s.title}>
                  <div className="mc-icon">{serviceIcons[index % serviceIcons.length]}</div>
                  <h4>{s.title}</h4>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Gallery ──────────────────────────────────── */}
          <div className="mc-block">
            <div className="mc-block-header">
              <span className="mc-label">Galería</span>
              <h3>{content.galleryHeadline}</h3>
            </div>
            <div className="mc-gallery">
              {gallery.map((img, i) => (
                <figure className={`mc-photo mc-photo--${i === 0 ? "wide" : "slim"}`} key={img.src}>
                  {safeUrl(img.src) && <img src={safeUrl(img.src)} alt={img.title} loading="lazy" />}
                  <div className="mc-photo-overlay" />
                  <figcaption>
                    <strong>{img.title}</strong>
                    <span>{img.text}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          {/* ── CTA ──────────────────────────────────────── */}
          <div className="mc-cta">
            <div className="mc-cta-text">
              <div className="mc-pill mc-pill-white">
                <MessageSquare size={12} />
                <span>Hablemos de tu proyecto</span>
              </div>
              <h3>{content.ctaHeadline}</h3>
              <p>
                {content.ctaDescription}
              </p>
            </div>
            {safeUrl(content.website) && <a
              href={content.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mc-btn mc-btn-white"
            >
              <Server size={16} />
              <span>Visitar sitio web</span>
              <ArrowRight size={16} />
            </a>}
          </div>

        </div>
      </section>

      <style>{`
        /* ── Tokens ──────────────────────────────────────── */
        #company { scroll-margin-top: 80px; }

        .mc-section {
          background:
            radial-gradient(ellipse 60% 45% at 12% 4%, rgba(37, 99, 235, 0.18) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 88% 8%, rgba(6, 182, 212, 0.12) 0%, transparent 55%),
            linear-gradient(180deg, #040918 0%, #040812 100%);
          color: #e2eaf5;
          padding: clamp(7.5rem, 10vw, 9.5rem) 1.25rem clamp(4.5rem, 6vw, 6.5rem);
          position: relative;
          overflow: hidden;
        }

        .mc-section::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.35;
          background-image:
            linear-gradient(rgba(148, 163, 184, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.04) 1px, transparent 1px);
          background-size: 54px 54px;
          mask-image: linear-gradient(to bottom, #000 15%, transparent 85%);
          -webkit-mask-image: linear-gradient(to bottom, #000 15%, transparent 85%);
          pointer-events: none;
        }

        .mc-wrap {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2.75rem;
          position: relative;
        }

        /* ── Pills & labels ──────────────────────────────── */
        .mc-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(14, 165, 233, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.26);
          color: #7dd3fc;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          width: fit-content;
        }

        .mc-pill-white {
          background: rgba(255,255,255,0.14);
          border-color: rgba(255,255,255,0.24);
          color: #ffffff;
        }

        .mc-label {
          display: inline-block;
          color: #7dd3fc;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        /* ── Header ──────────────────────────────────────── */
        .mc-header {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-width: 860px;
        }

        .mc-headline {
          margin: 0;
          font-size: clamp(2.4rem, 5vw, 4.35rem);
          font-weight: 900;
          line-height: 1.02;
          letter-spacing: -0.05em;
          background: linear-gradient(135deg, #ffffff 0%, #dbeafe 55%, #7dd3fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .mc-sub {
          margin: 0;
          color: #94a8be;
          font-size: clamp(0.98rem, 1.4vw, 1.1rem);
          line-height: 1.75;
          max-width: 720px;
        }

        /* ── Cards ───────────────────────────────────────── */
        .mc-card {
          background: linear-gradient(160deg, rgba(14, 25, 46, 0.84) 0%, rgba(8, 15, 30, 0.9) 100%);
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 24px;
          padding: 2rem;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            0 20px 50px rgba(2, 6, 23, 0.38);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        /* ── Hero ────────────────────────────────────────── */
        .mc-hero {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.25rem;
          align-items: stretch;
        }

        .mc-card-main {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 1.75rem;
          align-items: center;
        }

        .mc-logo-box {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          min-height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .mc-logo-box img {
          width: 100%;
          max-width: 240px;
          height: auto;
          display: block;
          object-fit: contain;
        }

        .mc-info {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .mc-location {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #7a92a8;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .mc-info h3,
        .mc-card-side h3 {
          margin: 0;
          color: #ffffff;
          font-size: clamp(1.35rem, 2.4vw, 2rem);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.035em;
        }

        .mc-info p,
        .mc-card-side p {
          margin: 0;
          color: #94a8be;
          line-height: 1.7;
          font-size: 0.95rem;
        }

        /* ── Checklist ───────────────────────────────────── */
        .mc-checklist {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .mc-checklist li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.9rem;
          color: #b8cad8;
          line-height: 1.55;
        }

        .mc-checklist li svg {
          flex-shrink: 0;
          margin-top: 2px;
          color: #22d3ee;
        }

        /* ── Social links ────────────────────────────────── */
        .mc-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          margin-top: 0.25rem;
        }

        .mc-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 10px;
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(255,255,255,0.1);
          color: #c4d4e4;
          font-size: 0.82rem;
          font-weight: 600;
          text-decoration: none;
          transition: background 200ms, border-color 200ms, color 200ms, transform 200ms;
        }

        .mc-link:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(34,211,238,0.3);
          color: #ffffff;
          transform: translateY(-1px);
        }

        /* ── Side card ───────────────────────────────────── */
        .mc-card-side {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        /* ── Tags ────────────────────────────────────────── */
        .mc-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }

        .mc-tags span {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(255,255,255,0.1);
          color: #b8cad8;
          font-size: 0.76rem;
          font-weight: 600;
        }

        /* ── Button ──────────────────────────────────────── */
        .mc-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 20px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0ea5e9, #22d3ee);
          color: #02111a;
          font-size: 0.88rem;
          font-weight: 800;
          text-decoration: none;
          width: fit-content;
          transition: opacity 200ms, transform 200ms;
        }

        .mc-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .mc-btn-white {
          background: #ffffff;
          color: #07111f;
          flex-shrink: 0;
        }

        /* ── Block sections ──────────────────────────────── */
        .mc-block {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .mc-block-header {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .mc-block-header h3 {
          margin: 0;
          color: #ffffff;
          font-size: clamp(1.6rem, 2.8vw, 2.4rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.05;
        }

        /* ── Services ────────────────────────────────────── */
        .mc-services {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .mc-service {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 1.35rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          transition: border-color 200ms, transform 200ms;
        }

        .mc-service:hover {
          border-color: rgba(34,211,238,0.22);
          transform: translateY(-3px);
        }

        .mc-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(34,211,238,0.1);
          border: 1px solid rgba(34,211,238,0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #22d3ee;
        }

        .mc-service h4 {
          margin: 0;
          color: #ffffff;
          font-size: 0.98rem;
          font-weight: 700;
          line-height: 1.3;
        }

        .mc-service p {
          margin: 0;
          color: #7a92a8;
          font-size: 0.88rem;
          line-height: 1.65;
        }

        /* ── Gallery ─────────────────────────────────────── */
        .mc-gallery {
          display: grid;
          grid-template-columns: 1.6fr 1fr 1fr;
          grid-template-rows: 380px;
          gap: 0.75rem;
        }

        .mc-photo {
          margin: 0;
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          cursor: default;
        }

        .mc-photo img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          transition: transform 500ms ease;
        }

        .mc-photo:hover img {
          transform: scale(1.06);
        }

        .mc-photo-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(2, 8, 18, 0.88) 0%,
            rgba(2, 8, 18, 0.35) 45%,
            transparent 100%
          );
          transition: opacity 300ms ease;
        }

        .mc-photo:hover .mc-photo-overlay {
          opacity: 0.85;
        }

        .mc-photo figcaption {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 1.4rem 1.35rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 5px;
          z-index: 1;
          transform: translateY(4px);
          transition: transform 300ms ease;
        }

        .mc-photo:hover figcaption {
          transform: translateY(0);
        }

        .mc-photo figcaption strong {
          color: #ffffff;
          font-size: 1rem;
          font-weight: 700;
          line-height: 1.3;
          text-shadow: 0 1px 8px rgba(0,0,0,0.4);
        }

        .mc-photo figcaption span {
          color: rgba(255,255,255,0.72);
          font-size: 0.84rem;
          line-height: 1.5;
          text-shadow: 0 1px 6px rgba(0,0,0,0.35);
        }

        /* ── CTA ─────────────────────────────────────────── */
        .mc-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          padding: 2rem 2.25rem;
          border-radius: 20px;
          background: linear-gradient(135deg, #1e4799 0%, #0a7aad 60%, #0891b2 100%);
          border: 1px solid rgba(255,255,255,0.12);
        }

        .mc-cta-text {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-width: 680px;
        }

        .mc-cta-text h3 {
          margin: 0;
          color: #ffffff;
          font-size: clamp(1.4rem, 2.4vw, 2rem);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }

        .mc-cta-text p {
          margin: 0;
          color: rgba(255,255,255,0.78);
          font-size: 0.95rem;
          line-height: 1.7;
        }

        /* ── Responsive ──────────────────────────────────── */
        @media (max-width: 1060px) {
          .mc-services {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 860px) {
          .mc-hero {
            grid-template-columns: 1fr;
          }

          .mc-card-main {
            grid-template-columns: 1fr;
          }

          .mc-logo-box {
            min-height: 200px;
          }

          .mc-gallery {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 260px 260px;
          }

          .mc-photo--wide {
            grid-column: 1 / -1;
          }

          .mc-cta {
            flex-direction: column;
            align-items: flex-start;
          }

          .mc-btn-white {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 620px) {
          .mc-services {
            grid-template-columns: 1fr;
          }

          .mc-gallery {
            grid-template-columns: 1fr;
            grid-template-rows: 260px 260px 260px;
          }

          .mc-photo--wide {
            grid-column: auto;
          }

          .mc-cta {
            padding: 1.5rem;
          }

          .mc-links {
            flex-direction: column;
          }

          .mc-link {
            justify-content: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mc-section * { transition: none !important; }
        }
      `}</style>
    </>
  );
}
