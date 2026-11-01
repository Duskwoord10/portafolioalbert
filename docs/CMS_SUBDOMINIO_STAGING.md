# Preparación de `auth.albertsanfle.com`

Estado: diseño y lista de recursos. **No se ha creado ni modificado DNS, CloudFront, certificados, bases, buckets o servicios de pago.** La cuenta AWS privada no es visible desde este entorno.

## Recursos que se necesitan antes de publicar

1. Confirmar en la cuenta AWS el ID de la zona hospedada de `albertsanfle.com`, distribución CloudFront y bucket del sitio público, región y presupuesto. No reutilizar permisos de publicación pública para archivos privados.
2. Certificado ACM en `us-east-1` que cubra `auth.albertsanfle.com` (y el dominio de API si se elige uno). Validación DNS en Route 53.
3. Origen estático privado S3 para el build del administrador, protegido por CloudFront Origin Access Control. La plantilla permite primero una distribución de staging con el dominio HTTPS de CloudFront y sin alias; `auth.albertsanfle.com` se configura sólo tras pruebas y autorización. La compilación actual contiene sitio público y panel en un mismo bundle; antes del despliegue final conviene generar un entrypoint exclusivo para el administrador y reducir peso.
4. API HTTPS con Lambda + API Gateway HTTP API, una vez reescrita la capa de datos. Comportamiento CloudFront `/api/*` en **ambos** dominios y `/sitemap.xml` en el dominio público hacia la API. Reenviar los encabezados necesarios (`Origin`, `Cookie`, `X-CSRF-Token`, `Content-Type`), método y cuerpo; desactivar caché en sesiones, escrituras y respuestas privadas. Validar políticas concretas con pruebas de staging.
5. DynamoDB con tablas/índices diseñados y presupuestados, S3 duradero para medios públicos y privados, permisos IAM mínimos. Considerar un origen CloudFront separado para medios públicos; los documentos privados requieren autorización de backend o URLs firmadas de vida corta. Cifrado, versionado, copias y retención definidos antes del corte.
6. Route 53: registro `A`/`AAAA` Alias para `auth.albertsanfle.com` hacia la distribución administrativa sólo después de pruebas y autorización. No desviar el apex existente hasta verificar el origen API y las rutas.
7. Variables/secretos del backend: orígenes HTTPS permitidos, tabla(s), bucket(s), clave de cifrado MFA, correo de recuperación, cuenta inicial creada mediante proceso privado. Guardar secretos en servicio apropiado, no en Vite, Git ni variables públicas.

## Aislamiento de sesión

La opción preferida es que el navegador llame a `/api` en el **mismo host**: `auth.albertsanfle.com/api` para administración y `albertsanfle.com/api/public` para lectura pública. La cookie `cms_session` debe ser host-only, `HttpOnly`, `Secure`, `SameSite=Strict`, con `Path=/api`, sin atributo `Domain`. Así la cookie del administrador no acompaña peticiones al host público. Configurar `VITE_CMS_API_URL` vacío para esos builds y comprobar CSRF/CORS con los dos orígenes HTTPS. La API debe verificar permisos en cada operación, aunque CloudFront la enrute.

## Puertas de salida antes del cambio DNS

- Inventario y respaldo verificable de SQLite y archivos; exportación e importación en staging con conteos, slugs, estados y hashes idénticos.
- Pruebas de sesión, MFA, expiración, publicación, borradores, vista pública y archivos privados desde dominios HTTPS de staging.
- Prueba de backup/restauración del destino y alerta de presupuesto; confirmar coste proyectado con AWS Pricing Calculator y elegibilidad de Free Tier.
- Comparar todas las URLs actuales, sitemap, robots, 404 y contenido antes/después; conservar reversión a distribución anterior.
- Aprobación del propietario para recursos facturables y cambios DNS de producción.

Las credenciales, IDs de recursos y valores DNS se completan después de inspeccionar la cuenta autorizada. La presencia de este documento no significa que la infraestructura esté desplegada.
