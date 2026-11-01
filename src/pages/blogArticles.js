export const categories = ["Todos", "AWS", "DevOps", "IA", "Desarrollo"];

export const articles = [
  {
    number: "01", slug: "arquitectura-aws-primer-proyecto", category: "AWS", theme: "aws", visualLabel: "CLOUD / 001", image: "/blog/aws-architecture.png", imageAlt: "Infraestructura cloud luminosa con servidores conectados", readTime: 7,
    title: "De una idea a una arquitectura AWS lista para crecer",
    excerpt: "Una forma práctica de organizar tu primer proyecto cloud: servicios, seguridad, costos y decisiones que conviene tomar desde el inicio.",
    intro: "Una buena arquitectura no empieza eligiendo servicios. Empieza entendiendo qué necesita hacer la aplicación, quién la usará y cómo sabrás si funciona bien.",
    sections: [
      { title: "Empieza por los requisitos", paragraphs: ["Escribe el flujo principal del usuario y anota cuánta disponibilidad, rapidez y capacidad necesitas. Un proyecto pequeño puede arrancar simple, siempre que deje claro cómo crecer.", "Define también qué datos son sensibles, cuánto tiempo deben conservarse y quién necesita acceder a ellos."], bullets: ["Tráfico esperado y posibles picos", "Datos que almacena la aplicación", "Presupuesto mensual aproximado"] },
      { title: "Separa las responsabilidades", paragraphs: ["Organiza la solución en capas: entrada, lógica de negocio, datos y observabilidad. Por ejemplo, una interfaz estática puede servirse desde S3 y CloudFront; una API puede usar Lambda y API Gateway; los datos pueden vivir en DynamoDB o RDS según sus relaciones y consultas.", "Es un ejemplo, no una receta universal. Escoge cada servicio por las necesidades del producto y la capacidad de tu equipo para operarlo."] },
      { title: "Seguridad y costos desde el primer día", paragraphs: ["Aplica permisos mínimos con IAM, cifra la información y evita colocar secretos en el código. Activa registros y alarmas básicas para saber qué ocurre cuando algo falla.", "Define un presupuesto en AWS Budgets y revisa los costos por servicio. Una arquitectura útil es una que también puedes mantener y pagar."] },
      { title: "Una ruta de implementación", paragraphs: ["Construye primero el camino crítico de extremo a extremo. Despliega con infraestructura como código, prueba el flujo real y mide latencia, errores y costos antes de añadir complejidad."] },
    ],
  },
  {
    number: "02", slug: "pipeline-cicd-sin-complicaciones", category: "DevOps", theme: "devops", visualLabel: "PIPELINE / 002", image: "/blog/devops-pipeline.png", imageAlt: "Etapas de un pipeline de despliegue conectadas", readTime: 6,
    title: "Un pipeline CI/CD sencillo que sí ayuda al equipo",
    excerpt: "Del commit al despliegue con validaciones útiles, entornos claros y una forma segura de volver atrás.",
    intro: "Automatizar un despliegue sirve cuando cada cambio recorre un camino conocido y el equipo recibe respuestas rápidas. El objetivo es reducir errores manuales y hacer visible el estado de cada entrega.",
    sections: [
      { title: "Elige pocas validaciones, pero valiosas", paragraphs: ["En cada pull request ejecuta instalación limpia, lint, pruebas relevantes y compilación. Si una verificación es lenta o inestable, arréglala antes de convertirla en un obstáculo permanente.", "Mantén los secretos fuera del repositorio y usa credenciales de corta duración cuando la plataforma lo permita."] },
      { title: "Distingue probar de publicar", paragraphs: ["Una rama de trabajo debe validar el cambio. La rama principal puede publicar en un entorno de prueba. Producción necesita un paso claro de promoción y una versión identificable.", "Guarda el artefacto de cada ejecución para desplegar exactamente lo que se probó."] },
      { title: "Planea la recuperación", paragraphs: ["Antes del primer despliegue, define cómo volver a la versión anterior y qué señales indican que debes hacerlo. Errores, latencia y métricas de negocio dan una visión más útil que un simple estado verde del pipeline."], bullets: ["Versión o commit desplegado", "Comprobación de salud después del despliegue", "Procedimiento de rollback documentado"] },
    ],
  },
  {
    number: "03", slug: "asistente-ia-con-contexto", category: "IA", theme: "ai", visualLabel: "INTELLIGENCE / 003", image: "/blog/ai-assistant.png", imageAlt: "Núcleo de inteligencia artificial conectado a documentos", readTime: 8,
    title: "Cómo diseñar un asistente de IA con contexto útil",
    excerpt: "Una guía para conectar un asistente con información real, medir sus respuestas y mantener control humano donde importa.",
    intro: "Un asistente útil necesita más que un buen prompt. Debe encontrar información pertinente, mostrar sus límites y permitir comprobar de dónde salió una respuesta.",
    sections: [
      { title: "Delimita el trabajo", paragraphs: ["Define un caso de uso concreto: responder preguntas sobre documentación interna, resumir solicitudes o ayudar a encontrar procedimientos. Reúne preguntas reales y establece qué debe hacer el asistente cuando no conoce la respuesta."] },
      { title: "Prepara la información", paragraphs: ["Organiza documentos, elimina duplicados y registra su fecha y fuente. Recupera fragmentos relevantes para cada consulta y entrega solo el contexto necesario al modelo.", "Si la información cambia con frecuencia, planifica un proceso de actualización."] },
      { title: "Mide antes de ampliar", paragraphs: ["Crea un conjunto de preguntas con respuestas esperadas. Evalúa precisión, utilidad y capacidad de reconocer incertidumbre. Revisa también tiempos de respuesta y costo por consulta.", "Para decisiones sensibles, añade una revisión humana y evita automatizar acciones que el sistema no pueda justificar."] },
    ],
  },
  {
    number: "04", slug: "infraestructura-como-codigo", category: "DevOps", theme: "infra", visualLabel: "INFRA / 004", image: "/blog/infrastructure-code.png", imageAlt: "Bloques de infraestructura ensamblados bajo una nube", readTime: 5,
    title: "Infraestructura como código sin perder el control",
    excerpt: "Convenciones pequeñas que ayudan a mantener entornos reproducibles, cambios revisables y configuraciones fáciles de entender.",
    intro: "La infraestructura como código permite revisar y repetir cambios, pero el orden del repositorio y la gestión del estado importan tanto como la herramienta elegida.",
    sections: [
      { title: "Organiza por intención", paragraphs: ["Separa entornos y módulos con nombres explícitos. Evita abstraer demasiado pronto: un módulo debe representar una pieza estable que el equipo entiende y reutiliza."] },
      { title: "Revisa antes de aplicar", paragraphs: ["Ejecuta validación y plan en cada cambio. Revisa recursos que se crearán, modificarán o eliminarán; protege el estado remoto y limita quién puede aplicar cambios en producción."] },
      { title: "Documenta las decisiones", paragraphs: ["Anota los requisitos, las variables importantes y el procedimiento de recuperación. Una explicación breve al lado del código ahorra tiempo cuando otra persona necesita operar el entorno."] },
    ],
  },
  {
    number: "05", slug: "api-observable-desde-inicio", category: "Desarrollo", theme: "code", visualLabel: "BUILD / 005", image: "/blog/api-observability.png", imageAlt: "Flujos de métricas y trazas alrededor de una API", readTime: 6,
    title: "Una API observable desde el primer endpoint",
    excerpt: "Logs claros, métricas básicas y trazas para investigar problemas sin adivinar qué pasó en producción.",
    intro: "Cuando una API falla, la pregunta no es solo qué error devolvió. También necesitas saber dónde ocurrió, a quién afectó y si el problema está creciendo.",
    sections: [
      { title: "Registra hechos útiles", paragraphs: ["Usa logs estructurados con hora, identificador de solicitud, ruta y resultado. Nunca registres contraseñas, tokens ni datos privados que no sean necesarios para diagnosticar."] },
      { title: "Mide el comportamiento", paragraphs: ["Empieza con tasa de solicitudes, errores y latencia. Separa los indicadores por ruta u operación importante y crea alertas que requieran una acción concreta."] },
      { title: "Sigue una solicitud de principio a fin", paragraphs: ["Propaga un identificador de correlación entre servicios. Si el sistema crece, las trazas distribuidas ayudan a detectar qué dependencia consume más tiempo o falla."] },
    ],
  },
];
