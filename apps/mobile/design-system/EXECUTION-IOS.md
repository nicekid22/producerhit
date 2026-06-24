# ProducerHit iOS — Exécution Dusty Cloud

> **Spec** : [`DUSTY-CLOUD.md`](./DUSTY-CLOUD.md) · **Tokens** : `theme/dustyCloud.ts`

## Phases — statut

| Phase | Contenu | Statut |
|-------|---------|--------|
| 0 | Tokens `dustyCloud.ts`, prism → dusty | ✅ |
| 1 | `AppBackground` void seul (grain retiré — pixelisé iOS) | ✅ |
| 2 | GenreChips, InspirationChipRow, PhPill | ✅ |
| 3 | LoopGridCard, LibraryFeaturedCard, CommunityGridCard, LoopCover | ✅ |
| 4 | FullPlayerSheet, orbe dusty, sans halo | ✅ |
| 5 | MiniPlayer orbe 36 + progress 1pt (fond solide) | ✅ |
| 6 | PhButton rose plat (tous écrans) | ✅ |
| 7 | TabBar icons, lavande active, sans orbe | ✅ |
| 8 | Nettoyage anti-slop + perf onglets | ✅ |

### Phase 8 — détail

| Zone | Statut |
|------|--------|
| `GlassCard` / `PhCard` — surfaces solides, blur seulement `forceGlass` (sheets chrome) | ✅ |
| Bannières réseau / offline / erreur — `PhCard` solide (plus de blur scroll) | ✅ |
| `SearchGlassField`, `ThemePicker`, `OnboardingSlideVisual` — solide | ✅ |
| `LocaleToggle`, `StudioHero`, `StudioModeToggle`, `StudioAdvancedSection` | ✅ |
| `AuthScreenShell`, `Paywall`, `DailyBonusCard`, `ContinueListeningCard` | ✅ |
| `PromptConsole`, chips/pills — Pressable léger + memo | ✅ |
| Tab bar / mini player — fond solide | ✅ |
| 4 onglets préchargés · `detachInactiveScreens` | ✅ |
| Player sheet conditionnel · `positionMs` filtré | ✅ |
| Grilles Library — playback via props parent | ✅ |
| Files covers pausées hors focus | ✅ |
| `useStaggerEntrance` une fois par onglet | ✅ |
| `CommunityTrendingCard` scrim image (fonctionnel) | ✅ gardé |
| `expo-symbols` SF Symbols tab bar | ⬜ optionnel (Ionicons OK) |
| WebView Three.js orbe | ⬜ spike non prioritaire |

---

## Règles PR

1. Lire `DUSTY-CLOUD.md` avant toute UI
2. Rose = CTA · Mauve = état/brand · jamais les deux sur un même composant
3. Pas de glass sur cartes scroll — `forceGlass` pour chrome seulement (`PhBottomSheet`)
4. `npm run lint` dans `apps/mobile`

---

## État snapshot

| Élément | État |
|---------|------|
| Fond | 🟢 `#1A1220` plat |
| Palette | 🟢 dustyCloud |
| Chips / pills | 🟢 |
| Player / mini / tab | 🟢 |
| CTA | 🟢 rose plat |
| Perf onglets | 🟢 |
| i18n / prompts | 🟢 hors scope |
| Onboarding v3 + coach marks + library GenrePicker | 🟢 |

*Dernière mise à jour : onboarding v3, preview audio, coach marks Studio, library GenrePicker.*
