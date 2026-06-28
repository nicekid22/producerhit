# Bootstrap ProducerHit Hermes project workspace (memory, strategy files, SECURITY)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/hermes/bootstrap-producerhit-project.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$TemplateDir = Join-Path $RepoRoot "scripts\hermes\templates\hermes\project"
$ProjectDir = "$env:LOCALAPPDATA\hermes\projects\producerhit"

$dirs = @(
  "$ProjectDir\metrics",
  "$ProjectDir\reports\daily",
  "$ProjectDir\memory"
)
foreach ($d in $dirs) {
  New-Item -ItemType Directory -Force -Path $d | Out-Null
}

$seedFiles = @(
  ".hermes.md",
  "AGENTS.md",
  "SECURITY.md",
  "business.md",
  "roadmap.md",
  "competitors.md",
  "pricing.md"
)
foreach ($f in $seedFiles) {
  $src = Join-Path $TemplateDir $f
  $dst = Join-Path $ProjectDir $f
  if (-not (Test-Path $src)) {
    Write-Host "  skip $f (no template)" -ForegroundColor DarkYellow
    continue
  }
  if (-not (Test-Path $dst)) {
    Copy-Item -Path $src -Destination $dst -Force
    Write-Host "  created $f" -ForegroundColor Green
  } else {
    Write-Host "  keep $f (exists)" -ForegroundColor DarkGray
  }
}

Write-Host "Project ready: $ProjectDir" -ForegroundColor Cyan
