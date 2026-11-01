"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePublicContent } from "../cms/usePublicContent.js";
import { HOME_FALLBACK_ROWS } from "../content/publicFallbacks.js";
import "./Certifications.css";

import {
  ExternalLink,
  Award,
  Calendar,
  Cloud,
  Zap,
  CheckCircle,
  Target,
  BookOpen,
  Rocket,
  Layers,
  Clock,
  Download,
  Sparkles,
  TrendingUp,
  Star,
  ChevronRight,
  GraduationCap,
  Code,
  Server,
  Terminal as TerminalIcon,
  Shield,
  Database,
  Trophy,
  Send,
} from "lucide-react";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#2563eb" offset="0"/>
      <stop stop-color="#06b6d4" offset="1"/>
    </linearGradient>
  </defs>
  <rect width="180" height="180" rx="36" fill="url(#g)"/>
  <text x="50%" y="45%" text-anchor="middle" font-family="Arial" font-size="28" font-weight="bold" fill="white">AWS</text>
  <text x="50%" y="63%" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="white">Certified</text>
</svg>
`);
const IN_PROGRESS_BADGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="180" height="180" rx="36" fill="#17324b"/><text x="90" y="83" text-anchor="middle" fill="white" font-family="Arial" font-size="18">En</text><text x="90" y="110" text-anchor="middle" fill="white" font-family="Arial" font-size="18">preparación</text></svg>'
);

const AWS_BADGES = {
  CLOUD_PRACTITIONER:
    "https://images.credly.com/images/00634f82-b07f-4bbd-a6bb-53de397fc3a6/image.png",
  SOLUTIONS_ARCHITECT_ASSOCIATE:
    "https://images.credly.com/images/0e284c3f-5164-4b21-8660-0d84737941bc/image.png",
  DEVELOPER_ASSOCIATE:
    "https://images.credly.com/images/b9feab85-1a43-4f6c-99a5-631b88d5461b/image.png",
  DEVOPS_ENGINEER_PROFESSIONAL:
    "https://images.credly.com/images/bd31ef42-d460-493e-8503-39592aaf0458/image.png",
  SOLUTIONS_ARCHITECT_PROFESSIONAL:
    "https://images.credly.com/images/2d84e428-9078-49b6-a804-13c15383d0de/image.png",
  SECURITY_SPECIALTY:
    "https://images.credly.com/images/53acdae5-d69f-4dda-b650-d02ed7a50dd7/image.png",
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const getLevel = (cert) => normalizeText(cert?.level);

const getBadgeImage = (cert) => {
  if (cert?.inProgress) return IN_PROGRESS_BADGE;
  const text = normalizeText(`${cert?.id || ""} ${cert?.title || ""}`);

  if (text.includes("cloud practitioner") || text.includes("clf")) {
    return AWS_BADGES.CLOUD_PRACTITIONER;
  }

  if (
    text.includes("solutions architect") &&
    (text.includes("professional") || text.includes("sap"))
  ) {
    return AWS_BADGES.SOLUTIONS_ARCHITECT_PROFESSIONAL;
  }

  if (text.includes("solutions architect") || text.includes("saa")) {
    return AWS_BADGES.SOLUTIONS_ARCHITECT_ASSOCIATE;
  }

  if (text.includes("developer") || text.includes("dva")) {
    return AWS_BADGES.DEVELOPER_ASSOCIATE;
  }

  if (text.includes("devops") || text.includes("dop")) {
    return AWS_BADGES.DEVOPS_ENGINEER_PROFESSIONAL;
  }

  if (text.includes("security") || text.includes("scs")) {
    return AWS_BADGES.SECURITY_SPECIALTY;
  }

  return cert?.badgeUrl || cert?.logo || cert?.image || cert?.badge || PLACEHOLDER;
};

const getVerifyUrl = (cert) =>
  cert?.link ||
  cert?.verifyLink ||
  cert?.validateLink ||
  cert?.credentialUrl ||
  cert?.credlyUrl ||
  cert?.url ||
  cert?.verificationUrl ||
  "";

const isDeveloperCert = (cert) => {
  const text = normalizeText(`${cert?.id || ""} ${cert?.title || ""}`);
  return text.includes("developer") || text.includes("dva");
};

export default function Certifications() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [hoveredCard, setHoveredCard] = useState(null);
  const [expandedSkills, setExpandedSkills] = useState({});
  const [terminalInput, setTerminalInput] = useState("");

  const terminalOutputRef = useRef(null);

  const certificationRows = usePublicContent('certification', []);
  const homeRows = usePublicContent('home', HOME_FALLBACK_ROWS);
  const aboutRows = usePublicContent('about', []);
  const companyRows = usePublicContent('company', []);
  const projectRows = usePublicContent('project', []);
  const skillRows = usePublicContent('skill', []);
  const home = homeRows[0]?.data || {};
  const about = aboutRows[0]?.data || {};
  const methodica = companyRows.find(row => row.slug === 'methodica-technology');
  const certifications = useMemo(() => certificationRows.map(row => row.data ? {
    ...row.data, title: row.title, id: row.data.id || row.slug,
    year: row.data.year || row.data.issuedAt?.slice(0, 4),
    badge: row.data.badge || row.data.image,
    inProgress: Boolean(row.data.inProgress),
  } : row), [certificationRows]);

  const stats = useMemo(() => {
    const uniqueSkills = new Set(certifications.flatMap((cert) => cert.skills || []));

    return {
      total: certifications.length,
      completed: certifications.filter((cert) => !cert.inProgress).length,
      professional: certifications.filter((cert) => getLevel(cert) === "professional")
        .length,
      associate: certifications.filter((cert) => getLevel(cert) === "associate").length,
      fundamental: certifications.filter((cert) => {
        const level = getLevel(cert);
        return level === "fundamental" || level === "foundational";
      }).length,
      skills: uniqueSkills.size,
      inProgress: certifications.filter((cert) => cert.inProgress).length,
    };
  }, [certifications]);

  const filteredCerts = certifications.filter((cert) => {
    const level = getLevel(cert);

    if (activeFilter === "all") return true;

    if (activeFilter === "fundamental") {
      return level === "fundamental" || level === "foundational";
    }

    return level === activeFilter;
  });

  const timelineItems = certifications
    .filter((cert) => !cert.inProgress && cert.year)
    .sort((a, b) => String(a.year).localeCompare(String(b.year)));

  const featuredSkills = skillRows.filter(row => row.data?.featured).slice(0, 8).map((row, index) => ({
    name: row.title,
    icon: <Code size={20} />,
    color: ['#10b981', '#ff9900', '#3b82f6', '#f97316', '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4'][index],
  }));

  const [terminalHistory, setTerminalHistory] = useState([
    { type: "system", text: "✨ Terminal Interactiva de Albert Sanfle" },
    { type: "system", text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    { type: "info", text: "Comandos disponibles:" },
    { type: "info", text: "  whoami   - Información sobre Albert Sanfle" },
    { type: "info", text: "  list     - Ver certificaciones" },
    { type: "info", text: "  stats    - Ver estadísticas" },
    { type: "info", text: "  skills   - Ver habilidades técnicas" },
    { type: "info", text: "  social   - Redes y contacto" },
    { type: "info", text: "  projects - Proyectos y empresa" },
    { type: "info", text: "  help     - Mostrar ayuda" },
    { type: "info", text: "  clear    - Limpiar terminal" },
    { type: "system", text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    { type: "info", text: "Prueba escribiendo: whoami" },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 550);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (terminalOutputRef.current) {
      terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  const toggleSkills = (certKey) => {
    setExpandedSkills((prev) => ({
      ...prev,
      [certKey]: !prev[certKey],
    }));
  };

  const clearTerminal = () => {
    setTerminalHistory([
      { type: "system", text: "✨ Terminal Interactiva de Albert Sanfle" },
      { type: "info", text: "Terminal limpiada. Escribe 'help' para ver los comandos." },
      { type: "info", text: "Prueba escribiendo: whoami" },
    ]);
  };

  const handleSuggestionClick = (cmd) => {
    setTerminalInput(cmd);
    document.querySelector(".terminal-input")?.focus();
  };

  const handleTerminalSubmit = (event) => {
    event.preventDefault();

    const command = terminalInput.trim().toLowerCase();
    if (!command) return;

    const newHistory = [
      ...terminalHistory,
      { type: "command", text: `$ ${terminalInput}` },
    ];

    switch (command) {
      case "whoami":
        newHistory.push(
          { type: "system", text: "\nSobre mí\n" },
          { type: "success", text: `  Nombre: ${home.name || 'Sin publicar'}` },
          { type: "success", text: `  Rol: ${home.title || 'Sin publicar'}` },
          { type: "success", text: `  Ubicación: ${about.location || home.footerLocation || 'Sin publicar'}` },
          { type: "info", text: `  ${about.lead || home.summary || 'Sin descripción publicada.'}` },
          { type: "system", text: "" }
        );
        break;

      case "social":
        newHistory.push(
          { type: "system", text: "\nRedes Sociales y Contacto\n" },
          ...[['Instagram', home.instagram], ['YouTube', home.youtube], ['LinkedIn', home.linkedin], ['GitHub', home.github], ['Empresa', methodica?.data?.instagram]].filter(([,url]) => url).map(([label,url]) => ({ type: 'success', text: `  ${label}: ${url}` })),
          { type: "system", text: "" }
        );
        break;

      case "projects":
        newHistory.push(
          { type: "system", text: "\nProyectos y Empresa\n" },
          ...(methodica ? [{ type: 'success', text: `  Empresa: ${methodica.title}` }] : []),
          ...(projectRows.length ? projectRows.map(row => ({ type: 'info', text: `  ${row.title}` })) : [{ type: 'info', text: '  Aún no hay proyectos publicados.' }]),
          { type: "system", text: "" }
        );
        break;

      case "list":
        newHistory.push({ type: "system", text: "\n📋 Certificaciones AWS:\n" });

        certifications.forEach((cert, index) => {
          const status = cert.inProgress ? "(En progreso)" : "(Completada)";

          newHistory.push({
            type: cert.inProgress ? "info" : "success",
            text: `  ${index + 1}. ${cert.title} ${status} - ${cert.year || "—"}`,
          });
        });

        newHistory.push({ type: "system", text: "" });
        break;

      case "stats":
        newHistory.push(
          { type: "system", text: "\n📊 Estadísticas de Certificaciones:\n" },
          { type: "info", text: `  Total: ${stats.total}` },
          { type: "info", text: `  Professional: ${stats.professional}` },
          { type: "info", text: `  Associate: ${stats.associate}` },
          { type: "info", text: `  Fundamental/Foundational: ${stats.fundamental}` },
          { type: "info", text: `  Habilidades técnicas: ${stats.skills}+` },
          { type: "system", text: "" }
        );
        break;

      case "skills":
        newHistory.push(
          { type: "system", text: "\nHabilidades Técnicas:\n" },
          { type: "info", text: skillRows.length ? `  ${skillRows.map(row => row.title).join(', ')}` : '  Aún no hay habilidades publicadas.' },
          { type: "system", text: "" }
        );
        break;

      case "help":
        newHistory.push(
          { type: "system", text: "\n💡 Comandos Disponibles:\n" },
          { type: "info", text: "  whoami   - Información completa sobre Albert Sanfle" },
          { type: "info", text: "  list     - Listar certificaciones" },
          { type: "info", text: "  stats    - Ver estadísticas" },
          { type: "info", text: "  skills   - Ver habilidades técnicas" },
          { type: "info", text: "  social   - Redes sociales y contacto" },
          { type: "info", text: "  projects - Proyectos y empresa" },
          { type: "info", text: "  clear    - Limpiar terminal" },
          { type: "system", text: "" }
        );
        break;

      case "clear":
        clearTerminal();
        setTerminalInput("");
        return;

      default:
        newHistory.push(
          { type: "error", text: `❌ Comando no reconocido: '${command}'` },
          { type: "info", text: "Escribe 'help' para ver los comandos disponibles." }
        );
    }

    setTerminalHistory(newHistory);
    setTerminalInput("");
  };

  if (loading) {
    return (
      <section className="certifications-section">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Cargando certificaciones...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="certifications-section" id="certifications">
      <header className="cert-hero">
        <div className="cert-hero-copy">
          <span className="cert-hero-kicker">Certificaciones profesionales</span>

          <h2 className="cert-hero-title">AWS Certifications</h2>

          <p className="cert-hero-text">
            Credenciales que respaldan mi experiencia en arquitectura cloud,
            desarrollo serverless, automatización y prácticas DevOps en AWS.
            Cada certificación refleja conocimiento aplicado a proyectos reales.
          </p>

          <div className="cert-hero-tags">
            <span>Arquitectura Cloud</span>
            <span>Serverless</span>
            <span>DevOps</span>
            <span>Automation</span>
          </div>
        </div>
      </header>

      <section className="cert-stats-modern" aria-label="Estadísticas de certificaciones">
        <article className="cert-stat-modern">
          <div className="cert-stat-icon">
            <Award size={22} />
          </div>

          <div className="cert-stat-body">
            <strong>{stats.total}</strong>
            <span>Certificaciones obtenidas y en progreso</span>
          </div>
        </article>

        <article className="cert-stat-modern">
          <div className="cert-stat-icon">
            <Rocket size={22} />
          </div>

          <div className="cert-stat-body">
            <strong>{stats.professional}</strong>
            <span>Registros de nivel Professional</span>
          </div>
        </article>

        <article className="cert-stat-modern">
          <div className="cert-stat-icon">
            <TrendingUp size={22} />
          </div>

          <div className="cert-stat-body">
            <strong>{stats.skills}</strong>
            <span>Habilidades técnicas cubiertas</span>
          </div>
        </article>

        <article className="cert-stat-modern">
          <div className="cert-stat-icon">
            <GraduationCap size={22} />
          </div>

          <div className="cert-stat-body">
            <strong>{stats.completed}</strong>
            <span>Credenciales completadas</span>
          </div>
        </article>
      </section>

      <nav className="certifications-filters" aria-label="Filtrar certificaciones">
        <button
          type="button"
          className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          <Sparkles size={18} />
          Todas ({stats.total})
        </button>

        <button
          type="button"
          className={`filter-btn ${activeFilter === "professional" ? "active" : ""}`}
          onClick={() => setActiveFilter("professional")}
        >
          <Rocket size={18} />
          Professional ({stats.professional})
        </button>

        <button
          type="button"
          className={`filter-btn ${activeFilter === "associate" ? "active" : ""}`}
          onClick={() => setActiveFilter("associate")}
        >
          <Layers size={18} />
          Associate ({stats.associate})
        </button>

        <button
          type="button"
          className={`filter-btn ${activeFilter === "fundamental" ? "active" : ""}`}
          onClick={() => setActiveFilter("fundamental")}
        >
          <BookOpen size={18} />
          Fundamental ({stats.fundamental})
        </button>
      </nav>

      <section className="featured-skills-section" aria-labelledby="skills-heading">
        <header className="skills-header">
          <h3 id="skills-heading">Habilidades Técnicas Destacadas</h3>
          <p>
            Tecnologías, servicios y herramientas que forman parte de mi stack
            profesional.
          </p>
        </header>

        <div className="skills-grid">
          {featuredSkills.map((skill, index) => (
            <div
              key={`${skill.name}-${index}`}
              className="skill-item"
              style={{ "--skill-color": skill.color }}
            >
              <div className="skill-icon" style={{ color: skill.color }}>
                {skill.icon}
              </div>

              <span className="skill-name">{skill.name}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="certifications-grid">
        {filteredCerts.map((cert, index) => {
          const certKey = cert.id || cert.title || String(index);
          const levelLower = getLevel(cert) || "associate";
          const isExpanded = Boolean(expandedSkills[certKey]);

          const verifyUrl = getVerifyUrl(cert);
          const canVerify = Boolean(verifyUrl) && !cert.inProgress;
          const developer = isDeveloperCert(cert);
          const isHovered = hoveredCard === index;

          return (
            <article
              key={certKey}
              className={`cert-card ${cert.inProgress ? "in-progress" : ""} level-${levelLower} ${
                isHovered ? "is-hovered" : ""
              }`}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="cert-badge-container">
                <div className="cert-badge-glow" />

                <img
                  className="cert-badge"
                  src={getBadgeImage(cert)}
                  alt={`${cert.title} badge`}
                  onError={(event) => {
                    if (!event.currentTarget.src.startsWith("data:image")) {
                      event.currentTarget.src = PLACEHOLDER;
                    }
                  }}
                  loading="lazy"
                />

                {cert.inProgress ? (
                  <div className="progress-indicator">
                    <Clock size={16} />
                    <span>En progreso</span>
                  </div>
                ) : (
                  <div className={`level-badge level-${levelLower}`}>
                    <Award size={14} />
                    <span>{cert.level || "Associate"} Level</span>
                  </div>
                )}
              </div>

              <div className="cert-content">
                <header className="cert-header">
                  <h3 className="cert-title">{cert.title}</h3>

                  <div className="cert-issuer">
                    <Cloud size={18} />
                    <span>{cert.issuer || cert.issuingOrganization || 'Entidad emisora no registrada'}</span>
                    <Star size={14} className="cert-star" />
                  </div>
                </header>

                <div className="cert-meta">
                  <div className="meta-item">
                    <Calendar size={18} />
                    <span>{cert.inProgress ? 'En preparación' : `Obtenida: ${cert.year || 'Sin fecha'}`}</span>
                  </div>

                  <div className="meta-item">
                    <Target size={18} />
                    <span>Enfoque: {cert.focus || 'No especificado'}</span>
                  </div>
                </div>

                <p className="cert-description">
                  {cert.description || 'Sin descripción publicada.'}
                </p>

                {cert.skills && cert.skills.length > 0 && (
                  <div className="cert-skills">
                    <div className="skills-title">
                      <Zap size={18} />
                      <span>Habilidades Técnicas:</span>
                    </div>

                    <div className="skills-tags">
                      {cert.skills
                        .slice(0, isExpanded ? cert.skills.length : 4)
                        .map((skill, skillIndex) => (
                          <span key={`${skill}-${skillIndex}`} className="skill-tag">
                            {skill}
                          </span>
                        ))}

                      {cert.skills.length > 4 && (
                        <button
                          type="button"
                          className="show-more-btn"
                          onClick={() => toggleSkills(certKey)}
                        >
                          {isExpanded ? "Ver menos" : `+${cert.skills.length - 4} más`}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {cert.highlights && cert.highlights.length > 0 && (
                  <ul className="cert-highlights">
                    {cert.highlights.map((highlight, highlightIndex) => (
                      <li key={`${highlight}-${highlightIndex}`}>
                        <CheckCircle size={16} />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <footer className="cert-footer">
                  <div className="cert-tags">
                    <span className="tag aws-tag">
                      <Cloud size={16} />
                      {cert.inProgress ? 'En preparación' : 'AWS Certified'}
                    </span>

                    {canVerify && <span className="tag verified-tag"><Shield size={16} />Verificar</span>}
                  </div>

                  <div className="cert-actions">
                    {canVerify ? (
                      <a
                        href={verifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`verify-btn ${developer ? "verify-btn--developer" : ""}`}
                        title="Abrir validación de credencial"
                      >
                        <ExternalLink size={18} />
                        <span>Validar credencial</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        className={`verify-btn verify-btn--disabled ${
                          developer ? "verify-btn--developer" : ""
                        }`}
                        disabled
                        title={
                          cert.inProgress
                            ? "Esta certificación está en progreso"
                            : "Falta el enlace de validación"
                        }
                      >
                        <ExternalLink size={18} />
                        <span>Validar credencial</span>
                      </button>
                    )}

                    {cert.downloadLink && (
                      <a href={cert.downloadLink} download className="download-btn">
                        <Download size={18} />
                        <span>PDF</span>
                      </a>
                    )}
                  </div>
                </footer>
              </div>
            </article>
          );
        })}
      </div>

      <section className="terminal-section" aria-labelledby="terminal-heading">
        <header className="terminal-header-info">
          <div className="terminal-icon">
            <TerminalIcon size={48} />
          </div>

          <h3 id="terminal-heading">Terminal Interactiva</h3>

          <p>
            Explora mi perfil profesional, certificaciones y proyectos usando
            comandos de terminal.
          </p>
        </header>

        <div className="terminal-container">
          <div className="terminal-header">
            <div className="terminal-buttons">
              <span className="terminal-button terminal-button-close" />
              <span className="terminal-button terminal-button-minimize" />
              <span className="terminal-button terminal-button-maximize" />
            </div>

            <div className="terminal-title">albertsanfle@aws-portfolio ~ %</div>

            <div className="terminal-actions">
              <button
                className="terminal-action-btn"
                onClick={clearTerminal}
                title="Limpiar terminal"
                aria-label="Limpiar terminal"
                type="button"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </div>
          </div>

          <div className="terminal-output" ref={terminalOutputRef} role="log" aria-live="polite">
            {terminalHistory.map((line, index) => (
              <div
                key={`${line.type}-${index}`}
                className={`terminal-line terminal-line--${line.type}`}
              >
                {line.text}
              </div>
            ))}
          </div>

          <form className="terminal-input-form" onSubmit={handleTerminalSubmit}>
            <div className="terminal-input-wrapper">
              <span className="terminal-prompt" aria-hidden="true">
                $
              </span>

              <input
                type="text"
                className="terminal-input"
                value={terminalInput}
                onChange={(event) => setTerminalInput(event.target.value)}
                placeholder="Escribe un comando..."
                autoComplete="off"
                spellCheck={false}
                aria-label="Comando de terminal"
              />

              <button type="submit" className="terminal-submit-btn" aria-label="Enviar comando">
                <Send size={18} />
              </button>
            </div>

            <div className="terminal-suggestions">
              <span className="terminal-suggestion-label">Prueba:</span>

              {["whoami", "list", "social"].map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  className="terminal-suggestion"
                  onClick={() => handleSuggestionClick(cmd)}
                >
                  {cmd}
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>

      <section className="journey-section" aria-labelledby="journey-heading">
        <header className="journey-header">
          <div className="journey-title-group">
            <Trophy size={32} className="journey-icon" />

            <div>
              <h3 id="journey-heading">Mi Trayectoria en AWS</h3>
              <p>
                Un viaje continuo de aprendizaje, práctica y crecimiento
                profesional.
              </p>
            </div>
          </div>
        </header>

        <div className="journey-timeline">
          {timelineItems.map((cert, index) => (
            <div key={`${cert.id || cert.title}-${index}`} className="timeline-item">
              <div className="timeline-marker">
                <div className="timeline-dot" />

                {index < timelineItems.length - 1 && <div className="timeline-line" />}
              </div>

              <div className="timeline-content">
                <span className="timeline-year">{cert.year}</span>
                <h4>{cert.title}</h4>
                <p className="timeline-level">{cert.level} Level</p>
              </div>
            </div>
          ))}
        </div>

        <div className="journey-stats">
          <div className="journey-stat">
            <Rocket size={24} />

            <div>
              <strong>{stats.total}</strong>
              <span>Certificaciones registradas</span>
            </div>
          </div>

          <div className="journey-stat">
            <TrendingUp size={24} />

            <div>
              <strong>{stats.inProgress}</strong>
              <span>En progreso actualmente</span>
            </div>
          </div>

          {stats.inProgress > 0 && <div className="journey-stat">
            <Target size={24} />
            <div>
              <strong>En preparación</strong>
              <span>{certifications.find(cert => cert.inProgress)?.title}</span>
            </div>
          </div>}
        </div>
      </section>
    </section>
  );
}
