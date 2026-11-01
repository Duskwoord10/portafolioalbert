# Staging AWS del CMS

**Estado (2026-10-21): staging desplegado; cuenta permanente creada, MFA propietario pendiente; sin conexión a producción.** Cuenta `479324457361`, perfil `default`, región `us-east-1`. No se modificaron CloudFront público, `albertsanflepage`, Route 53, certificados ni recursos `portfolio-dev-*`.

- Panel temporal HTTPS: <https://d34buqdfi1n3fd.cloudfront.net/admin>
- API temporal HTTPS: <https://uueaour2lh.execute-api.us-east-1.amazonaws.com>
- Stacks: `albert-cms-staging-admin` y `albert-cms-staging-api`, ambos `UPDATE_COMPLETE` tras corregir errores de staging.
- DynamoDB: `albert-cms-staging-api-CmsTable-IRPMELF0742D`.
- S3 multimedia: `albert-cms-staging-api-cmsmedia-y63puile7rsz`.
- S3 panel y artefactos privados: `albert-cms-staging-admin-adminbucket-r2ewomkezzh1`.
- CloudFront staging: `EEAXQEWMR2OQL`. SSM SecureString `/albert-cms/staging/totp-key`, versión 1, tier Standard, con clave `aws/ssm`.

## Inventario verificado

- Sitio público: distribución CloudFront `E15DL0KDZ9463N`, origen S3 `albertsanflepage`, alias `albertsanfle.com` y `www.albertsanfle.com`. Conservarla intacta.
- Route 53: zona `Z08027842MX62PVBRC3IM`. No existe registro `auth.albertsanfle.com`.
- Certificado ACM `0a7e26b6-fd9d-48f3-bfb0-1c989f7b6086`: cubre apex y `www`, pero no `auth.albertsanfle.com`. Staging usará el dominio HTTPS de CloudFront sin alias.
- Hay Lambdas de chatbot de Albert Sanfle, pero ninguna corresponde a esta API CMS Node. No conviene reutilizarlas.
- Hay tablas, buckets, Lambdas, API y stacks llamados `portfolio-dev-*`. Corresponden a `andresalvarezh.com`; **no reutilizarlos** ni migrar allí datos del CMS.
- No se encontró una tabla, bucket, HTTP API o distribución administrativa apta para staging CMS. `AdministratorAccess` está adjunto al grupo del usuario actual; usar en un futuro un rol de despliegue limitado.

El inventario inicial fue de lectura. La validación posterior se hizo únicamente sobre los nuevos recursos de staging.

## Recursos propuestos, separados de producción

Stack `albert-cms-staging-api` (`infra/aws/template.yaml`): tabla DynamoDB bajo demanda con GSI y TTL, bucket S3 privado y versionado, Lambda Node 22, HTTP API, grupo de logs de 14 días y alarma de errores. Stack `albert-cms-staging-admin` (`infra/aws/admin-template.yaml`): bucket privado, acceso OAC y distribución CloudFront con `/api/*` sin caché. Ese mismo bucket almacena los artefactos de despliegue Lambda fuera del prefijo `site/`. CloudFront sólo puede leer `site/*`; así se conservan **dos stacks y dos buckets**, sin un stack SAM auxiliar. Se requiere además un parámetro SSM `SecureString` `/albert-cms/staging/totp-key` para la clave MFA. La plantilla API concede sólo `ssm:GetParameter` sobre ese nombre. El valor no va en CloudFormation ni en el comando de despliegue. Para el parámetro se propone la clave administrada `aws/ssm`; antes de producción evaluar una clave KMS propia y rotación.

El presupuesto opcional de la plantilla quedó filtrado por la etiqueta de costo `Project=AlbertSanfleCMS`; requiere que el pagador active esa etiqueta antes de usarse y no detiene cargos. La alarma de errores sólo aparece en CloudWatch. Las políticas de ejecución de Lambda están limitadas a su tabla, índice, prefijo `media/*` y parámetro MFA. El usuario o rol que despliegue CloudFormation requiere permisos de creación más amplios, que deben delimitarse antes de ejecutarlo.

## Estimación de gasto

Escenario de referencia: 10 000 llamadas HTTP API, 1 GB DynamoDB, 1 GB S3, 1 GB de salida CloudFront y Lambda de 100 ms a 512 MB durante un mes. HTTP API ronda **US$0,01**, DynamoDB almacenamiento ronda **US$0,25** y S3 almacenamiento ronda **US$0,02–0,03**, más sus operaciones. Una alarma estándar puede sumar alrededor de **US$0,10**. Lambda, CloudFront, logs, SSM/KMS, transferencia, versiones S3 y copias pueden añadir cargos. La estimación orientativa de staging pequeño es **menos de US$5/mes si el tráfico es bajo y la cuenta conserva franquicias**, pero no es un límite garantizado. Esta cuenta tiene otras cargas que comparten franquicias. La plantilla usa facturación normal de CloudFront y no selecciona automáticamente su plan gratuito. Fuentes: [API Gateway](https://aws.amazon.com/api-gateway/pricing/), [Lambda](https://aws.amazon.com/lambda/pricing/), [DynamoDB](https://aws.amazon.com/dynamodb/pricing/), [S3](https://aws.amazon.com/s3/pricing/), [CloudFront](https://aws.amazon.com/cloudfront/pricing/), [CloudWatch](https://aws.amazon.com/cloudwatch/pricing/), [Budgets](https://aws.amazon.com/aws-cost-management/aws-budgets/pricing/), [Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html).

## Secuencia de despliegue ejecutada

El usuario autorizó staging el 2026-10-20. Los comandos siguientes muestran el procedimiento reproducible desde PowerShell. El parámetro `SecureString` se creó con 32 bytes aleatorios en memoria y sin imprimir la clave; no pegarla en Git, historial de terminal, parámetros CLI ni logs. Antes de repetir `sam deploy`, crear un conjunto de cambios con `--no-execute-changeset` y revisar los recursos.

```powershell
aws sts get-caller-identity --profile default --region us-east-1
npm run backup:create
npm run backup:verify
npm run migration:export
npm run migration:aws
npm run build:lambda
sam validate --lint --template-file infra/aws/template.yaml
sam validate --lint --template-file infra/aws/admin-template.yaml
```

Tras crear y verificar `/albert-cms/staging/totp-key` como `SecureString` por un canal protegido:

```powershell
sam deploy --template-file infra/aws/admin-template.yaml --stack-name albert-cms-staging-admin --region us-east-1 --profile default --capabilities CAPABILITY_IAM --parameter-overrides ApiDomainName=staging.invalid
$adminBucket = aws cloudformation describe-stacks --stack-name albert-cms-staging-admin --region us-east-1 --profile default --query "Stacks[0].Outputs[?OutputKey=='AdminBucketName'].OutputValue | [0]" --output text
$adminDomain = aws cloudformation describe-stacks --stack-name albert-cms-staging-admin --region us-east-1 --profile default --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomain'].OutputValue | [0]" --output text
sam deploy --template-file infra/aws/template.yaml --stack-name albert-cms-staging-api --region us-east-1 --profile default --s3-bucket $adminBucket --s3-prefix lambda-artifacts --capabilities CAPABILITY_IAM --parameter-overrides "PublicOrigin=https://$adminDomain" "AdminOrigin=https://$adminDomain" TotpKeyParameterName=/albert-cms/staging/totp-key
$apiUrl = aws cloudformation describe-stacks --stack-name albert-cms-staging-api --region us-east-1 --profile default --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue | [0]" --output text
$apiDomain = ([uri]$apiUrl).Host
sam deploy --template-file infra/aws/admin-template.yaml --stack-name albert-cms-staging-admin --region us-east-1 --profile default --capabilities CAPABILITY_IAM --parameter-overrides ApiDomainName=$apiDomain
$env:VITE_CMS_API_URL = ''
npm run build
aws s3 sync dist/ "s3://$adminBucket/site/" --region us-east-1 --profile default
```

Tomar `ApiUrl` de las salidas del stack API y usar **sólo su host** como `ApiDomainName`. Desplegar `albert-cms-staging-admin` con `AdminHostname` y `CertificateArn` vacíos. La primera creación usa `staging.invalid` como origen de API temporal inaccesible; actualizarlo al host real inmediatamente después de crear la API. Subir `dist/` al prefijo `site/` y comprobar que la ruta `lambda-artifacts/` no es visible por CloudFront. Verificar cookies, CSRF y CORS antes de iniciar sesión. No tocar la distribución pública ni Route 53.

## Resultados reales de staging

- Backups: SQLite respaldado y verificado en `.cms-backups/2026-10-21T01-26-01-535Z-6a1638a0`. Exportación `.cms-exports/2026-10-21T01-26-12-689Z-2c5ea125`: 122 elementos, incluidos 44 contenidos y 44 reservas de URL; sin administradores ni medios. Migración aplicada: 122 escritos; escaneo DynamoDB confirmó 122 antes de las pruebas.
- API Gateway/Lambda: `/api/health` devolvió 200. CloudFront `/admin` y `/api/health` devolvieron 200; `/` redirige a `/admin`. Navegador real mostró login y cinco artículos migrados en `/blog`. La configuración Lambda contiene sólo `CMS_TOTP_KEY_PARAMETER`; no contiene `CMS_TOTP_ENCRYPTION_KEY`.
- S3: bucket multimedia con bloqueo público completo, AES256 y versionado. Imagen de 68 bytes subida y recuperada con SHA-256 idéntico; URL S3 sin firma devolvió 403. La prueba autenticada subió otra imagen por API y recuperó los mismos bytes. Al cambiarla a privada, el acceso anónimo devolvió 401 y la sesión recibió una URL firmada temporal que descargó los bytes exactos. El bucket del panel concede lectura CloudFront sólo a `site/*`; `/lambda-artifacts/*` responde 404.
- Autenticación y contenido: `npm run test:staging` pasó dos veces login, MFA, código de recuperación, revocación de sesión, borrador/publicación/edición/lectura pública de empresa, experiencia, proyecto, certificación, evento, blog y página, carga de imagen, resumen del dashboard, papelera y logout. La segunda ejecución añadió el medio privado con URL firmada. Acceso administrativo anónimo: 401; origen público en `/api/session`: 403. Las cuentas temporales se retiraron y el contenido técnico quedó en papelera. Los conteos públicos finales permanecen en 1 experiencia, 0 proyectos, 4 certificaciones, 3 eventos, 5 artículos y 0 páginas. El escaneo total de la tabla es 273 después de revisiones, auditoría y pruebas.
- Correcciones durante staging: CloudFront rechazó la primera política API sin caché; se sustituyó por políticas administradas y el intento fallido se revirtió. Lambda falló inicialmente por CommonJS en paquete ESM; se añadió `createRequire`. DynamoDB rechazó `ttl` sin alias en una expresión; se corrigió, junto con `access` de multimedia. Las pruebas se repitieron después.
- Alarma `albert-cms-staging-api-CmsApiErrors-bVAhIsGGZNfG`: `OK`, errores Lambda en ventana de 5 minutos. No tiene canal de notificación configurado.

## Administrador propietario y presupuesto pendientes

La base local migrada tenía **cero administradores**. La prueba usó una cuenta aleatoria efímera y la retiró. Se utilizó este procedimiento para crear la cuenta real de staging sin transmitir contraseña por chat:

```powershell
$env:AWS_PROFILE = 'default'
$env:AWS_REGION = 'us-east-1'
$env:CMS_DATA_BACKEND = 'dynamodb'
$env:CMS_DYNAMODB_TABLE = 'albert-cms-staging-api-CmsTable-IRPMELF0742D'
node server/create-admin.js TU_CORREO
```

El comando solicita una contraseña de al menos 14 caracteres sin mostrarla. Luego iniciar sesión en la URL de staging y configurar MFA desde el panel. No crear otra cuenta mediante escritura manual en DynamoDB.

El presupuesto de US$5 **no se creó**: la versión inicial de la plantilla sumaba toda la cuenta, que ya llevaba US$48,126 de gasto agregado ese mes. Esa definición se corrigió para filtrar por etiqueta del CMS, pero la cuenta vinculada no permite verificar o activar etiquetas de asignación de costos. Quedan pendientes la activación por el pagador y un correo confirmado; no modificar facturación global sin autorización separada.

## Límites

- `npm test`: 8/8; prueba local de MFA, publicaciones, protección administrativa, adaptadores, migración y validación de la clave SSM. `npm run build:lambda` compiló el nuevo cliente SSM. Ambas plantillas aprobaron `sam validate --lint`.
- SSM, DynamoDB, S3, API Gateway y CloudFront quedaron probados en staging. La restauración aislada se verificó en la continuación del 2026-10-21; falta medir el costo real tras varios días.
- Las cargas S3 pasan por la API. Las descargas privadas usan URL firmada temporal tras comprobar permisos; todavía no hay URL firmada de **subida**.
- El flujo de recuperación usa un código de un solo uso generado desde una sesión autenticada y MFA. Si se pierde ese código y el acceso, se requiere un procedimiento administrativo fuera de banda.
- El certificado actual no sirve para `auth.albertsanfle.com`. Certificado nuevo, DNS y publicación final requieren autorización distinta después de aprobar staging. El sitio público de producción no consume aún la API de staging.

## Continuación 2026-10-21: cuenta, restauración y costos

- **Cuenta propietaria:** se abrió una terminal local visible con `scripts/setup-staging-admin.ps1`, que verificó cuenta `479324457361` y región `us-east-1` y llamó al comando interactivo documentado. DynamoDB confirma que existe un administrador permanente, sin imprimir correo ni credenciales. La contraseña se escribió directamente en la terminal, sin eco. La comprobación booleana de `scripts/staging-admin-status.js` indica **MFA pendiente**; el acceso autenticado desde navegador y las pruebas con esa cuenta aún no están verificados. El propietario debe iniciar sesión en el panel temporal, dejar el código MFA vacío la primera vez y completar el registro TOTP. El formulario de recuperación requiere un código generado después de activar MFA y no sirve para el primer acceso.
- **Respaldo DynamoDB:** copia nativa `arn:aws:dynamodb:us-east-1:479324457361:table/albert-cms-staging-api-CmsTable-IRPMELF0742D/backup/01792548614881-20b2440e`, estado `AVAILABLE`. Restauración a tabla aislada `albert-cms-staging-restore-20261021`, bajo demanda. No se reemplazó la tabla activa.
- **Archivos:** se copiaron los tres objetos `media/*` actuales a `albert-cms-staging-restore-479324457361-20261021`. El bucket nuevo tiene bloqueo público completo, SSE-S3, versionado y propiedad `BucketOwnerEnforced`. `scripts/verify-staging-restore.js` comparó 269 registros duraderos y tres hashes SHA-256: cero ausentes, extras o distintos. Un contador `RATE` apareció en la tabla activa tras el respaldo; sesiones y contadores temporales se excluyen de la comparación de contenido duradero. La restauración no se conectó a ninguna API. Los recursos de ensayo se conservan; generan almacenamiento y deben tener una decisión de retención posterior. Antes de un corte real, revocar sesiones restauradas y verificar que no se vuelvan a aceptar tokens antiguos.
- **Costos:** etiquetas `Project=AlbertSanfleCMS` y `Environment=staging` aplicadas mediante cambios revisados, sin reemplazos, a ambos stacks; `albert-cms-staging-admin` y `albert-cms-staging-api` quedaron `UPDATE_COMPLETE`. Se verificaron CloudFront, bucket administrativo y Lambda. La copia aislada se etiquetó como `staging-restore`. La plantilla API ahora define un presupuesto **condicional** filtrado por `user:Project$AlbertSanfleCMS`, pero `BudgetEmail` sigue vacío y no se creó presupuesto. `ce:ListCostAllocationTags` devolvió `AccessDeniedException` porque la cuenta vinculada no puede administrar etiquetas de facturación. El pagador debe activar la etiqueta `Project` para informes de costos y confirmar un correo antes de activar el presupuesto; no modificar uno global.
- **Panel:** se corrigió el límite visual de multimedia en el host de staging de 10 MB a los 4 MB que realmente admite Lambda, y se limpia el selector tras cada intento. El formulario de recuperación aclara que no sirve para un primer acceso sin MFA y código de recuperación previo. Se compiló y subió `dist/` sólo a `site/` del bucket administrativo de staging; CloudFront puede mantener la versión anterior hasta agotar sus 300 segundos de caché. `npm test` 8/8, lint y build aprobaron. Tras la actualización de etiquetas, `/api/health` respondió 200 y escrituras anónimas 401; hubo un 503 transitorio durante la actualización y la repetición de lectura anónima respondió 401.
- **Dominio definitivo:** pasos y recursos en [CMS_DOMINIO_FINAL.md](CMS_DOMINIO_FINAL.md). No se solicitó certificado, no se tocó Route 53 ni el sitio público.

### Diagnóstico del acceso permanente (2026-10-21)

El administrador permanente está en la tabla de este stack: correo exacto y normalizado, índice de búsqueda coincidente, rol `superadmin`, hash/sal con el formato de `scrypt` del servidor y MFA todavía sin configurar. No se observó bloqueo por intentos. Lambda usa la misma tabla; CloudFront sirve el panel y dirige `/api/*` al HTTP API de staging. Una petición anónima de prueba devolvió 401 genérico con CORS correcto y sin sesión. Esta inspección no permite comprobar la contraseña privada del propietario ni atribuir todavía una causa exacta al 401.

Para comprobarla en la terminal personal, desde la raíz del repositorio:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/repair-staging-admin.ps1
```

El procedimiento verifica cuenta y región, solicita la contraseña **sin eco**, compara con el hash almacenado y prueba HTTPS de staging. Si la contraseña no coincide, pide una nueva dos veces sin eco y actualiza condicionalmente **sólo** el hash y la sal de esa cuenta, incrementa su versión de autenticación e incorpora un evento de auditoría. No crea otra cuenta ni cambia MFA. La contraseña nunca debe copiarse al chat. Comunicar únicamente el resultado HTTP y el estado general que muestra la terminal. Si el HTTPS responde 200, entrar al panel sin código MFA, registrar TOTP en una aplicación autenticadora y confirmar allí un código; después cerrar sesión y repetir el acceso con MFA. La recuperación mediante código requiere MFA ya activado y un código de recuperación previamente guardado.

La terminal se verificó hasta el aviso de contraseña sin introducirla; no hubo restablecimiento ni verificación de acceso propietario. Se esperan esas interacciones antes de considerar resuelto el incidente. Dos ventanas abiertas previamente se cerraron sin registro de restablecimiento, por lo que se recomienda ejecutar el comando directamente en una terminal que permanezca visible.

Las plantillas de API y administrador aprobaron `sam validate --lint`; `npm test` pasó 8/8, lint y builds de Vite y Lambda aprobaron. Ambas pilas siguen `UPDATE_COMPLETE`. Se repitió la comparación de restauración: 269 registros duraderos y tres archivos idénticos por SHA-256, sin diferencias; la tabla restaurada y el bucket aislado permanecen y pueden generar cargos de almacenamiento. No eliminar sin autorización.

### Restablecimiento automático en Windows

El procedimiento anterior de entrada manual permanece disponible como alternativa, pero el comando principal ya genera una contraseña aleatoria de 28 caracteres y la guarda como credencial genérica `AlbertSanfleCMS/staging/asanfle@methodicatechnology.com` del usuario actual de Windows. El secreto permanece en memoria y viaja al proceso Node por stdin; no aparece en argumentos, archivos del repositorio ni salida. El script confirma la cuenta AWS `479324457361`, la región `us-east-1`, el administrador exacto y su estado MFA pendiente antes de actualizar sólo hash, sal y versión de sesión mediante transacción condicional con auditoría. Si MFA ya está activado, se detiene para no saltarlo. Comprueba después el login HTTPS (HTTP 200) y cierra la sesión técnica.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/repair-staging-admin.ps1
```

Después, copiar el secreto al portapapeles local sin mostrarlo en consola:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/get-staging-admin-password.ps1
```

El segundo comando limpia el portapapeles después de 45 segundos si no ha cambiado. Se puede repetir cuando haga falta. La credencial Windows persiste para ese usuario **en ese equipo**; cualquier proceso con acceso a esa sesión de Windows puede leerla, por lo que debe mantenerse protegida. El historial o la sincronización de portapapeles del equipo pueden conservar copias fuera de este script; desactivar esas funciones si se requiere máxima privacidad. Nunca pegar la contraseña en el chat.

El mecanismo se probó localmente con 50 contraseñas generadas, una entrada temporal de Windows que se creó, leyó y eliminó, y un perfil AWS ficticio rechazado por el canal stdin antes de llamar AWS. `npm test` pasó 8/8, lint y compilación Lambda aprobaron. **El restablecimiento real y el HTTP 200 de la cuenta permanente todavía no se han ejecutado**; requieren lanzar el comando principal. Después de obtener HTTP 200, entrar al panel con el correo permanente y la contraseña copiada, dejar MFA vacío la primera vez, registrar TOTP y confirmar el código en el navegador.
