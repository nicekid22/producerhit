# ProducerHit iOS — Design System (Master)

> **Direction active (2026)** : [**Dusty Cloud**](./DUSTY-CLOUD.md)  
> **Exécution** : [**EXECUTION-IOS.md**](./EXECUTION-IOS.md) — ordre des phases, statut, inventaire fichiers.

## En bref

| | |
|--|--|
| **Univers** | Coucher de soleil through frosted glass · argentique grain · Notion/Fabric dark |
| **Fond** | `#1A1220` void + grain seul — **pas** de blobs, mesh, aurora |
| **CTA** | Rose poudré `#C4687A` (plat + shadow rose) |
| **Brand / états** | Mauve `#8B6FA8` · lavande `#C4AEDE` |
| **Règle** | Rose et mauve **jamais sur le même composant** |

## Anti-patterns (bannis)

Voir liste complète dans [DUSTY-CLOUD.md](./DUSTY-CLOUD.md). En résumé :

- Mesh gradient / cercles flous / glass sur cartes scroll
- Glow rings sur navigation
- Gradients décoratifs sur cards entières
- Emojis en titres de section
- « AI slop » pitch-deck aesthetic

## Ancienne direction Prism (archivée)

La doc Prism mesh (`#0A0A0C`, gold/violet/magenta) reste dans l'historique git mais **n'est plus la cible**. Ne pas ajouter de nouveaux éléments Prism sans passer par la spec Dusty.

## Motion

- Press : `scale(0.97–0.99)`, 80–300ms, Reanimated
- Orbe / loading : seuls loops autorisés
- `prefers-reduced-motion` : respect obligatoire

## Dev

- `npm run start:lan` — Metro LAN iPhone
- `npm run lint` — `tsc --noEmit`
- Skia : dev build EAS pour orbe natif

## Stack UI

- Tokens : `theme/dustyCloud.ts` (cible) · `useTheme()`
- Fond : `AppBackground` (cible) remplace `MeshAtmosphere`
- Orbe : `AIOrb` Skia — palette Dusty Cloud
- Navigation : `EXECUTION-IOS.md` Phase 7
