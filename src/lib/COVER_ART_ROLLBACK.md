# Covers — retour arrière rapide

## Comportement actuel

- **Cartes & détails** : **photos uniquement** (Pollinations image persistée ou URL dynamique).
- Les anciennes covers vidéo (`loop-covers`, `coverKind: "video"`) sont **ignorées à l'affichage** → fallback image Pollinations.
- **Vidéo IA sociale** : service séparé dans **Share → Vidéo IA** (`generate-social-video`, bucket `social-videos`, 1 crédit/génération, 7 s boucle seamless + export client avec audio + grain VHS).

## Rollback en 1 ligne

Dans `src/lib/coverArt.ts` :

```ts
export const USE_PERSISTED_COVER_URL = false;
```

Puis rebuild. Tout repasse sur les URLs Pollinations dynamiques.

## Galerie landing

- Nouveau mode `pk-landing-gallery--lite` (8 photos, bandeau CSS).
- Ancien mosaic : retiré du composant ; la liste complète reste dans `LANDING_GALLERY_IMAGES` si besoin de restaurer l'ancien `VisualCarousel` depuis git.
