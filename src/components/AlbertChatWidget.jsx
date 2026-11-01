import React, { useEffect, useRef, useState } from "react";
import { usePublicContent } from "../cms/usePublicContent.js";
import { HOME_FALLBACK_ROWS } from "../content/publicFallbacks.js";
import { publishedNavigation } from "../cms/navigation.js";
import { cmsFetch } from "../cms/api.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import "./AlbertChatWidget.css";

function TerminalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 7L10 12L5 17"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 17H19"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.5 18.5L4 20L5.1 16.4A8 8 0 1 1 7.5 18.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 11.5H8.01M12 11.5H12.01M16 11.5H16.01"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GmailIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M6 12.5V37C6 38.66 7.34 40 9 40H15V21.45L6 14.55V12.5Z"
        fill="#4285F4"
      />
      <path
        d="M33 21.45V40H39C40.66 40 42 38.66 42 37V12.5V14.55L33 21.45Z"
        fill="#34A853"
      />
      <path
        d="M6 12.5L24 26.3L42 12.5V10.2C42 7.72 39.16 6.31 37.18 7.82L24 17.92L10.82 7.82C8.84 6.31 6 7.72 6 10.2V12.5Z"
        fill="#EA4335"
      />
      <path d="M15 21.45L6 14.55V20.55L15 27.45V21.45Z" fill="#C5221F" />
      <path d="M33 21.45L42 14.55V20.55L33 27.45V21.45Z" fill="#FABB05" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 11.7A8 8 0 0 1 8.2 18.8L4 20L5.2 15.9A8 8 0 1 1 20 11.7Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.1 8.2C9.3 7.8 9.5 7.8 9.8 7.8H10.1C10.3 7.8 10.5 7.9 10.6 8.2L11.2 9.6C11.3 9.9 11.3 10.1 11.1 10.3L10.6 10.9C10.5 11.1 10.5 11.3 10.7 11.5C11.4 12.7 12.4 13.6 13.6 14.1C13.9 14.3 14.1 14.2 14.3 14L14.9 13.2C15.1 13 15.3 12.9 15.6 13L17 13.7C17.3 13.8 17.4 14 17.4 14.3C17.3 15.2 16.9 15.8 16.2 16.2C15.5 16.6 14.5 16.7 13.1 16.1C11 15.3 9.2 13.7 8.2 11.8C7.3 10.2 8.5 8.9 9.1 8.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 18L9 12L15 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 3L10.5 13.5"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 3L14 21L10.5 13.5L3 10L21 3Z"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12H19M14 7L19 12L14 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlbertBrand({ name, role }) {
  return (
    <div className="albert-brand">
      <div className="albert-brand-icon">
        <TerminalIcon />
      </div>

      <div className="albert-brand-copy">
        <strong>{name}</strong>
        <span>{role}</span>
      </div>
    </div>
  );
}

export default function AlbertChatWidget() {
  const homeRows = usePublicContent('home', HOME_FALLBACK_ROWS);
  const menuRows = usePublicContent('menu', []);
  const home = homeRows[0]?.data || {};
  const { t } = useLanguage();
  const navigation = publishedNavigation(menuRows, []);
  const quickQuestions = [
    { label:'Perfil profesional', question:home.chatQuestionProfile },
    { label:'Experiencia en AWS', question:home.chatQuestionExperience },
    { label:'Proyectos destacados', question:home.chatQuestionProjects },
  ].filter(item => item.question);
  const contactEmail = home.contactEmail || '';
  const whatsappUrl = home.contactPhoneRaw ?
    `https://wa.me/${home.contactPhoneRaw}?text=${encodeURIComponent(home.chatWhatsappMessage || '')}` : '';
  const gmailUrl = contactEmail ?
    `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}&su=${encodeURIComponent(home.chatEmailSubject || '')}&body=${encodeURIComponent(home.chatEmailBody || '')}` : '';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const displayedMessages = [
    ...(home.chatWelcome ? [{ role:'assistant', content:home.chatWelcome }] : []),
    ...messages,
  ];

  const rootRef = useRef(null);
  const chatBodyRef = useRef(null);
  const inputRef = useRef(null);
  const requestTimesRef = useRef([]);

  useEffect(() => {
    if (!chatBodyRef.current) return;
    chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isChatOpen) return;

    const timer = window.setTimeout(() => inputRef.current?.focus(), 150);
    return () => window.clearTimeout(timer);
  }, [isChatOpen]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== "Escape") return;

      if (isChatOpen) {
        setIsChatOpen(false);
        setIsMenuOpen(true);
        return;
      }

      setIsMenuOpen(false);
    }

    function handleOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [isChatOpen]);

  function closeEverything() {
    setIsChatOpen(false);
    setIsMenuOpen(false);
  }

  function openChat() {
    setIsMenuOpen(false);
    setIsChatOpen(true);
  }

  function returnToChannels() {
    setIsChatOpen(false);
    setIsMenuOpen(true);
  }

  function getAssistantText(data) {
    if (!data) return "No recibí una respuesta válida del asistente.";
    if (typeof data === "string") return data;

    if (typeof data.body === "string") {
      try {
        return getAssistantText(JSON.parse(data.body));
      } catch {
        return data.body;
      }
    }

    return (
      data.message ||
      data.answer ||
      data.response ||
      data.text ||
      "No recibí una respuesta válida del asistente."
    );
  }

  async function sendMessage(text) {
    const cleanText = String(text || "").trim();
    if (!cleanText || isLoading) return;

    if (cleanText.length > 800) return;
    const now = Date.now();
    requestTimesRef.current = requestTimesRef.current.filter(time => now - time < 60_000);
    if (requestTimesRef.current.length >= 5) {
      setMessages(current => [...current, { role:'assistant', content:'Has enviado varios mensajes seguidos. Espera un minuto antes de intentarlo de nuevo.' }]);
      return;
    }
    requestTimesRef.current.push(now);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);

    setMessages((current) => [
      ...current,
      { role: "user", content: cleanText },
    ]);
    setInputValue("");
    setIsLoading(true);

    try {
      const result = await cmsFetch('/public/chat', {
        method: "POST",
        credentials: "omit",
        signal: controller.signal,
        headers: { Accept: "application/json" },
        body: JSON.stringify({ message: cleanText }),
      });

      setMessages((current) => [
        ...current,
          { role: "assistant", content: getAssistantText(result).slice(0, 4000) },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "No pude conectar con el asistente. Inténtalo de nuevo más tarde.",
        },
      ]);
    } finally {
      window.clearTimeout(timeout);
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(inputValue);
  }

  const showQuickQuestions = messages.length === 0 && !isLoading;

  return (
    <div className="albert-chat-root" ref={rootRef}>
      {isChatOpen && (
        <section
          className="albert-chat-widget is-open"
          role="dialog"
          aria-label={t('chat.aria')}
          aria-live="polite"
        >
          <header className="albert-chat-header">
            <div className="albert-header-bar">
              <button
                className="albert-header-icon-button"
                type="button"
                aria-label={t('chat.back')}
                onClick={returnToChannels}
              >
                <BackIcon />
              </button>

              <AlbertBrand name={home.footerDisplayName || home.name || ''} role={home.footerRoleLine || home.title || ''} />

              <button
                className="albert-header-icon-button"
                type="button"
                aria-label={t('chat.close')}
                onClick={closeEverything}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="albert-header-intro">
              <div className="albert-header-copy">
                <h2>{t('chat.title')}</h2>
                <p>{t('chat.description')}</p>
              </div>

              <div className="albert-status">{t('chat.online')}</div>
            </div>
          </header>

          <main className="albert-chat-body" ref={chatBodyRef}>
            {displayedMessages.map((message, index) => (
              <div
                className={`albert-message ${
                  message.role === "user" ? "is-user" : "is-assistant"
                }`}
                key={`${message.role}-${index}`}
              >
                <div className="albert-bubble">{message.content}</div>
              </div>
            ))}

            {showQuickQuestions && (
              <section
                className="albert-quick-start"
                aria-label={t('chat.questions')}
              >
                <div className="albert-quick-start-heading">
                  <span>{t('chat.questions')}</span>
                  <small>{t('chat.choose')}</small>
                </div>

                <div className="albert-quick-start-grid">
                  {quickQuestions.map((suggestion) => (
                    <button
                      key={suggestion.question}
                      type="button"
                      onClick={() => sendMessage(suggestion.question)}
                    >
                      <span>{suggestion.label}</span>
                      <ArrowRightIcon />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {isLoading && (
              <div className="albert-message is-assistant">
                <div
                  className="albert-bubble albert-typing"
                  aria-label="Escribiendo"
                >
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </main>

          {navigation.length > 0 && <section
            className="albert-portfolio-navigation"
            aria-label={t('chat.explore')}
          >
            <div className="albert-portfolio-navigation-top">
              <span>{t('chat.explore')}</span>
              <small>{t('chat.direct')}</small>
            </div>

            <div className="albert-portfolio-navigation-list">
              {navigation.map((link) => (
                <a
                  key={link.to}
                  className="albert-portfolio-navigation-link"
                  href={link.to}
                  onClick={closeEverything}
                >
                  <span>{link.label}</span>
                  <ArrowRightIcon />
                </a>
              ))}
            </div>
          </section>}

          <footer className="albert-chat-footer">
            <form className="albert-chat-form" onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                placeholder={t('chat.placeholder')}
                value={inputValue}
                disabled={isLoading}
                maxLength={800}
                autoComplete="off"
                onChange={(event) => setInputValue(event.target.value)}
              />

              <button
                type="submit"
                aria-label={t('chat.send')}
                disabled={isLoading || !inputValue.trim()}
              >
                <SendIcon />
              </button>
            </form>

            <div className="albert-powered-by">
              <span className="albert-powered-dot" />
              Asistente del portafolio conectado
            </div>
          </footer>
        </section>
      )}

      {!isChatOpen && (
        <div className={`albert-channel-dock ${isMenuOpen ? "is-open" : ""}`}>
          <button
            className={`albert-main-launcher ${isMenuOpen ? "is-close" : ""}`}
            type="button"
                aria-label={isMenuOpen ? t('chat.close') : t('chat.talk')}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span className="albert-main-launcher-icon">
              {isMenuOpen ? <CloseIcon /> : <ChatIcon />}
            </span>

            {!isMenuOpen && (
                <span className="albert-launcher-message" aria-hidden="true">
                {t('chat.talk')}
              </span>
            )}
          </button>

          <div className="albert-channel-options" aria-hidden={!isMenuOpen}>
            <button
              className="albert-channel-button is-ai"
              type="button"
              aria-label={t('chat.open')}
              tabIndex={isMenuOpen ? 0 : -1}
              onClick={openChat}
            >
              <span className="albert-channel-tooltip">{t('chat.title')}</span>
              <TerminalIcon />
            </button>

            {whatsappUrl && <a
              className="albert-channel-button is-whatsapp"
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Escribir por WhatsApp al ${home.contactPhoneDisplay || ''}`}
              tabIndex={isMenuOpen ? 0 : -1}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="albert-channel-tooltip">
                <strong>WhatsApp</strong>
                <small>{home.contactPhoneDisplay || ''}</small>
              </span>
              <WhatsAppIcon />
            </a>}

            {gmailUrl && <a
              className="albert-channel-button is-gmail"
              href={gmailUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Escribir por Gmail: ${contactEmail}`}
              tabIndex={isMenuOpen ? 0 : -1}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="albert-channel-tooltip is-email">
                <strong>Gmail</strong>
                <small>{contactEmail}</small>
              </span>
              <GmailIcon />
            </a>}
          </div>
        </div>
      )}
    </div>
  );
}
