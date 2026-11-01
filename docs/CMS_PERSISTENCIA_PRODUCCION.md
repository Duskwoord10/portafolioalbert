# Decisión de persistencia para producción

**Actualización 2026-10-20:** el adaptador DynamoDB/S3, la API Lambda, el importador y las plantillas están implementados localmente. Consultar [CMS_AWS_DESPLIEGUE.md](CMS_AWS_DESPLIEGUE.md) para el estado comprobado y los pasos pendientes. Esta evaluación histórica conserva las alternativas consideradas.

Evaluación: 2026-10-17. No se han creado recursos AWS ni cambiado DNS. Las tarifas dependen de región, cuenta, modalidad y uso real; confirmar el presupuesto con AWS Pricing Calculator antes de autorizar un despliegue.

## Contexto comprobado

El frontend es React/Vite servido como sitio estático mediante CloudFront; la API local es un proceso Node HTTP con `node:sqlite`, escrituras síncronas y archivos bajo `.cms-data/`. Esa API **no se puede copiar tal cual a Lambda**: SQLite y archivos locales no ofrecen persistencia entre invocaciones. No hay credenciales AWS disponibles en este entorno para inventariar recursos privados ni verificar elegibilidad de Free Tier.

## Opciones

| Opción | Migración de la API actual | Mantenimiento y escalado | Coste de referencia | Decisión |
| --- | --- | --- | --- | --- |
| RDS PostgreSQL + S3 | Mantiene el modelo relacional, pero requiere consultas async, traducción SQL, pool y conexión de Lambda a VPC | Backups administrados; instancia y almacenamiento continuos | Se facturan horas de instancia, disco y respaldo. Las 750 h/20 GB del Free Tier aplican sólo si la cuenta es elegible | Alternativa si el volumen de consultas o relaciones justifica el coste fijo |
| DynamoDB + S3 | Requiere reescribir la capa de persistencia y diseñar claves/índices; exportar SQLite sin perder revisiones ni IDs | Servicio serverless sin administrar instancias; ajustar capacidad y retención | Ejemplo oficial us-east-1: USD 0,625/millón de escrituras de 1 KB y USD 0,125/millón de lecturas consistentes de 1 KB en on-demand; otros tamaños y funciones cuestan más | **Objetivo recomendado** para el tráfico pequeño e irregular del portafolio, sujeto a pruebas de migración y presupuesto |
| Aurora PostgreSQL Serverless v2 + S3 | Más cercano a SQL, pero requiere adaptación async, red y migración | Escala en ACU; algunas versiones permiten pausa a 0 | ACU/almacenamiento/I/O; el coste depende de tiempo activo y versión | No elegir sin medir; la simplicidad aparente de SQL no elimina la operación ni cargos |
| VM/EC2 con SQLite en volumen persistente + S3 | Menos cambios de SQL; servidor y disco siempre encendidos | Parches, copias, recuperación y alta disponibilidad recaen en el proyecto | Instancia, EBS, transferencia y copias aun con poco tráfico | Sólo si existe servidor pagado que pueda reutilizarse y presupuesto explícito |

Fuentes: [DynamoDB pricing](https://aws.amazon.com/dynamodb/pricing/), [RDS PostgreSQL pricing](https://aws.amazon.com/rds/postgresql/pricing/), [Aurora pricing](https://aws.amazon.com/rds/aurora/pricing/), [S3 pricing](https://aws.amazon.com/s3/pricing/), [Lambda pricing](https://aws.amazon.com/lambda/pricing/). El nivel gratuito de DynamoDB provisionado (25 RCU, 25 WCU y 25 GB) **no equivale** a llamadas on-demand ilimitadas gratis. API Gateway, CloudFront, logs y transferencia se calculan aparte. No se presupuestan cifras totales sin conocer tráfico, tamaño de archivos, caché y elegibilidad de cuenta.

## Diseño objetivo y secuencia de migración

1. Mantener SQLite local como fuente hasta que el nuevo backend pase pruebas. Crear copia consistente, verificar hashes e integridad y guardar copia privada cifrada fuera del servidor.
2. Definir repositorios para contenido, sesiones, revisiones, media, mensajes, auditoría y analítica. Para DynamoDB: claves estables `PK`/`SK`, índice de tipo/estado/orden para lecturas públicas y condición de versión para escrituras concurrentes. No trasladar contraseñas ni TOTP a un almacén público.
3. Exportar cada tabla con IDs/fechas/estados originales y validar conteos, slugs, relaciones y hashes. Importar a staging; resolver colisiones sin sobreescribir. Probar rollback conservando SQLite y documentos originales.
4. Sustituir `.cms-data/media` por S3 privado con acceso público selectivo mediante CloudFront/OAC o URLs firmadas según el recurso. Mantener los archivos originales y comprobar objetos por hash antes de cambiar referencias.
5. Convertir la API a un adaptador para Lambda/HTTP API o servidor ya disponible. Reprobar autenticación, CSRF, cookies, CORS, multimedia y ciclo borrador/publicación con dominios HTTPS reales de staging.
6. Medir coste y activar AWS Budgets/alertas antes del corte. Aprobar y ejecutar recursos AWS, DNS y certificados únicamente con autorización del propietario.

SQLite sigue siendo el entorno local. La capa DynamoDB está implementada, pero la integración aún exige pruebas contra recursos AWS de staging antes de producción.

## Respaldo local disponible

`npm run backup:create` usa `VACUUM INTO` para generar una copia coherente de SQLite y copia `.cms-data/media` a `.cms-backups/`. El manifiesto registra hashes SHA-256 y conteos. `npm run backup:verify -- RUTA` comprueba archivos, integridad SQLite y conteos. Ambos comandos operan localmente y no modifican los originales. Para una copia plenamente coherente de DB y media, detener temporalmente subidas o la API durante la copia; cifrar y proteger respaldos fuera de la máquina. La restauración se hace en un directorio nuevo y se valida allí antes de un corte; nunca reemplazar datos activos a ciegas.

`npm run migration:export -- RUTA_DEL_RESPALDO` crea en `.cms-exports/` un JSONL local con claves candidatas `pk`/`sk`, IDs/fechas/estados originales y guardas de unicidad para slugs. **No escribe en DynamoDB.** No traslada sesiones para exigir nuevo login tras el corte. El paquete contiene hashes de contraseña, secretos MFA y mensajes; requiere el mismo nivel de protección que una copia completa. Antes de importarlo hay que terminar el adaptador, validar límites de item/índices y cifrar secretos MFA.
