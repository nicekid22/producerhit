# Requires macOS + Xcode Simulator. On Windows, use a Mac or cloud Mac for captures.
#
# 1. Start app: cd apps/mobile && npm run ios
# 2. On Mac: bash scripts/capture-app-store-screenshots.sh
#
# Or single frame:
#   xcrun simctl io booted screenshot store-screenshots/iphone-67-create.png
#
# See store-screenshots/README.md for the full shot list.

Write-Host "iOS Simulator screenshots require macOS." -ForegroundColor Yellow
Write-Host "Run on a Mac: bash apps/mobile/scripts/capture-app-store-screenshots.sh"
Write-Host "Guide: apps/mobile/store-screenshots/README.md"
