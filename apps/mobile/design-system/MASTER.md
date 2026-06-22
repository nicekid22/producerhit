# ProducerHit iOS — Design System (Master)

> **Design Read:** app mobile producteur, 3 skins distincts (Prism studio / Warm editorial / Air minimal Apple).
> **Dials:** VARIANCE 7 · MOTION 5 · DENSITY 4

## Anti-patterns (bannis)

- Gradients cyan+violet décoratifs (Prism = 1 accent cyan)
- Orbes animés en boucle sur chaque écran
- Glass + blur partout
- Eyebrows répétés (max 1 / 3 sections)
- Emojis comme icônes structurelles
- Copy « Elevate », « Seamless », em-dash

## Prism — Studio Night

| Token | Value |
|-------|-------|
| bg | `#0a0a0c` |
| surface | `#141418` |
| accent | `#3db8e8` |
| text | `#f4f4f5` |
| material | studio (matte, waveform) |

## Warm — Editorial Vinyl

| Token | Value |
|-------|-------|
| bg | `#f7f2ea` |
| surface | `#fffdf8` |
| accent | `#c45c26` |
| text | `#1c1917` |
| material | paper (grain, serif display) |

## Air — Minimal Apple

| Token | Value |
|-------|-------|
| bg | `#f5f5f7` |
| surface | `#ffffff` |
| accent | `#007aff` |
| text | `#1d1d1f` |
| material | flat (hairlines, zero blur) |

## Motion

- Press: `scale(0.97)`, 120ms ease-out
- Tab switch: no animation
- Modal/paywall enter: 220ms ease-out
- `prefers-reduced-motion`: opacity only

## Touch

- Min target 44×44pt
- Haptics: success/error on generation & IAP
