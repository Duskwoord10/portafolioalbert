"use client"

import { useState, useEffect, useRef } from "react"
import { CERTIFICATIONS, PROFILE, LINKS } from "../data.js"
import "./Certifications.css"

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
  AlertCircle,
  TrendingUp,
  Star,
  ChevronRight,
  GraduationCap,
  Code,
  Server,
  TerminalIcon,
  Shield,
  Database,
  Trophy,
  Send,
} from "lucide-react"

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop stopColor="#2563eb" offset="0"/>
      <stop stopColor="#06b6d4" offset="1"/>
    </linearGradient>
  </defs>
  <rect width="140" height="140" rx="25" fill="url(#g)"/>
  <text x="50%" y="50%" textAnchor="middle" fontFamily="Arial" fontSize="16" fontWeight="bold" fill="white" dy=".3em">AWS</text>
</svg>
`)

const getVerifyUrl = (cert) => {
  return (
    cert?.link ||
    cert?.verifyLink ||
    cert?.validateLink ||
    cert?.credentialUrl ||
    cert?.credlyUrl ||
    cert?.url ||
    cert?.verificationUrl ||
    ""
  )
}

const isDeveloperCert = (cert) => {
  const t = String(cert?.title || "").toLowerCase()
  const id = String(cert?.id || "").toUpperCase()
  return t.includes("developer") || id.startsWith("DVA") || id.includes("DEVELOPER")
}

export default function Certifications() {
  const [activeFilter, setActiveFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [expandedSkills, setExpandedSkills] = useState({})

  const [terminalInput, setTerminalInput] = useState("")
  const [terminalHistory, setTerminalHistory] = useState([
    { type: "system", text: "✨ Terminal Interactiva de Albert Sanfle" },
    { type: "system", text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    { type: "info", text: "👋 ¡Bienvenido! Comandos disponibles:" },
    { type: "info", text: "  • whoami      - Información sobre Albert Sanfle" },
    { type: "info", text: "  • list        - Ver todas las certificaciones" },
    { type: "info", text: "  • stats       - Ver estadísticas" },
    { type: "info", text: "  • skills      - Ver habilidades técnicas" },
    { type: "info", text: "  • social      - Ver redes sociales y contacto" },
    { type: "info", text: "  • projects    - Ver proyectos y empresa" },
    { type: "info", text: "  • help        - Mostrar ayuda" },
    { type: "info", text: "  • clear       - Limpiar terminal" },
    { type: "system", text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    { type: "info", text: "💡 Prueba escribiendo: whoami" },
  ])
  const terminalOutputRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!CERTIFICATIONS || !Array.isArray(CERTIFICATIONS)) {
        setError("No se encontraron certificaciones o el formato es incorrecto.")
      }
      setLoading(false)
    }, 700)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (terminalOutputRef.current) {
      terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight
    }
  }, [terminalHistory])

  const certifications = Array.isArray(CERTIFICATIONS) ? CERTIFICATIONS : []

  const filteredCerts = certifications.filter((cert) => {
    if (activeFilter === "all") return true
    if (!cert.level) return false
    return String(cert.level).toLowerCase() === activeFilter
  })

  const stats = {
    total: certifications.length,
    professional: certifications.filter((c) => c.level === "Professional").length,
    associate: certifications.filter((c) => c.level === "Associate").length,
    fundamental: certifications.filter((c) => c.level === "Fundamental").length,
    skills: [...new Set(certifications.flatMap((c) => c.skills || []))].length,
  }

  const featuredSkills = [
    { name: "DevOps", icon: <TerminalIcon size={20} />, color: "#10b981" },
    { name: "AWS Cloud", icon: <Cloud size={20} />, color: "#ff9900" },
    { name: "CI/CD", icon: <Code size={20} />, color: "#3b82f6" },
    { name: "Linux", icon: <Server size={20} />, color: "#f97316" },
    { name: "Node.js", icon: <Code size={20} />, color: "#22c55e" },
    { name: "Security", icon: <Shield size={20} />, color: "#ef4444" },
    { name: "Databases", icon: <Database size={20} />, color: "#8b5cf6" },
    { name: "SRE", icon: <Server size={20} />, color: "#06b6d4" },
  ]

  const toggleSkills = (certKey) => {
    setExpandedSkills((prev) => ({
      ...prev,
      [certKey]: !prev[certKey],
    }))
  }

  const handleTerminalSubmit = (e) => {
    e.preventDefault()
    const command = terminalInput.trim().toLowerCase()

    if (!command) return

    const newHistory = [...terminalHistory, { type: "command", text: `$ ${terminalInput}` }]

    switch (command) {
      case "whoami":
        newHistory.push(
          { type: "system", text: "\n👨‍💻 Sobre Albert Sanfle\n" },
          { type: "success", text: `  Nombre: ${PROFILE.name}` },
          { type: "success", text: `  Edad: ${PROFILE.age} años` },
          { type: "success", text: `  Rol: ${PROFILE.roleLine}` },
          { type: "success", text: `  Empresa: ${PROFILE.company}` },
          { type: "success", text: `  Ubicación: ${PROFILE.location}` },
          { type: "success", text: `  Canal YouTube: Methodica Talks` },
          { type: "system", text: "\n📝 Descripción:\n" },
          { type: "info", text: "  DevOps Engineer enfocado en AWS y Linux." },
          {
            type: "info",
            text: "  Certificado AWS Developer Associate (DVA) y AWS Solutions Architect Associate (SAA).",
          },
          { type: "info", text: "  Trabajo con arquitecturas serverless/event-driven y operación en producción." },
          { type: "info", text: "  Especialista en Lambda, API Gateway, DynamoDB, S3, CloudFront, Route 53 y EC2." },
          { type: "info", text: "  Integración con Amazon Connect + Lex/Bedrock/Polly." },
          { type: "system", text: "\n🎯 Enfoque:\n" },
          { type: "success", text: "  • Automatización & CI/CD" },
          { type: "success", text: "  • Observabilidad & Monitoring" },
          { type: "success", text: "  • Confiabilidad & Incident Response" },
          { type: "system", text: "" },
        )
        break

      case "social":
        newHistory.push(
          { type: "system", text: "\n🌐 Redes Sociales y Contacto\n" },
          { type: "success", text: "  Instagram Personal: https://www.instagram.com/albertsanfle_07/" },
          { type: "success", text: "  Instagram Empresa: https://www.instagram.com/methodicatechandco/" },
          { type: "success", text: `  YouTube: ${LINKS.youtube}` },
          { type: "success", text: `  LinkedIn: ${LINKS.linkedin}` },
          { type: "success", text: `  Empresa: ${PROFILE.company}` },
          { type: "system", text: "" },
        )
        break

      case "projects":
        newHistory.push(
          { type: "system", text: "\n🚀 Proyectos y Empresa\n" },
          { type: "success", text: `  Empresa: ${PROFILE.company}` },
          { type: "info", text: "  Descripción: Empresa de tecnología enfocada en soluciones cloud y DevOps" },
          { type: "success", text: "  Instagram: https://www.instagram.com/methodicatechandco/" },
          { type: "system", text: "\n📺 Canal de YouTube:\n" },
          { type: "success", text: "  Canal: Methodica Talks" },
          { type: "success", text: `  URL: ${LINKS.youtube}` },
          { type: "info", text: "  Contenido: Tutoriales de AWS, DevOps y tecnología cloud" },
          { type: "system", text: "" },
        )
        break

      case "list":
        newHistory.push({ type: "system", text: "\n📋 Certificaciones AWS:\n" })
        certifications.forEach((cert, i) => {
          const status = cert.inProgress ? "(En progreso)" : "(Completada)"
          newHistory.push({
            type: cert.inProgress ? "info" : "success",
            text: `  ${i + 1}. ${cert.title} ${status} - ${cert.year}`,
          })
        })
        newHistory.push({ type: "system", text: "" })
        break

      case "stats":
        newHistory.push(
          { type: "system", text: "\n📊 Estadísticas de Certificaciones:\n" },
          { type: "info", text: `  Total: ${stats.total} certificaciones` },
          { type: "info", text: `  Professional: ${stats.professional}` },
          { type: "info", text: `  Associate: ${stats.associate}` },
          { type: "info", text: `  Fundamental: ${stats.fundamental}` },
          { type: "info", text: `  Habilidades técnicas: ${stats.skills}+` },
          { type: "system", text: "\n☁️ Tecnologías AWS:\n" },
          { type: "success", text: "  ✓ Lambda" },
          { type: "success", text: "  ✓ API Gateway" },
          { type: "success", text: "  ✓ DynamoDB" },
          { type: "success", text: "  ✓ S3" },
          { type: "success", text: "  ✓ CloudFront" },
          { type: "success", text: "  ✓ Route 53" },
          { type: "success", text: "  ✓ EC2" },
          { type: "success", text: "  ✓ RDS" },
          { type: "success", text: "  ✓ Amazon Connect" },
          { type: "success", text: "  ✓ Amazon Lex" },
          { type: "success", text: "  ✓ Amazon Bedrock" },
          { type: "success", text: "  ✓ Amazon Polly" },
          { type: "system", text: "" },
        )
        break

      case "skills":
        newHistory.push({ type: "system", text: "\n🚀 Habilidades Técnicas:\n" })

        newHistory.push({ type: "system", text: "\n☁️ Cloud Services:" })
        const cloudServices = ["Lambda", "API Gateway", "DynamoDB", "S3", "CloudFront", "Route 53", "EC2", "RDS"]
        cloudServices.forEach((tech) => {
          newHistory.push({ type: "success", text: `  ✓ ${tech}` })
        })

        newHistory.push({ type: "system", text: "\n🤖 AI & ML Services:" })
        const aiServices = ["Amazon Connect", "Amazon Lex", "Amazon Bedrock", "Amazon Polly"]
        aiServices.forEach((tech) => {
          newHistory.push({ type: "success", text: `  ✓ ${tech}` })
        })

        newHistory.push({ type: "system", text: "\n⚙️ DevOps & Automation:" })
        const devopsTools = [
          "CI/CD",
          "Infrastructure as Code",
          "Automation",
          "Observability",
          "Incident Response",
          "CloudFormation",
          "Terraform",
        ]
        devopsTools.forEach((tech) => {
          newHistory.push({ type: "success", text: `  ✓ ${tech}` })
        })

        newHistory.push({ type: "system", text: "\n🐧 Operating Systems:" })
        newHistory.push({ type: "success", text: "  ✓ Linux Administration" })
        newHistory.push({ type: "success", text: "  ✓ Shell Scripting" })

        newHistory.push({ type: "system", text: "" })
        break

      case "help":
        newHistory.push(
          { type: "system", text: "\n💡 Comandos Disponibles:\n" },
          { type: "info", text: "  whoami      - Información completa sobre Albert Sanfle" },
          { type: "info", text: "  list        - Listar todas las certificaciones" },
          { type: "info", text: "  stats       - Ver estadísticas y tecnologías" },
          { type: "info", text: "  skills      - Ver todas las habilidades técnicas" },
          { type: "info", text: "  social      - Ver redes sociales y contacto" },
          { type: "info", text: "  projects    - Ver proyectos y empresa" },
          { type: "info", text: "  help        - Mostrar esta ayuda" },
          { type: "info", text: "  clear       - Limpiar la terminal" },
          { type: "system", text: "" },
        )
        break

      case "clear":
        setTerminalHistory([
          { type: "system", text: "✨ Terminal Interactiva de Albert Sanfle" },
          { type: "info", text: "Terminal limpiada. Escribe 'help' para ver los comandos." },
          { type: "info", text: "💡 Prueba escribiendo: whoami" },
        ])
        setTerminalInput("")
        return

      default:
        newHistory.push(
          { type: "error", text: `❌ Comando no reconocido: '${command}'` },
          { type: "info", text: "Escribe 'help' para ver los comandos disponibles." },
        )
    }

    setTerminalHistory(newHistory)
    setTerminalInput("")
  }

  const renderLoading = () => (
    <section className="certifications-section">
      <div className="section-header">
        <span className="section-kicker">Credenciales</span>
        <h2 className="section-title">Certificaciones AWS</h2>
        <p className="section-subtitle">Cargando certificaciones...</p>
      </div>

      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando certificaciones...</p>
      </div>
    </section>
  )

  const renderError = () => (
    <section className="certifications-section">
      <div className="section-header">
        <span className="section-kicker" style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}>
          Error
        </span>
        <h2 className="section-title">Hubo un problema</h2>
        <p className="section-subtitle">No se pudieron cargar las certificaciones</p>
      </div>

      <div className="error-container">
        <AlertCircle size={64} />
        <h3>Error al cargar datos</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Reintentar
          <ChevronRight size={16} />
        </button>
      </div>
    </section>
  )

  if (loading) return renderLoading()
  if (error) return renderError()

  return (
    <section className="certifications-section">
      <div className="section-header">
        <span className="section-kicker">Certificaciones Profesionales</span>
        <h2 className="section-title">AWS Certifications</h2>
        <p className="section-subtitle">
          Badges y enfoque práctico en arquitectura cloud, desarrollo y DevOps. Validación oficial de habilidades en
          Amazon Web Services.
        </p>
      </div>

      <div className="certifications-stats">
        <div className="stats-card">
          <div className="stats-icon">
            <Award size={28} />
          </div>
          <div className="stats-content">
            <h3>{stats.total}</h3>
            <p>Certificaciones Totales</p>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-icon">
            <Rocket size={28} />
          </div>
          <div className="stats-content">
            <h3>{stats.professional}</h3>
            <p>Nivel Professional</p>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-icon">
            <TrendingUp size={28} />
          </div>
          <div className="stats-content">
            <h3>{stats.skills}+</h3>
            <p>Habilidades Técnicas</p>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-icon">
            <GraduationCap size={28} />
          </div>
          <div className="stats-content">
            <h3>100%</h3>
            <p>Cloud Focused</p>
          </div>
        </div>
      </div>

      <div className="certifications-filters">
        <button
          className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          <Sparkles size={18} />
          Todas ({stats.total})
        </button>

        <button
          className={`filter-btn ${activeFilter === "professional" ? "active" : ""}`}
          onClick={() => setActiveFilter("professional")}
        >
          <Rocket size={18} />
          Professional ({stats.professional})
        </button>

        <button
          className={`filter-btn ${activeFilter === "associate" ? "active" : ""}`}
          onClick={() => setActiveFilter("associate")}
        >
          <Layers size={18} />
          Associate ({stats.associate})
        </button>

        <button
          className={`filter-btn ${activeFilter === "fundamental" ? "active" : ""}`}
          onClick={() => setActiveFilter("fundamental")}
        >
          <BookOpen size={18} />
          Fundamental ({stats.fundamental})
        </button>
      </div>

      <div className="featured-skills-section">
        <div className="skills-header">
          <h3>Habilidades Técnicas Destacadas</h3>
          <p>Tecnologías y herramientas que domino</p>
        </div>

        <div className="skills-grid">
          {featuredSkills.map((skill, index) => (
            <div key={index} className="skill-item" style={{ "--skill-color": skill.color }}>
              <div className="skill-icon" style={{ color: skill.color }}>
                {skill.icon}
              </div>
              <span className="skill-name">{skill.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="certifications-grid">
        {filteredCerts.map((cert, index) => {
          const certKey = cert.id || cert.title || String(index)
          const levelLower = cert.level ? String(cert.level).toLowerCase() : "associate"
          const isExpanded = !!expandedSkills[certKey]

          const verifyUrl = getVerifyUrl(cert)
          const canVerify = Boolean(verifyUrl) && !cert.inProgress
          const developer = isDeveloperCert(cert)

          return (
            <div
              key={certKey}
              className={`cert-card ${cert.inProgress ? "in-progress" : ""} level-${levelLower}`}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="cert-badge-container">
                <img
                  className="cert-badge"
                  src={cert.badge || PLACEHOLDER}
                  alt={`${cert.title} badge`}
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER
                  }}
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
                <div className="cert-header">
                  <h3 className="cert-title">{cert.title}</h3>
                  <div className="cert-issuer">
                    <span>Amazon Web Services</span>
                    <Star size={14} style={{ marginLeft: "auto", color: "#fbbf24" }} />
                  </div>
                </div>

                <div className="cert-meta">
                  <div className="meta-item">
                    <Calendar size={18} />
                    <span>Obtenida: {cert.year || "—"}</span>
                  </div>
                  <div className="meta-item">
                    <Target size={18} />
                    <span>Enfoque: {cert.focus || "Cloud"}</span>
                  </div>
                </div>

                <p className="cert-description">
                  {cert.description || "Certificación AWS especializada en arquitectura cloud."}
                </p>

                {cert.skills && cert.skills.length > 0 && (
                  <div className="cert-skills">
                    <div className="skills-title">
                      <Zap size={18} />
                      <span>Habilidades Técnicas:</span>
                    </div>

                    <div className="skills-tags">
                      {cert.skills.slice(0, isExpanded ? cert.skills.length : 4).map((skill, skillIndex) => (
                        <span key={skillIndex} className="skill-tag">
                          {skill}
                        </span>
                      ))}

                      {cert.skills.length > 4 && (
                        <button className="show-more-btn" onClick={() => toggleSkills(certKey)}>
                          {isExpanded ? "Ver menos" : `+${cert.skills.length - 4} más`}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {cert.highlights && cert.highlights.length > 0 && (
                  <ul className="cert-highlights">
                    {cert.highlights.map((highlight, highlightIndex) => (
                      <li key={highlightIndex}>
                        <CheckCircle size={16} />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="cert-footer">
                  <div className="cert-tags">
                    <span className="tag aws-tag">
                      <Cloud size={16} />
                      AWS Certified
                    </span>
                    <span className="tag verified-tag">
                      <Shield size={16} />
                      Verificado
                    </span>
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
                        className={`verify-btn verify-btn--disabled ${developer ? "verify-btn--developer" : ""}`}
                        disabled
                        title={
                          cert.inProgress
                            ? "Esta certificación está en progreso"
                            : "Falta el enlace de validación. Agrega 'link' en data.js"
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
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="terminal-section">
        <div className="terminal-header-info">
          <div className="terminal-icon">
            <TerminalIcon size={48} />
          </div>
          <h3>Terminal Interactiva</h3>
          <p>Explora mi perfil profesional, certificaciones y proyectos usando comandos de terminal</p>
        </div>

        <div className="terminal-container">
          <div className="terminal-header">
            <div className="terminal-buttons">
              <span className="terminal-button terminal-button-close"></span>
              <span className="terminal-button terminal-button-minimize"></span>
              <span className="terminal-button terminal-button-maximize"></span>
            </div>
            <div className="terminal-title">albertsanfle@aws-portfolio ~ %</div>
            <div className="terminal-actions">
              <button
                className="terminal-action-btn"
                onClick={() => {
                  setTerminalHistory([
                    { type: "system", text: "✨ Terminal Interactiva de Albert Sanfle" },
                    { type: "info", text: "Terminal limpiada. Escribe 'help' para ver los comandos." },
                    { type: "info", text: "💡 Prueba escribiendo: whoami" },
                  ])
                }}
                title="Limpiar terminal"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </div>
          </div>

          <div className="terminal-output" ref={terminalOutputRef}>
            {terminalHistory.map((line, index) => (
              <div key={index} className={`terminal-line terminal-line--${line.type}`}>
                {line.text}
              </div>
            ))}
          </div>

          <form className="terminal-input-form" onSubmit={handleTerminalSubmit}>
            <div className="terminal-input-wrapper">
              <span className="terminal-prompt">$</span>
              <input
                type="text"
                className="terminal-input"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Escribe un comando..."
                autoFocus
              />
              <button type="submit" className="terminal-submit-btn">
                <Send size={18} />
              </button>
            </div>
          </form>

          <div className="terminal-suggestions">
            <span className="terminal-suggestion-label">Prueba:</span>
            <button
              className="terminal-suggestion-btn"
              onClick={() => {
                setTerminalInput("whoami")
                document.querySelector(".terminal-input")?.focus()
              }}
            >
              whoami
            </button>
            <button
              className="terminal-suggestion-btn"
              onClick={() => {
                setTerminalInput("list")
                document.querySelector(".terminal-input")?.focus()
              }}
            >
              list
            </button>
            <button
              className="terminal-suggestion-btn"
              onClick={() => {
                setTerminalInput("social")
                document.querySelector(".terminal-input")?.focus()
              }}
            >
              social
            </button>
          </div>
        </div>
      </div>

      <div className="journey-section">
        <div className="journey-header">
          <div className="journey-title-group">
            <Trophy size={32} className="journey-icon" />
            <div>
              <h3>Mi Trayectoria en AWS</h3>
              <p>Un viaje continuo de aprendizaje y crecimiento profesional</p>
            </div>
          </div>
        </div>

        <div className="journey-timeline">
          {certifications
            .filter((cert) => !cert.inProgress && cert.year)
            .sort((a, b) => (a.year > b.year ? 1 : -1))
            .map((cert, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-marker">
                  <div className="timeline-dot"></div>
                  {index < certifications.filter((c) => !c.inProgress && c.year).length - 1 && (
                    <div className="timeline-line"></div>
                  )}
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
              <span>Certificaciones completadas</span>
            </div>
          </div>
          <div className="journey-stat">
            <TrendingUp size={24} />
            <div>
              <strong>{certifications.filter((c) => c.inProgress).length}</strong>
              <span>En progreso actualmente</span>
            </div>
          </div>
          <div className="journey-stat">
            <Target size={24} />
            <div>
              <strong>Siguiente meta</strong>
              <span>AWS Specialty Certifications</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
