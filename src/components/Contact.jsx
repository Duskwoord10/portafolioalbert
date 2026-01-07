import React, { useMemo, useState } from "react";
import { LINKS, PROFILE } from "../data.js";
import { Section, Card, IconLink } from "./ui.jsx";
import { MailIcon, PhoneIcon, LocationIcon, LinkedInIcon } from "./icons.jsx";

function buildMailto({ name, fromEmail, message }) {
  const subject = encodeURIComponent(`Contacto desde portafolio — ${name || "Nuevo lead"}`);
  const body = encodeURIComponent(
`Nombre: ${name}
Correo: ${fromEmail}

Mensaje:
${message}`
  );
  return `mailto:${LINKS.email}?subject=${subject}&body=${body}`;
}

function normalizeTel(phone) {
  return phone.replace(/[^\d+]/g, "");
}

export default function Contact() {
  const [form, setForm] = useState({ name: "", fromEmail: "", message: "" });

  const canSend = useMemo(() => {
    return form.name.trim() && form.fromEmail.trim() && form.message.trim();
  }, [form]);

  return (
    <Section
      id="contact"
      kicker="Contacto"
      title="Hablemos"
      subtitle="Escríbeme y coordinamos la mejor forma de ayudarte."
    >
      <div className="twoCols">
        <Card>
          <h3 className="h3">Datos</h3>
          <div className="contactList">
            <a className="contactItem" href={`mailto:${LINKS.email}`}>
              <MailIcon /> <span>{LINKS.email}</span>
            </a>

            <a className="contactItem" href={`tel:${normalizeTel(LINKS.phone)}`}>
              <PhoneIcon /> <span>{LINKS.phone}</span>
            </a>

            <div className="contactItem">
              <LocationIcon /> <span>{PROFILE.location}</span>
            </div>
          </div>

          <div className="contactLinks">
            <IconLink href={LINKS.linkedin} label="Conectar en LinkedIn">
              <LinkedInIcon />
            </IconLink>
          </div>

          <p className="micro muted">
            Este formulario abre tu correo. Si quieres “envío real”, lo conectamos a AWS SES/Lambda.
          </p>
        </Card>

        <Card>
          <h3 className="h3">Envíame un mensaje</h3>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!canSend) return;
              window.location.href = buildMailto(form);
            }}
          >
            <label className="label">
              Nombre
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tu nombre"
                required
              />
            </label>

            <label className="label">
              Correo
              <input
                className="input"
                type="email"
                value={form.fromEmail}
                onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
                placeholder="tuemail@ejemplo.com"
                required
              />
            </label>

            <label className="label">
              Mensaje
              <textarea
                className="textarea"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Cuéntame qué necesitas…"
                rows={5}
                required
              />
            </label>

            <button className={`btn ${canSend ? "" : "btnDisabled"}`} disabled={!canSend}>
              Enviar (abre tu email)
            </button>
          </form>
        </Card>
      </div>
    </Section>
  );
}
