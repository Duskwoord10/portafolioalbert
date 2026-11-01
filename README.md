# Portafolio Albert Sanfle y CMS

Portafolio React/Vite con API Node para administrar contenido existente. El desarrollo local conserva SQLite y archivos en `.cms-data/`; la integración de DynamoDB, S3 y Lambda está preparada para pruebas en AWS, sin despliegue de producción.

## Desarrollo local

Requisitos: Node.js 22 y npm. Consultar `.env.example` y configurar las variables necesarias en la terminal o el supervisor del proceso. Para producción, `CMS_TOTP_ENCRYPTION_KEY` debe ser una clave de 32 bytes hexadecimales; conservarla fuera de Git.

```text
npm ci
npm run dev:api
npm run dev
```

La API escucha en `http://localhost:8787`, el sitio Vite en `http://localhost:5173` y el panel en `/admin`. Para crear la primera cuenta, ejecutar `npm run admin:create -- correo@dominio` en una terminal interactiva. El administrador debe activar MFA antes de editar.

## Comprobación

```text
npm test
npm run lint
npm run build
npm run build:lambda
```

La guía de operación, respaldos y restauración está en [docs/CMS_OPERACION.md](docs/CMS_OPERACION.md). El estado por fases está en [PROGRESS.md](PROGRESS.md).

## AWS

La API admite `CMS_DATA_BACKEND=sqlite|dynamodb` y `CMS_MEDIA_BACKEND=local|s3`. La arquitectura, exportación, simulación de migración, recursos requeridos, costos y pasos de despliegue están en [docs/CMS_AWS_DESPLIEGUE.md](docs/CMS_AWS_DESPLIEGUE.md). Las plantillas sin desplegar están en `infra/aws/`.
