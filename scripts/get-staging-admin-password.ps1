param(
  [ValidateRange(15, 300)]
  [int] $ClearAfterSeconds = 45
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'staging-windows-credential.ps1')
$password = Get-StagingCredential
if ([string]::IsNullOrEmpty($password)) {
  throw 'No hay una contraseña del CMS de staging guardada para este usuario de Windows.'
}

try {
  Set-Clipboard -Value $password
  Write-Host "Contraseña copiada localmente. Pégala en el navegador; el portapapeles se limpiará en $ClearAfterSeconds segundos si no lo cambias."
  Start-Sleep -Seconds $ClearAfterSeconds
  if ((Get-Clipboard -Raw) -ceq $password) {
    Set-Clipboard -Value ''
    Write-Host 'Portapapeles limpiado.'
  }
} finally {
  $password = $null
}
