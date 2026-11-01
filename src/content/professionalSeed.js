// Registros ya visibles en Sobre mí antes de incorporar el CMS.
export const COMPANY_SEED = {
  title: 'Never Off Technology', slug: 'never-off-technology',
  data: { country: 'República Dominicana' },
}

export const EXPERIENCE_SEED = {
  title: 'DevOps / SRE Engineer', slug: 'devops-sre-engineer-never-off-technology',
  data: {
    role: 'DevOps / SRE Engineer', company: COMPANY_SEED.title,
    employmentType: 'Tiempo completo', location: 'República Dominicana',
    startMonth: '2024-02', endMonth: '2026-02',
    description: 'Operé y optimicé soluciones en AWS con enfoque DevOps, garantizando disponibilidad, rendimiento, seguridad y estabilidad en ambientes productivos.',
    responsibilities: [
      'Arquitecturas serverless y event-driven con Lambda, API Gateway, DynamoDB, S3 y EventBridge.',
      'Distribución de aplicaciones mediante CloudFront y administración DNS con Route 53.',
      'Flujos de CI/CD, control de versiones y procesos de despliegue automatizado.',
      'Integraciones para Amazon Connect con Lex, Bedrock, Polly y servicios externos.',
      'Seguridad con IAM de mínimo privilegio, métricas, logs, alertas y buenas prácticas operativas.',
      'Troubleshooting, respuesta a incidentes, documentación técnica y mejora continua.',
    ].join('\n'),
    technologies: 'AWS, DevOps, SRE, Serverless, CI/CD, Amazon Connect, Observabilidad, Seguridad',
  },
}

export const EDUCATION_SEED = {
  title: 'Ingeniería de Sistemas', slug: 'ingenieria-de-sistemas-intec',
  data: { institution: 'Instituto Tecnológico de Santo Domingo · INTEC',
    degree: 'Ingeniería de Sistemas', startYear: '2022', endYear: '2026',
    status: 'Etapa final' },
}

export const EVENT_SEEDS = [
  { title:'AWS Community Experience', slug:'aws-community-experience', data:{
    image:'https://albertsanflepage.s3.us-east-1.amazonaws.com/media/amazonmex2.png',
    brand:'AWS', eyebrow:'Experiencia internacional',
    description:'Aprendizaje, networking y conversaciones con profesionales del ecosistema cloud en un entorno internacional.',
    position:'center 48%',
  } },
  { title:'Arquitectura y operación moderna', slug:'arquitectura-y-operacion-moderna', data:{
    image:'https://albertsanflepage.s3.us-east-1.amazonaws.com/media/amazonmex3.png',
    brand:'AWS', eyebrow:'Cloud & DevOps',
    description:'Una experiencia que fortaleció mi visión sobre automatización, confiabilidad y soluciones preparadas para producción.',
    position:'center 36%',
  } },
  { title:'Microsoft Experience', slug:'microsoft-experience', data:{
    image:'https://albertsanflepage.s3.us-east-1.amazonaws.com/media/Microsfotofoto.png',
    brand:'Microsoft', eyebrow:'Tecnología e innovación',
    description:'Intercambio de ideas sobre plataformas modernas, inteligencia artificial y transformación tecnológica.',
    position:'center 42%',
  } },
]

export const AWARD_SEEDS = [
  { title:'Ualett Challenge Hackathon 2026', slug:'ualett-challenge-hackathon-2026', data:{
    institution:'Ualett × INTEC', rank:'Primer lugar', category:'Innovación y producto',
    headline:'Una propuesta reconocida por su viabilidad tecnológica.',
    description:'Formé parte del equipo ganador del primer lugar en una competencia de dos días enfocada en diseñar una aplicación para conductores independientes.',
    image:'https://news.ualett.com/hubfs/Ualett%20Challenge%20Hackathon.png',
    link:'https://news.ualett.com/es/ualett-and-intec-announce-the-winners-of-the-ualett-challenge-hackathon-2026',
    prize:'RD$240,000',
    teamContextTitle:'Trabajo multidisciplinario',
    teamContextDescription:'Producto, tecnología, UX y modelo de negocio.',
    prizeDescription:'Premio grupal otorgado al equipo ganador.',
  } },
  { title:'XI Torneo de Redes de Datos 2025', slug:'xi-torneo-de-redes-de-datos-2025', data:{
    institution:'INTEC', rank:'Tercer lugar', category:'Redes y telecomunicaciones',
    headline:'INTEC obtuvo el tercer lugar en una competencia nacional.',
    description:'Formé parte de la delegación institucional que participó en retos de configuración, análisis y resolución de escenarios de redes de datos durante 2025.',
    image:'https://colmena.intec.edu.do/wp-content/uploads/2025/11/INTEC-obtiene-tercer-lugar-en-el-XI-Torneo-de-Redes-de-Datos.jpeg',
    link:'https://colmena.intec.edu.do/2025/11/intec-obtiene-tercer-lugar-en-el-xi-torneo-de-redes-de-datos/',
    presentationLabel:'Representación institucional',
    highlights:'Resolución de escenarios técnicos bajo presión.\nColaboración, análisis y toma de decisiones en equipo.\nRepresentación universitaria a nivel nacional.',
  } },
]

export const SKILL_GROUPS_SEED = [
  { category:'Cloud', items:['AWS','Lambda','API Gateway','DynamoDB','Amazon S3','EventBridge','CloudFront','Route 53','EC2','IAM','CloudWatch'] },
  { category:'DevOps', items:['Docker','Kubernetes','Terraform','Linux','CI/CD','CodeCommit'] },
  { category:'IA y comunicaciones', items:['Amazon Connect','Amazon Lex','Amazon Bedrock','Amazon Polly'] },
  { category:'Desarrollo', items:['Node.js','Python','React','REST APIs'] },
]

export const SKILL_SEEDS = SKILL_GROUPS_SEED.flatMap((group, groupIndex) => group.items.map((title, index) => ({
  title,
  slug:`${group.category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  sort_order:groupIndex * 100 + index,
  data:{ category:group.category },
})))
