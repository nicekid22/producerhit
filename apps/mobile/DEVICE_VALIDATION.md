# Checklist validation device — ProducerHit iOS

À exécuter sur **iPhone réel** (TestFlight ou dev client). Si le lag persiste, profiler avec Xcode **Instruments** (Time Profiler + GPU).

## Critères de succès

- Communauté : tap play → son **ou** message d'erreur clair en < 2 s
- Switch onglet : pas de freeze perceptible (> 300 ms)
- Pas de warning Metro récurrent (VirtualizedList / nested scroll)
- `npm run lint` vert dans `apps/mobile`
- 3 thèmes (Prism / Warm / Air) sans régression visuelle

## Zones à valider

| Zone | Actions |
|------|---------|
| **Créer** | Génération, orbe progress, CTA, clavier |
| **Bibliothèque** | Grille, sheet détail, lecture, pull-refresh |
| **Communauté** | Trending horizontal, grille, play, sheet, erreur réseau, loop ACE sans login |
| **Compte** | Thèmes Prism / Warm / Air, changement fond mesh |
| **Tab bar** | Créer en 1er, switch rapide entre onglets |
| **Mini-player** | Orbe Skia en pause hors lecture, WebGL en lecture |
| **Full player** | Orbe WebGL seulement si `expanded` |

## Communauté (régressions P0)

- [ ] Play loop avec `audioUrl` HTTP → lecture immédiate
- [ ] Play loop ACE-only **sans** session → message login requis
- [ ] Play loop ACE avec session → résolution + lecture ou toast échec
- [ ] Covers Pinterest : pas de rafale au mount (max ~3 concurrent)
- [ ] Scroll trending + grille fluide (pas de saccades majeures)

## Performance (régressions P1)

- [ ] Switch onglets : pas de spike GPU > 3 s continu hors lecture
- [ ] Onglet Créer blur : orbe tab bar en idle / paused
- [ ] Génération sur autre onglet : orbe WebGL pausé
- [ ] Mesh Prism : grain visible, pas de cercles dessinés, fluidité OK

## Profilage optionnel (Instruments)

1. Ouvrir l'app, laisser idle 30 s sur chaque onglet
2. Noter % GPU / CPU sur Communauté au premier scroll
3. Comparer avant/après si lag signalé
