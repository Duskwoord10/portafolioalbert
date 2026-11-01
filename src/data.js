// =========================
// Albert Sanfle — Portfolio Data
// =========================

const calculateAge = (birthYear, birthMonth, birthDay) => {
  const today = new Date();

  let age = today.getFullYear() - birthYear;
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  if (
    currentMonth < birthMonth ||
    (currentMonth === birthMonth && currentDay < birthDay)
  ) {
    age--;
  }

  return age;
};

export const PROFILE = {
  name: "Albert Javier Sanfle Lopez",
  shortName: "Albert Sanfle",
  age: calculateAge(2004, 2, 4),
  roleLine: "AWS • Cloud • DevOps • Automation",
  title: "DevOps Engineer | AWS Certified",
  company: "Methodica Technology & Co.",
  location: "Santo Domingo, República Dominicana",
  email: "asanfle@methodicatechnology.com",
  phone: "+1 (809) 351-8082",
  photo:
    "https://albertsanflepage.s3.us-east-1.amazonaws.com/media/albertsanflefotopg.jpg",
  summary:
    "DevOps Engineer enfocado en AWS, Linux, automatización, infraestructura cloud, serverless y soluciones digitales para empresas.",
};

export const MEDIA = {
  profilePhoto:
    "https://albertsanflepage.s3.us-east-1.amazonaws.com/media/albertsanflefotopg.jpg",
  companyLogo:
    "https://methodicatechnologybucketgeneral.s3.us-east-1.amazonaws.com/LOGOS/PRINCIPAL/PRINCIPAL.png",
};

export const LINKS = {
  linkedin: "https://www.linkedin.com/in/albert-sanfle-a89209215/",
  youtube: "https://www.youtube.com/@albertsanfle07",
  instagram: "https://www.instagram.com/albertsanfle_07/",
  methodicaInstagram: "https://www.instagram.com/methodicatechandco/",
  email: "asanfle@methodicatechnology.com",
  phone: "+1 (809) 351-8082",
  github: "https://github.com/albertsanfle",
  website: "https://albertsanfle.com",
};

export const CERTIFICATIONS = [
  {
    id: "CLF-C02",
    title: "AWS Certified Cloud Practitioner",
    badge:
      "https://images.credly.com/images/00634f82-b07f-4bbd-a6bb-53de397fc3a6/twitter_thumb_201604_image.png",
    level: "Fundamental",
    year: "2024",
    focus: "Cloud Fundamentals",
    status: "Completada",
    description:
      "Base sólida en conceptos cloud, servicios principales de AWS, seguridad, modelo de responsabilidad compartida, pricing, soporte y mejores prácticas.",
    highlights: [
      "Cloud concepts",
      "AWS core services",
      "Security & Compliance",
      "Billing & Pricing",
    ],
    skills: [
      "AWS Basics",
      "IAM",
      "S3",
      "EC2",
      "VPC",
      "Cloud Concepts",
      "Billing & Pricing",
      "Shared Responsibility Model",
    ],
    link:
      "https://www.credly.com/badges/d6a40278-2819-4752-a74d-5f5c7be9e7fb/linked_in_profile",
    credlyUrl:
      "https://www.credly.com/badges/d6a40278-2819-4752-a74d-5f5c7be9e7fb/linked_in_profile",
    inProgress: false,
  },
  {
    id: "SAA-C03",
    title: "AWS Certified Solutions Architect – Associate",
    badge:
      "https://images.credly.com/size/680x680/images/0e284c3f-5164-4b21-8660-0d84737941bc/image.png",
    level: "Associate",
    year: "2024",
    focus: "Architecture & Design",
    status: "Completada",
    description:
      "Diseño de arquitecturas seguras, resilientes, escalables y costo-eficientes en AWS para entornos reales de producción.",
    highlights: [
      "High availability",
      "Well-Architected",
      "Networking & Storage",
      "Cost optimization",
    ],
    skills: [
      "VPC",
      "EC2",
      "S3",
      "RDS",
      "IAM",
      "Route 53",
      "CloudFront",
      "Load Balancing",
      "Auto Scaling",
      "Well-Architected Framework",
    ],
    link:
      "https://www.credly.com/badges/2728e77b-b1b7-4bd0-a386-0c58d1dc73b8/linked_in_profile",
    credlyUrl:
      "https://www.credly.com/badges/2728e77b-b1b7-4bd0-a386-0c58d1dc73b8/linked_in_profile",
    inProgress: false,
  },
  {
    id: "DVA-C02",
    title: "AWS Certified Developer – Associate",
    badge:
      "https://images.credly.com/size/680x680/images/b9feab85-1a43-4f6c-99a5-631b88d5461b/image.png",
    level: "Associate",
    year: "2025",
    focus: "Development & Serverless",
    status: "Completada",
    description:
      "Construcción, despliegue y depuración de aplicaciones cloud-native usando servicios AWS, SDKs, APIs, CI/CD y arquitecturas serverless.",
    highlights: [
      "Serverless patterns",
      "CI/CD basics",
      "Monitoring & troubleshooting",
      "Cloud-native development",
    ],
    skills: [
      "Lambda",
      "API Gateway",
      "DynamoDB",
      "S3",
      "CloudWatch",
      "IAM",
      "SDKs",
      "CI/CD",
      "EventBridge",
      "SQS",
      "SNS",
    ],
    link:
      "https://www.credly.com/badges/7f668e8c-98ea-4564-a269-b9dc9550dfba/linked_in_profile",
    credlyUrl:
      "https://www.credly.com/badges/7f668e8c-98ea-4564-a269-b9dc9550dfba/linked_in_profile",
    inProgress: false,
  },
  {
    id: "DOP-C02",
    title: "AWS Certified DevOps Engineer – Professional",
    badge:
      "https://images.credly.com/size/680x680/images/bd31ef42-d460-493e-8503-39592aaf0458/image.png",
    level: "Professional",
    year: "2026",
    focus: "DevOps & Automation",
    status: "En progreso",
    description:
      "Preparación enfocada en automatización, CI/CD avanzado, infraestructura como código, observabilidad, seguridad operacional y operación confiable a escala.",
    highlights: [
      "Pipelines avanzados",
      "Infrastructure as Code",
      "Observabilidad",
      "Resiliencia & monitoring",
    ],
    skills: [
      "CodePipeline",
      "CodeBuild",
      "CodeDeploy",
      "CloudFormation",
      "CDK",
      "CloudWatch",
      "X-Ray",
      "Systems Manager",
      "Security automation",
      "Incident Response",
      "Blue/Green Deployments",
    ],
    link:
      "https://aws.amazon.com/certification/certified-devops-engineer-professional/",
    inProgress: true,
    progress: 65,
  },
];

export const DELIVERABLES = [
  {
    title: "Arquitectura AWS lista para producción",
    desc:
      "Diseño de servicios, networking, seguridad, escalado, alta disponibilidad y costo/beneficio con enfoque de negocio.",
  },
  {
    title: "DevOps y automatización",
    desc:
      "CI/CD, infraestructura como código, ambientes, observabilidad, monitoreo y despliegues confiables.",
  },
  {
    title: "Contact Center & Experiencia de Cliente",
    desc:
      "Implementación y optimización con Amazon Connect: flujos, colas, agentes, métricas, automatización y mejora continua.",
  },
];

export const TECH_STACK = [
  "AWS",
  "Linux",
  "DevOps",
  "CI/CD",
  "Lambda",
  "API Gateway",
  "DynamoDB",
  "S3",
  "CloudFront",
  "Route 53",
  "EC2",
  "RDS",
  "IAM",
  "CloudWatch",
  "Amazon Connect",
  "Lex",
  "Bedrock",
  "Polly",
  "Node.js",
  "React",
];

export const SERVICES = [
  {
    title: "Cloud Architecture",
    desc:
      "Diseño de soluciones cloud seguras, escalables y optimizadas en costos usando AWS.",
  },
  {
    title: "DevOps Implementation",
    desc:
      "Automatización de despliegues, pipelines CI/CD, monitoreo y operación confiable.",
  },
  {
    title: "Serverless Applications",
    desc:
      "Desarrollo de APIs, funciones Lambda, integraciones y aplicaciones event-driven.",
  },
  {
    title: "AI & Automation",
    desc:
      "Chatbots, asistentes virtuales, automatización de procesos e integración con servicios de IA.",
  },
];
