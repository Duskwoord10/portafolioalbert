$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$env:AWS_PROFILE = 'default'
$env:AWS_REGION = 'us-east-1'
$account = (& aws sts get-caller-identity --profile default --region us-east-1 --query Account --output text).Trim()
if ($LASTEXITCODE -ne 0 -or $account -ne '479324457361') { throw 'Cuenta AWS inesperada.' }
$env:CMS_PRODUCTION_KEY_CREATE = 'APPROVED'
try {
  & node scripts/create-production-mfa-key.js
  if ($LASTEXITCODE -ne 0) { throw 'No se creó el parámetro MFA.' }
} finally {
  Remove-Item Env:CMS_PRODUCTION_KEY_CREATE -ErrorAction SilentlyContinue
}
