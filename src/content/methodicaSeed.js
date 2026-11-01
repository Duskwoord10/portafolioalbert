// Copia del contenido que ya aparecía en la página pública de Methodica.
// Se usa para la primera migración y como respaldo visual hasta publicar el registro CMS.
const media = 'https://albertsanflepage.s3.us-east-1.amazonaws.com/media/'

export const METHODICA_SEED = {
  name: 'Methodica Technology & Co',
  logo: `${media}methodicalogoblanco.png`,
  website: 'https://methodicatechnology.com/',
  location: 'Santo Domingo, República Dominicana',
  headline: 'Soluciones digitales para empresas que quieren operar mejor.',
  introduction: 'Methodica es mi empresa de tecnología. Creamos software, automatizaciones, infraestructura cloud y canales digitales para negocios que necesitan ordenar procesos, atender mejor y crecer con una base técnica seria.',
  mainHeadline: 'Construimos herramientas que tu empresa sí puede usar.',
  mainDescription: 'Nos sentamos a entender el problema, diseñamos una solución práctica y la llevamos a producción con orden, seguimiento y criterio técnico.',
  sideHeadline: 'Software, cloud, automatización y atención digital.',
  sideDescription: 'Proyectos completos: desde plataformas internas y dashboards hasta automatizaciones, bots, infraestructura AWS y soluciones de atención al cliente.',
  servicesHeadline: 'Áreas donde Methodica aporta valor',
  galleryHeadline: 'Presencia, equipo y camino de la marca',
  ctaHeadline: 'Si tu negocio necesita una solución digital, podemos construirla.',
  ctaDescription: 'Escríbenos y revisamos la idea, el proceso o el problema. La meta es aterrizar una solución útil, no complicarte más la operación.',
  instagram: 'https://www.instagram.com/methodicatechandco/',
  linkedin: 'https://www.linkedin.com/company/methodicatechandco/',
  points: [
    'Levantamos la necesidad contigo antes de escribir una línea de código.',
    'Construimos soluciones mantenibles, claras y listas para usarse.',
    'Acompañamos el despliegue, la operación y las mejoras posteriores.',
  ].join('\n'),
  tags: 'Software,AWS,DevOps,Automatización,APIs,Chatbots,Dashboards,Cloud',
  services: [
    { title:'Software a medida', text:'Plataformas web, paneles administrativos, APIs y sistemas internos pensados para la operación real.' },
    { title:'Cloud & DevOps', text:'Despliegues, infraestructura en AWS, automatización de ambientes y bases sólidas para escalar.' },
    { title:'Automatización', text:'Flujos que conectan herramientas, reducen tareas repetitivas y ayudan a trabajar con más orden.' },
    { title:'Canales digitales e IA', text:'Chatbots, asistentes, WhatsApp, contact center cloud e integraciones para atención y procesos.' },
  ],
  gallery: [
    { src:`${media}methodica1.png`, title:'Presencia tecnológica', text:'Participamos en espacios donde se habla de innovación, tecnología y nuevas oportunidades.' },
    { src:`${media}methodica2.png`, title:'Equipo y visión', text:'Methodica se construye con una idea simple: resolver bien, entregar claro y acompañar el proceso.' },
    { src:`${media}methodica3.png`, title:'Tecnología aplicada', text:'Software, cloud y automatización puestos al servicio de empresas que necesitan avanzar.' },
  ],
}
