# ProducerHit OpenClaw — install marketing agent team
# Usage: powershell -ExecutionPolicy Bypass -File scripts/openclaw/install-producerhit-team.ps1

$ErrorActionPreference = "Stop"

$OpenClawDir = "$env:USERPROFILE\.openclaw"
$Workspace = "$OpenClawDir\workspace-producerhit"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path $RepoRoot)) {
    $RepoRoot = "C:\Users\dylar\Documents\ProducerKit AI - Cursor 2"
}

Write-Host "ProducerHit OpenClaw - install team" -ForegroundColor Cyan
Write-Host "Workspace: $Workspace"
Write-Host "Repo:      $RepoRoot"

# Ensure workspace exists (files may already be in ~/.openclaw)
$dirs = @(
    "$Workspace\agents",
    "$Workspace\memory",
    "$Workspace\tasks",
    "$Workspace\reports\daily",
    "$Workspace\reports\weekly"
)
foreach ($d in $dirs) {
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}

# Default model qwen3.5 via openclaw CLI (avoid rewriting full JSON)
& openclaw config set agents.defaults.model.primary "ollama/qwen3.5" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Updated default model -> ollama/qwen3.5" -ForegroundColor Green
} else {
    Write-Host "Could not set default model (gateway offline?) - edit openclaw.json manually" -ForegroundColor Yellow
}

# Agent definitions: id, model
$agents = @(
    @{ id = "ph-ceo";      model = "ollama/qwen3.5" },
    @{ id = "ph-research"; model = "ollama/qwen3.5" },
    @{ id = "ph-social";   model = "ollama/qwen3.5" },
    @{ id = "ph-seo";      model = "ollama/qwen3.5" },
    @{ id = "ph-growth";   model = "ollama/qwen3.5" },
    @{ id = "ph-dev";      model = "ollama/qwen2.5-coder" }
)

foreach ($a in $agents) {
    $id = $a.id
    Write-Host "Agent: $id ($($a.model))" -ForegroundColor Yellow
    $existing = & openclaw agents list --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
    $found = $false
    if ($existing) {
        foreach ($item in $existing) {
            if ($item.id -eq $id) { $found = $true; break }
        }
    }
    if ($found) {
        Write-Host "  already registered - skip add" -ForegroundColor DarkGray
        continue
    }
    & openclaw agents add $id `
        --workspace $Workspace `
        --model $a.model `
        --non-interactive
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "  openclaw agents add $id failed (exit $LASTEXITCODE) - gateway may be offline"
    }
}

# CEO identity
& openclaw agents set-identity --agent ph-ceo --name "ProducerHit CEO" --emoji ":studio_microphone:" --json 2>$null

Write-Host ""
Write-Host "Done. Next steps:" -ForegroundColor Green
Write-Host "  1. ollama serve  (if not running)"
Write-Host "  2. openclaw gateway --force"
Write-Host ('  3. powershell -File "' + $RepoRoot + '\scripts\openclaw\register-cron-jobs.ps1"')
Write-Host '  4. openclaw agent --agent ph-research --message "Run tasks/research-hourly.md"'
