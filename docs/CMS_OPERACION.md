# Operación del CMS local

## Instalación

Requiere Node 22.17+ y npm. `node:sqlite` muestra una advertencia de experimentalidad. Los datos se guardan en `.cms-data/`, fuera de `dist` y excluidos de Git.

1. `npm install`.
2. En una terminal: `npm run dev:api`.
3. En otra: `npm run dev`.
4. Crear la primera cuenta: `npm run admin:create -- correo@dominio.com`. La contraseña única (mínimo 14 caracteres) se introduce en la terminal, sin valor predeterminado en el repositorio.
5. Abrir `http://localhost:5173/admin`, iniciar sesión y configurar MFA TOTP. Las escrituras están bloqueadas hasta activarlo.

En producción, «Olvidé mi contraseña» solicita por SES un código que vence en 15 minutos. El restablecimiento requiere también MFA si ya estaba activado y revoca las sesiones previas. En local, configurar `CMS_RECOVERY_FROM_EMAIL` y credenciales AWS con permisos de envío sobre una identidad SES verificada; sin remitente configurado, el endpoint devuelve 503. El código de recuperación guardado desde Seguridad sigue siendo una alternativa distinta y no se envía por correo.

`.env.example` documenta variables disponibles. El servidor aún no carga `.env` automáticamente; para otros valores hay que establecer variables de entorno al iniciar Node. `VITE_CMS_API_URL` se incorpora al build de Vite; en desarrollo `/api` usa el proxy Vite.

Para cifrar secretos TOTP, configurar `CMS_TOTP_ENCRYPTION_KEY` con 32 bytes aleatorios en hexadecimal en el entorno del servidor. Es obligatoria con `NODE_ENV=production`. También son obligatorios `CMS_PUBLIC_ORIGIN` y `CMS_ADMIN_ORIGIN` con HTTPS; se rechaza `CMS_SECURE_COOKIES=false`. No imprimir, versionar ni perder la clave: una clave perdida impide verificar MFA cifrado. Si ya existen secretos en texto plano, crear/verificar un respaldo y ejecutar `npm run security:migrate-totp -- RUTA_RESPALDO` (simulación), seguido de `npm run security:migrate-totp -- RUTA_RESPALDO --apply`. La API de producción rechaza arrancar con secretos MFA sin cifrar. Al migrar a AWS, sustituir esta variable por un mecanismo de secretos/KMS apropiado y probar rotación.

## Uso

Elegir módulo → nuevo registro → guardar borrador → vista previa → publicar. Solo `published` sale en `/api/public/*`. Las revisiones se restauran como borrador y eliminar mueve a papelera. Los cambios publicados se leen con `Cache-Control: no-store`, sin reconstruir el bundle.

Para agregar experiencia, crear primero una empresa en **Empresas** y después seleccionar esa empresa en **Experiencia**. Varios puestos pueden compartir el mismo registro de empresa.

La biblioteca acepta JPEG, PNG, WebP, AVIF y PDF hasta 10 MB. Los archivos se guardan en `.cms-data/media`. Permite texto alternativo, acceso público/privado, papelera y restauración. No deja ocultar ni retirar archivos vinculados a contenido activo. Faltan miniaturas, eliminación de EXIF y análisis antivirus; no subir documentos privados al ámbito público. La analítica almacena vistas y aperturas de CV por día y ruta únicamente tras consentimiento `all`; no almacena IP en SQLite ni promete visitantes únicos.

El formulario de contacto intenta guardar el mensaje en la API; si la API no está disponible conserva la salida anterior por `mailto:`. La bandeja local permite leer, marcar pendiente, archivar y mover a papelera. No hay correo de aviso configurado.

## Respaldo y restauración local

Ejecutar `npm run backup:create` para crear una instantánea SQLite mediante `VACUUM INTO`, copiar multimedia y generar un manifiesto con SHA-256 y conteos. Verificarla con `npm run backup:verify -- RUTA_DEL_RESPALDO`. Las copias quedan en `.cms-backups/` (configurable con `CMS_BACKUP_DIR`), excluidas de Git. Para que DB y multimedia representen exactamente el mismo instante, detener temporalmente la API o las subidas durante la copia. Guardar una copia cifrada fuera del equipo con acceso limitado.

Para restaurar, ejecutar `npm run backup:restore -- RUTA_DEL_RESPALDO`. Verifica la fuente, crea una copia nueva en `.cms-restores/` y la verifica otra vez; no sobreescribe la base activa. Detener la API original si se desea un corte coherente y apuntar `CMS_DB_PATH` y `CMS_MEDIA_DIR` de un entorno de staging a esa copia. Comprobar integridad, URLs y archivos antes de planear cualquier cambio de producción.

La evaluación de base y almacenamiento AWS está en [CMS_PERSISTENCIA_PRODUCCION.md](CMS_PERSISTENCIA_PRODUCCION.md). DynamoDB/S3 son la opción objetivo por coste variable, pero la API sigue usando SQLite y disco local.
La lista de recursos, DNS, TLS y pruebas de staging está en [CMS_SUBDOMINIO_STAGING.md](CMS_SUBDOMINIO_STAGING.md).

## Producción: pendiente obligatorio

- Confirmar hosting y base duradera. Nunca poner SQLite en el filesystem efímero de Lambda.
- Enrutar `/sitemap.xml` del dominio público a la API; el sitemap se genera desde contenido publicado. `robots.txt` ya anuncia esa ruta, pero el hosting estático actual no tiene todavía el enrutamiento dinámico.
- Crear almacenamiento público/privado, permisos IAM mínimos, DNS y TLS para `auth.albertsanfle.com` y la API.
- Configurar orígenes HTTPS, cookies Secure y `VITE_CMS_API_URL`; probar CORS/CSRF/cookies entre subdominios.
- Crear el administrador mediante proceso privado, configurar correo de recuperación, respaldos automáticos, logs y alertas.
- Migrar el contenido existente, probar URLs, archivos y restauración antes de retirar fuentes estáticas.
- El texto principal de «Sobre mí», la experiencia de Never Off Technology, la educación INTEC, dos reconocimientos, tres tarjetas de eventos y 25 habilidades se importan idempotentemente al CMS. Sus datos publicados se leen desde `/api/public/*`; otras secciones de esa página continúan en JSX.
- La analítica suma aperturas de CV consentidas por ruta/día; no calcula visitas, personas, países ni fuentes de tráfico.
- No se ha cambiado DNS ni desplegado este CMS en producción.

## Pruebas realizadas

`node --test server/cms.test.js`: importación, 401 sin sesión, bloqueo sin MFA, activación MFA, borrador, publicación, revisión, papelera, archivo, proyecto, página, menú, sitemap y contacto. `npm run build` compiló. `npm run lint` pasó.
