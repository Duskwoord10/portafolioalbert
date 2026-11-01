import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import TranslatePageContent from './TranslatePageContent.jsx'

const LanguageContext = createContext(null)

const messages = {
  es: {
    'nav.home':'Inicio','nav.about':'Sobre mí','nav.experience':'Experiencia',
    'nav.certifications':'Certificaciones','nav.blog':'Blog','nav.cv':'CV',
    'nav.contact':'Hablemos','nav.toggle':'Cambiar idioma a inglés',
    'nav.menu':'Navegación','nav.mobilePitch':'¿Tienes una idea, proyecto o propuesta?',
    'nav.conversation':'Conversemos','nav.available':'Disponible para nuevas oportunidades',
    'home.greeting':'Hola, soy','home.certifications':'Certificaciones publicadas',
    'home.years':'Años de experiencia','home.projects':'Proyectos entregados',
    'home.linkedin':'Ver LinkedIn','home.profile':'Perfil profesional',
    'home.youtube':'Ver YouTube','home.video':'Contenido técnico','home.stack':'Stack Tecnológico',
    'blog.eyebrow':'IDEAS, CÓDIGO Y CLOUD','blog.title':'Notas desde la','blog.titleAccent':'práctica.',
    'blog.description':'Guías claras y ejemplos sobre arquitectura cloud, automatización y tecnología aplicada. Ideas para llevar del concepto a producción.',
    'blog.articles':'artículos','blog.byline':'Escrito para quienes construyen',
    'blog.featured':'LECTURA DESTACADA','blog.all':'Todos los artículos',
    'blog.explore':'02 / EXPLORAR','blog.resources':'Recursos breves para aprender, probar y construir.',
    'blog.filter':'Filtrar por categoría','blog.search':'Buscar artículos...',
    'blog.read':'Leer artículo','blog.readTime':'min de lectura',
    'blog.emptyTitle':'No encontramos artículos','blog.emptyText':'Prueba otra palabra o selecciona una categoría diferente.',
    'blog.seeAll':'Ver todos','footer.navigation':'Navegación','footer.specialties':'Especialidades',
    'footer.contact':'Contacto profesional','footer.direct':'Contacto directo',
    'footer.start':'Iniciar conversación','footer.linkedin':'Conectar en LinkedIn',
    'footer.allContact':'Ver todas las opciones de contacto','footer.available':'Disponible para nuevas oportunidades',
    'chat.aria':'Asistente virtual de Albert Sanfle','chat.title':'Asistente IA',
    'chat.description':'Experiencia, proyectos, certificaciones y contacto.','chat.online':'En línea',
    'chat.questions':'Preguntas sugeridas','chat.choose':'Elige una para comenzar',
    'chat.placeholder':'Escribe tu mensaje...','chat.send':'Enviar mensaje',
    'chat.open':'Abrir asistente de inteligencia artificial','chat.talk':'Hablemos',
    'chat.back':'Volver a los canales de contacto','chat.close':'Cerrar widget',
    'chat.explore':'Explorar páginas','chat.direct':'Navegación directa',
  },
  en: {
    'nav.home':'Home','nav.about':'About','nav.experience':'Experience',
    'nav.certifications':'Certifications','nav.blog':'Blog','nav.cv':'Resume',
    'nav.contact':'Let’s talk','nav.toggle':'Cambiar idioma a español',
    'nav.menu':'Navigation','nav.mobilePitch':'Have an idea, project, or proposal?',
    'nav.conversation':'Let’s talk','nav.available':'Available for new opportunities',
    'home.greeting':'Hi, I’m','home.certifications':'Published certifications',
    'home.years':'Years of experience','home.projects':'Projects delivered',
    'home.linkedin':'View LinkedIn','home.profile':'Professional profile',
    'home.youtube':'Watch YouTube','home.video':'Technical content','home.stack':'Technology Stack',
    'blog.eyebrow':'IDEAS, CODE & CLOUD','blog.title':'Notes from','blog.titleAccent':'the field.',
    'blog.description':'Clear guides and examples on cloud architecture, automation, and applied technology. Ideas to take from concept to production.',
    'blog.articles':'articles','blog.byline':'Written for people who build',
    'blog.featured':'FEATURED READ','blog.all':'All articles',
    'blog.explore':'02 / EXPLORE','blog.resources':'Short resources to learn, test, and build.',
    'blog.filter':'Filter by category','blog.search':'Search articles...',
    'blog.read':'Read article','blog.readTime':'min read',
    'blog.emptyTitle':'No articles found','blog.emptyText':'Try another search or choose a different category.',
    'blog.seeAll':'View all','footer.navigation':'Navigation','footer.specialties':'Specialties',
    'footer.contact':'Professional contact','footer.direct':'Direct contact',
    'footer.start':'Start a conversation','footer.linkedin':'Connect on LinkedIn',
    'footer.allContact':'View all contact options','footer.available':'Available for new opportunities',
    'chat.aria':'Albert Sanfle virtual assistant','chat.title':'AI assistant',
    'chat.description':'Experience, projects, certifications, and contact.','chat.online':'Online',
    'chat.questions':'Suggested questions','chat.choose':'Choose one to get started',
    'chat.placeholder':'Write your message...','chat.send':'Send message',
    'chat.open':'Open the AI assistant','chat.talk':'Let’s talk',
    'chat.back':'Back to contact options','chat.close':'Close widget',
    'chat.explore':'Explore pages','chat.direct':'Direct navigation',
  },
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('portfolio-language') === 'en' ? 'en' : 'es' }
    catch { return 'es' }
  })

  useEffect(() => {
    document.documentElement.lang = language
    try { localStorage.setItem('portfolio-language', language) } catch { /* storage optional */ }
  }, [language])

  const value = useMemo(() => ({
    language,
    setLanguage: nextLanguage => setLanguage(nextLanguage === 'en' ? 'en' : 'es'),
    toggleLanguage: () => setLanguage(current => current === 'es' ? 'en' : 'es'),
    t: key => messages[language][key] || messages.es[key] || key,
  }), [language])

  return <LanguageContext.Provider value={value}>
    <TranslatePageContent language={language} />
    {children}
  </LanguageContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage debe utilizarse dentro de LanguageProvider')
  return context
}

// eslint-disable-next-line react-refresh/only-export-components
export function translateNavigationLabel(label, language) {
  const keys = {
    '/':'nav.home','inicio':'nav.home','/sobre-mi':'nav.about','sobre mí':'nav.about','sobre mi':'nav.about',
    '/experiencia':'nav.experience','experiencia':'nav.experience',
    '/certificaciones':'nav.certifications','certificaciones':'nav.certifications',
    '/blog':'nav.blog','blog':'nav.blog','/cv':'nav.cv','cv':'nav.cv',
    '/contacto':'nav.contact','contacto':'nav.contact',
  }
  const key = keys[label?.toLowerCase?.()]
  return key ? messages[language][key] : label
}
