$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$env:AWS_PROFILE = 'default'
$env:AWS_REGION = 'us-east-1'
. (Join-Path $PSScriptRoot 'staging-windows-credential.ps1')

function New-StagingPassword {
  $groups = @('ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!#%+_-')
  $alphabet = ($groups -join '')
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $bytes = New-Object byte[] 4
  function Get-SecureIndex([int] $Max) {
    $limit = [uint64][math]::Floor(4294967296.0 / $Max) * $Max
    do {
      $rng.GetBytes($bytes)
      $number = [uint64][BitConverter]::ToUInt32($bytes, 0)
    } while ($number -ge $limit)
    return [int]($number % $Max)
  }
  try {
    $characters = New-Object 'System.Collections.Generic.List[char]'
    foreach ($group in $groups) {
      $characters.Add($group[(Get-SecureIndex $group.Length)])
    }
    while ($characters.Count -lt 28) {
      $characters.Add($alphabet[(Get-SecureIndex $alphabet.Length)])
    }
    for ($index = $characters.Count - 1; $index -gt 0; $index--) {
      $other = Get-SecureIndex ($index + 1)
      $temporary = $characters[$index]
      $characters[$index] = $characters[$other]
      $characters[$other] = $temporary
    }
    return -join $characters.ToArray()
  } finally {
    [Array]::Clear($bytes, 0, $bytes.Length)
    $rng.Dispose()
  }
}

$storedNew = $false
$nodeStarted = $false
$resultKnown = $false
$resetCommitted = $false
$previous = $null
$password = $null
try {
  $account = (& aws sts get-caller-identity --profile default --region us-east-1 --query Account --output text).Trim()
  if ($LASTEXITCODE -ne 0 -or $account -ne '479324457361') {
    throw 'La identidad AWS no corresponde a la cuenta de staging autorizada.'
  }

  $previous = Get-StagingCredential
  $password = New-StagingPassword
  Set-StagingCredential $password
  $storedNew = $true
  if ((Get-StagingCredential) -cne $password) {
    throw 'Windows no pudo verificar la credencial guardada. No se ha solicitado el restablecimiento.'
  }

  $node = (Get-Command node.exe -ErrorAction Stop).Source
  $start = New-Object System.Diagnostics.ProcessStartInfo
  $start.FileName = $node
  $start.Arguments = 'scripts/reset-staging-admin.js'
  $start.WorkingDirectory = (Get-Location).Path
  $start.UseShellExecute = $false
  $start.RedirectStandardInput = $true
  $start.RedirectStandardOutput = $true
  $start.RedirectStandardError = $true
  $start.CreateNoWindow = $true
  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $start
  $nodeStarted = $process.Start()
  $process.StandardInput.WriteLine($password)
  $process.StandardInput.Close()
  $responseText = $process.StandardOutput.ReadToEnd()
  $null = $process.StandardError.ReadToEnd()
  $process.WaitForExit()
  $response = $responseText | ConvertFrom-Json
  $resultKnown = $true
  $resetCommitted = [bool]$response.resetCommitted
  if (-not $resetCommitted) {
    throw "No se modificó la cuenta de staging. Motivo: $($response.error)."
  }
  if ($process.ExitCode -ne 0 -or $response.loginStatus -ne 200) {
    throw "La contraseña se restableció y permanece en Windows, pero la comprobación HTTPS respondió HTTP $($response.loginStatus)."
  }
  if (-not $response.sessionClosed) {
    throw 'La API aceptó la contraseña (HTTP 200), pero no se confirmó el cierre de la sesión de comprobación.'
  }
  Write-Host 'Restablecimiento correcto. Login HTTPS: HTTP 200; sesión de comprobación cerrada.'
  Write-Host 'MFA no se modificó. Abre https://d34buqdfi1n3fd.cloudfront.net/admin y deja el código MFA vacío en el primer acceso.'
  Write-Host 'Para copiar la contraseña desde Windows: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/get-staging-admin-password.ps1'
} catch {
  if ($storedNew -and (-not $nodeStarted -or ($resultKnown -and -not $resetCommitted))) {
    try {
      if ($null -ne $previous) { Set-StagingCredential $previous }
      else { Remove-StagingCredential }
    } catch {
      Write-Warning 'No se pudo restaurar la credencial anterior de Windows. Revisa el Administrador de credenciales.'
    }
  }
  Write-Error $_
  exit 1
} finally {
  $password = $null
  $previous = $null
  if ($process) { $process.Dispose() }
}
