$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$env:AWS_PROFILE = 'default'
$env:AWS_REGION = 'us-east-1'
$account = (& aws sts get-caller-identity --profile default --region us-east-1 --query Account --output text).Trim()
if ($LASTEXITCODE -ne 0 -or $account -ne '479324457361') {
  throw 'La cuenta AWS no coincide con el staging autorizado.'
}
& node scripts/export-production-candidate.js
if ($LASTEXITCODE -ne 0) { throw 'No se completó la exportación de contenido publicado.' }
