param(
  [ValidateRange(15, 300)]
  [int] $ClearAfterSeconds = 45
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'staging-windows-credential.ps1')
$password = [AlbertCmsCredential.Native]::Load(
  'AlbertSanfleCMS/production/asanfle@methodicatechnology.com',
  'asanfle@methodicatechnology.com')
if ([string]::IsNullOrEmpty($password)) { throw 'No hay contraseña de producción para este usuario de Windows.' }
try {
  Set-Clipboard -Value $password
  Write-Host "Contraseña copiada localmente. Pégala en el navegador; se limpiará en $ClearAfterSeconds segundos si no la cambias."
  Start-Sleep -Seconds $ClearAfterSeconds
  if ((Get-Clipboard -Raw) -ceq $password) { Set-Clipboard -Value ''; Write-Host 'Portapapeles limpiado.' }
} finally { $password = $null }
