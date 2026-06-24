# iOS Widget (futur)

Le snapshot **last played** est persisté pour un futur widget natif.

## Données (`lib/lastPlayedCache.ts`)

Clé AsyncStorage : `ph_last_played_v1`

```json
{
  "id": "loop-uuid",
  "name": "Track name",
  "genre": "Trap",
  "bpm": 140,
  "coverUrl": "https://...",
  "savedAt": 1710000000000
}
```

Écrit à chaque `setCurrent()` dans `playerStore`.

## Implémentation widget (hors scope Expo managed)

1. `npx expo prebuild` + target **Widget Extension** dans Xcode
2. App Group `group.com.producerhit.app` pour partager `UserDefaults`
3. Bridge RN → écrire aussi dans App Group depuis `saveLastPlayed`
4. Widget SwiftUI : cover + titre + bouton « Play » (deep link `producerhit://play/{id}`)

## Deep link play (à ajouter)

Route implémentée : `app/play/[id].tsx` + `PendingPlayDeepLink` + `producerhit://play/{id}`.

Widget natif (hors scope Expo managed) :
