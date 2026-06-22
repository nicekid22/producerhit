# ProducerHit iOS — EAS build (interactive, first run sets up Apple credentials)
# Usage:
#   .\scripts\eas-build-ios.ps1              # TestFlight / App Store (production)
#   .\scripts\eas-build-ios.ps1 -Profile preview   # Internal ad hoc (devices registered in EAS)

param(
  [ValidateSet("preview", "production", "development")]
  [string]$Profile = "production"
)

$ErrorActionPreference = "Stop"
$env:NODE_OPTIONS = "--use-system-ca"
$env:EAS_BUILD_NO_EXPO_GO_WARNING = "true"

Set-Location $PSScriptRoot\..

Write-Host "EAS iOS build — profile: $Profile" -ForegroundColor Cyan
Write-Host "Compte Expo: hype22 | Bundle: com.producerhit.app" -ForegroundColor DarkGray
Write-Host ""

if ($Profile -eq "preview") {
  Write-Host "Preview = distribution interne (Ad Hoc). Enregistre ton iPhone:" -ForegroundColor Yellow
  Write-Host "  npx eas-cli device:create" -ForegroundColor Yellow
  Write-Host ""
}

npx eas-cli build --platform ios --profile $Profile
