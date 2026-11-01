$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$env:AWS_PROFILE = 'default'
$env:AWS_REGION = 'us-east-1'
$env:CMS_DATA_BACKEND = 'dynamodb'
$env:NODE_ENV = 'production'

try {
  $account = (& aws sts get-caller-identity --profile default --region us-east-1 --query Account --output text).Trim()
  if ($LASTEXITCODE -ne 0 -or $account -ne '479324457361') { throw 'Cuenta AWS inesperada.' }
  $outputsText = & aws cloudformation describe-stacks --profile default --region us-east-1 `
    --stack-name albert-cms-production-api --query 'Stacks[0].Outputs' --output json
  if ($LASTEXITCODE -ne 0) { throw 'Falta el stack de API de producción.' }
  $entries = ($outputsText -join "`n") | ConvertFrom-Json
  $table = ($entries | Where-Object { $_.OutputKey -eq 'TableName' }).OutputValue
  if (!$table -or !$table.StartsWith('albert-cms-production-api-CmsTable-')) {
    throw 'La tabla no pertenece al stack de producción.'
  }
  $env:CMS_DYNAMODB_TABLE = $table
  Write-Output 'Introduce la contraseña nueva sólo en esta terminal; no aparecerá en el historial ni en argumentos.'
  & node server/create-admin.js asanfle@methodicatechnology.com
  if ($LASTEXITCODE -ne 0) { throw 'No se creó la cuenta de producción.' }
} finally {
  foreach ($name in @('CMS_DATA_BACKEND','CMS_DYNAMODB_TABLE','NODE_ENV')) {
    Remove-Item "Env:$name" -ErrorAction SilentlyContinue
  }
}
