"use client"
import { useEffect } from "react"
import Hero from "../components/Hero.jsx"
import { Container } from "../components/ui.jsx"
import "./HomePage.css"

export default function HomePage() {
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://platform.linkedin.com/badges/js/profile.js"
    script.async = true
    script.defer = true
    script.type = "text/javascript"
    document.body.appendChild(script)

    return () => {
      const scripts = document.querySelectorAll('script[src*="platform.linkedin.com"]')
      scripts.forEach((s) => s.remove())
    }
  }, [])

  return (
    <>
      <Hero />

      <section className="quote-section">
        <Container>
          <div className="quote-container">
            <div className="quote-image-wrapper">
              <div className="quote-image-glow"></div>
              <img
                src="https://albertsanflepage.s3.us-east-1.amazonaws.com/media/billgatefoto2.jpg"
                alt="Bill Gates"
                className="quote-image"
              />
            </div>
            <div className="quote-content">
              <div className="quote-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              <blockquote className="quote-text">
                "El éxito es un pésimo maestro. Seduce a la gente inteligente a pensar que no puede perder."
              </blockquote>
              <div className="quote-divider"></div>
              <p className="quote-subtext">
                "La humildad y el aprendizaje constante son las claves para mantenerse relevante en el mundo de la
                tecnología."
              </p>
              <div className="quote-author">
                <span className="author-name">Bill Gates</span>
                <span className="author-title">Fundador de Microsoft</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="social-section">
        <Container>
          <div className="social-header">
            <div className="social-icon-animated">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <h3 className="social-title">Sígueme en mis redes sociales</h3>
            <p className="social-subtitle">Conéctate conmigo y mantente al día con mis proyectos y contenido tech.</p>
          </div>

          <div className="social-cards-container">
            {/* Instagram Card */}
            <a
              href="https://www.instagram.com/albertsanfle_07/"
              target="_blank"
              rel="noreferrer"
              className="social-card instagram-card"
            >
              <div className="card-glow instagram-glow"></div>
              <div className="card-shine"></div>
              <div className="social-card-header">
                <div className="avatar-ring instagram-ring">
                  <img
                    src="https://albertsanflepage.s3.us-east-1.amazonaws.com/media/albertsanfleinstagramfoto.jpg"
                    alt="Albert Sanfle Instagram"
                    className="avatar-img"
                  />
                </div>
                <div className="social-badge instagram-badge">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
              </div>

              <div className="social-info">
                <h4 className="social-handle">@albertsanfle_07</h4>
                <p className="social-name">Albert Sanfle</p>
                <p className="social-desc">DevOps Engineer | AWS</p>
              </div>

              <div className="social-stats">
                <div className="stat">
                  <span className="stat-num">19</span>
                  <span className="stat-text">Posts</span>
                </div>
                <div className="stat">
                  <span className="stat-num">1.3K</span>
                  <span className="stat-text">Seguidores</span>
                </div>
                <div className="stat">
                  <span className="stat-num">680</span>
                  <span className="stat-text">Seguidos</span>
                </div>
              </div>

              <div className="follow-btn instagram-btn">
                <span>Seguir en Instagram</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </a>

            {/* LinkedIn Card - actualizada con foto de portafolio */}
            <div className="social-card linkedin-card">
              <div className="card-glow linkedin-glow"></div>
              <div className="card-shine"></div>
              <div className="social-card-header">
                <div className="avatar-ring linkedin-ring">
                  <img
                    src="https://albertsanflepage.s3.us-east-1.amazonaws.com/media/albertsanfleportafolioimagen.jpg"
                    alt="Albert Sanfle LinkedIn"
                    className="avatar-img"
                  />
                </div>
                <div className="social-badge linkedin-badge-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>
              </div>

              <div className="social-info">
                <h4 className="social-handle">Albert Javier Sanfle Lopez</h4>
                <p className="social-desc linkedin-desc">DevOps Engineer | AWS Certified | CI/CD | SRE</p>
              </div>

              <div className="linkedin-embed">
                <div
                  className="badge-base LI-profile-badge"
                  data-locale="en_US"
                  data-size="large"
                  data-theme="dark"
                  data-type="HORIZONTAL"
                  data-vanity="albert-sanfle-a89209215"
                  data-version="v1"
                >
                  <a
                    className="badge-base__link LI-simple-link"
                    href="https://do.linkedin.com/in/albert-sanfle-a89209215/en?trk=profile-badge"
                  >
                    Albert Javier Sanfle Lopez
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
