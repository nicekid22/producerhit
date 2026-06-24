#!/usr/bin/env bash
# Capture App Store screenshots from iOS Simulator (macOS only).
# Prerequisite: app running in Simulator (npm run ios from apps/mobile).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/store-screenshots"
DEVICE="${SIM_DEVICE:-iPhone 16 Pro Max}"

mkdir -p "$OUT"

shot() {
  local file="$1"
  echo "→ $file (navigate to screen in Simulator, then press Enter)"
  read -r _
  xcrun simctl io booted screenshot "$OUT/$file"
  echo "   saved"
}

echo "ProducerHit — screenshot capture"
echo "Device: $DEVICE"
echo "Output: $OUT"
echo ""
echo "Open the app in Simulator first. You'll capture each screen manually."
echo ""

shot "iphone-67-onboarding.png"
shot "iphone-67-onboarding-personalize.png"
shot "iphone-67-create.png"
shot "iphone-67-generating.png"
shot "iphone-67-library.png"
shot "iphone-67-player.png"
shot "iphone-67-community.png"
shot "iphone-67-paywall.png"
shot "iphone-67-account.png"

echo ""
echo "Done. Review frames in store-screenshots/"
