$ErrorActionPreference = "Stop"
$Templates = Join-Path $PSScriptRoot "templates\workspace"
$Workspace = "$env:USERPROFILE\.openclaw\workspace-influ"

Write-Host "=== INFLU OpenClaw install ===" -ForegroundColor Cyan
New-Item -ItemType Directory -Path $Workspace -Force | Out-Null
robocopy $Templates $Workspace /E /XO /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
@("reports\daily", "memory") | ForEach-Object {
    New-Item -ItemType Directory -Path (Join-Path $Workspace $_) -Force | Out-Null
}
python (Join-Path $PSScriptRoot "register-openclaw-agents.py")
Write-Host "Workspace: $Workspace" -ForegroundColor Green
