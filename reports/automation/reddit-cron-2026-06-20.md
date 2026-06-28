# Reddit cron — 2026-06-20

| | |
|--|--|
| OAuth | ❌ `npm run reddit:oauth -- --open` |
| Intervalle | 20 min (scout ; 1 action max si quota) |
| Commentaires aujourd'hui | 0 / 3 |
| Posts aujourd'hui | 0 / 1 |
| Posts cette semaine | 0 / 3 |
| Peut commenter | ✅ |
| Peut poster | ✅ |
| Threads scoutés | 0 |
| Commentaires ce run | 0 |
| Post hebdo | ⏭ not_requested |

## Quotas

```
Cron interval: 20 min (scout chaque tick, action si quota OK)
Comments: 0/3 today · 3 left · cooldown 120m
Posts: 0/1 today · 0/3 this week
Can comment: yes
Can post: yes
```

## Calendrier posts (UTC)

| Jour | Action |
|------|--------|
| Lundi | r/aiMusic — beats + **mode chanson** (discussion) |
| Mercredi | Rotation : SideProject / **r/Songwriting** / WATMM |
| Vendredi | Rotation : alphaandbetausers / **r/musicproduction** / r/composer |
| Scout | 5 subs/run en rotation (17 subs : prod, songwriting, AI, DAW) |
| Manuel | r/Typebeats [FREE] beat — hors cron |

## Threads repérés


## Activer l'auto complète

1. `npm run reddit:oauth -- --open`
2. Secrets GitHub : `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_REFRESH_TOKEN`
3. `npm run reddit:cron -- --run`
