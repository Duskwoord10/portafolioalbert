$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'staging-windows-credential.ps1')
$source = Get-Content (Join-Path $PSScriptRoot 'repair-staging-admin.ps1') -Raw
$syntax = [scriptblock]::Create($source)
$definition = $syntax.Ast.Find({
  param($node)
  $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and
    $node.Name -eq 'New-StagingPassword'
}, $true)
if (-not $definition) { throw 'No se encontró el generador de contraseña.' }
. ([scriptblock]::Create($definition.Extent.Text))
for ($index = 0; $index -lt 50; $index++) {
  $sample = New-StagingPassword
  if ($sample.Length -ne 28 -or $sample -cnotmatch '[A-Z]' -or
      $sample -cnotmatch '[a-z]' -or $sample -notmatch '[2-9]' -or
      $sample -notmatch '[!#%+_-]') {
    throw 'La contraseña generada no cumple los requisitos.'
  }
}
Write-Host 'Prueba de generación aleatoria (50 contraseñas): correcta.'
$start = New-Object System.Diagnostics.ProcessStartInfo
$start.FileName = (Get-Command node.exe -ErrorAction Stop).Source
$start.Arguments = 'scripts/reset-staging-admin.js'
$start.WorkingDirectory = (Split-Path -Parent $PSScriptRoot)
$start.UseShellExecute = $false
$start.RedirectStandardInput = $true
$start.RedirectStandardOutput = $true
$start.RedirectStandardError = $true
$start.CreateNoWindow = $true
$start.EnvironmentVariables['AWS_PROFILE'] = 'invalid-test-profile'
$start.EnvironmentVariables['AWS_REGION'] = 'us-east-1'
$process = New-Object System.Diagnostics.Process
$process.StartInfo = $start
try {
  $null = $process.Start()
  $process.StandardInput.WriteLine((New-StagingPassword))
  $process.StandardInput.Close()
  $response = $process.StandardOutput.ReadToEnd() | ConvertFrom-Json
  $null = $process.StandardError.ReadToEnd()
  $process.WaitForExit()
  if ($process.ExitCode -eq 0 -or $response.resetCommitted -or
      $response.error -ne 'wrong_aws_environment') {
    throw 'El proceso secundario no rechazó el perfil de prueba.'
  }
  Write-Host 'Prueba de canal stdin y bloqueo por perfil AWS: correcta.'
} finally {
  $process.Dispose()
}
$target = 'AlbertSanfleCMS/staging-test/' + [guid]::NewGuid().ToString('N')
$user = 'staging-test'
$secret = [guid]::NewGuid().ToString('N')
try {
  [AlbertCmsCredential.Native]::Save($target, $user, $secret)
  if ([AlbertCmsCredential.Native]::Load($target, $user) -cne $secret) {
    throw 'La credencial de prueba no se recuperó correctamente.'
  }
  Write-Host 'Prueba de escritura y lectura del Administrador de credenciales: correcta.'
} finally {
  [AlbertCmsCredential.Native]::Remove($target)
  $secret = $null
}
