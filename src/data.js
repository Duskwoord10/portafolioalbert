// =========================
// Albert Sanfle — Portfolio Data
// =========================

export const PROFILE = {
  name: "Albert Sanfle",
  age: 21,
  roleLine: "AWS • Cloud • DevOps",
  company: "Methodica Technology & Co.",
  location: "Santo Domingo, República Dominicana",
  photo: "https://albertsanflepage.s3.us-east-1.amazonaws.com/media/albertsanfleportafolioimagen.jpg",
}

export const MEDIA = {
  profilePhoto: "https://albertsanflepage.s3.us-east-1.amazonaws.com/media/albertsanfleportafolioimagen.jpg",
}

export const LINKS = {
  linkedin: "https://www.linkedin.com/in/albert-sanfle-a89209215/",
  youtube: "https://www.youtube.com/@MethodicaTalks",
  email: "albert@methodicatech.com",
  phone: "+1 (809) 000-0000",
  github: "https://github.com/albertsanfle",
  website: "https://albertsanfle.com",
}

export const CERTIFICATIONS = [
  {
    id: "CLF-C01",
    title: "AWS Certified Cloud Practitioner",
    badge: "https://albertsanflepage.s3.us-east-1.amazonaws.com/media/aws-cloud-practitioner.png",
    level: "Fundamental",
    year: "2024",
    focus: "Cloud Fundamentals",
    description: "Base sólida en conceptos cloud, servicios core de AWS, seguridad, pricing y mejores prácticas.",
    highlights: ["Cloud concepts", "AWS core services", "Security & Compliance"],
    skills: ["AWS Basics", "IAM", "Billing & Pricing"],
    link: "https://www.credly.com/badges/d6a40278-2819-4752-a74d-5f5c7be9e7fb/linked_in_profile",
    inProgress: false,
  },
  {
    id: "SAA-C03",
    title: "AWS Certified Solutions Architect – Associate",
    badge: "https://albertsanflepage.s3.us-east-1.amazonaws.com/media/aws-solutions-architect-associate.webp",
    level: "Associate",
    year: "2024",
    focus: "Architecture & Design",
    description: "Diseño de arquitecturas seguras, resilientes y costo-eficientes en AWS para entornos reales.",
    highlights: ["High availability", "Well-Architected", "Networking & Storage"],
    skills: ["VPC", "EC2", "S3", "RDS", "Load Balancing"],
    link: "https://www.credly.com/badges/2728e77b-b1b7-4bd0-a386-0c58d1dc73b8/linked_in_profile",
    inProgress: false,
  },
  {
    id: "DVA-C02",
    title: "AWS Certified Developer – Associate",
    badge: "https://albertsanflepage.s3.us-east-1.amazonaws.com/media/aws-developer-associate.png",
    level: "Associate",
    year: "2025",
    focus: "Development & Serverless",
    description:
      "Construcción, despliegue y depuración de aplicaciones cloud-native con enfoque en servicios AWS y serverless.",
    highlights: ["Serverless patterns", "CI/CD basics", "Monitoring & troubleshooting"],
    skills: ["Lambda", "API Gateway", "DynamoDB", "CloudWatch"],
    link: "https://www.credly.com/badges/7f668e8c-98ea-4564-a269-b9dc9550dfba/linked_in_profile",
    inProgress: false,
  },
  {
    id: "DOP-C02",
    title: "AWS Certified DevOps Engineer – Professional",
    badge: "https://albertsanflepage.s3.us-east-1.amazonaws.com/media/aws-devops-engineer-pro.webp",
    level: "Professional",
    year: "2026",
    focus: "DevOps & Automation",
    description:
      "En preparación: automatización, observabilidad, despliegues avanzados y operación confiable a escala.",
    highlights: ["Pipelines avanzados", "IaC", "Resiliencia & monitoring"],
    skills: ["CI/CD", "IaC", "Observability", "Security automation"],
    link: "https://aws.amazon.com/certification/certified-devops-engineer-professional/",
    inProgress: true,
    progress: 65,
  },
]

export const DELIVERABLES = [
  {
    title: "Arquitectura AWS lista para producción",
    desc: "Diseño de servicios, networking, seguridad, escalado y costo/beneficio con enfoque de negocio.",
  },
  {
    title: "DevOps y automatización",
    desc: "CI/CD, Infraestructura como Código, ambientes, observabilidad y despliegues confiables.",
  },
  {
    title: "Contact Center & Experiencia de Cliente",
    desc: "Implementación y optimización con Amazon Connect: flujos, colas, agentes, métricas y mejora continua.",
  },
]
