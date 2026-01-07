import React from "react";
import { PROFILE, LINKS } from "../data.js";
import { Section, Card, IconLink } from "./ui.jsx";
import { YouTubeIcon } from "./icons.jsx";

export default function Company() {
  return (
    <Section
      id="company"
      kicker="Empresa"
      title={PROFILE.company}
      subtitle="Innovación, automatización y soluciones cloud enfocadas en impacto."
    >
      <div className="twoCols">
        <Card>
          <h3 className="h3">Qué hacemos</h3>
          <ul className="list">
            <li>Arquitectura AWS (seguridad, escalado, costos).</li>
            <li>DevOps y automatización para equipos productivos.</li>
            <li>Contact Centers inteligentes con Amazon Connect.</li>
            <li>Integraciones y dashboards operativos.</li>
          </ul>
        </Card>

        <Card>
          <h3 className="h3">Contenido</h3>
          <p className="p muted">Compartimos aprendizaje real en el canal:</p>
          <IconLink href={LINKS.youtube} label="@MethodicaTalks">
            <YouTubeIcon />
          </IconLink>
          <p className="micro muted">
            Luego agregamos GitHub, Instagram, Calendly si quieres.
          </p>
        </Card>
      </div>
    </Section>
  );
}
