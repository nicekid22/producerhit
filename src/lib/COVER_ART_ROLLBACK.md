# Covers — retour arrière rapide

## Comportement actuel

- À la **création** ou au **premier affichage** d’une carte, l’URL Pollinations canonique est enregistrée dans `stems_url.ace.coverUrl`.
- L’affichage utilise `resolveCoverImageUrl()` : URL stockée en priorité, sinon Pollinations (comme avant).
- **Landing trending** : URL persistée si dispo, sinon URL Pollinations **stable** (même `seed` + `coverPrompt` → même image, cache CDN).

## Rollback en 1 ligne

Dans `src/lib/coverArt.ts` :

```ts
export const USE_PERSISTED_COVER_URL = false;
```

Puis rebuild. Tout repasse sur les URLs Pollinations dynamiques.

## Galerie landing

- Nouveau mode `pk-landing-gallery--lite` (8 photos, bandeau CSS).
- Ancien mosaic : retiré du composant ; la liste complète reste dans `LANDING_GALLERY_IMAGES` si besoin de restaurer l’ancien `VisualCarousel` depuis git.
