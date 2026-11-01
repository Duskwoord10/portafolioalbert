import React, { useEffect, useState } from "react";
import {
  Link,
  NavLink,
} from "react-router-dom";
import "./Navbar.css";
import { usePublicContent } from "../cms/usePublicContent.js";
import { publishedNavigation } from "../cms/navigation.js";
import { HOME_FALLBACK_ROWS } from "../content/publicFallbacks.js";
import { useLanguage, translateNavigationLabel } from "../i18n/LanguageContext.jsx";

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12H19M14 7L19 12L14 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6.5H20V17.5H4V6.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M5 7.5L12 13L19 7.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CountryFlag({ country }) {
  if (country === 'es') {
    return (
      <svg viewBox="0 0 24 16" aria-hidden="true" focusable="false">
        <rect width="24" height="16" rx="2" fill="#AA151B" />
        <path fill="#F1BF00" d="M0 4h24v8H0z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 16" aria-hidden="true" focusable="false">
      <rect width="24" height="16" rx="2" fill="#012169" />
      <path d="M0 0l24 16M24 0L0 16" stroke="#fff" strokeWidth="4" />
      <path d="M0 0l24 16M24 0L0 16" stroke="#C8102E" strokeWidth="1.6" />
      <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="6" />
      <path d="M12 0v16M0 8h24" stroke="#C8102E" strokeWidth="2.6" />
    </svg>
  );
}

export default function Navbar() {
  const menuRecords = usePublicContent('menu', []);
  const homeRows = usePublicContent('home', HOME_FALLBACK_ROWS);
  const home = homeRows[0]?.data || {};
  const { language, setLanguage, t } = useLanguage();
  const navLinks = publishedNavigation(menuRecords).map(link => ({
    ...link, label:translateNavigationLabel(link.label, language),
  }));

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth > 960) {
        setMobileMenuOpen(false);
      }
    };
    const closeOnHistory = () => setMobileMenuOpen(false);

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleResize);
    window.addEventListener("popstate", closeOnHistory);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("popstate", closeOnHistory);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen
      ? "hidden"
      : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`navbar ${
          scrolled ? "navbar-scrolled" : ""
        }`}
      >
        <div className="navbar-container">
          <div className="navbar-shell">
            <Link
              to="/"
              className="navbar-brand"
              aria-label="Ir al inicio"
              onClick={closeMobileMenu}
            >
              <span
                className="navbar-brand-mark"
                aria-hidden="true"
              >
                <span className="brand-symbol">&gt;</span>
                <span className="brand-cursor">_</span>
              </span>

              <span className="navbar-brand-copy">
                <strong>{home.footerDisplayName || home.name || ''}</strong>
                <small>{home.title || ''}</small>
              </span>
            </Link>

            <nav
              className="navbar-navigation"
              aria-label="Navegación principal"
            >
              <div className="navbar-navigation-track">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      isActive
                        ? "navbar-link navbar-link-active"
                        : "navbar-link"
                    }
                  >
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </div>
            </nav>

            <div className="navbar-actions">
              <div className="language-switch" role="group" aria-label="Language / Idioma">
                <button className={language === 'es' ? 'is-active' : ''} type="button"
                  onClick={() => setLanguage('es')} aria-label="Español" aria-pressed={language === 'es'} title="Español">
                  <CountryFlag country="es" />
                  <span className="language-code">ES</span>
                </button>
                <button className={language === 'en' ? 'is-active' : ''} type="button"
                  onClick={() => setLanguage('en')} aria-label="English" aria-pressed={language === 'en'} title="English">
                  <CountryFlag country="en" />
                  <span className="language-code">EN</span>
                </button>
              </div>
              <Link
                className="navbar-contact"
                to="/contacto"
              >
                <span className="navbar-contact-icon">
                  <MailIcon />
                </span>

                <span>{t('nav.contact')}</span>

                <span className="navbar-contact-arrow">
                  <ArrowIcon />
                </span>
              </Link>

              <button
                className={`mobile-menu-toggle ${
                  mobileMenuOpen
                    ? "mobile-menu-toggle-active"
                    : ""
                }`}
                type="button"
                onClick={() =>
                  setMobileMenuOpen((current) => !current)
                }
                aria-label={
                  mobileMenuOpen
                    ? "Cerrar menú"
                    : "Abrir menú"
                }
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                {mobileMenuOpen ? (
                  <CloseIcon />
                ) : (
                  <MenuIcon />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <button
        className={`mobile-overlay ${
          mobileMenuOpen
            ? "mobile-overlay-visible"
            : ""
        }`}
        type="button"
        onClick={closeMobileMenu}
        aria-label="Cerrar menú móvil"
        tabIndex={mobileMenuOpen ? 0 : -1}
      />

      <aside
        id="mobile-navigation"
        className={`mobile-menu ${
          mobileMenuOpen ? "mobile-menu-open" : ""
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="mobile-menu-top">
          <Link
            to="/"
            className="mobile-menu-brand"
            onClick={closeMobileMenu}
          >
            <span
              className="navbar-brand-mark"
              aria-hidden="true"
            >
              <span className="brand-symbol">&gt;</span>
              <span className="brand-cursor">_</span>
            </span>

            <span className="navbar-brand-copy">
              <strong>{home.footerDisplayName || home.name || ''}</strong>
              <small>{home.title || ''}</small>
            </span>
          </Link>

          <button
            className="mobile-menu-close"
            type="button"
            onClick={closeMobileMenu}
            aria-label="Cerrar menú"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mobile-menu-content">
          <div className="mobile-menu-label">
            Navegación
          </div>

          <nav
            className="mobile-navigation"
            aria-label="Navegación móvil"
          >
            {navLinks.map((link, index) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  isActive
                    ? "mobile-navigation-link mobile-navigation-link-active"
                    : "mobile-navigation-link"
                }
                onClick={closeMobileMenu}
              >
                <span className="mobile-link-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="mobile-link-label">
                  {link.label}
                </span>

                <span className="mobile-link-arrow">
                  <ArrowIcon />
                </span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mobile-menu-footer">
          <p>
            ¿Tienes una idea, proyecto o propuesta?
          </p>

          <Link
            className="mobile-contact-button"
            to="/contacto"
            onClick={closeMobileMenu}
          >
            <span className="mobile-contact-icon">
              <MailIcon />
            </span>

            <span>Conversemos</span>

            <span className="mobile-contact-arrow">
              <ArrowIcon />
            </span>
          </Link>

          <span className="mobile-availability">
            <span aria-hidden="true" />
            Disponible para nuevas oportunidades
          </span>
        </div>
      </aside>
    </>
  );
}
