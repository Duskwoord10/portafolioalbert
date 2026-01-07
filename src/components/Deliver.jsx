import React from "react";
import { DELIVERABLES } from "../data.js";
import { Section, Card } from "./ui.jsx";

export default function Deliver() {
  return (
    <Section
      id="deliver"
      kicker="Valor"
      title="Lo que entrego"
      subtitle="Paquetes claros, con documentación y pasos replicables."
    >
      <div className="grid3">
        {DELIVERABLES.map((d) => (
          <Card key={d.title}>
            <h3 className="h3">{d.title}</h3>
            <p className="p muted">{d.desc}</p>
          </Card>
        ))}
      </div>

      <div className="note">
        <strong>Incluye:</strong> checklist de entrega, handover y recomendaciones.
      </div>
    </Section>
  );
}
