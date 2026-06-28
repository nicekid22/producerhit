# Install + configure OpenCode for ProducerHit
# Usage: npm run opencode:install

$ErrorActionPreference = "Stop"
$Repo = $PSScriptRoot | Split-Path -Parent | Split-Path -Parent

Write-Host "=== OpenCode install ===" -ForegroundColor Cyan

$env:NODE_OPTIONS = "--use-system-ca"
npm install -g opencode-ai
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

opencode --version

Set-Location $Repo
python (Join-Path $Repo "scripts\configure-opencode.py")
exit $LASTEXITCODE
