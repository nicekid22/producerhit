# App Store screenshots

Place marketing screenshots here before ASC submission.

## Quick capture (Simulator — macOS)

```bash
cd apps/mobile
npm run ios
bash scripts/capture-app-store-screenshots.sh
```

On Windows, use a Mac or run `scripts/capture-app-store-screenshots.ps1` for instructions.

Manual single frame:

## Recommended frames

| # | File | Screen | What to show |
|---|------|--------|----------------|
| 1 | `iphone-67-onboarding.png` | Onboarding slide 1 | Bannière Three.js + preview audio communauté |
| 2 | `iphone-67-onboarding-personalize.png` | Onboarding slide 4 | Choix mode + genres |
| 3 | `iphone-67-create.png` | Studio / Create | StudioHero + prompt + GenrePicker |
| 4 | `iphone-67-generating.png` | Create (generating) | GenerationProgress + orbe |
| 5 | `iphone-67-library.png` | Library | Featured card + grille |
| 6 | `iphone-67-player.png` | Full player | Cover + seek + orbe |
| 7 | `iphone-67-community.png` | Explore | Trending + grille |
| 8 | `iphone-67-paywall.png` | Paywall | Plan + CTA rose |
| 9 | `iphone-67-account.png` | Account | Profil + bonus quotidien |

## Device sizes

| File prefix | Device |
|-------------|--------|
| `iphone-67-*.png` | iPhone 6.7" (16 Pro Max) |
| `iphone-65-*.png` | iPhone 6.5" (optional) |
| `ipad-13-studio.png` | iPad 12.9" Studio |
| `ipad-13-library.png` | iPad 12.9" Library |

Background must stay **`#1A1220`** (Dusty Cloud void). No Prism mesh / aurora in marketing frames.

## Deep link smoke test

```text
producerhit://play/{loopId}   → app/play/[id].tsx → lecture + player
producerhit://loop/{loopId}     → app/loop/[id].tsx → Communauté
```

Test on device or Simulator after dev build:

```powershell
xcrun simctl openurl booted "producerhit://play/a08a1aea-eaff-4bcd-b893-73129daa2b0e"
```
