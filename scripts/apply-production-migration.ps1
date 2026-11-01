param(
  [Parameter(Mandatory = $true)]
  [string]$ExportDir,
  [switch]$Execute
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$env:AWS_PROFILE = 'default'
$env:AWS_REGION = 'us-east-1'

$account = (& aws sts get-caller-identity --profile default --region us-east-1 --query Account --output text).Trim()
if ($LASTEXITCODE -ne 0 -or $account -ne '479324457361') { throw 'Cuenta AWS inesperada.' }

$outputsText = & aws cloudformation describe-stacks --profile default --region us-east-1 `
  --stack-name albert-cms-production-api --query 'Stacks[0].Outputs' --output json
if ($LASTEXITCODE -ne 0) { throw 'No existe el stack de API de producción.' }
$outputs = @{}
foreach ($entry in (($outputsText -join "`n") | ConvertFrom-Json)) { $outputs[$entry.OutputKey] = $entry.OutputValue }
$table = $outputs['TableName']
$bucket = $outputs['MediaBucket']
if (!$table -or !$bucket -or !$table.StartsWith('albert-cms-production-api-CmsTable-') -or
    !$bucket.StartsWith('albert-cms-production-api-cmsmedia-')) {
  throw 'Los recursos de destino no pertenecen al stack de producción esperado.'
}

$env:CMS_DYNAMODB_TABLE = $table
$env:CMS_S3_BUCKET = $bucket
$env:CMS_MIGRATION_TARGET_ENV = 'production'
try {
  & node server/aws/migrate.js $ExportDir
  if ($LASTEXITCODE -ne 0) { throw 'Falló la validación local de migración.' }
  if ($Execute) {
    $env:CMS_MIGRATION_APPLY = 'YES'
    & node server/aws/migrate.js $ExportDir --apply
    if ($LASTEXITCODE -ne 0) { throw 'Falló la importación. Los datos originales siguen intactos; revisa el error antes de reintentar.' }
  } else {
    Write-Output 'Sólo validación local. Se requiere -Execute tras la autorización de producción.'
  }
} finally {
  foreach ($name in @('CMS_DYNAMODB_TABLE','CMS_S3_BUCKET','CMS_MIGRATION_TARGET_ENV','CMS_MIGRATION_APPLY')) {
    Remove-Item "Env:$name" -ErrorAction SilentlyContinue
  }
}
