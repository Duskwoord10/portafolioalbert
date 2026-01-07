// ✅ ARCHIVO: src/components/Hero.jsx
import React, { useState, useEffect } from "react";
import { LINKS, PROFILE } from "../data.js";
import { Container } from "./ui.jsx";
import { LinkedInIcon, YouTubeIcon } from "./icons.jsx";
import "./Hero.css";

export default function Hero() {
  const [imageLoaded, setImageLoaded] = useState(true);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  // Show WhatsApp button only when scrolled down past 500px
  useEffect(() => {
    const handleScroll = () => {
      setShowWhatsApp(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="hero" className="hero-section">
      {/* Background Effects */}
      <div className="hero-bg">
        <div className="bg-gradient"></div>
        <div className="bg-mesh"></div>
        <div className="bg-grid"></div>
      </div>

      <Container>
        <div className="hero-content">
          {/* Text Column */}
          <div className="hero-text">
            {/* Main Title */}
            <h1 className="hero-title">
              <span className="title-greeting">Hola, soy</span>
              <span className="title-name">{PROFILE.name}</span>
            </h1>

            {/* Professional Summary */}
            <div className="hero-summary">
              <p className="summary-text">
                Ingeniero de Sistemas especializado en <strong>DevOps</strong> y <strong>Cloud Computing</strong>, 
                con más de {PROFILE.age - 18} años de experiencia construyendo y automatizando 
                infraestructuras escalables en AWS. Cuento con <strong>5+ certificaciones AWS</strong> que 
                validan mi expertise técnico en arquitecturas cloud y prácticas de CI/CD.
              </p>
              <p className="summary-text">
                Fundador de <strong>Methodica Technology & Co</strong>, empresa especializada en 
                transformación digital donde desarrollamos <strong>chatbots omnicanales</strong> con IA, 
                implementamos sistemas de <strong>facturación electrónica</strong>, y creamos soluciones 
                empresariales con Docker, Kubernetes y Terraform. Ayudamos a empresas a modernizar sus 
                procesos mediante automatización inteligente y arquitecturas cloud escalables.
              </p>
            </div>

            {/* Key Metrics */}
            <div className="hero-metrics">
              <div className="metric-card">
                <div className="metric-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div className="metric-content">
                  <div className="metric-value">5+</div>
                  <div className="metric-label">Certificaciones AWS</div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <div className="metric-content">
                  <div className="metric-value">{PROFILE.age - 18}+</div>
                  <div className="metric-label">Años de Experiencia</div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <div className="metric-content">
                  <div className="metric-value">25+</div>
                  <div className="metric-label">Proyectos Entregados</div>
                </div>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="hero-actions">
              <a 
                href={LINKS.linkedin} 
                className="btn btn-primary"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <LinkedInIcon />
                <span>Ver Perfil Profesional</span>
              </a>
              <a 
                href={LINKS.youtube} 
                className="btn btn-secondary"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <YouTubeIcon />
                <span>Contenido Técnico</span>
              </a>
            </div>

            {/* Tech Stack */}
            <div className="tech-stack">
              <div className="stack-label">Stack Tecnológico:</div>
              <div className="stack-items">
                <div className="stack-item">
                  <span className="stack-icon">☁️</span>
                  <span>AWS</span>
                </div>
                <div className="stack-item">
                  <span className="stack-icon">🐳</span>
                  <span>Docker</span>
                </div>
                <div className="stack-item">
                  <span className="stack-icon">☸️</span>
                  <span>Kubernetes</span>
                </div>
                <div className="stack-item">
                  <span className="stack-icon">🔧</span>
                  <span>Terraform</span>
                </div>
                <div className="stack-item">
                  <span className="stack-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  </span>
                  <span>GitHub</span>
                </div>
                <div className="stack-item">
                  <span className="stack-icon">🔄</span>
                  <span>CI/CD</span>
                </div>
                <div className="stack-item">
                  <span className="stack-icon">🐍</span>
                  <span>Python</span>
                </div>
                <div className="stack-item">
                  <span className="stack-icon">⚙️</span>
                  <span>Jenkins</span>
                </div>
              </div>
            </div>
          </div>

          {/* Image Column */}
          <div className="hero-visual">
            {imageLoaded ? (
              <div className="image-container">
                {/* Decorative elements */}
                <div className="visual-decoration">
                  <div className="decoration-orbit orbit-1"></div>
                  <div className="decoration-orbit orbit-2"></div>
                  <div className="decoration-orbit orbit-3"></div>
                </div>

                {/* Main image */}
                <div className="image-wrapper">
                  <img
                    src={PROFILE.photo}
                    alt={`${PROFILE.name} - Ingeniero de Sistemas`}
                    onError={() => setImageLoaded(false)}
                    loading="eager"
                  />
                  <div className="image-overlay"></div>
                </div>

                {/* Status badge */}
                <div className="status-badge">
                  <span className="status-dot"></span>
                  <div className="status-text">
                    <span className="status-main">Disponible para proyectos</span>
                    <span className="status-sub">Respuesta en 24h</span>
                  </div>
                </div>

                {/* Floating tech icons */}
                <div className="floating-icon icon-docker">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338 0-.676.03-1.01.09-.478-1.265-1.333-2.412-2.545-3.426l-.5-.415-.414.5c-.399.49-.611 1.07-.611 1.73 0 .729.21 1.354.633 1.845-.215.12-.45.23-.713.335-.959.357-2.104.437-3.262.437H.002L0 11.262c-.013.59.033 1.175.137 1.75.104.573.258 1.126.467 1.657.404 1.02.985 1.86 1.719 2.513.673.6 1.44 1.045 2.28 1.325 1.007.337 2.092.516 3.23.516.598 0 1.2-.038 1.792-.115 1.175-.152 2.323-.488 3.414-1.003a15.417 15.417 0 002.863-1.568c.844-.629 1.596-1.334 2.246-2.106.652-.772 1.2-1.609 1.636-2.495.44-.888.75-1.823.928-2.793.178-.97.224-1.973.138-2.99h.01zM.002 11.262h2.119v-2.12H.002v2.12z"/>
                  </svg>
                </div>

                <div className="floating-icon icon-github">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </div>

                <div className="floating-icon icon-aws">
                  ☁️
                </div>

                <div className="floating-icon icon-k8s">
                  ☸️
                </div>
              </div>
            ) : (
              <div className="image-fallback">
                <div className="fallback-initial">{PROFILE.name.charAt(0)}</div>
                <div className="fallback-info">
                  <div className="fallback-name">{PROFILE.name}</div>
                  <div className="fallback-title">Ingeniero de Sistemas</div>
                  <div className="fallback-company">Founder @ Methodica Technology & Co</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* WhatsApp Floating Button - Only shows when scrolled */}
      <a 
        href="https://wa.me/18493518082" 
        className={`whatsapp-float ${showWhatsApp ? 'whatsapp-visible' : ''}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>
    </section>
  );
}