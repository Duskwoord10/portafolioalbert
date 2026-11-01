# Auditoría y plan del CMS

Fecha: 2026-10-17. Alcance: repositorio local y DNS público. No se ha cambiado la infraestructura de producción.

## Arquitectura actual

- React 19.2, React Router 7.11, Vite 7, JavaScript y CSS. No había backend CMS, autenticación ni base de datos en el repositorio.
- Rutas existentes: `/`, `/sobre-mi`, `/certificaciones`, `/blog`, `/blog/:slug`, `/methodica`, `/contacto` y 404.
- Contenido: perfil y certificaciones en `src/data.js`; cinco artículos en `src/pages/blogArticles.js`; textos, fotos, eventos, proyectos y navegación adicionales dentro de componentes JSX.
- Imágenes locales en `public/blog`, imágenes remotas en un bucket S3 existente, Credly y otros sitios. El formulario de contacto usa `mailto:`, sin bandeja de entrada.
- Chatbot independiente mediante AWS Lambda Function URL. El sitio tiene preferencias de cookies propias.
- DNS autoritativo en Amazon Route 53; el dominio principal apunta a CloudFront. `auth.albertsanfle.com` no existe en DNS. No hay infraestructura como código ni pipeline en este repositorio. AWS CLI no tiene credenciales configuradas aquí.
- No se encontró Cloudflare configurado en DNS ni en el repositorio. Cloudflare Web Analytics requeriría cuenta e integración nueva. Su documentación distingue sitios no proxied y límites: https://developers.cloudflare.com/web-analytics/limits/

## Problemas

1. El contenido requiere editar código y reconstruir el bundle.
2. Hay datos y navegación duplicados entre `data.js` y componentes.
3. La API y bandeja de mensajes se han añadido localmente; todavía no están desplegadas y el correo de aviso está pendiente.
4. La portada deriva una cifra de experiencia de la edad; conviene reemplazarla por un dato sustentado y administrado.
5. No hay servicio de correo verificado para recuperación de contraseña.
6. No hay servidor persistente verificado para alojar Node/SQLite. CloudFront/S3 estáticos no pueden mantener esta API ni su base.
7. `node:sqlite` es experimental en Node 22 y no debería ser la base final sin una decisión de soporte/hosting.
8. El secreto TOTP se guarda en la base local sin cifrado de aplicación. Para producción hay que cifrarlo con un gestor de claves, limitar acceso y comprobar respaldos seguros.

## Arquitectura propuesta

Conservar el frontend y su identidad visual. Servir público y administrador mediante CloudFront/S3 en dominios separados. Usar API protegida con contenido persistente y archivos, donde las lecturas públicas filtran `published`. Dado AWS existente, evaluar para producción Lambda + DynamoDB + S3 + Cognito/API Gateway; alternativa: servidor Node ya disponible con volumen persistente, si se confirma. AWS documenta el patrón serverless: https://docs.aws.amazon.com/whitepapers/latest/serverless-multi-tier-architectures-api-gateway-lambda/web-application.html

La implementación presente utiliza SQLite y archivos en disco **para desarrollo local**. Es una base funcional, no el despliegue de la arquitectura final. Antes de producción se debe migrar a almacenamiento duradero y verificar respaldos.

## Modelo de datos inicial

`admins`, `sessions`, `content`, `seed_imports`, `revisions`, `media`, `audit`, `messages`, `pageviews` e `interactions`. `content` usa tipo, slug, estado, JSON de campos, orden y fechas, con índice y unicidad por tipo/slug. `seed_imports` preserva la identidad de registros importados aunque se edite su slug. Las empresas se crean como registros propios y las experiencias guardan su identificador; la API valida que exista. Esa referencia vive aún en JSON, sin clave foránea SQL: asociaciones, etiquetas y taxonomías requerirán relaciones formales al ampliar el CMS.

## Migración segura

- Importación inicial real: cinco artículos, certificaciones de `data.js`, perfil para `home`, texto principal de «Sobre mí», empresa/puesto ya publicados, formación INTEC, dos reconocimientos, tres tarjetas de eventos y habilidades ya visibles. Los ejemplos ficticios de la especificación no se han cargado.
- Varias secciones de `Sobre mí`, `Methodica` y el resto de la portada siguen visibles desde el código. Falta extraer y cotejar servicios, imágenes, proyectos y otros textos campo por campo.
- Conservar URLs existentes. Los slugs de páginas nuevas no pueden ocupar rutas reservadas.
- Antes de retirar contenido estático: inventariar fechas, títulos, enlaces, fotos y documentos; respaldar; migrar; comparar; y probar páginas públicas.

## Costos y riesgos

No se añadieron dependencias npm ni se activaron servicios pagados. Un backend AWS nuevo puede generar cargos por API Gateway, Lambda, DynamoDB, S3, CloudFront, Cognito, logs y transferencia. No se puede garantizar costo cero sin medir uso y revisar la cuenta. La API local no debe exponerse públicamente como solución de producción.

## Plan y estado

| Fase | Estado | Resultado |
| --- | --- | --- |
| 1 Auditoría | Realizada | Código, rutas, DNS, dependencias, contenido y riesgos. |
| 2 API/persistencia | Parcial local | SQLite, CRUD, revisiones, media, lecturas públicas. Falta backend y almacenamiento AWS. |
| 3 Seguridad | Parcial local | scrypt, MFA TOTP, cookie HttpOnly, CSRF, autorización y límite de login. Falta recuperación y auditoría de seguridad. |
| 4 Dashboard | Parcial local | Login, navegación, editores y conteos reales. |
| 5–9 Contenido | Parcial local | CRUD genérico, rutas públicas y bandeja de contacto. Faltan relaciones, editores completos y migración total. |
| 10 Analítica | Parcial local | Vistas agregadas con consentimiento; no sesiones ni visitantes únicos. |
| 11–13 Producción | Pendiente | Migración completa, pruebas, DNS, TLS, respaldos y despliegue. |

## Próximos pasos

1. Migrar el contenido real restante sin perder páginas ni URLs.
2. Seleccionar/provisionar almacenamiento de producción y adaptar la API con respaldos verificables.
3. Terminar recuperación, sesiones, permisos y revisión de seguridad.
4. Completar galerías, editores especializados, SEO, contacto y analítica.
5. Probar en staging HTTPS antes de cambiar DNS.
