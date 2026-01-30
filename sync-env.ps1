param(
  [string]$RootEnvPath = ".env",
  [string]$BackendEnvPath = "backend\\.env",
  [string]$FrontendEnvPath = "frontend\\.env",
  [switch]$LocalDb
)

function Read-EnvFile {
  param([string]$Path)
  $map = @{}
  if (-not (Test-Path -LiteralPath $Path)) {
    return $map
  }
  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if ($line.Length -eq 0) { return }
    if ($line.StartsWith("#")) { return }
    if ($line.StartsWith("export ")) { $line = $line.Substring(7) }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $key = $line.Substring(0, $idx).Trim()
    $val = $line.Substring($idx + 1)
    $map[$key] = $val
  }
  return $map
}

$envs = Read-EnvFile -Path $RootEnvPath
if (-not $envs.Count) {
  throw "Root env file not found or empty: $RootEnvPath"
}

if ($LocalDb.IsPresent -and $envs.ContainsKey("DATABASE_URL")) {
  $envs["DATABASE_URL"] = $envs["DATABASE_URL"] -replace "@db:", "@localhost:"
}

$backendKeys = @(
  "FLASK_ENV",
  "SECRET_KEY",
  "JWT_SECRET_KEY",
  "DATABASE_URL",
  "FRONTEND_URL",
  "CORS_ALLOWED_ORIGINS",
  "AI_PROVIDER",
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "HISTORY_RETENTION_DAYS",
  "MAX_DIAGNOSES_PER_DAY",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "RUN_MIGRATIONS",
  "RUN_SEED",
  "RESET_SEED",
  "GUNICORN_WORKERS"
)

$backendLines = @(
  "# Auto-generated from $RootEnvPath",
  "# Do not edit directly; edit $RootEnvPath instead.",
  ""
)
foreach ($key in $backendKeys) {
  if ($envs.ContainsKey($key)) {
    $backendLines += "$key=$($envs[$key])"
  }
}
$backendLines += ""

$frontendKeys = @()
foreach ($key in $envs.Keys) {
  if ($key.StartsWith("VITE_")) {
    $frontendKeys += $key
  }
}
$frontendKeys = $frontendKeys | Sort-Object

$frontendLines = @(
  "# Auto-generated from $RootEnvPath",
  "# Do not edit directly; edit $RootEnvPath instead.",
  ""
)
foreach ($key in $frontendKeys) {
  $frontendLines += "$key=$($envs[$key])"
}
$frontendLines += ""

Set-Content -LiteralPath $BackendEnvPath -Value $backendLines -Encoding ascii
Set-Content -LiteralPath $FrontendEnvPath -Value $frontendLines -Encoding ascii

Write-Host "Synced: $BackendEnvPath"
Write-Host "Synced: $FrontendEnvPath"
