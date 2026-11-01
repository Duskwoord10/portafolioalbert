// ✅ ARCHIVO: src/components/Hero.jsx
import React, { useState } from "react";
import { usePublicContent } from "../cms/usePublicContent.js";
import { HOME_FALLBACK_ROWS } from "../content/publicFallbacks.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { Container } from "./ui.jsx";
import { LinkedInIcon, YouTubeIcon } from "./icons.jsx";
import "./Hero.css";

const TECH_ICONS = { AWS:'☁️',Docker:'🐳',Kubernetes:'☸️',Terraform:'🔧',
  'CI/CD':'🔄',Python:'🐍',Jenkins:'⚙️' };

export default function Hero() {
  const homeRows = usePublicContent('home', HOME_FALLBACK_ROWS);
  const certifications = usePublicContent('certification', []);
  const { t } = useLanguage();
  const home = homeRows[0]?.data || {};
  const techStack = (home.featuredTechnologies || '').split(',').map(label => label.trim())
    .filter(Boolean).map(label => ({ label,icon:TECH_ICONS[label] || '•' }));
  const [failedImageUrl, setFailedImageUrl] = useState('');

  const yearsExperience = Number(home.yearsExperience);
  const projectsDelivered = Number(home.projectsDelivered);

  return (
    <section id="hero" className="hero-section">
      <div className="hero-bg">
        <div className="bg-gradient"></div>
        <div className="bg-mesh"></div>
        <div className="bg-grid"></div>
      </div>

      <Container>
        <div className="hero-content">
          {/* LEFT */}
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="title-greeting">{t('home.greeting')}</span>
              <span className="title-name">{home.name || ''}</span>
            </h1>
            {home.title && <p className="hero-professional-title">{home.title}</p>}

            <div className="hero-summary">
              {(home.summary || '').split(/\n\s*\n/).filter(Boolean)
                .map((paragraph, index) => <p className="summary-text" key={index}>{paragraph}</p>)}
            </div>

            <div className="hero-highlights">
              <div className="hero-stats-grid">
                {certifications.length > 0 && <div className="hero-stat-card">
                  <div className="hero-stat-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M12 2 3 7l9 5 9-5-9-5Z" />
                      <path d="M3 12l9 5 9-5" />
                      <path d="M3 17l9 5 9-5" />
                    </svg>
                  </div>

                  <div className="hero-stat-copy">
                    <strong>{certifications.length}</strong>
                  <span>{t('home.certifications')}</span>
                  </div>
                </div>}

                {Number.isFinite(yearsExperience) && yearsExperience > 0 && <div className="hero-stat-card">
                  <div className="hero-stat-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>

                  <div className="hero-stat-copy">
                    <strong>{yearsExperience}+</strong>
                  <span>{t('home.years')}</span>
                  </div>
                </div>}

                {Number.isFinite(projectsDelivered) && projectsDelivered > 0 && <div className="hero-stat-card">
                  <div className="hero-stat-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M13 2 3 14h7l-1 8 12-14h-7l1-6Z" />
                    </svg>
                  </div>

                  <div className="hero-stat-copy">
                    <strong>{projectsDelivered}+</strong>
                  <span>{t('home.projects')}</span>
                  </div>
                </div>}
              </div>

              <div className="hero-actions-modern">
                {home.linkedin && <a
                  href={home.linkedin}
                  className="hero-btn-modern hero-btn-linkedin"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="hero-btn-icon hero-btn-icon-linkedin">
                    <LinkedInIcon />
                  </span>

                  <span className="hero-btn-content">
                    <small>{t('home.profile')}</small>
                    <strong>{t('home.linkedin')}</strong>
                  </span>
                </a>}

                {home.youtube && <a
                  href={home.youtube}
                  className="hero-btn-modern hero-btn-youtube"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="hero-btn-icon hero-btn-icon-youtube">
                    <YouTubeIcon />
                  </span>

                  <span className="hero-btn-content">
                    <small>{t('home.video')}</small>
                    <strong>{t('home.youtube')}</strong>
                  </span>
                </a>}
              </div>

              <p className="hero-cta-note">
                {home.heroCtaNote}
              </p>
            </div>

            <div className="tech-stack">
              <div className="stack-label">{t('home.stack')}</div>

              <div className="stack-items">
                {techStack.map((tech) => (
                  <div className="stack-item" key={tech.label}>
                    <span className="stack-icon">{tech.icon}</span>
                    <span>{tech.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="hero-visual">
            {home.photo && home.photo !== failedImageUrl ? (
              <div className="image-container">
                <div className="visual-decoration">
                  <div className="decoration-orbit orbit-1"></div>
                  <div className="decoration-orbit orbit-2"></div>
                  <div className="decoration-orbit orbit-3"></div>
                </div>

                <div className="image-wrapper">
                  <img
                    src={home.photo}
                    alt={home.name || 'Fotografía principal'}
                    onError={() => setFailedImageUrl(home.photo)}
                    loading="eager"
                  />
                </div>

                <div className="status-badge">
                  <span className="status-dot"></span>

                  <div className="status-text">
                    <span className="status-main">
                      {home.heroAvailability}
                    </span>
                    <span className="status-sub">{home.heroResponseNote}</span>
                  </div>
                </div>

                <div className="floating-icon icon-aws">☁️</div>
                <div className="floating-icon icon-k8s">☸️</div>

                <div className="floating-icon icon-github">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="image-fallback">
                <div className="fallback-initial">
                  {(home.name || '').charAt(0)}
                </div>

                <div className="fallback-info">
                  <div className="fallback-name">{home.name || ''}</div>
                  <div className="fallback-title">
                    {home.title || ''}
                  </div>
                  <div className="fallback-company">
                    {home.heroAvailability || ''}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
