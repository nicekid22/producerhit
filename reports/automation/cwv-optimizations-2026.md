# Core Web Vitals — optimisations ProducerHit (2026-06-16)

Objectif : score Lighthouse mobile **> 95** (Performance + Best Practices).

## Gains build (avant → après)

| Asset | Avant | Après | Δ gzip |
|-------|-------|-------|--------|
| `index-*.css` (entry) | ~428 KB / 72 KB | ~317 KB / **56 KB** | **−16 KB** |
| `App-*.js` | ~277 KB / 88 KB | ~162 KB / **52 KB** | **−36 KB** |
| `index-*.js` (boot) | ~375 KB / 119 KB | ~5 KB / **1.9 KB** | boot minimal |
| Thème cloud (chemin critique) | chargé si flag ON | **uniquement si thème choisi** | ~26 KB gzip évités |
| Google Fonts | requête externe | **supprimée** | LCP −200–400 ms typ. |

Chunks dédiés : `vendor`, `supabase`, `icons`, `i18n`, `blog`, `seo-pages`, `audio`, CSS route-specific.

## LCP (Largest Contentful Paint)

- **Polices** : stack système dans `index.css` ; suppression Google Fonts dans `index.html`.
- **CSS critique** : `main.tsx` ne charge plus que `index.css`, loader, brand-logo ; toast/cover/texture différés (~900 ms idle).
- **Thèmes** : bug corrigé — `cloud-theme.css` (~206 KB) n’est plus préchargé pour tous les visiteurs ; warm-glass différé après first paint.
- **JS shell** : `App` en `React.lazy`, composants globaux lourds lazy (AudioPlayer, Stripe, Growth, etc.).
- **Landing** : `fetchPublicLoops` différé via `deferUntilIdle` ; CSS marketing via `RouteStylesBootstrap` / `loadMarketingCss`.

## CLS (Cumulative Layout Shift)

- `.pk-page-loader--boot` : placeholder anti-shift au boot Suspense.
- `.pk-landing-below-fold` : `content-visibility: auto` + `contain-intrinsic-size`.
- Covers : `StoredLoopCover` avec fade-in ; `decoding="async"` ; `fetchPriority="low"` en lazy.

## INP (Interaction to Next Paint)

- Auth init différé (`deferUntilIdle` 1.6 s) — moins de travail main thread au load.
- GA4 / analytics tiers différés (`GrowthBootstrap`).
- `content-visibility` sur sections landing below-the-fold.

## Bundle & code splitting

- `vite.config.ts` : `target: es2022`, `modulePreload.polyfill: false`, chunks manuels incl. **`i18n`**.
- Pages routes en `lazy()` dans `App.tsx`.

## Images

- Trending strip mobile : `loading="lazy"`.
- Player dock cover : `loading="lazy"`.
- Side cards landing : lazy + `fetchPriority="low"` (LandingGenerator).

## Caching (Vercel)

- `/assets/*` : `max-age=31536000, immutable`
- Images statiques : 7 j + `stale-while-revalidate`
- `index.html` : `must-revalidate`

## API / base de données

- `LoopsBootstrap` : `loadMyLoops` uniquement sur dashboard/library/settings.
- Landing : requêtes publiques loops différées (idle).
- Auth Supabase : init après idle (session non bloquante pour LCP).

## Rendering

- `RouteStylesBootstrap` : CSS par route après idle.
- Sections landing sous le fold : skip paint jusqu’au scroll proche.

## Limites restantes (score 95+ non garanti sans mesure prod)

1. **`index.css` ~317 KB** — monolithique ; split structurel = gros refactor.
2. **Dashboard chunk ~192 KB** — route protégée, acceptable hors landing Lighthouse.
3. **i18n chunk ~114 KB** — 14 locales ; lazy par locale = amélioration future.
4. **Warm-glass default** — ~139 KB CSS chargé après idle (FOUC léger possible).
5. Mesurer avec **Lighthouse mobile** (throttling) sur URL prod après deploy Vercel.

## Fichiers modifiés (perf)

- `vite.config.ts`, `vercel.json`, `index.html`
- `src/main.tsx`, `src/App.tsx`
- `src/lib/perf/defer.ts`, `src/lib/themeStyles.ts`
- `src/components/RouteStylesBootstrap.tsx`, `AuthBootstrap.tsx`, `GrowthBootstrap.tsx`
- `src/pages/Landing.tsx`, `src/index.css`
- `src/components/landing/*`, `src/components/cover/StoredLoopCover.tsx`

## Vérification locale

```bash
npm run check
npx vite build
npx vite preview
# Lighthouse → http://localhost:4173/ (mobile, navigation)
```
