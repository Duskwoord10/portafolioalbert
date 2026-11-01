# Integración AWS del CMS — estado y operación

Estado: código preparado y probado localmente; **sin despliegue ni importación en AWS**. En este entorno no hay perfil, región ni credenciales AWS configuradas para inventariar recursos de la cuenta. No se han creado tablas, buckets, funciones, distribuciones, certificados o registros DNS.

El plan aislado y la estimación previa a cualquier creación están en [CMS_STAGING_AWS.md](CMS_STAGING_AWS.md). La plantilla administrativa admite staging sin alias DNS ni certificado propio; la API exige orígenes HTTPS explícitos.

## Arquitectura implementada

- `server/index.js` usa un repositorio común. `CMS_DATA_BACKEND=sqlite` conserva la base local; `dynamodb` usa `server/store/dynamo.js`. La API, autenticación, validaciones y rutas son las mismas.
- DynamoDB usa una tabla `pk`/`sk` y GSI `gsi1` para contenido por tipo, correo de administrador, sesiones, mensajes y media. Slugs reservados por registros `SLUG#...`; las publicaciones, revisiones y cambios de slug se escriben juntos mediante transacciones condicionales. El contador de abuso tiene TTL. Los eventos analíticos con ID aleatorio se deduplican mediante una transacción con TTL, sin guardar IP.
- `CMS_MEDIA_BACKEND=local` conserva archivos locales; `s3` almacena objetos bajo `media/` en un bucket privado, con cifrado SSE-S3 y escritura condicional. La API valida formato y tamaño; la descarga devuelve una URL de lectura firmada de 60 segundos. En Lambda la carga se limita a 4 MB por el límite de payload; archivos grandes requerirán carga directa firmada y confirmación posterior.
- `server/lambda.js` adapta API Gateway HTTP API payload 2.0 al enrutador existente. `npm run build:lambda` genera sólo el paquete de código en `.aws-build/`, sin bases ni respaldos.
- `infra/aws/template.yaml` define API HTTP, Lambda, tabla, bucket privado y permisos mínimos. `infra/aws/admin-template.yaml` define bucket privado, CloudFront/OAC y proxy `/api/*` para `auth.albertsanfle.com`. Ambos recursos quedan **sin crear**.

## Migración sin borrar la fuente

1. Detener temporalmente las ediciones y subidas durante la instantánea. Ejecutar `npm run backup:create` y `npm run backup:verify -- RUTA_RESPALDO`.
2. Si hay secretos TOTP existentes, exigir `CMS_TOTP_ENCRYPTION_KEY` estable y ejecutar antes `security:migrate-totp` con respaldo verificado. Conservar la clave fuera del repositorio.
3. Ejecutar `npm run migration:export -- RUTA_RESPALDO`. El JSONL conserva IDs, fechas, estados, revisiones, auditoría, importaciones de semillas, media, mensajes y agregados analíticos; omite sesiones deliberadamente.
4. Ejecutar `npm run migration:aws -- RUTA_EXPORTACION` para comprobar hashes, formato, tamaño de elementos y copias multimedia **sin acceso a AWS**.
5. En una cuenta y stack de staging autorizados, asignar credenciales temporales con `infra/aws/migrator-policy.example.json`, configurar `CMS_DYNAMODB_TABLE`, `CMS_S3_BUCKET`, `CMS_BACKUP_DIR` y `CMS_MIGRATION_APPLY=YES`, y ejecutar `npm run migration:aws -- RUTA_EXPORTACION --apply`. El importador hace una comprobación previa de conflictos, usa escrituras condicionales y omite elementos u objetos idénticos al reejecutarse. Ante una diferencia se detiene sin sobrescribirla.
6. Comparar conteos, slugs, revisiones y hashes de S3; después probar login, MFA, borrador, publicación, lectura pública, medios y papelera en staging. Mantener SQLite y los archivos originales para recuperación.

Los respaldos y exportaciones incluyen datos privados. Mantenerlos fuera de Git, cifrados y con acceso restringido. Si la instantánea no contiene un administrador, configurar `CMS_DATA_BACKEND=dynamodb` en el entorno de una terminal interactiva con credenciales de staging y permisos temporales según `infra/aws/bootstrap-policy.example.json`, ejecutar `npm run admin:create -- correo@dominio` y configurar MFA al primer acceso. No existe contraseña predeterminada.

## Preparación de despliegue

1. Con acceso de sólo lectura, inventariar cuenta y región (`aws sts get-caller-identity`, CloudFront, Route 53, ACM, API Gateway, DynamoDB y S3). Elegir nombres y recursos reutilizables. Este paso aún no se pudo ejecutar.
2. Estimar cargos y crear un presupuesto/alerta. Confirmar región, certificado ACM en `us-east-1`, dominio y política de respaldos. La creación de recursos requiere autorización expresa.
3. Compilar con `npm ci`, `npm run build:lambda`, `npm run build`; validar con `sam validate --template-file infra/aws/template.yaml --lint`. Crear previamente un parámetro SSM `SecureString` con la clave MFA mediante un canal privado. Desplegar sólo staging autorizado con `TotpKeyParameterName=/albert-cms/staging/totp-key`; la plantilla permite a la Lambda leer únicamente ese parámetro. No pasar la clave literal a CloudFormation, comandos versionados ni archivos. Consultar `docs/CMS_STAGING_AWS.md` para el inventario, costos y secuencia actual.
4. Ejecutar la migración en staging y los flujos reales. El sitio público también necesitará rutas CloudFront `/api/*` y `/sitemap.xml` hacia la misma API; por ahora **no se han modificado**. Ambas distribuciones deben desactivar caché para `/api/*` y enviar Origin, Content-Type, X-CSRF-Token, cookies y parámetros de consulta. Mantener la cookie host-only con Secure, HttpOnly, SameSite=Strict.
5. Con un certificado ya validado, desplegar `infra/aws/admin-template.yaml`, subir el build Vite con `VITE_CMS_API_URL` vacío a su bucket, comprobar `/admin` y `/api/health` en el dominio de CloudFront. Sólo después cambiar el alias Route 53 de `auth.albertsanfle.com` con autorización. Probar CORS, CSRF y rutas SPA antes del corte público.
6. Documentar un procedimiento de exportación DynamoDB y S3, retención, restauración en tabla/bucket nuevos y simulacros. No habilitar borrado de stack de datos; ambos recursos tienen `Retain`.

## Costos y límites

La plantilla usa DynamoDB bajo demanda, S3 Standard, Lambda, API Gateway HTTP API, CloudWatch Logs y, para el administrador, CloudFront. **Todos pueden generar cargos** al desplegarse. Para una referencia de 100 000 llamadas API/mes, API Gateway HTTP API rondaría USD 0,10 antes de franquicias y ajustes por tamaño; Lambda cobra solicitudes y tiempo, con franquicia mensual según cuenta. DynamoDB publica ejemplos en us-east-1 de USD 0,625 por millón de escrituras de 1 KB y USD 0,125 por millón de lecturas de 1 KB; GSI, transacciones, tamaño de ítems y almacenamiento añaden consumo. S3 añade almacenamiento, solicitudes, versiones y salida de datos. CloudFront, logs, certificado/dominio y transferencia varían con uso y plan. Calcular con volúmenes reales y la región elegida antes de autorizar un stack.

Fuentes: [DynamoDB](https://aws.amazon.com/dynamodb/pricing/), [S3](https://aws.amazon.com/s3/pricing/), [Lambda](https://aws.amazon.com/lambda/pricing/), [API Gateway](https://aws.amazon.com/api-gateway/pricing/), [CloudFront](https://aws.amazon.com/cloudfront/pricing/).

## Validación y pendientes

Pasaron siete pruebas automatizadas de API local, Lambda con SQLite, transacciones DynamoDB simuladas, firma S3 sin red e integridad de respaldo multimedia simulado; también pasaron la simulación de migración de 122 ítems, lint, build Vite y validación estricta de ambas plantillas. **No se ha probado DynamoDB/S3 contra AWS real**; tampoco se ha probado el dominio, DNS, CloudFront ni la migración con archivos de la base existente, porque esa base local contiene cero archivos multimedia. El primer despliegue debe hacerse en staging.

La recuperación mediante código de un solo uso y MFA está implementada y probada con SQLite; falta verificarla contra DynamoDB real. No existe recuperación por correo. Los editores de proyectos y artículos consultan vistas reales consentidas de los últimos 30 días. Siguen pendientes la optimización/limpieza de EXIF, las subidas directas de archivos grandes, paginación de mensajes y consultas auxiliares, métricas de visitantes/país/fuentes, pruebas visuales del panel y varios editores de contenido. Las listas de contenido y medios ya admiten `?limit=1..100&cursor=...`; el panel usa estos cursores en las listas principales y en el selector multimedia. No se muestran cifras ficticias.
