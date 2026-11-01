$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$account = (& aws sts get-caller-identity --profile default --region us-east-1 --query Account --output text).Trim()
if ($LASTEXITCODE -ne 0 -or $account -ne '479324457361') { throw 'Cuenta AWS inesperada.' }
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$destination = Join-Path '.cms-backups' "production-config-$stamp"
New-Item -ItemType Directory -Path $destination -Force | Out-Null

& aws cloudfront get-distribution-config --profile default --id E15DL0KDZ9463N --output json |
  Set-Content -LiteralPath (Join-Path $destination 'public-cloudfront.json') -Encoding utf8
if ($LASTEXITCODE -ne 0) { throw 'No se pudo copiar la configuración CloudFront.' }
& aws route53 list-resource-record-sets --profile default --hosted-zone-id Z08027842MX62PVBRC3IM `
  --output json | Set-Content -LiteralPath (Join-Path $destination 'route53-records.json') -Encoding utf8
if ($LASTEXITCODE -ne 0) { throw 'No se pudo copiar la zona Route 53.' }
Write-Output "Configuración de sólo lectura guardada en $destination"
