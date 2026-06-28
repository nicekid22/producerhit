# Smoke test - trigger one PH cron on Ollama (gateway must be running)
param(
  [string]$JobName = "PH Acquisition",
  [int]$TimeoutMinutes = 45
)

$ErrorActionPreference = "Continue"
$HermesHome = "$env:LOCALAPPDATA\hermes"
$HermesExe = "$HermesHome\hermes-agent\.venv\Scripts\hermes.exe"
$JobsPath = "$HermesHome\cron\jobs.json"
$env:HERMES_HOME = $HermesHome
$env:HERMES_ACCEPT_HOOKS = "1"

if (-not (Test-Path $HermesExe)) { Write-Error "Hermes missing" }
if (-not (Test-Path $JobsPath)) { Write-Error "jobs.json missing" }

try {
  $null = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 5
} catch {
  Write-Host "Ollama DOWN - run: ollama serve" -ForegroundColor Red
  exit 1
}

$jobs = Get-Content $JobsPath -Raw | ConvertFrom-Json
$job = $jobs.jobs | Where-Object { $_.name -eq $JobName } | Select-Object -First 1
if (-not $job) { Write-Error "Job not found: $JobName" }

Write-Host "Smoke test: $($job.name) ($($job.id))" -ForegroundColor Cyan
Write-Host "Skill: $($job.skill) | Model: $($job.model)" -ForegroundColor DarkGray

& $HermesExe cron run --accept-hooks $job.id 2>&1
Start-Sleep -Seconds 2
& $HermesExe cron tick --accept-hooks 2>&1

Write-Host ""
Write-Host "Waiting for completion (max $TimeoutMinutes min, CPU/Iris Xe can be slow)..." -ForegroundColor Yellow
$deadline = (Get-Date).AddMinutes($TimeoutMinutes)
$lastStatus = $null
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds 20
  $fresh = Get-Content $JobsPath -Raw | ConvertFrom-Json
  $j = $fresh.jobs | Where-Object { $_.id -eq $job.id } | Select-Object -First 1
  if ($j.last_status -and $j.last_status -ne $lastStatus) {
    $lastStatus = $j.last_status
    $color = if ($lastStatus -eq "ok") { "Green" } else { "Yellow" }
    Write-Host "  status: $lastStatus" -ForegroundColor $color
  }
  if ($j.last_run_at -and $j.last_status -in @("ok", "error")) {
    if ($j.last_error) {
      $err = $j.last_error
      if ($err.Length -gt 240) { $err = $err.Substring(0, 240) }
      Write-Host "  error: $err" -ForegroundColor Red
      exit 1
    }
    Write-Host "Smoke test OK" -ForegroundColor Green
    exit 0
  }
}

Write-Host "Timeout - check: npm run hermes:status" -ForegroundColor DarkYellow
exit 2
