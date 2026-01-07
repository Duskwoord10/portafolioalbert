import React from "react";
import { PROFILE, LINKS } from "../data.js";
import { Link } from "react-router-dom";
import {
  Heart,
  Coffee,
  Terminal,
  Code,
  Cloud,
  Github,
  Linkedin,
  Mail,
  ArrowUp,
} from "lucide-react";
import "./Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const handleCoffeeClick = () => {
    window.open("https://buymeacoffee.com/albertsanfle", "_blank", "noopener,noreferrer");
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer">
      {/* Gradient Line */}
      <div className="footer-line" />

      <div className="container">
        <div className="footer-content">
          {/* Main Grid */}
          <div className="footer-grid">
            {/* Brand Column */}
            <div className="footer-col footer-brand">
              <div className="brand-header">
                <div className="brand-logo">
                  <Terminal size={20} />
                </div>
                <div>
                  <h3 className="brand-name">{PROFILE.name}</h3>
                  <p className="brand-role">AWS · Cloud · DevOps</p>
                </div>
              </div>

              <p className="brand-desc">
                Ingeniero de Sistemas y fundador de <strong>Methodica Technology & Co</strong>. Especializado en arquitecturas cloud, DevOps y automatización con AWS. Construyendo el futuro de la tecnología empresarial.
              </p>

              <div className="brand-social">
                {LINKS?.linkedin && (
                  <a
                    href={LINKS.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={18} />
                  </a>
                )}
                {LINKS?.github && (
                  <a
                    href={LINKS.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn"
                    aria-label="GitHub"
                  >
                    <Github size={18} />
                  </a>
                )}
                {LINKS?.email && (
                  <a
                    href={`mailto:${LINKS.email}`}
                    className="social-btn"
                    aria-label="Email"
                  >
                    <Mail size={18} />
                  </a>
                )}
              </div>
            </div>

            {/* Navigation Column */}
            <div className="footer-col">
              <h4 className="footer-title">Navegación</h4>
              <ul className="footer-links">
                <li><Link to="/">Inicio</Link></li>
                <li><Link to="/sobre-mi">Sobre Mí</Link></li>
                <li><Link to="/experiencia">Experiencia</Link></li>
                <li><Link to="/proyectos">Proyectos</Link></li>
                <li><Link to="/certificaciones">Certificaciones</Link></li>
                <li><Link to="/contacto">Contacto</Link></li>
              </ul>
            </div>

            {/* Services Column */}
            <div className="footer-col">
              <h4 className="footer-title">Servicios</h4>
              <ul className="footer-links">
                <li>Arquitectura Cloud (AWS)</li>
                <li>DevOps & CI/CD</li>
                <li>Chatbots Omnicanales</li>
                <li>Facturación Electrónica</li>
                <li>Infraestructura como Código</li>
                <li>Consultoría Tecnológica</li>
              </ul>
            </div>

            {/* CTA Column */}
            <div className="footer-col">
              <div className="cta-card">
                <div className="cta-icon">
                  <Coffee size={24} />
                </div>
                <h4 className="cta-title">¿Te gusta mi trabajo?</h4>
                <p className="cta-text">
                  Apóyame con un café y ayúdame a seguir creando contenido de calidad.
                </p>
                <button className="cta-btn" onClick={handleCoffeeClick}>
                  <Coffee size={18} />
                  <span>Buy Me a Coffee</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="footer-bottom">
            <div className="footer-bottom-left">
              <p className="footer-copyright">
                © {currentYear} <strong>{PROFILE.name}</strong>. Todos los derechos reservados.
              </p>
              <div className="footer-love">
                <span>Hecho con</span>
                <Heart size={14} className="icon-heart" />
                <span>y</span>
                <Coffee size={14} className="icon-coffee" />
              </div>
            </div>

            <div className="footer-bottom-right">
              <div className="footer-tech">
                <span className="tech-badge">
                  <Code size={14} />
                  <span>React</span>
                </span>
                <span className="tech-badge">
                  <Cloud size={14} />
                  <span>AWS</span>
                </span>
                <span className="tech-badge">
                  <Terminal size={14} />
                  <span>DevOps</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top */}
      <button 
        className="scroll-top" 
        onClick={scrollToTop}
        aria-label="Volver arriba"
      >
        <ArrowUp size={20} />
      </button>

      {/* Mobile Coffee Button */}
      <button
        className="mobile-coffee"
        onClick={handleCoffeeClick}
        aria-label="Apóyame"
      >
        <Coffee size={20} />
        <span>Apóyame</span>
      </button>
    </footer>
  );
}