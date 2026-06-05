# Rollback — Landing mobile v2

## Désactivation rapide (prod / preview)

```bash
VITE_LANDING_MOBILE_V2=0
```

Puis rebuild / redeploy. Aucun revert git nécessaire.

## Fichiers touchés par la v2

| Fichier | Rôle |
|---------|------|
| `src/lib/featureFlags.ts` | Flag `LANDING_MOBILE_V2` |
| `src/styles/landing-mobile-v2.css` | Styles mobile épurés + animation idle |
| `src/main.tsx` | Import CSS |
| `src/pages/Landing.tsx` | Hero condensé, sections masquées mobile |
| `src/components/landing/LandingGenerator.tsx` | Mode compact, samples mobile, idle float |
| `src/components/landing/LandingCommunityRail.tsx` | Lead compact (classe CSS) |

## Revert git complet

```bash
git checkout HEAD -- src/lib/featureFlags.ts src/main.tsx src/pages/Landing.tsx src/components/landing/LandingGenerator.tsx src/components/landing/LandingCommunityRail.tsx
git rm src/styles/landing-mobile-v2.css LANDING_MOBILE_V2_ROLLBACK.md
```

## Comportement v2 (mobile ≤767px)

- Hero : tagline + typewriter + lead (espacement corrigé, plus de chevauchement)
- Carte unifiée : générateur + « Aucune compétence… » + 2 extraits en liste (pas des tuiles isolées)
- Animation idle légère sur toute la carte unifiée
- Stats compactes (grille 4 modes) sans bloc titre long
- Lead communauté court mais visible au scroll
