$ErrorActionPreference = "Stop"
$HermesHome = "$env:LOCALAPPDATA\hermes"
$ProjectDir = "$HermesHome\projects\influencer-marketing"
$SkillsTpl = Join-Path $PSScriptRoot "templates\hermes\skills"
$env:HERMES_HOME = $HermesHome

Write-Host "=== INFLU Hermes deploy ===" -ForegroundColor Cyan
New-Item -ItemType Directory -Path $ProjectDir -Force | Out-Null
robocopy (Join-Path $PSScriptRoot "templates\workspace") $ProjectDir /E /XO /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
New-Item -ItemType Directory -Path "$ProjectDir\reports\daily" -Force | Out-Null
Get-ChildItem $SkillsTpl -Directory | ForEach-Object {
    robocopy $_.FullName "$HermesHome\skills\$($_.Name)" /E /XO /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
    Write-Host "Skill: $($_.Name)"
}
Write-Host "Project: $ProjectDir" -ForegroundColor Green
