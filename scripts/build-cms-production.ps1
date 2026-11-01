param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('public', 'admin')]
  [string]$Target,
  [string]$ApiUrl = ''
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)

if ($Target -eq 'public') {
  if ($ApiUrl -notmatch '^https://[a-z0-9]+\.execute-api\.us-east-1\.amazonaws\.com$') {
    throw 'El build público requiere la URL HTTPS de API Gateway de producción en us-east-1.'
  }
  if ($ApiUrl -eq 'https://uueaour2lh.execute-api.us-east-1.amazonaws.com') {
    throw 'La API de staging nunca debe incluirse en el build público de producción.'
  }
  $env:VITE_CMS_API_URL = $ApiUrl
} else {
  if ($ApiUrl) { throw 'El build administrativo utiliza /api en su propio CloudFront.' }
  $env:VITE_CMS_API_URL = ''
}
$env:VITE_CMS_BUILD_TARGET = $Target

try {
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw 'Falló Vite.' }
  $destination = Join-Path '.cms-build' ("$Target-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
  New-Item -ItemType Directory -Path $destination -Force | Out-Null
  Copy-Item -Path 'dist\*' -Destination $destination -Recurse -Force
  Write-Output "Build $Target preparado en $destination"
} finally {
  Remove-Item Env:VITE_CMS_API_URL -ErrorAction SilentlyContinue
  Remove-Item Env:VITE_CMS_BUILD_TARGET -ErrorAction SilentlyContinue
}
