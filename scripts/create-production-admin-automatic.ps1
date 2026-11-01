$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
. (Join-Path $PSScriptRoot 'staging-windows-credential.ps1')
$env:AWS_PROFILE = 'default'
$env:AWS_REGION = 'us-east-1'
$env:CMS_DATA_BACKEND = 'dynamodb'
$env:NODE_ENV = 'production'
$target = 'AlbertSanfleCMS/production/asanfle@methodicatechnology.com'
$email = 'asanfle@methodicatechnology.com'

function New-ProductionPassword {
  $groups = @('ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!#%+_-')
  $alphabet = $groups -join ''
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $bytes = New-Object byte[] 4
  function Get-SecureIndex([int] $Max) {
    $limit = [uint64][math]::Floor(4294967296.0 / $Max) * $Max
    do { $rng.GetBytes($bytes); $number = [uint64][BitConverter]::ToUInt32($bytes, 0) }
    while ($number -ge $limit)
    return [int]($number % $Max)
  }
  try {
    $characters = New-Object 'System.Collections.Generic.List[char]'
    foreach ($group in $groups) { $characters.Add($group[(Get-SecureIndex $group.Length)]) }
    while ($characters.Count -lt 28) { $characters.Add($alphabet[(Get-SecureIndex $alphabet.Length)]) }
    for ($index = $characters.Count - 1; $index -gt 0; $index--) {
      $other = Get-SecureIndex ($index + 1)
      $temporary = $characters[$index]
      $characters[$index] = $characters[$other]
      $characters[$other] = $temporary
    }
    return -join $characters.ToArray()
  } finally { [Array]::Clear($bytes, 0, $bytes.Length); $rng.Dispose() }
}

$password = $null
$saved = $false
$started = $false
try {
  $account = (& aws sts get-caller-identity --profile default --region us-east-1 --query Account --output text).Trim()
  if ($LASTEXITCODE -ne 0 -or $account -ne '479324457361') { throw 'Cuenta AWS inesperada.' }
  $outputs = & aws cloudformation describe-stacks --profile default --region us-east-1 `
    --stack-name albert-cms-production-api --query 'Stacks[0].Outputs' --output json
  if ($LASTEXITCODE -ne 0) { throw 'Falta la API de producción.' }
  $entries = ($outputs -join "`n") | ConvertFrom-Json
  $table = ($entries | Where-Object { $_.OutputKey -eq 'TableName' }).OutputValue
  if (!$table -or !$table.StartsWith('albert-cms-production-api-CmsTable-')) { throw 'Tabla inesperada.' }
  $env:CMS_DYNAMODB_TABLE = $table
  & node scripts/create-production-admin.js --check
  if ($LASTEXITCODE -ne 0) { throw 'Ya existe una cuenta o falló la comprobación.' }
  if ([AlbertCmsCredential.Native]::Load($target, $email)) {
    throw 'Ya existe una credencial de producción en Windows; no se sobrescribirá.'
  }
  $password = New-ProductionPassword
  [AlbertCmsCredential.Native]::Save($target, $email, $password)
  $saved = $true
  if ([AlbertCmsCredential.Native]::Load($target, $email) -cne $password) {
    throw 'Windows no pudo verificar la credencial.'
  }
  $node = (Get-Command node.exe -ErrorAction Stop).Source
  $start = New-Object System.Diagnostics.ProcessStartInfo
  $start.FileName = $node
  $start.Arguments = 'scripts/create-production-admin.js --create'
  $start.WorkingDirectory = (Get-Location).Path
  $start.UseShellExecute = $false
  $start.RedirectStandardInput = $true
  $start.RedirectStandardOutput = $true
  $start.RedirectStandardError = $true
  $start.CreateNoWindow = $true
  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $start
  $started = $process.Start()
  $process.StandardInput.WriteLine($password)
  $process.StandardInput.Close()
  $output = $process.StandardOutput.ReadToEnd()
  $null = $process.StandardError.ReadToEnd()
  $process.WaitForExit()
  if ($process.ExitCode -ne 0) {
    throw 'No se confirmó la creación. La contraseña permanece protegida en Windows por si AWS completó la operación.'
  }
  Write-Host $output.Trim()
  Write-Host 'Contraseña protegida en el Administrador de credenciales de Windows.'
  Write-Host 'Para copiarla localmente: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/get-production-admin-password.ps1'
} catch {
  if ($saved -and -not $started) {
    try { [AlbertCmsCredential.Native]::Remove($target) } catch {}
  }
  Write-Error $_
  exit 1
} finally {
  $password = $null
  if ($process) { $process.Dispose() }
  foreach ($name in @('CMS_DYNAMODB_TABLE','CMS_DATA_BACKEND','NODE_ENV')) {
    Remove-Item "Env:$name" -ErrorAction SilentlyContinue
  }
}
