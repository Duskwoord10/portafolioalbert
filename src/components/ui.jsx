import React from "react";

export function Container({ children }) {
  return <div className="container">{children}</div>;
}

export function Section({ id, kicker, title, subtitle, children }) {
  return (
    <section id={id} className="section">
      <Container>
        <header className="sectionHeader">
          {kicker ? <p className="kicker">{kicker}</p> : null}
          <h2 className="h2">{title}</h2>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </header>
        {children}
      </Container>
    </section>
  );
}

export function Pill({ children }) {
  return <span className="pill">{children}</span>;
}

export function Card({ children, className = "" }) {
  return <div className={`card ${className}`.trim()}>{children}</div>;
}

export function IconLink({ href, label, children }) {
  return (
    <a className="iconLink" href={href} target="_blank" rel="noreferrer">
      <span className="icon" aria-hidden="true">{children}</span>
      <span>{label}</span>
      <span className="iconLinkArrow" aria-hidden="true">↗</span>
    </a>
  );
}
