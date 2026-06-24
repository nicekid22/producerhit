# Sprint 8 — Analyse & plan iOS

## Diagnostic (post Sprint 7)

L’app n’est plus une « demo Expo » sur les écrans principaux, mais il reste des **ruptures de qualité** :

| Zone | État | Gap |
|------|------|-----|
| Boot / splash | Spinner générique | Pas de brand moment, splash Prism figé |
| Tokens statiques | 5+ composants | Warm/Air cassés localement |
| Community liste | Row 72px | vs trending cover-first |
| Library | Pas de skeleton | Blanc au chargement, pas de « 0 résultats filtre » |
| Create | BPM/lyrics bruts | Hors PromptConsole/PhTextField |
| Daily bonus | État local | Bouton réapparaît après remount |
| Mini player | SeekBar linéaire | Pas de haptics, ≠ full player |
| Auth callback | Prism hardcodé | Pas de retry |

## Sprint 8 — lots

| # | Lot | Impact | Effort | Statut |
|---|-----|--------|--------|--------|
| 1 | Boot branded + splash hide + auth layout thémé | Haut | S | ✅ |
| 2 | Migration `useTheme()` (dé, logo, callback, cards) | Haut | S | ✅ |
| 3 | Library skeleton + empty filtre | Moyen | S | ✅ |
| 4 | Community grille cover-first | Haut | M | ✅ |
| 5 | DailyBonus hydraté + retiré de Create | Moyen | S | ✅ |
| 6 | Create PhTextField BPM/lyrics + MiniPlayer haptics | Moyen | S | ✅ |
| 7 | Paywall stagger + haptics IAP | Moyen | S | ✅ |
| 8 | TestFlight screenshots (manuel) | Ship | M | ⏳ |

## Règles inchangées

Voir [MASTER.md](./MASTER.md) — pas de glass partout, CTA gradient limité.
