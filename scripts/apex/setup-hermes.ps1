# Deploy Apex Hermes project + skills

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$HermesHome = "$env:LOCALAPPDATA\hermes"
$HermesExe = "$HermesHome\hermes-agent\.venv\Scripts\hermes.exe"
$ProjectDir = "$HermesHome\projects\apex-revenue"
$SkillsTpl = Join-Path $PSScriptRoot "templates\hermes\skills"
$ProjectTpl = Join-Path $PSScriptRoot "templates\hermes\project"
$cronScript = Join-Path $RepoRoot "scripts\apex\register-hermes-crons.ps1"
$env:HERMES_HOME = $HermesHome

Write-Host "=== Apex Revenue OS - Hermes deploy ===" -ForegroundColor Cyan

if (-not (Test-Path $HermesExe)) {
    Write-Host "Hermes not installed. Run scripts/hermes/setup-producerhit.ps1 first." -ForegroundColor Red
    exit 1
}

New-Item -ItemType Directory -Path $ProjectDir -Force | Out-Null
if (Test-Path $ProjectTpl) {
    robocopy $ProjectTpl $ProjectDir /E /XO /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
}

@("reports\daily", "reports\weekly") | ForEach-Object {
    $p = Join-Path $ProjectDir $_
    if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p -Force | Out-Null }
}

if (Test-Path $SkillsTpl) {
    Get-ChildItem $SkillsTpl -Directory | ForEach-Object {
        $dest = Join-Path "$HermesHome\skills" $_.Name
        robocopy $_.FullName $dest /E /XO /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
        Write-Host "Skill: $($_.Name)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Project: $ProjectDir" -ForegroundColor Green
Write-Host "Next: powershell -File $cronScript"
