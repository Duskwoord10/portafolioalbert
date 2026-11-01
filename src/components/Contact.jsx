import React, { useMemo, useState } from "react";
import { cmsFetch } from "../cms/api.js";
import { usePublicContent } from "../cms/usePublicContent.js";
import { HOME_FALLBACK_ROWS } from "../content/publicFallbacks.js";

const SUBJECT_OPTIONS = [
  "Proyecto o colaboración",
  "Consultoría tecnológica",
  "Oportunidad profesional",
  "Desarrollo web o automatización",
  "Otro asunto",
];

function buildMailto({ name, email, subject, message }, contactEmail) {
  const mailSubject = encodeURIComponent(
    `${subject || "Contacto desde portafolio"} — ${name || "Nuevo contacto"}`
  );

  const mailBody = encodeURIComponent(
`Hola Albert,

Mi nombre es ${name}.
Mi correo es ${email}.

Motivo del contacto:
${subject}

Mensaje:
${message}

Saludos.`
  );

  return `mailto:${contactEmail}?subject=${mailSubject}&body=${mailBody}`;
}

function buildWhatsAppLink(phoneRaw) {
  const message = encodeURIComponent(
    "Hola Albert, vi tu portafolio y me gustaría conversar contigo."
  );

  return `https://wa.me/${phoneRaw}?text=${message}`;
}

function GmailIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M6 12.7v22.6c0 2 1.6 3.7 3.7 3.7H15V21.5L6 14.8v-2.1Z" />
      <path fill="#34A853" d="M33 21.5V39h5.3c2 0 3.7-1.6 3.7-3.7V12.7l-9 2.1v6.7Z" />
      <path fill="#FBBC04" d="M33 14.8v6.7L24 28l-9-6.5v-6.7l9 6.5 9-6.5Z" />
      <path fill="#EA4335" d="M6 12.7c0-4.5 5.2-7 8.7-4.3L24 15.1l9.3-6.7c3.5-2.6 8.7-.1 8.7 4.3v2.1L33 21.5 24 15l-9 6.5-9-6.7v-2.1Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8.2 3.5 10 7.7c.2.5.1 1-.3 1.4l-1.4 1.4a15 15 0 0 0 5.2 5.2l1.4-1.4c.4-.4.9-.5 1.4-.3l4.2 1.8c.6.2.9.8.8 1.4l-.4 2.6c-.1.7-.7 1.2-1.4 1.2C10.4 21 3 13.6 3 4.5c0-.7.5-1.3 1.2-1.4l2.6-.4c.6-.1 1.2.2 1.4.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="10"
        r="2.7"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.45 8.4H3V21h3.45V8.4ZM4.73 3A2 2 0 1 0 4.73 7a2 2 0 0 0 0-4ZM21 13.78c0-3.8-2.03-5.57-4.74-5.57-2.18 0-3.16 1.2-3.7 2.04V8.4H9.1V21h3.46v-6.24c0-1.65.31-3.25 2.36-3.25 2.02 0 2.05 1.89 2.05 3.36V21H21v-7.22Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.5 11.6A8.5 8.5 0 0 1 7.9 19l-4.4 1.2 1.2-4.3A8.5 8.5 0 1 1 20.5 11.6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 7.8c.3-.3.6-.3.8-.3h.4c.2 0 .4.1.5.4l.8 1.8c.1.3.1.5-.1.7l-.6.8c-.2.2-.2.4 0 .7.5.9 1.2 1.6 2.1 2.1.3.2.5.2.7 0l.8-1c.2-.2.4-.3.7-.2l1.9.9c.3.1.4.3.4.6 0 .4-.2 1.3-.7 1.7-.5.5-1.3.8-2.2.6-1.1-.2-2.7-.8-4.4-2.3-1.3-1.2-2.3-2.7-2.7-4-.4-1.2-.1-2 .4-2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
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
        d="M21 3 10.5 13.5M21 3l-7 18-3.5-7.5L3 10l18-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Contact() {
  const homeRows = usePublicContent('home', HOME_FALLBACK_ROWS);
  const home = homeRows[0]?.data || {};
  const contact = { email:home.contactEmail, phoneDisplay:home.contactPhoneDisplay,
    phoneRaw:home.contactPhoneRaw, location:home.footerLocation, linkedin:home.linkedin };
  const [delivery, setDelivery] = useState('');
  const [website, setWebsite] = useState('');
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: SUBJECT_OPTIONS[0],
    message: "",
  });

  const canSend = useMemo(() => {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

    return Boolean(
      form.name.trim() &&
      validEmail &&
      form.subject &&
      form.message.trim().length >= 10
    );
  }, [form]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSend) return;

    try {
      await cmsFetch('/contact', { method: 'POST', body: JSON.stringify({ ...form, website }) });
      setDelivery('Mensaje recibido. Gracias por escribir.');
      setForm({ name: '', email: '', subject: SUBJECT_OPTIONS[0], message: '' });
    } catch {
      setDelivery('La bandeja no está disponible; se abrirá tu aplicación de correo.');
      window.location.assign(buildMailto(form, contact.email));
    }
  };

  return (
    <>
      <section className="as-contact-section" id="contact">
        <div className="as-contact-heading">
          <span>Contacto</span>
          <h2>{home.contactHeadline}</h2>
          <p>{home.contactIntro}</p>
        </div>

        <div className="as-contact-shell">
          <div className="as-contact-decoration as-contact-decoration-one" />
          <div className="as-contact-decoration as-contact-decoration-two" />

          <aside className="as-contact-info">
            <div className="as-contact-info-top">
              <div className="as-contact-badge">Disponible para nuevos proyectos</div>

              <div className="as-contact-intro">
                <small>Hablemos</small>
                <h3>{home.contactCardHeadline}</h3>
                <p>{home.contactCardDescription}</p>
              </div>

              <div className="as-contact-list">
                <a href={`mailto:${contact.email}`} className="as-contact-item">
                  <span className="as-contact-item-icon as-gmail-icon">
                    <GmailIcon />
                  </span>

                  <span className="as-contact-item-copy">
                    <small>Correo electrónico</small>
                    <strong>{contact.email}</strong>
                  </span>

                  <span className="as-contact-item-arrow">
                    <ArrowIcon />
                  </span>
                </a>

                <a
                  href={`tel:${contact.phoneRaw}`}
                  className="as-contact-item"
                >
                  <span className="as-contact-item-icon">
                    <PhoneIcon />
                  </span>

                  <span className="as-contact-item-copy">
                    <small>Teléfono</small>
                    <strong>{contact.phoneDisplay}</strong>
                  </span>

                  <span className="as-contact-item-arrow">
                    <ArrowIcon />
                  </span>
                </a>

                <div className="as-contact-item as-contact-item-static">
                  <span className="as-contact-item-icon">
                    <LocationIcon />
                  </span>

                  <span className="as-contact-item-copy">
                    <small>Ubicación</small>
                    <strong>{contact.location}</strong>
                  </span>
                </div>
              </div>

              <div className="as-contact-socials">
                <a
                  href={contact.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="as-contact-social as-linkedin"
                >
                  <LinkedInIcon />
                  <span>LinkedIn</span>
                </a>

                <a
                  href={buildWhatsAppLink(contact.phoneRaw)}
                  target="_blank"
                  rel="noreferrer"
                  className="as-contact-social as-whatsapp"
                >
                  <WhatsAppIcon />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="as-contact-info-bottom">
              <div>
                <small>Respuesta estimada</small>
                <strong>Menos de 24 horas</strong>
              </div>

              <span>AWS · CLOUD · IA</span>
            </div>
          </aside>

          <div className="as-contact-form-panel">
            <div className="as-contact-form-heading">
              <div>
                <small>Mensaje directo</small>
                <h3>{home.contactFormHeadline}</h3>
              </div>

              <div className="as-contact-form-mail-icon">
                <GmailIcon />
              </div>
            </div>

            <form className="as-contact-form" onSubmit={handleSubmit}>
              <label style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">Sitio web
                <input tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} />
              </label>
              <div className="as-contact-form-row">
                <label>
                  <span>Nombre completo</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    placeholder="Ej. Juan Pérez"
                    autoComplete="name"
                    required
                  />
                </label>

                <label>
                  <span>Correo electrónico</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    placeholder="nombre@empresa.com"
                    autoComplete="email"
                    required
                  />
                </label>
              </div>

              <label>
                <span>Motivo del contacto</span>
                <select
                  value={form.subject}
                  onChange={(event) =>
                    updateField("subject", event.target.value)
                  }
                >
                  {SUBJECT_OPTIONS.map((option) => (
                    <option value={option} key={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="as-contact-message-field">
                <span>Mensaje</span>
                <textarea
                  value={form.message}
                  onChange={(event) =>
                    updateField("message", event.target.value.slice(0, 700))
                  }
                  placeholder="Háblame brevemente sobre tu proyecto, necesidad u oportunidad..."
                  rows={7}
                  minLength={10}
                  maxLength={700}
                  required
                />
                <small>{form.message.length}/700</small>
              </label>

              <div className="as-contact-form-footer">
                <p>
                  {delivery || 'Tu mensaje se enviará a la bandeja de contacto.'}
                </p>

                <button type="submit" disabled={!canSend}>
                  <span>Enviar mensaje</span>
                  <SendIcon />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <style>{`
        .as-contact-section,
        .as-contact-section * {
          box-sizing: border-box;
        }

        .as-contact-section {
          position: relative;
          width: 100%;
          padding: 96px 24px;
          overflow: hidden;
          background:
            radial-gradient(circle at 18% 12%, rgba(14, 165, 233, 0.10), transparent 28%),
            radial-gradient(circle at 86% 18%, rgba(99, 102, 241, 0.12), transparent 30%),
            linear-gradient(180deg, #08121f 0%, #0a1220 46%, #0b1020 100%);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          color: #0f172a;
        }

        .as-contact-heading {
          position: relative;
          z-index: 2;
          width: min(760px, 100%);
          margin: 0 auto 42px;
          text-align: center;
        }

        .as-contact-heading::before {
          content: "";
          position: absolute;
          z-index: -1;
          top: 38px;
          left: 50%;
          width: min(720px, 92vw);
          height: 220px;
          transform: translateX(-50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.18), transparent 68%);
          filter: blur(12px);
          pointer-events: none;
        }

        .as-contact-heading > span {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 30px;
          padding: 0 13px;
          border: 1px solid #dbeafe;
          border-radius: 999px;
          color: #2563eb;
          background: #eff6ff;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .as-contact-heading h2 {
          position: relative;
          z-index: 2;
          margin: 18px 0 0;
          color: #f8fbff !important;
          -webkit-text-fill-color: #f8fbff;
          text-shadow:
            0 2px 18px rgba(59, 130, 246, 0.16),
            0 1px 0 rgba(255, 255, 255, 0.03);
          font-size: clamp(34px, 5vw, 58px);
          line-height: 1.02;
          font-weight: 950;
          letter-spacing: -0.055em;
        }

        .as-contact-heading p {
          position: relative;
          z-index: 2;
          max-width: 650px;
          margin: 17px auto 0;
          color: #a9bad2 !important;
          -webkit-text-fill-color: #a9bad2;
          font-size: 15px;
          line-height: 1.7;
        }

        .as-contact-shell {
          position: relative;
          z-index: 2;
          isolation: isolate;
          width: min(1180px, 100%);
          min-height: 690px;
          display: grid;
          grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
          margin: 0 auto;
          overflow: hidden;
          border: 1px solid rgba(203, 213, 225, 0.82);
          border-radius: 32px;
          background: #ffffff;
          box-shadow:
            0 38px 100px rgba(15, 23, 42, 0.14),
            0 12px 35px rgba(15, 23, 42, 0.07);
        }

        .as-contact-decoration {
          position: absolute;
          z-index: -1;
          width: 360px;
          height: 360px;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(10px);
        }

        .as-contact-decoration-one {
          top: -220px;
          right: 18%;
          background: rgba(37, 99, 235, 0.14);
        }

        .as-contact-decoration-two {
          right: -190px;
          bottom: -230px;
          background: rgba(14, 165, 233, 0.11);
        }

        .as-contact-info {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          padding: 42px;
          color: #ffffff;
          background:
            radial-gradient(
              circle at 85% 8%,
              rgba(59, 130, 246, 0.35),
              transparent 30%
            ),
            radial-gradient(
              circle at 10% 100%,
              rgba(37, 99, 235, 0.23),
              transparent 36%
            ),
            linear-gradient(145deg, #07111f 0%, #0a172a 52%, #102a58 100%);
        }

        .as-contact-info::before {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0.21;
          pointer-events: none;
          background-image:
            linear-gradient(
              rgba(255, 255, 255, 0.055) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.055) 1px,
              transparent 1px
            );
          background-size: 38px 38px;
          mask-image: linear-gradient(to bottom, #000 25%, transparent 95%);
        }

        .as-contact-info::after {
          content: "";
          position: absolute;
          top: 85px;
          right: -95px;
          width: 250px;
          height: 250px;
          border: 1px solid rgba(147, 197, 253, 0.17);
          border-radius: 50%;
          box-shadow:
            0 0 0 38px rgba(147, 197, 253, 0.04),
            0 0 0 76px rgba(147, 197, 253, 0.025);
        }

        .as-contact-info-top,
        .as-contact-info-bottom {
          position: relative;
          z-index: 2;
        }

        .as-contact-badge {
          width: fit-content;
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          padding: 0 13px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 999px;
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          font-size: 11px;
          font-weight: 800;
        }

        .as-contact-intro {
          max-width: 470px;
          margin-top: 34px;
        }

        .as-contact-intro small,
        .as-contact-form-heading small {
          display: inline-block;
          margin-bottom: 11px;
          color: #93c5fd;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.17em;
          text-transform: uppercase;
        }

        .as-contact-intro h3,
        .as-contact-form-heading h3 {
          margin: 0;
          letter-spacing: -0.045em;
        }

        .as-contact-intro h3 {
          max-width: 420px;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff;
          font-size: clamp(31px, 3vw, 43px);
          line-height: 1.03;
          font-weight: 950;
        }

        .as-contact-intro p {
          max-width: 450px;
          margin: 18px 0 0;
          color: rgba(226, 232, 240, 0.78);
          font-size: 14px;
          line-height: 1.75;
        }

        .as-contact-list {
          display: grid;
          gap: 10px;
          margin-top: 34px;
        }

        .as-contact-item {
          min-width: 0;
          min-height: 70px;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 12px 14px;
          border: 1px solid rgba(255, 255, 255, 0.11);
          border-radius: 18px;
          color: inherit;
          text-decoration: none;
          background: rgba(255, 255, 255, 0.065);
          backdrop-filter: blur(12px);
          transition:
            transform 0.18s ease,
            background 0.18s ease,
            border-color 0.18s ease;
        }

        a.as-contact-item:hover {
          transform: translateX(4px);
          border-color: rgba(147, 197, 253, 0.34);
          background: rgba(255, 255, 255, 0.1);
        }

        .as-contact-item-icon {
          width: 46px;
          height: 46px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border: 1px solid rgba(147, 197, 253, 0.17);
          border-radius: 14px;
          color: #bfdbfe;
          background: rgba(37, 99, 235, 0.15);
        }

        .as-contact-item-icon svg {
          width: 21px;
          height: 21px;
        }

        .as-contact-item-icon.as-gmail-icon {
          background: rgba(255, 255, 255, 0.95);
        }

        .as-contact-item-icon.as-gmail-icon svg {
          width: 25px;
          height: 25px;
        }

        .as-contact-item-copy {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .as-contact-item-copy small {
          color: rgba(191, 219, 254, 0.68);
          font-size: 11px;
          font-weight: 700;
        }

        .as-contact-item-copy strong {
          overflow: hidden;
          color: #ffffff;
          font-size: 13px;
          font-weight: 850;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .as-contact-item-arrow {
          width: 32px;
          height: 32px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 10px;
          color: rgba(191, 219, 254, 0.72);
          background: rgba(255, 255, 255, 0.055);
        }

        .as-contact-item-arrow svg {
          width: 16px;
          height: 16px;
        }

        .as-contact-socials {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .as-contact-social {
          min-height: 50px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 0 14px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.075);
          font-size: 13px;
          font-weight: 850;
          text-decoration: none;
          transition:
            transform 0.16s ease,
            background 0.16s ease,
            border-color 0.16s ease;
        }

        .as-contact-social:hover {
          transform: translateY(-2px);
        }

        .as-contact-social.as-linkedin:hover {
          border-color: rgba(96, 165, 250, 0.45);
          background: rgba(10, 102, 194, 0.2);
        }

        .as-contact-social.as-whatsapp:hover {
          border-color: rgba(52, 211, 153, 0.42);
          background: rgba(34, 197, 94, 0.16);
        }

        .as-contact-social svg {
          width: 19px;
          height: 19px;
        }

        .as-contact-info-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 42px;
          padding-top: 22px;
          border-top: 1px solid rgba(255, 255, 255, 0.11);
        }

        .as-contact-info-bottom > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .as-contact-info-bottom small {
          color: rgba(191, 219, 254, 0.66);
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .as-contact-info-bottom strong {
          color: #ffffff;
          font-size: 13px;
          font-weight: 850;
        }

        .as-contact-info-bottom > span {
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          padding: 0 12px;
          border: 1px solid rgba(147, 197, 253, 0.16);
          border-radius: 999px;
          color: rgba(219, 234, 254, 0.82);
          background: rgba(37, 99, 235, 0.1);
          font-size: 10px;
          font-weight: 800;
        }

        .as-contact-form-panel {
          padding: 42px;
          background:
            linear-gradient(
              155deg,
              rgba(255, 255, 255, 0.99),
              rgba(248, 250, 252, 0.97)
            );
        }

        .as-contact-form-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 30px;
        }

        .as-contact-form-heading small {
          color: #2563eb;
        }

        .as-contact-form-heading h3 {
          color: #0f172a;
          font-size: clamp(26px, 2.2vw, 34px);
          line-height: 1.1;
          font-weight: 950;
        }

        .as-contact-form-mail-icon {
          width: 54px;
          height: 54px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border: 1px solid #e2e8f0;
          border-radius: 17px;
          background: #ffffff;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.09);
        }

        .as-contact-form-mail-icon svg {
          width: 29px;
          height: 29px;
        }

        .as-contact-form {
          display: grid;
          gap: 18px;
        }

        .as-contact-form-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .as-contact-form label {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .as-contact-form label > span {
          color: #334155;
          font-size: 12px;
          font-weight: 850;
        }

        .as-contact-form input,
        .as-contact-form select,
        .as-contact-form textarea {
          width: 100%;
          border: 1px solid #dbe3ef;
          outline: none;
          border-radius: 15px;
          color: #0f172a;
          background: rgba(255, 255, 255, 0.95);
          font: inherit;
          transition:
            border-color 0.16s ease,
            box-shadow 0.16s ease,
            background 0.16s ease;
        }

        .as-contact-form input,
        .as-contact-form select {
          height: 52px;
          padding: 0 15px;
        }

        .as-contact-form select {
          appearance: none;
          cursor: pointer;
          padding-right: 44px;
          background-image:
            linear-gradient(45deg, transparent 50%, #64748b 50%),
            linear-gradient(135deg, #64748b 50%, transparent 50%);
          background-position:
            calc(100% - 20px) 23px,
            calc(100% - 15px) 23px;
          background-size: 5px 5px, 5px 5px;
          background-repeat: no-repeat;
        }

        .as-contact-form textarea {
          min-height: 180px;
          resize: vertical;
          padding: 15px 15px 34px;
          line-height: 1.65;
        }

        .as-contact-form input::placeholder,
        .as-contact-form textarea::placeholder {
          color: #94a3b8;
        }

        .as-contact-form input:hover,
        .as-contact-form select:hover,
        .as-contact-form textarea:hover {
          border-color: #bfdbfe;
        }

        .as-contact-form input:focus,
        .as-contact-form select:focus,
        .as-contact-form textarea:focus {
          border-color: rgba(37, 99, 235, 0.72);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.09);
        }

        .as-contact-message-field > small {
          position: absolute;
          right: 13px;
          bottom: 11px;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 700;
          pointer-events: none;
        }

        .as-contact-form-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 2px;
        }

        .as-contact-form-footer p {
          max-width: 280px;
          margin: 0;
          color: #64748b;
          font-size: 11px;
          line-height: 1.55;
        }

        .as-contact-form-footer button {
          min-width: 185px;
          min-height: 52px;
          border: 0;
          border-radius: 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 20px;
          color: #ffffff;
          background: linear-gradient(135deg, #2563eb 0%, #1746c8 100%);
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.24);
          font-size: 13px;
          font-weight: 850;
          cursor: pointer;
          transition:
            transform 0.16s ease,
            box-shadow 0.16s ease,
            opacity 0.16s ease;
        }

        .as-contact-form-footer button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 19px 35px rgba(37, 99, 235, 0.3);
        }

        .as-contact-form-footer button:disabled {
          cursor: not-allowed;
          opacity: 0.43;
          box-shadow: none;
        }

        .as-contact-form-footer button svg {
          width: 18px;
          height: 18px;
        }

        @media (max-width: 980px) {
          .as-contact-shell {
            grid-template-columns: 1fr;
          }

          .as-contact-info,
          .as-contact-form-panel {
            padding: 34px;
          }

          .as-contact-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .as-contact-item-static {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 640px) {
          .as-contact-section {
            padding: 72px 14px;
          }

          .as-contact-heading {
            margin-bottom: 30px;
          }

          .as-contact-heading h2 {
            font-size: 37px;
          }

          .as-contact-shell {
            border-radius: 24px;
          }

          .as-contact-info,
          .as-contact-form-panel {
            padding: 25px 18px;
          }

          .as-contact-info::after {
            display: none;
          }

          .as-contact-intro h3 {
            font-size: 31px;
          }

          .as-contact-list,
          .as-contact-form-row {
            grid-template-columns: 1fr;
          }

          .as-contact-item-static {
            grid-column: auto;
          }

          .as-contact-socials {
            grid-template-columns: 1fr;
          }

          .as-contact-info-bottom,
          .as-contact-form-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .as-contact-info-bottom > span {
            width: fit-content;
          }

          .as-contact-form-heading h3 {
            font-size: 27px;
          }

          .as-contact-form-footer p {
            max-width: none;
          }

          .as-contact-form-footer button {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .as-contact-item,
          .as-contact-social,
          .as-contact-form input,
          .as-contact-form select,
          .as-contact-form textarea,
          .as-contact-form-footer button {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}
