# Reddit cron — 2026-06-21 (dry-run)

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


## Mode manuel (OAuth indisponible)

Reddit bloque souvent **Create app** sur [prefs/apps](https://www.reddit.com/prefs/apps) depuis fin 2025.
**Devvit** (apps in-Reddit) ≠ credentials OAuth pour le cron.

Tu es déjà connecté dans ton navigateur → copie-colle les brouillons ci-dessous (max 3–5/jour).

### Post discussion du jour (pré-rempli)

- **Sub:** r/aiMusic
- **[Ouvrir le formulaire Reddit](https://www.reddit.com/submit?sr=aiMusic&title=Solo+dev+%E2%80%94+AI+for+beat+loops+AND+song+sketches+%28not+another+Suno+clone%29.+Am+I+solving+a+real+problem%3F&selftext=hey+r%2FaiMusic+%E2%80%94+solo+dev%2Fproducer%2C+not+a+label.+tired+of+the+gap+between+%22full+AI+songs%22+and+actually+making+music.%0A%0A**two+workflows+i+kept+mixing+up%3A**%0A-+**Type+beat+%2F+loop+mode**+%E2%80%94+8-bar+sketch+in+fixed+BPM+%2B+key+%E2%86%92+DAW+%E2%86%92+redo+drums%2F808%2Fmix%0A-+**Song+mode**+%E2%80%94+melody+%2B+structure+%2B+vocal-ish+sketch+to+unblock+lyrics%2Farrangement+%28i+still+rewrite+everything%29%0A%0A**what+broke+for+me+with+Suno%2FUdio+alone%3A**%0A-+amazing+for+*finished+songs*%2C+awkward+when+i+need+a+loop+in+one+key+for+beat+work%0A-+song+output+is+a+demo%2C+not+my+final+vocal%2Flyrics%0A-+BeatStars+%E2%86%92+hours+of+scrolling%0A%0A**what+i+built+%28ProducerHit%29%3A**%0A-+pick+genre+%2B+BPM+%2B+key+*before*+generating%0A-+switch+**loop**+vs+**song**+intent+%28not+the+same+use+case%29%0A-+seed+variations+%E2%86%92+same+mood%2C+new+idea%0A-+export+%E2%86%92+human+finishing+required%0A%0A**honest+questions%3A**%0A1.+do+you+use+AI+for+loops%2C+full+songs%2C+or+both%3F%0A2.+anyone+actually+using+AI+for+*songwriting+sketches*+vs+releasable+vocals%3F%0A3.+what+would+make+you+trust+a+tool+vs+%22AI+slop%22%3F%0A%0Ano+links+in+the+feed+%E2%80%94+happy+to+discuss+in+comments.)**

```
hey r/aiMusic — solo dev/producer, not a label. tired of the gap between "full AI songs" and actually making music.

**two workflows i kept mixing up:**
- **Type beat / loop mode** — 8-bar sketch in fixed BPM + key → DAW → redo drums/808/mix
- **Song mode** — melody + structure + vocal-ish sketch to unblock lyrics/arrangement (i still rewrite everything)

**what broke for me with Suno/Udio alone:**
- amazing for *finished songs*, awkward when i need a loop in one key for beat work
- song output is a demo, not my final vocal/lyrics
- BeatStars → hours of scrolling

**what i built (ProducerHit):**
- pick genre + BPM + key *before* generating
- switch **loop** vs **song** intent (not the same use case)
- seed variations → same mood, new idea
- export → human finishing required

**honest questions:**
1. do you use AI for loops, full songs, or both?
2. anyone actually using AI for *songwriting sketches* vs releasable vocals?
3. what would make you trust a tool vs "AI slop"?

no links in the feed — happy to discuss in comments.
```

### Exemple de commentaire (adapter au thread)

```
workflow that's been working: lock bpm/key → 3–4 ugly sketches → pick one → replace 100% of drums/808 in daw.

ai = reference, not the final beat. anyone else doing this or is it a crutch?
```

### Recherches à ouvrir (threads récents)

- [r/aiMusic · ai · "make money"](https://www.reddit.com/r/aiMusic/search/?q=make+money&restrict_sr=1&sort=new&t=week)
- [r/aiMusic · ai · "suno"](https://www.reddit.com/r/aiMusic/search/?q=suno&restrict_sr=1&sort=new&t=week)
- [r/SunoAI · ai · "alternative"](https://www.reddit.com/r/SunoAI/search/?q=alternative&restrict_sr=1&sort=new&t=week)
- [r/SunoAI · ai · "song"](https://www.reddit.com/r/SunoAI/search/?q=song&restrict_sr=1&sort=new&t=week)
- [r/Songwriting · song · "writer's block"](https://www.reddit.com/r/Songwriting/search/?q=writer%27s+block&restrict_sr=1&sort=new&t=week)
- [r/Songwriting · song · "ai"](https://www.reddit.com/r/Songwriting/search/?q=ai&restrict_sr=1&sort=new&t=week)
- [r/singing · song · "ai vocal"](https://www.reddit.com/r/singing/search/?q=ai+vocal&restrict_sr=1&sort=new&t=week)
- [r/singing · song · "demo"](https://www.reddit.com/r/singing/search/?q=demo&restrict_sr=1&sort=new&t=week)
- [r/composer · song · "ai"](https://www.reddit.com/r/composer/search/?q=ai&restrict_sr=1&sort=new&t=week)
- [r/composer · song · "melody"](https://www.reddit.com/r/composer/search/?q=melody&restrict_sr=1&sort=new&t=week)
- [r/musicians · song · "ai music"](https://www.reddit.com/r/musicians/search/?q=ai+music&restrict_sr=1&sort=new&t=week)
- [r/musicians · song · "songwriting"](https://www.reddit.com/r/musicians/search/?q=songwriting&restrict_sr=1&sort=new&t=week)
- [r/makinghiphop · beats · "suno"](https://www.reddit.com/r/makinghiphop/search/?q=suno&restrict_sr=1&sort=new&t=week)
- [r/makinghiphop · beats · "ai beat"](https://www.reddit.com/r/makinghiphop/search/?q=ai+beat&restrict_sr=1&sort=new&t=week)
- [r/trapproduction · beats · "type beat"](https://www.reddit.com/r/trapproduction/search/?q=type+beat&restrict_sr=1&sort=new&t=week)
- [r/trapproduction · beats · "ai"](https://www.reddit.com/r/trapproduction/search/?q=ai&restrict_sr=1&sort=new&t=week)

### Raccourcis

```bash
npm run reddit:manual          # rapport + ouvre Reddit
npm run reddit:launch -- --open  # playbook launch 2–6h
```

