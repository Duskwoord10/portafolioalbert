# Preparación de `auth.albertsanfle.com`

Estado: **preparado, no ejecutado**. El panel de staging sigue en `https://d34buqdfi1n3fd.cloudfront.net/admin`. No se ha cambiado Route 53, el certificado público, CloudFront `E15DL0KDZ9463N`, el bucket `albertsanflepage` ni el sitio público.

## Recursos verificados

- Cuenta `479324457361`, región `us-east-1`; zona Route 53 `Z08027842MX62PVBRC3IM`.
- Distribución del CMS `EEAXQEWMR2OQL`, stack `albert-cms-staging-admin`.
- Certificado ACM actual `0a7e26b6-fd9d-48f3-bfb0-1c989f7b6086` cubre `albertsanfle.com` y `www.albertsanfle.com`; **no** cubre `auth.albertsanfle.com`.
- `infra/aws/admin-template.yaml` admite `AdminHostname` y `CertificateArn`, con TLS mínimo 1.2 y SNI. La API permite un único `CMS_ADMIN_ORIGIN` mediante parámetro `AdminOrigin` de `infra/aws/template.yaml`.

## Secuencia propuesta tras autorización específica

1. Solicitar un certificado ACM **nuevo** para `auth.albertsanfle.com` en `us-east-1`, con validación DNS. No sustituir el certificado del sitio público.
2. Crear sólo el CNAME de validación que ACM indique en la zona verificada. Esperar estado `ISSUED` y comprobar el nombre y ARN.
3. Preparar un cambio de CloudFormation para el stack administrativo existente con `AdminHostname=auth.albertsanfle.com` y `CertificateArn=<ARN_NUEVO>`. Revisar que cambie solamente la configuración de su propia distribución; ejecutar y esperar `Deployed`.
4. Actualizar el stack API con `AdminOrigin=https://auth.albertsanfle.com`, conservar el origen público previsto y el parámetro MFA. Revisar el conjunto de cambios para descartar reemplazo de DynamoDB, S3 o Lambda. Desplegar primero la configuración de CORS/cookies y comprobar login, MFA, CSRF y logout sobre el nuevo host.
5. Crear un alias A/AAAA de Route 53 para `auth.albertsanfle.com` apuntando **sólo** a `EEAXQEWMR2OQL`. Confirmar HTTPS, certificado, rutas SPA y proxy `/api/*` desde navegador.
6. Mantener intacto `E15DL0KDZ9463N` y `albertsanflepage`. La conexión del portafolio público a la API y la migración a producción requieren una aprobación y un plan separados.

Antes del corte final deben aprobarse los flujos de contenido, respaldo, costos y seguridad con la cuenta propietaria. El dominio temporal de CloudFront permanecerá como ruta de recuperación durante la verificación, sujeto a la configuración de origen permitido de la API. Una vez finalizada, revisar si conviene restringirlo, sin eliminarlo prematuramente.
