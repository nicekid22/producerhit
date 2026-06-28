# ProducerHit CEO stack — lean (10-20 skills, not 500)
# Windows + Hermes v0.16+
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/hermes/install-ceo-stack.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/hermes/install-ceo-stack.ps1 -InstallHubSkills
#   powershell -ExecutionPolicy Bypass -File scripts/hermes/install-ceo-stack.ps1 -LeanOnly

param(
  [switch]$InstallHubSkills,
  [switch]$LeanOnly,
  [switch]$SkipBundle
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$HermesHome = "$env:LOCALAPPDATA\hermes"
$HermesExe = "$HermesHome\hermes-agent\.venv\Scripts\hermes.exe"
$SkillsDir = "$HermesHome\skills"
$ProjectDir = "$HermesHome\projects\producerhit"
$Templates = Join-Path $RepoRoot "scripts\hermes\templates\hermes\skills"

if (-not (Test-Path $HermesExe)) {
  Write-Error "Hermes not found. Run: iex (irm https://hermes-agent.nousresearch.com/install.ps1)"
}

$env:HERMES_HOME = $HermesHome
$ver = & $HermesExe --version 2>&1 | Select-Object -First 1
Write-Host "=== ProducerHit CEO Stack ===" -ForegroundColor Cyan
Write-Host $ver
Write-Host "HERMES_HOME: $HermesHome"
Write-Host ""

# 1. Sync ProducerHit skills (repo -> ~/.hermes/skills)
$phSkills = @(
  "ph-ceo", "ph-acquisition", "ph-competitor", "ph-content", "ph-conversion",
  "ph-growth", "ph-automation", "ph-reddit",
  "ph-growth-commander", "ph-tiktok-growth", "ph-stripe-analytics",
  "ph-revenue-optimizer", "ph-funnel-doctor", "ph-market-intelligence", "ph-automation-builder"
)
foreach ($name in $phSkills) {
  $src = Join-Path $Templates $name
  $dst = Join-Path $SkillsDir $name
  if (Test-Path $src) {
    New-Item -ItemType Directory -Force -Path $dst | Out-Null
    Copy-Item -Path (Join-Path $src "SKILL.md") -Destination (Join-Path $dst "SKILL.md") -Force
    Write-Host "  sync $name" -ForegroundColor Green
  } else {
    Write-Host "  skip $name (no template in repo)" -ForegroundColor DarkYellow
  }
}

$viralTemplates = Join-Path $RepoRoot "scripts\viral\templates\hermes\skills"
if (Test-Path $viralTemplates) {
  Get-ChildItem $viralTemplates -Directory | ForEach-Object {
    if ($_.Name -like "ph-viral-*") {
      $dst = Join-Path $SkillsDir $_.Name
      New-Item -ItemType Directory -Force -Path $dst | Out-Null
      Copy-Item -Path (Join-Path $_.FullName "SKILL.md") -Destination (Join-Path $dst "SKILL.md") -Force
      Write-Host "  sync $($_.Name)" -ForegroundColor Green
    }
  }
}

# 2. Lean mode: archive apex-* and influ-* (tool bloat)
if ($LeanOnly) {
  Write-Host ""
  Write-Host "Lean mode - archiving apex-* and influ-*" -ForegroundColor Yellow
  $archive = Join-Path $SkillsDir "_archived"
  New-Item -ItemType Directory -Force -Path $archive | Out-Null
  Get-ChildItem $SkillsDir -Directory | ForEach-Object {
    if ($_.Name -like "apex-*" -or $_.Name -like "influ-*") {
      $dest = Join-Path $archive $_.Name
      if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
      Move-Item $_.FullName $dest -Force
      Write-Host "  archived $($_.Name)"
    }
  }
}

# 3. Optional hub skills (max 2)
if ($InstallHubSkills) {
  Write-Host ""
  Write-Host "Installing hub skills..." -ForegroundColor Cyan
  $hub = @(
    "skills-sh/firecrawl/firecrawl-workflows/firecrawl-deep-research",
    "skills-sh/affaan-m/everything-claude-code/autonomous-agent-harness"
  )
  foreach ($id in $hub) {
    Write-Host "  install $id"
    & $HermesExe skills install $id -y 2>&1
  }
  Write-Host "Note: computer-use is macOS only. On Windows use Cursor + npm scripts." -ForegroundColor DarkYellow
}

# 4. CEO bundle -> /producerhit-ceo
if (-not $SkipBundle) {
  Write-Host ""
  Write-Host "Creating bundle producerhit-ceo..." -ForegroundColor Cyan
  & $HermesExe bundles delete producerhit-ceo 2>&1 | Out-Null
  $bundleSkills = @(
    "ph-ceo", "ph-growth-commander", "ph-stripe-analytics", "ph-revenue-optimizer",
    "ph-funnel-doctor", "ph-market-intelligence", "ph-automation-builder",
    "ph-growth", "ph-acquisition", "ph-reddit", "ph-content", "ph-competitor",
    "ph-conversion", "ph-automation", "ph-tiktok-growth", "plan",
    "github-pr-workflow", "arxiv"
  )
  Get-ChildItem $SkillsDir -Directory | Where-Object { $_.Name -like "ph-viral-*" } | ForEach-Object {
    $bundleSkills += $_.Name
  }
  $args = @("bundles", "create", "producerhit-ceo")
  foreach ($s in $bundleSkills) { $args += "--skill"; $args += $s }
  & $HermesExe @args 2>&1
  Write-Host "  -> type /producerhit-ceo in hermes chat" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Already builtin (do not reinstall) ===" -ForegroundColor Cyan
Write-Host "  github-pr-workflow, arxiv, blogwatcher, plan, hermes-agent-skill-autogen"
Write-Host "  MEMORY.md / USER.md (persistent memory)"

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "  1. hermes update"
Write-Host "  2. ollama serve"
Write-Host "  3. hermes gateway start"
Write-Host "  4. powershell -File scripts/hermes/register-cron-jobs.ps1"
Write-Host "  5. hermes chat --workdir `"$ProjectDir`""
Write-Host "  6. /producerhit-ceo"
