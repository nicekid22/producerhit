# Expo dev server — SSL fix on Windows + QR for Expo Go.
param(
  [switch]$Lan,
  [switch]$Tunnel
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$env:NODE_OPTIONS = "--use-system-ca"

$expoArgs = @("start")
if ($Lan) {
  $expoArgs += "--lan"
} elseif ($Tunnel) {
  $expoArgs += "--tunnel"
} else {
  # Localhost only — offline skips Expo API (avoids SSL fetch failed on some Windows setups).
  $expoArgs += "--offline"
}

Write-Host ""
Write-Host "ProducerHit mobile - Expo Go"
Write-Host "  cwd: $(Get-Location)"
if ($Lan) {
  Write-Host "  mode: LAN (iPhone same Wi-Fi, scan QR in terminal)"
} elseif ($Tunnel) {
  Write-Host "  mode: tunnel (slow, works across networks)"
} else {
  Write-Host "  mode: localhost"
  Write-Host "  tip: npm run start:lan for iPhone QR"
}
Write-Host ""

& npx expo @expoArgs
