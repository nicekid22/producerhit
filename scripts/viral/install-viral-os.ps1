# VIRAL Content OS — full install (OpenClaw + Hermes + Odysseus)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/viral/install-viral-os.ps1

$ErrorActionPreference = "Continue"
$RepoRoot = Split-Path $PSScriptRoot -Parent | Split-Path -Parent
$Templates = Join-Path $PSScriptRoot "templates"
$HermesHome = Join-Path $env:LOCALAPPDATA "hermes"
$OpenClawWs = Join-Path $env:USERPROFILE ".openclaw\workspace-viral"
$HermesProject = Join-Path $HermesHome "projects\viral-content"
$HermesSkills = Join-Path $HermesHome "skills"

Write-Host "=== VIRAL Content OS install ===" -ForegroundColor Cyan
Write-Host "Repo: $RepoRoot"

# --- OpenClaw workspace ---
Write-Host "`n[1/6] OpenClaw workspace-viral" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $OpenClawWs -Force | Out-Null
robocopy (Join-Path $Templates "workspace") $OpenClawWs /E /XO /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
Copy-Item (Join-Path $Templates "BRIEF.md") (Join-Path $OpenClawWs "BRIEF.md") -Force
Copy-Item (Join-Path $Templates "TOOLKIT.md") (Join-Path $OpenClawWs "TOOLKIT.md") -Force
@("reports\daily") | ForEach-Object { New-Item -ItemType Directory -Path (Join-Path $OpenClawWs $_) -Force | Out-Null }
python (Join-Path $PSScriptRoot "register-openclaw-agents.py")
python (Join-Path $PSScriptRoot "register-openclaw-crons-direct.py")

# --- Hermes project + skills ---
Write-Host "`n[2/6] Hermes viral-content project" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $HermesProject -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $HermesProject "reports\daily") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $HermesProject "memory") -Force | Out-Null
Copy-Item (Join-Path $Templates "BRIEF.md") (Join-Path $HermesProject "BRIEF.md") -Force
Copy-Item (Join-Path $Templates "TOOLKIT.md") (Join-Path $HermesProject "TOOLKIT.md") -Force
Copy-Item (Join-Path $Templates "hermes\project\.hermes.md") (Join-Path $HermesProject ".hermes.md") -Force
robocopy (Join-Path $Templates "workspace\memory") (Join-Path $HermesProject "memory") /E /XO /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null

$skillsSrc = Join-Path $Templates "hermes\skills"
Get-ChildItem $skillsSrc -Directory | ForEach-Object {
    $dest = Join-Path $HermesSkills $_.Name
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
    Copy-Item (Join-Path $_.FullName "SKILL.md") (Join-Path $dest "SKILL.md") -Force
    Write-Host "  skill: $($_.Name)" -ForegroundColor DarkGray
}

python (Join-Path $PSScriptRoot "register-hermes-crons-direct.py")

# --- Ollama 64k ---
Write-Host "`n[3/6] Ollama qwen2.5-64k" -ForegroundColor Yellow
& (Join-Path $PSScriptRoot "ensure-ollama-64k.ps1")

# --- Odysseus ---
Write-Host "`n[4/6] Odysseus VIRAL crew" -ForegroundColor Yellow
$OdysseusHome = "C:\Users\dylar\odysseus"
if (Test-Path (Join-Path $OdysseusHome "venv\Scripts\python.exe")) {
    $env:ODYSSEUS_HOME = $OdysseusHome
    & (Join-Path $OdysseusHome "venv\Scripts\python.exe") (Join-Path $PSScriptRoot "seed-viral-odysseus.py")
} else {
    Write-Host "  Odysseus venv not found - skip seed (run manually later)" -ForegroundColor DarkYellow
}

# --- Browser profiles dir (Playwright / Hermes browser-use) ---
Write-Host "`n[5/6] Browser profiles folder" -ForegroundColor Yellow
$profiles = Join-Path $HermesHome "browser-profiles"
New-Item -ItemType Directory -Path $profiles -Force | Out-Null
Write-Host "  $profiles (connect socials once per profile)" -ForegroundColor DarkGray

# --- Test agent runner ---
Write-Host "`n[6/6] Test viral-agent-run status" -ForegroundColor Yellow
Push-Location $RepoRoot
node --use-system-ca scripts/viral/viral-agent-run.mjs status 2>&1
Pop-Location

Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Green
Write-Host "OpenClaw: 4 agents + 4 VIRAL crons (workspace-viral)"
Write-Host "Hermes:    4 skills + 4 VIRAL crons (projects/viral-content)"
Write-Host "Odysseus:  4 agents + 4 scheduled tasks (Documents/viral-content)"
Write-Host ""
Write-Host "Launch services:" -ForegroundColor Cyan
Write-Host "  powershell -File `"$RepoRoot\scripts\launch-all-agents-windows.ps1`""
Write-Host ""
Write-Host "Manual pipeline test:" -ForegroundColor Cyan
Write-Host "  cd `"$RepoRoot`""
Write-Host "  npm run viral:agent -- pipeline"
Write-Host ""
Write-Host "See scripts/viral/NEEDS.md for optional setup" -ForegroundColor Yellow
