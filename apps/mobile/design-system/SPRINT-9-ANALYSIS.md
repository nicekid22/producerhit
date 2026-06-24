# Sprint 9 — Ship polish

## Lots

| # | Lot | Statut |
|---|-----|--------|
| 1 | `PhBottomSheet` glass blur (Prism / studio material) | ✅ |
| 2 | Pull-to-refresh haptics (`usePullRefresh`) | ✅ |
| 3 | `NetworkErrorBanner` + retry Library / Community | ✅ |
| 4 | Deep link loop (`parseLoopDeepLink`, store, `/loop/[id]`, universal links) | ✅ |
| 5 | Community skeleton + `CommunityNoResultsState` | ✅ |
| 6 | Screenshots README + associatedDomains | ✅ |
| 7 | TestFlight build + ASC screenshots | ⏳ manuel |

## Fichiers clés

- `components/PhBottomSheet.tsx` — BlurView iOS, bgGlass Android
- `lib/usePullRefresh.ts` — haptics + RefreshControl
- `components/NetworkErrorBanner.tsx`
- `lib/parseLoopDeepLink.ts` + `stores/deepLinkStore.ts` + `app/loop/[id].tsx`
- `lib/publicLoopsApi.ts` — `fetchCommunityLoopById`

## Sprint 10 (suggestion)

- Offline cache loops (AsyncStorage last fetch)
- Share extension iOS
- Widget « last track »
- PhBottomSheet drag-to-dismiss
- NetInfo banner proactive (optional dep)
