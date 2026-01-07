import React, { useState, useEffect, useMemo, useRef } from "react";
import { PROFILE } from "../data.js";
import { Section, Card } from "./ui.jsx";
import "./About.css";

import {
  Cloud,
  Shield,
  Zap,
  Code,
  BarChart,
  Users,
  Target,
  Server,
  Cpu,
  Database,
  GitPullRequest,
  Activity,
  MessageSquare,
  Calendar,
  Layers,
  CheckCircle,
  ChevronRight,
  Sparkles,
  Star,
  Check,
  ThumbsUp,
  Search,
  Copy,
  Terminal,
  Play,
  ExternalLink,
  FolderGit2,
  DatabaseZap,
  GitBranch,
  Container,
  Lock,
  User,
  Briefcase,
  Mail,
  Globe,
  Heart,
} from "lucide-react";

// Terminal interactiva mejorada
function InteractiveTerminal() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  // Comandos personalizados
  const commands = {
    "whois albert": {
      response: `👨‍💻 Albert Sánchez - Cloud & DevOps Engineer

📍 ${PROFILE.location}
🎓 Estudiante de Ingeniería de Software
🏢 Fundador de ${PROFILE.company}
🚀 ${new Date().getFullYear() - 2018}+ años en Cloud

📌 Especializado en:
  • AWS Architecture
  • Kubernetes & Docker
  • Terraform & CI/CD
  • Cloud Security
  • Serverless Computing

💡 Filosofía: Automatización, Seguridad y Excelencia Operacional`,
      color: "#3b82f6"
    },
    "help": {
      response: `🛠️ Comandos disponibles:

• whois albert      - Información sobre mí
• proyectos         - Mis proyectos destacados
• stack             - Stack tecnológico
• experiencia       - Años de experiencia
• contacto          - Información de contacto
• skills            - Mis habilidades
• aws               - Comandos de AWS
• terraform         - Comandos de Terraform
• docker            - Comandos de Docker
• clear             - Limpiar terminal
• help              - Mostrar esta ayuda`,
      color: "#8b5cf6"
    },
    "proyectos": {
      response: `🚀 Proyectos Destacados:

1. Arquitectura Multi-AZ AWS
   • Disponibilidad: 99.99%
   • Recuperación: < 15min
   • Ahorro: 35% costos

2. CI/CD Pipeline Enterprise
   • Deploy time: 3 min
   • Test coverage: 95%
   • MTTR: 5 min

3. Data Lake Serverless
   • Procesamiento: TB/día
   • Cost efficiency: 60%
   • Query time: < 2s`,
      color: "#10b981"
    },
    "stack": {
      response: `🛠️ Stack Tecnológico:

☁️ Cloud: AWS, Azure, Google Cloud
🐳 Containers: Docker, Kubernetes, EKS
⚡ DevOps: Terraform, Ansible, GitHub Actions
🔐 Security: IAM, KMS, WAF, Security Hub
💾 Databases: PostgreSQL, MongoDB, Redis, DynamoDB
📊 Monitoring: CloudWatch, Prometheus, Grafana
🚀 Languages: Python, JavaScript, TypeScript, Go`,
      color: "#f97316"
    },
    "experiencia": {
      response: `📅 Experiencia: ${new Date().getFullYear() - 2018}+ años

🏆 Logros:
• 50+ proyectos Cloud entregados
• 30+ clientes satisfechos
• 100% tasa de éxito
• Migraciones a AWS exitosas
• Implementación de DevOps

🔄 Evolución:
2018 - Inicio en Cloud Computing
2019 - Especialización en AWS
2020 - Certificaciones AWS
2021 - Kubernetes & Containers
2022 - DevOps & Automation
2023 - Arquitecturas Enterprise
2024 - Consultoría & Liderazgo`,
      color: "#ec4899"
    },
    "contacto": {
      response: `📞 Contacto:

📧 Email: ${PROFILE.email || "contacto@example.com"}
💼 LinkedIn: ${PROFILE.linkedin || "linkedin.com/in/albert"}
🌐 Website: ${PROFILE.website || "albertdev.com"}
📍 Ubicación: ${PROFILE.location}

💬 Disponible para:
• Consultoría Cloud
• Arquitectura AWS
• Implementación DevOps
• Migraciones a la nube
• Formación & Mentoring`,
      color: "#06b6d4"
    },
    "skills": {
      response: `🎯 Habilidades Técnicas:

🔹 AWS Architecture (95%)
  - EC2, S3, RDS, Lambda, VPC
  - Well-Architected Framework

🔹 DevOps & CI/CD (90%)
  - Docker, Kubernetes, Terraform
  - GitHub Actions, Jenkins

🔹 Cloud Security (88%)
  - IAM, KMS, WAF, Security Hub
  - Compliance & Auditing

🔹 Data & Analytics (85%)
  - Redshift, Glue, Athena
  - ETL Pipelines, Data Lakes`,
      color: "#8b5cf6"
    },
    "aws": {
      response: `☁️ Comandos AWS útiles:

# Ver identidad
$ aws sts get-caller-identity

# Listar buckets S3
$ aws s3 ls

# Describir instancias EC2
$ aws ec2 describe-instances

# Ver logs de CloudWatch
$ aws logs tail /aws/lambda/my-function

# Listar funciones Lambda
$ aws lambda list-functions

# Ver estado de servicios
$ aws health describe-events`,
      color: "#ff9900"
    },
    "terraform": {
      response: `🏗️ Comandos Terraform:

# Inicializar proyecto
$ terraform init

# Planificar cambios
$ terraform plan

# Aplicar cambios
$ terraform apply -auto-approve

# Mostrar estado
$ terraform show

# Destruir recursos
$ terraform destroy

# Formatear código
$ terraform fmt`,
      color: "#7b42bc"
    },
    "docker": {
      response: `🐳 Comandos Docker:

# Construir imagen
$ docker build -t mi-app .

# Listar contenedores
$ docker ps -a

# Ejecutar contenedor
$ docker run -d -p 3000:3000 mi-app

# Ver logs
$ docker logs [container-id]

# Limpiar recursos
$ docker system prune -a

# Docker Compose
$ docker-compose up -d`,
      color: "#2496ed"
    },
    "clear": {
      response: null,
      action: () => setHistory([])
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim().toLowerCase();
    setInput("");
    setIsProcessing(true);

    // Añadir comando al historial
    const newHistory = [...history, { type: 'input', text: cmd }];
    
    // Procesar comando después de un breve delay
    setTimeout(() => {
      if (commands[cmd]) {
        if (commands[cmd].action) {
          commands[cmd].action();
          setHistory([...newHistory, { 
            type: 'output', 
            text: "✅ Comando ejecutado", 
            color: "#10b981" 
          }]);
        } else {
          setHistory([...newHistory, { 
            type: 'output', 
            text: commands[cmd].response, 
            color: commands[cmd].color 
          }]);
        }
      } else {
        setHistory([...newHistory, { 
          type: 'output', 
          text: `❌ Comando no encontrado: "${cmd}"\nEscribe "help" para ver comandos disponibles.`, 
          color: "#ef4444" 
        }]);
      }
      setIsProcessing(false);
    }, 300);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
    }
  };

  // Auto scroll al final
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Focus en input al cargar
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleCopyAll = () => {
    const allText = history.map(h => 
      h.type === 'input' ? `$ ${h.text}` : h.text
    ).join('\n');
    navigator.clipboard.writeText(allText);
  };

  return (
    <Card className="terminal-card">
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
        </div>
        
        <div className="terminal-title">
          <Terminal size={18} />
          <span>Terminal Interactiva</span>
          <span className="cursor">▋</span>
        </div>

        <div className="terminal-actions">
          <button 
            className="action-btn"
            onClick={handleCopyAll}
            title="Copiar todo"
          >
            <Copy size={16} />
          </button>
          <button 
            className="action-btn"
            onClick={() => setHistory([])}
            title="Limpiar terminal"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="terminal-content">
        <div className="terminal-welcome">
          <p>✨ <strong>Terminal Interactiva de {PROFILE.name}</strong></p>
          <p>Escribe comandos como <code>whois albert</code>, <code>proyectos</code>, <code>stack</code> o <code>help</code></p>
          <p>Presiona <kbd>Ctrl</kbd> + <kbd>L</kbd> para limpiar • <kbd>↑</kbd> <kbd>↓</kbd> para navegar histórico</p>
        </div>

        <div className="terminal-output" ref={terminalRef}>
          {history.map((item, index) => (
            <div key={index} className={`terminal-line ${item.type}`}>
              {item.type === 'input' ? (
                <div className="input-line">
                  <span className="prompt">$</span>
                  <span className="command">{item.text}</span>
                </div>
              ) : (
                <pre style={{ color: item.color }}>{item.text}</pre>
              )}
            </div>
          ))}
          {isProcessing && (
            <div className="processing">
              <span className="spinner">⌛</span> Procesando...
            </div>
          )}
        </div>

        <form className="terminal-input-form" onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <span className="prompt">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Escribe un comando..."
              spellCheck="false"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
            />
            <button type="submit" className="submit-btn" disabled={isProcessing}>
              {isProcessing ? "..." : "▶"}
            </button>
          </div>
          <div className="input-hint">
            <span className="hint">💡 Prueba: <code>whois albert</code></span>
          </div>
        </form>

        <div className="quick-commands">
          <p>Comandos rápidos:</p>
          <div className="command-chips">
            {Object.keys(commands).slice(0, 6).map((cmd) => (
              <button
                key={cmd}
                className="command-chip"
                onClick={() => {
                  setInput(cmd);
                  inputRef.current.focus();
                }}
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function About() {
  const [yearsExperience, setYearsExperience] = useState(0);
  const [activeTab, setActiveTab] = useState("expertise");
  const [techQuery, setTechQuery] = useState("");

  useEffect(() => {
    const startYear = 2018;
    const currentYear = new Date().getFullYear();
    setYearsExperience(Math.max(0, currentYear - startYear));
  }, []);

  // Estadísticas con nueva paleta de colores
  const stats = [
    {
      icon: <Calendar size={20} />,
      value: `${yearsExperience}+`,
      label: "Años de experiencia",
      color: "#3b82f6"
    },
    { 
      icon: <Server size={20} />, 
      value: "50+", 
      label: "Proyectos Cloud",
      color: "#8b5cf6"
    },
    { 
      icon: <Users size={20} />, 
      value: "30+", 
      label: "Clientes satisfechos",
      color: "#10b981"
    },
    { 
      icon: <Heart size={20} />, 
      value: "100%", 
      label: "Satisfacción garantizada",
      color: "#ec4899"
    },
  ];

  // Áreas de expertise mejoradas
  const expertiseAreas = [
    {
      icon: <Cloud size={24} />,
      title: "Arquitectura AWS",
      description: "Diseño de soluciones escalables siguiendo el marco Well-Architected",
      level: 95,
      color: "#3b82f6",
      skills: ["VPC", "EC2", "S3", "RDS", "Lambda", "CloudFormation"],
      projects: ["Migraciones", "Multi-AZ", "Disaster Recovery"]
    },
    {
      icon: <GitBranch size={24} />,
      title: "DevOps & CI/CD",
      description: "Automatización de pipelines con enfoque en calidad y seguridad",
      level: 90,
      color: "#8b5cf6",
      skills: ["Docker", "Kubernetes", "GitHub Actions", "Terraform", "Ansible"],
      projects: ["Blue/Green", "Canary Deployments", "GitOps"]
    },
    {
      icon: <Shield size={24} />,
      title: "Seguridad Cloud",
      description: "Implementación de controles de seguridad desde el diseño",
      level: 88,
      color: "#10b981",
      skills: ["IAM", "KMS", "WAF", "Security Hub", "GuardDuty"],
      projects: ["Compliance", "Auditorías", "Pentesting"]
    },
    {
      icon: <Database size={24} />,
      title: "Data & Analytics",
      description: "Arquitecturas de datos escalables y pipelines ETL",
      level: 85,
      color: "#f97316",
      skills: ["Redshift", "Glue", "Athena", "Kinesis", "DynamoDB"],
      projects: ["Data Lakes", "Real-time", "Machine Learning"]
    },
  ];

  // Stack tecnológico completo con categorías
  const technologies = [
    { 
      category: "Cloud Providers", 
      items: ["AWS", "Azure", "Google Cloud", "Digital Ocean"],
      icon: <Cloud size={18} />
    },
    { 
      category: "Infrastructure as Code", 
      items: ["Terraform", "CloudFormation", "CDK", "Pulumi"],
      icon: <FolderGit2 size={18} />
    },
    { 
      category: "Containers & Orchestration", 
      items: ["Docker", "Kubernetes", "EKS", "Helm", "Istio"],
      icon: <Container size={18} />
    },
    { 
      category: "CI/CD & Automation", 
      items: ["GitHub Actions", "Jenkins", "GitLab CI", "ArgoCD", "Spinnaker"],
      icon: <GitPullRequest size={18} />
    },
    { 
      category: "Monitoring & Observability", 
      items: ["CloudWatch", "Prometheus", "Grafana", "Datadog", "New Relic"],
      icon: <Activity size={18} />
    },
    { 
      category: "Databases", 
      items: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "DynamoDB"],
      icon: <DatabaseZap size={18} />
    },
    { 
      category: "Programming Languages", 
      items: ["Python", "JavaScript", "TypeScript", "Go", "Bash"],
      icon: <Code size={18} />
    },
    { 
      category: "Security Tools", 
      items: ["AWS IAM", "Vault", "WAF", "Security Hub", "Prisma Cloud"],
      icon: <Lock size={18} />
    },
  ];

  // Filtrar tecnologías
  const filteredTech = useMemo(() => {
    const q = techQuery.trim().toLowerCase();
    if (!q) return technologies;

    return technologies
      .map((tech) => ({
        ...tech,
        items: tech.items.filter((item) => 
          item.toLowerCase().includes(q) || tech.category.toLowerCase().includes(q)
        )
      }))
      .filter((tech) => tech.items.length > 0);
  }, [techQuery]);

  // Proyectos destacados
  const featuredProjects = [
    {
      title: "Arquitectura Multi-AZ en AWS",
      description: "Diseño e implementación de arquitectura altamente disponible con recuperación ante desastres",
      icon: <Cloud size={24} />,
      metrics: [
        { label: "Disponibilidad", value: "99.99%" },
        { label: "Tiempo Recuperación", value: "< 15min" },
        { label: "Ahorro Costos", value: "35%" }
      ],
      color: "#3b82f6",
      tags: ["AWS", "Alta Disponibilidad", "Recuperación Desastres"]
    },
    {
      title: "Pipeline CI/CD Enterprise",
      description: "Pipeline automatizado con testing, security scanning y despliegue a múltiples ambientes",
      icon: <GitPullRequest size={24} />,
      metrics: [
        { label: "Tiempo Deploy", value: "3 min" },
        { label: "Cobertura Tests", value: "95%" },
        { label: "MTTR", value: "5 min" }
      ],
      color: "#8b5cf6",
      tags: ["GitOps", "Seguridad", "Automatización"]
    },
    {
      title: "Plataforma Data Lake Analytics",
      description: "Plataforma serverless para procesamiento y análisis de datos a gran escala",
      icon: <Database size={24} />,
      metrics: [
        { label: "Procesamiento", value: "TB/día" },
        { label: "Eficiencia Costos", value: "60%" },
        { label: "Tiempo Query", value: "< 2s" }
      ],
      color: "#10b981",
      tags: ["Serverless", "Big Data", "Analytics"]
    },
  ];

  // Metodología
  const methodology = [
    { 
      step: 1, 
      title: "Análisis & Discovery", 
      description: "Evaluación de requisitos, arquitectura existente y definición de KPIs",
      icon: <Target size={20} />,
      duration: "1-2 semanas"
    },
    { 
      step: 2, 
      title: "Diseño Arquitectura", 
      description: "Diseño de solución siguiendo principios Well-Architected y mejores prácticas",
      icon: <Layers size={20} />,
      duration: "1-3 semanas"
    },
    { 
      step: 3, 
      title: "Implementación", 
      description: "Desarrollo, configuración y automatización de la solución",
      icon: <Code size={20} />,
      duration: "2-6 semanas"
    },
    { 
      step: 4, 
      title: "Testing & Seguridad", 
      description: "Testing exhaustivo, validación de seguridad y auditoría de código",
      icon: <Shield size={20} />,
      duration: "1-2 semanas"
    },
    { 
      step: 5, 
      title: "Despliegue & Entrega", 
      description: "Despliegue, documentación y transferencia de conocimiento",
      icon: <Activity size={20} />,
      duration: "1 semana"
    },
    { 
      step: 6, 
      title: "Optimización & Soporte", 
      description: "Monitoreo, optimización continua y soporte post-implementación",
      icon: <BarChart size={20} />,
      duration: "Continuo"
    },
  ];

  // Beneficios
  const benefits = [
    { 
      icon: "⚡", 
      title: "Entrega Rápida", 
      description: "Metodologías ágiles con entregas incrementales cada 2 semanas"
    },
    { 
      icon: "🔒", 
      title: "Seguridad Primero", 
      description: "Seguridad integrada desde el diseño, cumplimiento de estándares"
    },
    { 
      icon: "📊", 
      title: "Proceso Transparente", 
      description: "Comunicación constante, reportes semanales y visibilidad completa"
    },
    { 
      icon: "🔄", 
      title: "Mejora Continua", 
      description: "Iteraciones basadas en métricas y retroalimentación"
    },
    { 
      icon: "💡", 
      title: "Guía Experta", 
      description: "Mentoría y transferencia de conocimiento durante todo el proyecto"
    },
    { 
      icon: "🎯", 
      title: "Enfoque en Resultados", 
      description: "Métricas de negocio y resultados medibles"
    },
  ];

  // Tab navigation
  const tabIndex = useMemo(() => {
    const tabs = ["expertise", "tech", "projects", "methodology"];
    return tabs.indexOf(activeTab);
  }, [activeTab]);

  return (
    <Section
      kicker="Perfil Profesional"
      title="Arquitecto Cloud & DevOps"
      subtitle="Especializado en construir soluciones cloud nativas, seguras y listas para producción con AWS, Kubernetes y DevOps modernos."
      id="about"
    >
      {/* Efectos de fondo */}
      <div className="about-background">
        <div className="gradient-sphere" />
        <div className="grid-pattern" />
      </div>

      {/* Sección de Estadísticas */}
      <div className="stats-section">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="stat-card"
            data-color={stat.color}
          >
            <div className="stat-icon-wrapper">
              {stat.icon}
            </div>
            <div className="stat-content">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
            <div className="stat-glow" />
          </div>
        ))}
      </div>

      {/* Tarjeta de Perfil Principal */}
      <Card className="profile-card-main">
        <div className="profile-header-main">
          <div className="profile-badge-main">
            <Sparkles size={16} />
            <span>Arquitecto Cloud • Ingeniero DevOps</span>
          </div>
          
          <div className="profile-intro">
            <h1 className="profile-name-main">{PROFILE.name}</h1>
            <div className="profile-tags">
              <span className="profile-tag">Certificado AWS</span>
              <span className="profile-tag">Kubernetes</span>
              <span className="profile-tag">Terraform</span>
              <span className="profile-tag">Seguridad Cloud</span>
            </div>
            
            <p className="profile-location">
              {PROFILE.location} • {PROFILE.roleLine} • {yearsExperience}+ años en Cloud
            </p>
          </div>
        </div>

        <div className="profile-content-main">
          <div className="profile-description-main">
            <p>
              <strong>Especialista en arquitecturas cloud modernas</strong> con un enfoque práctico en 
              <strong> AWS, Kubernetes y DevOps</strong>. Combino experiencia técnica profunda con 
              mejores prácticas de la industria para construir soluciones que son{" "}
              <strong>escalables, seguras y optimizadas para producción</strong>.
            </p>
            
            <p>
              Mi filosofía se basa en <strong>automatización, seguridad por diseño y excelencia operacional</strong>. 
              Cada solución está diseñada para ser mantenible, cost-efectiva y alineada con los objetivos de negocio.
            </p>
          </div>

          <div className="value-proposition-main">
            <div className="value-item">
              <Check size={18} />
              <span>Arquitecturas escalables y resilientes</span>
            </div>
            <div className="value-item">
              <Check size={18} />
              <span>Seguridad integrada desde el diseño</span>
            </div>
            <div className="value-item">
              <Check size={18} />
              <span>Automatización completa de procesos</span>
            </div>
          </div>

          {/* Terminal Interactiva */}
          <div className="terminal-section">
            <h3 className="section-title">
              <Terminal size={22} />
              Terminal Interactiva
            </h3>
            <p className="section-subtitle">
              Escribe comandos para conocer más sobre mí, mis proyectos y experiencia.
            </p>
            <InteractiveTerminal />
          </div>
        </div>
      </Card>

      {/* Navegación por Tabs */}
      <div className="tabs-navigation">
        <div 
          className="tabs-indicator"
          style={{ transform: `translateX(${tabIndex * 100}%)` }}
        />
        
        <button
          className={`tab-button ${activeTab === "expertise" ? "active" : ""}`}
          onClick={() => setActiveTab("expertise")}
        >
          <Cpu size={18} />
          <span>Especialidades</span>
          <span className="tab-badge">4</span>
        </button>
        
        <button
          className={`tab-button ${activeTab === "tech" ? "active" : ""}`}
          onClick={() => setActiveTab("tech")}
        >
          <Code size={18} />
          <span>Tecnologías</span>
          <span className="tab-badge">{technologies.length}</span>
        </button>
        
        <button
          className={`tab-button ${activeTab === "projects" ? "active" : ""}`}
          onClick={() => setActiveTab("projects")}
        >
          <Star size={18} />
          <span>Proyectos</span>
          <span className="tab-badge">{featuredProjects.length}</span>
        </button>
        
        <button
          className={`tab-button ${activeTab === "methodology" ? "active" : ""}`}
          onClick={() => setActiveTab("methodology")}
        >
          <BarChart size={18} />
          <span>Metodología</span>
          <span className="tab-badge">6</span>
        </button>
      </div>

      {/* Contenido de Tabs */}
      <div className="tab-content-wrapper">
        {/* Tab de Especialidades */}
        {activeTab === "expertise" && (
          <div className="expertise-section">
            <div className="section-header">
              <h3>Áreas de Especialización</h3>
              <p>Conocimiento técnico profundo en tecnologías cloud modernas</p>
            </div>
            
            <div className="expertise-grid">
              {expertiseAreas.map((area, index) => (
                <Card key={index} className="expertise-card-detailed">
                  <div className="expertise-card-header">
                    <div 
                      className="expertise-icon-main"
                      style={{ color: area.color }}
                    >
                      {area.icon}
                    </div>
                    <div className="expertise-level-badge">
                      <span>{area.level}%</span>
                    </div>
                  </div>
                  
                  <h4>{area.title}</h4>
                  <p className="expertise-description">{area.description}</p>
                  
                  <div className="skill-progress-bar">
                    <div 
                      className="skill-progress-fill"
                      style={{ 
                        width: `${area.level}%`,
                        background: area.color
                      }}
                    />
                  </div>
                  
                  <div className="expertise-details">
                    <div className="skills-list">
                      <h5>Habilidades:</h5>
                      <div className="skills-tags">
                        {area.skills.map((skill, idx) => (
                          <span key={idx} className="skill-tag-item">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="projects-list">
                      <h5>Tipos de Proyectos:</h5>
                      <ul>
                        {area.projects.map((project, idx) => (
                          <li key={idx}>
                            <Check size={14} />
                            {project}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tab de Tecnologías */}
        {activeTab === "tech" && (
          <Card className="tech-stack-section">
            <div className="section-header">
              <h3>Stack Tecnológico</h3>
              <p>Conjunto completo de herramientas para infraestructura cloud moderna</p>
            </div>
            
            <div className="search-container">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  value={techQuery}
                  onChange={(e) => setTechQuery(e.target.value)}
                  placeholder="Buscar tecnologías (ej: Docker, AWS, Kubernetes...)"
                />
                {techQuery && (
                  <button 
                    className="clear-search"
                    onClick={() => setTechQuery("")}
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="search-stats">
                <span>{filteredTech.length} categorías</span>
                <span>•</span>
                <span>{filteredTech.reduce((acc, tech) => acc + tech.items.length, 0)} tecnologías</span>
              </div>
            </div>
            
            <div className="tech-categories-grid">
              {filteredTech.length > 0 ? (
                filteredTech.map((tech, index) => (
                  <div key={index} className="tech-category-card">
                    <div className="category-header">
                      <div className="category-icon">
                        {tech.icon}
                      </div>
                      <h4>{tech.category}</h4>
                    </div>
                    
                    <div className="category-tags">
                      {tech.items.map((item, idx) => (
                        <span 
                          key={idx} 
                          className="tech-tag-item"
                          onClick={() => setTechQuery(item)}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <p>No se encontraron tecnologías para "{techQuery}"</p>
                  <button 
                    className="reset-search"
                    onClick={() => setTechQuery("")}
                  >
                    Reiniciar Búsqueda
                  </button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Tab de Proyectos */}
        {activeTab === "projects" && (
          <div className="projects-section">
            <div className="section-header">
              <h3>Proyectos Destacados</h3>
              <p>Implementaciones reales con resultados medibles</p>
            </div>
            
            <div className="projects-grid-detailed">
              {featuredProjects.map((project, index) => (
                <Card key={index} className="project-card-detailed">
                  <div className="project-card-header">
                    <div 
                      className="project-icon-main"
                      style={{ color: project.color }}
                    >
                      {project.icon}
                    </div>
                    <div className="project-tags">
                      {project.tags.map((tag, idx) => (
                        <span key={idx} className="project-tag-item">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <h4>{project.title}</h4>
                  <p className="project-description">{project.description}</p>
                  
                  <div className="project-metrics-grid">
                    {project.metrics.map((metric, idx) => (
                      <div key={idx} className="metric-item-detailed">
                        <div className="metric-value">{metric.value}</div>
                        <div className="metric-label">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="project-cta">
                    <button className="view-details-btn">
                      <ExternalLink size={16} />
                      Ver Caso de Estudio
                    </button>
                    <div className="project-tech">
                      <span>AWS</span>
                      <span>Terraform</span>
                      <span>Kubernetes</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tab de Metodología */}
        {activeTab === "methodology" && (
          <Card className="methodology-section">
            <div className="section-header">
              <h3>Proceso de Desarrollo</h3>
              <p>Enfoque estructurado para entregas confiables y de alta calidad</p>
            </div>
            
            <div className="methodology-timeline">
              {methodology.map((step) => (
                <div key={step.step} className="timeline-step">
                  <div className="step-number-container">
                    <div className="step-number">{step.step}</div>
                    {step.step < methodology.length && (
                      <div className="step-connector-main" />
                    )}
                  </div>
                  
                  <Card className="step-content-main">
                    <div className="step-header-main">
                      <div className="step-icon-main">
                        {step.icon}
                      </div>
                      <div>
                        <h4>{step.title}</h4>
                        <span className="step-duration">{step.duration}</span>
                      </div>
                    </div>
                    
                    <p className="step-description">{step.description}</p>
                    
                    <div className="step-deliverables">
                      <h5>Entregables Clave:</h5>
                      <ul>
                        <li>Documentación & Diagramas de arquitectura</li>
                        <li>Infraestructura como Código</li>
                        <li>Scripts de automatización</li>
                        <li>Reportes de testing & validación</li>
                      </ul>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Sección de Beneficios */}
      <Card className="benefits-section-main">
        <div className="section-header">
          <h3>¿Por qué trabajar conmigo?</h3>
          <p>Lo que diferencia mi enfoque de otros</p>
        </div>
        
        <div className="benefits-grid-main">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-item-main">
              <div className="benefit-icon-main">
                {benefit.icon}
              </div>
              <div className="benefit-content-main">
                <h4>{benefit.title}</h4>
                <p>{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Sección CTA */}
      <Card className="cta-section-main">
        <div className="cta-content-main">
          <div className="cta-header-main">
            <h3>¿Listo para transformar tu infraestructura?</h3>
            <p>
              Hablemos sobre cómo podemos construir soluciones escalables, seguras 
              y cost-efectivas para tu negocio. Agenda una consulta gratuita hoy.
            </p>
          </div>
          
          <div className="cta-actions">
            <button
              className="cta-button-primary"
              onClick={() => 
                document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <MessageSquare size={20} />
              Agendar Consulta Gratuita
              <ChevronRight size={20} />
            </button>
            
            <div className="cta-features">
              <span>✓ Sin compromiso</span>
              <span>✓ Evaluación técnica incluida</span>
              <span>✓ Llamada de descubrimiento de 30 min</span>
            </div>
          </div>
        </div>
      </Card>
    </Section>
  );
}