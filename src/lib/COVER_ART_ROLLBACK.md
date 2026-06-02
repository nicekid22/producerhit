# Covers — retour arrière rapide



## Comportement actuel



- **Cartes & détails** : **photos uniquement** (Pollinations image persistée ou URL dynamique).

- Les anciennes covers vidéo (`loop-covers`, `coverKind: "video"`) sont **ignorées à l'affichage** → fallback image Pollinations.

- **Vidéo mood sociale** : **Share → Vidéo mood** (`fetch-mood-image` + rendu client `moodBoardVideo.ts`, 1 crédit/photo Pexels ou fallback Pollinations image, export 15 s 9:16/1:1 avec logo `/img/logovideo.png` + audio).



## Rollback en 1 ligne



Dans `src/lib/coverArt.ts` :



```ts

export const USE_PERSISTED_COVER_URL = false;

```



Puis rebuild. Tout repasse sur les URLs Pollinations dynamiques.



## Galerie landing



- Nouveau mode `pk-landing-gallery--lite` (8 photos, bandeau CSS).

- Ancien mosaic : retiré du composant ; la liste complète reste dans `LANDING_GALLERY_IMAGES` si besoin de restaurer l'ancien `VisualCarousel` depuis git.

