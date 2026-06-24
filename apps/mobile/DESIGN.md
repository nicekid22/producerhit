# ProducerHit Mobile — Design system

> **Direction active** : [design-system/DUSTY-CLOUD.md](./design-system/DUSTY-CLOUD.md) · Exécution : [EXECUTION-IOS.md](./design-system/EXECUTION-IOS.md)

La doc « iris / Prism mesh » ci-dessous est **legacy** — ne pas étendre sans migration dusty.

## Design Read (legacy iris — en migration)

**Produit :** génération musicale IA, bibliothèque, communauté, IAP.

**Direction :** dark studio iris (Prism) + variantes Warm/Air avec accents iris cohérents.

| Dial | Valeur |
|------|--------|
| DESIGN_VARIANCE | 7 |
| MOTION_INTENSITY | 6 |
| VISUAL_DENSITY | 4 |

## Tokens (`theme/types.ts`)

- `background` — base, gradient, cardDeep
- `iris` — rose, sky, lavender, cream, gradient
- `glass` — surface, border, blur (≤0.10 opacity)
- `glow` — iris, accent shadows
- `colors.accentPrimary` — CTA / sélection UI

Palettes : `theme/palettes/{prism,warm,air}.ts` · `useTheme()`.

## Composants signature

| Composant | Rôle |
|-----------|------|
| `AIOrb` | Orbe iris Skia (+ fallback) — génération, tab bar, StudioHero |
| `GlassCard` | Surface glass variant default/elevated/active |
| `StudioTabBar` | Tab bar flottante blur + orbe central Create |
| `AppBackground` / `ThemeBackdrop` | Void `#1A1220` + grain seul (Dusty Cloud) |
| `GenerationProgress` | AIOrb 160px + phases |
| `PhButton` | CTA rose plat `#C4687A` + shadow dusty |

## Stack animation

- `react-native-reanimated` + `react-native-gesture-handler` + `react-native-worklets`
- `@shopify/react-native-skia` (dev build EAS requis)
- `lib/reanimated/usePressScale.tsx`, `useOrbMotion.ts`

## Anti-patterns bannis

- Cyan legacy `#3db8e8` comme accent principal
- Glass partout
- Glow néon
- Orbe figée

Voir `design-system/MASTER.md` pour détail complet.
