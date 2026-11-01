# Run this in a visible, interactive PowerShell window. Never pass a password as an argument.
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$env:AWS_PROFILE = 'default'
$env:AWS_REGION = 'us-east-1'
$env:CMS_DATA_BACKEND = 'dynamodb'
$env:CMS_DYNAMODB_TABLE = 'albert-cms-staging-api-CmsTable-IRPMELF0742D'

try {
  $account = (& aws sts get-caller-identity --profile default --region us-east-1 --query Account --output text).Trim()
  if ($LASTEXITCODE -ne 0 -or $account -ne '479324457361') {
    throw "Cuenta AWS inesperada o sesion no disponible: $account"
  }
  Write-Host 'Cuenta AWS y region de staging verificadas.'
  $email = (Read-Host 'Correo para tu administrador permanente').Trim().ToLowerInvariant()
  if ($email -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$') { throw 'Correo invalido.' }
  Write-Host 'Escribe ahora la contrasena directamente en esta terminal. No se mostrara.'
  & node server/create-admin.js $email
  if ($LASTEXITCODE -ne 0) { throw 'No se creo el administrador.' }
  Write-Host 'Abre https://d34buqdfi1n3fd.cloudfront.net/admin, inicia sesion y activa MFA.'
} catch {
  Write-Error $_
} finally {
  Read-Host 'Presiona Enter para cerrar esta ventana'
}
