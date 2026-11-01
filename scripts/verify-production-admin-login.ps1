param([switch] $TemporaryDomain)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'staging-windows-credential.ps1')
$password = [AlbertCmsCredential.Native]::Load(
  'AlbertSanfleCMS/production/asanfle@methodicatechnology.com',
  'asanfle@methodicatechnology.com')
if ([string]::IsNullOrEmpty($password)) { throw 'Falta la credencial protegida de producción.' }
$origin = if ($TemporaryDomain) { 'https://dq7j1lg56rxnf.cloudfront.net' }
  else { 'https://auth.albertsanfle.com' }
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
  $body = @{ email = 'asanfle@methodicatechnology.com'; password = $password } | ConvertTo-Json -Compress
  $login = Invoke-WebRequest -Uri "$origin/api/login" -Method POST -UseBasicParsing `
    -ContentType 'application/json' -Headers @{ Origin = $origin } -Body $body -WebSession $session
  $data = $login.Content | ConvertFrom-Json
  if ($login.StatusCode -ne 200 -or !$data.authenticated -or $data.mfaConfigured) {
    throw 'La respuesta de inicio de sesión no coincide con una cuenta nueva pendiente de MFA.'
  }
  $logout = Invoke-WebRequest -Uri "$origin/api/logout" -Method POST -UseBasicParsing `
    -Headers @{ Origin = $origin; 'X-CSRF-Token' = $data.csrf } -WebSession $session
  if ($logout.StatusCode -ne 200) { throw 'No se confirmó el cierre de la sesión de prueba.' }
  Write-Output 'Inicio de sesión HTTPS: HTTP 200; MFA pendiente de configuración personal; cierre de sesión: HTTP 200.'
} catch {
  $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
  throw "Falló la comprobación privada de inicio/cierre de sesión (HTTP $status)."
} finally {
  $body = $null
  $password = $null
  $data = $null
}
