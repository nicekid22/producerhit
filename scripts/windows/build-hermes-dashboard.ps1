# Build Hermes web dashboard (fixes npm SSL on Windows via --use-system-ca)
# Usage: npm run hermes:dashboard-build

$ErrorActionPreference = "Stop"
$Root = "$env:LOCALAPPDATA\hermes\hermes-agent"
$NpmCli = "$env:ProgramFiles\nodejs\node_modules\npm\bin\npm-cli.js"

if (-not (Test-Path $Root)) {
    Write-Error "Hermes not found at $Root"
}

Write-Host "=== Build Hermes dashboard ===" -ForegroundColor Cyan
Set-Location $Root
node --use-system-ca $NpmCli run install:web
node --use-system-ca $NpmCli run build -w web

$Dist = Join-Path $Root "hermes_cli\web_dist\index.html"
if (-not (Test-Path $Dist)) {
    Write-Error "Build failed — missing $Dist"
}

Write-Host "[OK] Dashboard built -> $Dist" -ForegroundColor Green
Write-Host "Start: hermes dashboard --skip-build --no-open" -ForegroundColor DarkGray
Write-Host "Open:  http://127.0.0.1:9119" -ForegroundColor Green
