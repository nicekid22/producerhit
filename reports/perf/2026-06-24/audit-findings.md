# Audit performance web — ProducerHit (2026-06-24)

## Résumé exécutif

Audit code + build prod (`vite build`). Plusieurs optimisations CWV documentées en juin 2026 avaient **régressé** (43 imports CSS synchrones dans `main.tsx`, `AudioPlayer` eager, `RouteFade` sur toutes les routes).

| Priorité | Issue | Impact |
|----------|-------|--------|
| P0 | 43 CSS sync au boot (`main.tsx`) | LCP, TBT, parse CSS bloquant |
| P0 | `RouteFade` 300 ms sur `location.key` | Navigation app perçue lente |
| P0 | `LoopCardItem` subscribe `s.loops` entier | Re-render ×200 cartes |
| P0 | Library/Explore sans virtualisation | Scroll jank, DOM lourd |
| P1 | `AudioPlayer` interval 250 ms + RAF visualizer | CPU main thread |
| P1 | `backdrop-filter` élevé mobile | GPU scroll |
| P1 | `registerGenerationCatalogExtensions` au boot | JS parse ~catalogue |
| P2 | Pas de gates Lighthouse CI | Régressions non détectées |

## Build prod (après corrections)

| Asset | Taille | gzip |
|-------|--------|------|
| `index-*.js` | 194 KB | 61 KB (−3.5 KB gzip) |
| `index-*.css` entry | 303 KB | ~56 KB (CSS route splitté) |
| CSS route (ex.) | `community-flux` 12 KB, `distribution-studio` 20 KB | chargé à la demande |

## Actions implémentées (2026-06-24)

- Boot : `main.tsx` → uniquement `index.css` ; CSS route via `defer.ts` + `RouteStylesBootstrap` + `ShellPerfBootstrap`
- Navigation : `RouteFade` désactivé sur routes app shell ; `AudioPlayer` + Speed Insights lazy
- Catalogue génération différé → `ensureGenerationCatalogExtensions()` au mount Dashboard
- `LoopCardItem` : selector Zustand par `loop.id` (plus `s.loops` entier)
- Virtualisation : `VirtualizedGrid` sur Library + Explore
- Player : tick 500 ms, visualizer pause si onglet caché
- GPU mobile : `perf-mobile-gpu.css` (blur réduit, reduced-motion)
- Cover studio : `useDeferredValue` sur compteur prompt
- RUM : `web-vitals` → GA4 (10 % sample) + Vercel Speed Insights
- CI : `.github/workflows/perf-audit.yml`, scripts `perf:lighthouse` / `perf:bundle`
