# Reddit growth — ProducerHit

## Strategie : discussion d'abord, subs varies (beats + chanson)

**Posts auto** = sujets fondateur / questions — jamais [FREE] beat link en cron.

### Subs scoutes (rotation 5-6 par run)

| Categorie | Subs |
|-----------|------|
| **AI** | r/aiMusic, r/SunoAI |
| **Beats** | r/makinghiphop, r/trapproduction, r/futurebeatmakers |
| **Songwriting** | r/Songwriting, r/singing, r/composer, r/musicians |
| **Production** | r/WeAreTheMusicMakers, r/musicproduction, r/audioengineering, r/MusicInTheMaking, r/edmproduction |
| **DAW** | r/FL_Studio, r/Ableton, r/Logic_Studio |

### Calendrier posts auto (--post, UTC)

| Jour | Contenu |
|------|---------|
| Lundi | r/aiMusic — **loops + mode chanson** |
| Mercredi | Rotation : SideProject / **r/Songwriting** / WATMM |
| Vendredi | Rotation : alphaandbetausers / **r/musicproduction** / r/composer |

### Modes ProducerHit a mentionner

- **Type beat / loop** — BPM + key lock, sketch DAW
- **Mode chanson** — melody/structure/lyrics unblock, pas vocal final

### Commandes

```bash
npm run reddit:agent -- --open
npm run reddit:agent -- post r/Songwriting
npm run reddit:cron -- --run
npm run reddit:cron:status
REDDIT_POST_SUBREDDIT=Songwriting npm run reddit:agent -- --open
```

### Quotas

`REDDIT_MAX_COMMENTS_PER_DAY=3` · `REDDIT_MAX_POSTS_PER_WEEK=3`
