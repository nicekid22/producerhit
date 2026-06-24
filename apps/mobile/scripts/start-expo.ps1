# Expo dev server — SSL fix on Windows + QR for Expo Go.
param(
  [switch]$Lan,
  [switch]$Tunnel,
  [switch]$Clear
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$env:NODE_OPTIONS = "--use-system-ca"

$expoArgs = @("start")
if ($Clear) {
  $expoArgs += "--clear"
}
if ($Lan) {
  $expoArgs += "--lan"
} elseif ($Tunnel) {
  $expoArgs += "--tunnel"
} else {
  # Localhost — offline skips Expo API (avoids SSL fetch failed on some Windows setups).
  $expoArgs += "--offline"
}

Write-Host ""
Write-Host "ProducerHit mobile - Expo Go"
Write-Host "  cwd: $(Get-Location)"
if ($Lan) {
  Write-Host "  mode: LAN (iPhone same Wi-Fi, scan QR)"
} elseif ($Tunnel) {
  Write-Host "  mode: tunnel"
} else {
  Write-Host "  mode: localhost (offline)"
  Write-Host "  tip: npm run start:lan for iPhone QR"
}
if ($Clear) {
  Write-Host "  cache: cleared"
}
Write-Host ""

& npx expo @expoArgs
