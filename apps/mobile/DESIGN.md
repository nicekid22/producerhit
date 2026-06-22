# ProducerHit Mobile — Design system v3

Refonte anti-template (skills: frontend-design, design-taste-frontend, emil-design-eng, ui-ux-pro-max, high-end-visual-design, redesign-existing-projects).

## Design Read

**Produit :** app mobile pour producteurs musicaux — génération ACE Step, bibliothèque, communauté, IAP.

**Direction :** hybride à 3 skins réellement distincts (matériaux différents, pas un simple swap hex).

| Dial | Valeur |
|------|--------|
| DESIGN_VARIANCE | 7 |
| MOTION_INTENSITY | 5 |
| VISUAL_DENSITY | 4 |

## Les 3 thèmes

| Thème | ID | Matériau | Identité |
|-------|-----|----------|----------|
| Prism | `prism` | `studio` | Studio night / DAW — fond `#0a0a0c`, accent cyan unique `#3db8e8`, waveform strip |
| Warm | `warm` | `paper` | Editorial vinyl — papier `#f7f2ea`, serif Georgia display, grain statique |
| Air | `air` | `flat` | Minimal Apple — `#f5f5f7`, hairlines, zéro blur décoratif |

Source : `theme/palettes/{prism,warm,air}.ts` · store `stores/visualThemeStore.ts` · `useTheme()` via `ThemeProvider`.

## Architecture tokens

`ThemeTokens` inclut : `colors`, `typography`, `radius`, `elevation`, `motion`, `material`, `glass` (nullable — glass réservé aux sheets Prism).

Motion : `theme/motion.ts` — `pressScale: 0.97`, durées 120/220 ms, ease-out `[0.23, 1, 0.32, 1]`.

Legacy : `theme/tokens.ts` — spacing uniquement ; préférer `useTheme()` pour couleurs/typo.

## Composants fondation

| Composant | Rôle |
|-----------|------|
| `ThemeBackdrop` | Fond par matériau (studio line / paper radial / flat) — **pas d’orbes animés** |
| `PhSurface` | Surfaces `studio` / `paper` / `flat` ; `GlassSurface` = alias |
| `PhDisplay` / `PhLabel` | Hiérarchie typo token-driven |
| `PhButton` | Press scale + haptics ; `gradient` **uniquement** CTA Create |
| `WaveformStrip` | Signature Prism (décor produit) |
| `BrandLogo` | Wordmark web `producer` + `hit` accent |
| `PhEyebrow` | Usage rare (max 1 / 3 sections) |
| `SeekBar` | Ligne simple + thumb |
| `ThemePicker` | 3 mini-mockups visuels distincts |

## Shell

- Tab bar **intégrée** iOS (`animation: "none"` sur tabs)
- `MiniPlayer` cover-first 52px, seek simple
- `FullPlayerSheet` fond thème, Ionicons

## Motion & accessibilité

- `lib/useReducedMotion.ts` — désactive les transforms press si Reduce Motion activé
- Pas d’animation sur : tab switch, chip tap, toggle mode
- Haptics : boutons, play, succès génération, daily bonus, IAP

## Écrans signature

Chaque écran a une famille de layout distincte (pas 3 cards glass identiques) :

- **Create** — titre display + waveform ; seul gradient = CTA Générer
- **Library** — covers-first, empty state waveform
- **Community** — rack beats (cover + metadata)
- **Account** — sections hairline, ThemePicker visuel
- **Paywall** — une offre mise en avant, copy factuelle
- **Onboarding / Auth** — wordmark, zéro emoji structurel, ThemeBackdrop

## Anti-patterns bannis

- Gradients violet + cyan décoratifs
- Orbes / mesh animés en boucle
- `PhEyebrow` sur chaque header
- Emojis comme icônes UI (onboarding, bonus)
- Tab bar flottante blur générique
- Copy AI (« Elevate », « Seamless », em-dash marketing)
- `accentSecondary` / `pillActiveGradient` multi-couleurs

## Pre-flight checklist (RN)

- [ ] 3 thèmes = matériaux différents
- [ ] 1 accent par thème, verrouillé écran entier
- [ ] Touch targets ≥ 44 pt
- [ ] `useReducedMotion` sur press transforms
- [ ] `npm run mobile:lint` vert
- [ ] Test Expo sur iPhone (LAN)

## Docs complémentaires

- `design-system/MASTER.md` — source de vérité refonte
- `design-system/pages/create.md`, `pages/paywall.md` — overrides écran
