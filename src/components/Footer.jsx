import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { usePublicContent } from "../cms/usePublicContent.js";
import { HOME_FALLBACK_ROWS } from "../content/publicFallbacks.js";
import { useLanguage, translateNavigationLabel } from "../i18n/LanguageContext.jsx";
import { existingNavigation, publishedNavigation } from "../cms/navigation.js";
import {
  ArrowUp,
  ArrowUpRight,
  Bot,
  Check,
  ChevronRight,
  Cloud,
  Code2,
  Copy,
  Github,
  Heart,
  Linkedin,
  Mail,
  MapPin,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
  Youtube,
} from "lucide-react";
import "./footer.css";

export default function Footer() {
  const menuRecords = usePublicContent('menu', []);
  const homeRows = usePublicContent('home', HOME_FALLBACK_ROWS);
  const home = homeRows[0]?.data || {};
  const { language, t } = useLanguage();
  const contactEmail = home.contactEmail;
  const currentYear = new Date().getFullYear();

  const [emailCopied, setEmailCopied] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const displayName = home.footerDisplayName;
  const fullName = home.name || displayName;
  const roleLine = home.footerRoleLine;

  const navigationLinks = publishedNavigation(menuRecords, [
    ...existingNavigation, { to:'/contacto',label:'Contacto' },
  ]).map(item => ({ ...item, label:translateNavigationLabel(item.label, language) }));

  const specialtyIcons = [Cloud, Workflow, Server, Bot, ShieldCheck];
  const specialties = (Array.isArray(home.footerSpecialties) ? home.footerSpecialties : [])
    .map((item,index) => ({ label:item.title,description:item.text,
      icon:specialtyIcons[index % specialtyIcons.length] }));

  const socialLinks = [
        {
          label: "LinkedIn",
          href: home.linkedin,
          icon: Linkedin,
          className: "linkedin",
        },
        {
          label: "GitHub",
          href: home.github,
          icon: Github,
          className: "github",
        },
        {
          label: "YouTube",
          href: home.youtube,
          icon: Youtube,
          className: "youtube",
        },
      ].filter((social) => Boolean(social.href));

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 500);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const openEmail = () => {
    window.location.assign(`mailto:${contactEmail}`);
  };

  const copyEmailFallback = () => {
    const textarea = document.createElement("textarea");

    textarea.value = contactEmail;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  const copyEmail = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(contactEmail);
      } else {
        copyEmailFallback();
      }

      setEmailCopied(true);

      window.setTimeout(() => {
        setEmailCopied(false);
      }, 2200);
    } catch (error) {
      console.error("No se pudo copiar el correo:", error);
      openEmail();
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="portfolio-footer">
      <div className="footer-background-grid" />
      <div className="footer-orb footer-orb-left" />
      <div className="footer-orb footer-orb-right" />

      <div className="footer-accent-line" />

      <div className="footer-container">
        <section className="footer-hero">
          <div className="footer-hero-content">
            <div className="footer-availability">
              <span className="availability-dot" />

              <span>{t('footer.available')}</span>
            </div>

            <h2 className="footer-hero-title">
              {home.footerHeading}{" "}<span>{home.footerHeadingAccent}</span>
            </h2>

            <p className="footer-hero-description">
              {home.footerDescription}
            </p>

            <div className="footer-hero-tags">
              <span>AWS</span>
              <span>DevOps</span>
              <span>Serverless</span>
              <span>Automatización</span>
              <span>Inteligencia artificial</span>
            </div>
          </div>

          <div className="footer-hero-actions">
            <button
              type="button"
              className="footer-main-button"
              onClick={openEmail}
            >
              <span className="footer-main-button-icon">
                <Mail size={18} aria-hidden="true" />
              </span>

              <span className="footer-main-button-text">
                <small>{t('footer.direct')}</small>
                <strong>{t('footer.start')}</strong>
              </span>

              <ArrowUpRight size={18} aria-hidden="true" />
            </button>

            {home.linkedin && (
              <a
                href={home.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-linkedin-button"
              >
                <Linkedin size={18} aria-hidden="true" />
                <span>{t('footer.linkedin')}</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            )}
          </div>
        </section>

        <div className="footer-main-grid">
          <section className="footer-profile-section">
            <Link to="/" className="footer-profile-header">
              <span className="footer-logo">
                <Terminal size={23} aria-hidden="true" />
              </span>

              <span className="footer-profile-identity">
                <strong>{displayName}</strong>
                <small>{roleLine}</small>
              </span>
            </Link>

            <p className="footer-profile-description">
              {home.footerProfileDescription}
            </p>

            <div className="footer-location">
              <MapPin size={16} aria-hidden="true" />

              <span>{home.footerLocation}</span>
            </div>

            <div className="footer-social-list">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`footer-social-link ${social.className}`}
                    aria-label={`Abrir ${social.label}`}
                    title={social.label}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </a>
                );
              })}

              <a
                href={`mailto:${contactEmail}`}
                className="footer-social-link email"
                aria-label="Enviar correo electrónico"
                title="Correo electrónico"
              >
                <Mail size={18} aria-hidden="true" />
              </a>
            </div>
          </section>

          <section className="footer-navigation-section">
            <div className="footer-section-heading">
              <span>{t('footer.navigation')}</span>
              <div />
            </div>

            <nav aria-label="Navegación del pie de página">
              <ul className="footer-navigation-list">
                {navigationLinks.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        isActive ? "is-active" : ""
                      }
                    >
                      <span>{item.label}</span>
                      <ChevronRight size={15} aria-hidden="true" />
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </section>

          <section className="footer-specialties-section">
            <div className="footer-section-heading">
              <span>{t('footer.specialties')}</span>
              <div />
            </div>

            <ul className="footer-specialties-list">
              {specialties.map((specialty) => {
                const Icon = specialty.icon;

                return (
                  <li key={specialty.label}>
                    <span className="footer-specialty-icon">
                      <Icon size={17} aria-hidden="true" />
                    </span>

                    <span className="footer-specialty-content">
                      <strong>{specialty.label}</strong>
                      <small>{specialty.description}</small>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="footer-contact-section">
            <div className="footer-contact-card">
              <div className="footer-contact-card-header">
                <span className="footer-contact-icon">
                  <Sparkles size={19} aria-hidden="true" />
                </span>

                <span className="footer-contact-status">
                  {t('footer.contact')}
                </span>
              </div>

              <h3>{home.footerContactHeadline}</h3>

              <p>{home.footerContactDescription}</p>

              <div className="footer-email-box">
                <div className="footer-email-data">
                  <Mail size={17} aria-hidden="true" />

                  <a href={`mailto:${contactEmail}`}>
                    {contactEmail}
                  </a>
                </div>

                <button
                  type="button"
                  className={`footer-copy-email ${
                    emailCopied ? "is-copied" : ""
                  }`}
                  onClick={copyEmail}
                  aria-label="Copiar correo electrónico"
                  title="Copiar correo"
                >
                  {emailCopied ? (
                    <Check size={17} aria-hidden="true" />
                  ) : (
                    <Copy size={17} aria-hidden="true" />
                  )}
                </button>
              </div>

              <Link to="/contacto" className="footer-contact-page-link">
                <span>Ver todas las opciones de contacto</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>

              <span className="sr-only" aria-live="polite">
                {emailCopied
                  ? "El correo electrónico fue copiado correctamente."
                  : ""}
              </span>
            </div>
          </section>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <p>
              © {currentYear} <strong>{fullName}</strong>
            </p>

            <span className="footer-bottom-dot" />

            <p>Todos los derechos reservados</p>

            <span className="footer-bottom-dot" />

            <div className="footer-made-in">
              <span>Diseñado con</span>

              <Heart
                size={13}
                className="footer-heart"
                aria-hidden="true"
              />

              <span>en República Dominicana</span>
            </div>
          </div>

          <div className="footer-stack">
            <span>
              <Code2 size={14} aria-hidden="true" />
              React
            </span>

            <span>
              <Cloud size={14} aria-hidden="true" />
              AWS
            </span>

            <span>
              <Terminal size={14} aria-hidden="true" />
              DevOps
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        className={`footer-scroll-top ${
          showScrollButton ? "is-visible" : ""
        }`}
        onClick={scrollToTop}
        aria-label="Volver al inicio"
        title="Volver al inicio"
      >
        <ArrowUp size={20} aria-hidden="true" />
      </button>
    </footer>
  );
}
