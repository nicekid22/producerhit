# Reddit cron — 2026-06-21

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


## Mode manuel — pourquoi les agents ne commentent pas seuls

| Raison | Détail |
|--------|--------|
| **Pas d'OAuth** | Sans `REDDIT_CLIENT_ID` + secret + refresh token, le cron **ne peut pas** poster de commentaires via l'API |
| **Hermes PH Reddit** | Cron jamais exécuté (status: never) |
| **Mode manuel** | Ouvre le navigateur — **tu** dois coller le commentaire (3–5/jour max) |

### ⚠️ Fenêtres Reddit « post non finalisé »

Les URLs `/submit?title=...` **ne peuvent pas** :
- choisir le **flair** (obligatoire sur r/aiMusic — étoile rouge)
- remplir le corps sur le **nouveau Reddit** (souvent vide)

→ **Ne pas publier** ces brouillons aiMusic. **Commenter** les threads existants ci-dessous.

---

## 1. Commentaires prioritaires (copier-coller)

### 1. [r/aiMusic — make money from AI music](https://www.reddit.com/r/aiMusic/comments/1u9y2i0/does_anyone_actually_make_money_from_ai_generated/)

```
honest take, not trying to sell you anything:

most "make money from ai music" threads are really 3 different games — streaming finished tracks (brutal margins + noise), leasing beats (still needs real mixing + branding), or selling workflow/tools to other creators (unsexy but real).

raw generator dumps rarely last. the people i still see doing *something* treat ai as sketch/reference, finish in a daw, or they build for producers instead of competing on spotify.

what lane are you actually aiming for? streaming, beats, or services? the answer matters more than which model you use.
```

### 2. [r/aiMusic — Suno / alternatives (recherche)](https://www.reddit.com/r/aiMusic/search/?q=suno+alternative&restrict_sr=1&sort=new&t=week)

```
suno/udio excel at full songs. when i need an 8-bar loop in a fixed bpm/key for beat work, i ended up in a totally different workflow (sketch → daw → redo drums).

do you use ai for finished releases or mostly ideation?
```

### 3. [r/makinghiphop — Suno / AI beats](https://www.reddit.com/r/makinghiphop/search/?q=suno&restrict_sr=1&sort=new&t=week)

```
suno wins for songs; for beat workflow i lock bpm/key first then treat output as reference only. still redo drums every time.

what's your split — full tracks or loops/sketches?
```

---

## 2. Nouveau post (optionnel) — r/SideProject

Pas de flair obligatoire. **Coller le corps à la main** si le formulaire est vide.

- **[Ouvrir formulaire](https://www.reddit.com/submit?sr=SideProject&title=BeatStars+scrolling+was+killing+my+sessions+so+I+built+a+seed-based+loop+sketch+tool+%28probably+overbuilt+it%29&selftext=Not+another+%22AI+will+replace+artists%22+pitch+%E2%80%94+I+built+this+because+I+kept+losing+**hours**+before+I+even+opened+FL.%0A%0A**The+annoying+gap%3A**%0A-+Suno%2FUdio+%E2%86%92+great+for+*finished+songs*%2C+useless+when+I+need+an+8-bar+loop+in+**one+BPM+%2B+key**%0A-+BeatStars+%E2%86%92+infinite+scroll%2C+wrong+vibe%2C+wrong+key%0A-+Blank+project+%E2%86%92+writer%27s+block%0A%0A**What+I+shipped+%28ProducerHit%29%3A**%0A-+lock+genre+%2F+BPM+%2F+key+*before*+generation%0A-+seed+variations+%E2%86%92+same+mood%2C+new+melody+%28like+rerolling+an+idea+without+starting+over%29%0A-+export+mp3+%E2%86%92+I+redo+drums%2C+808%2C+mix+manually.+AI+%3D+sketch+pad+only.%0A%0ASolo+dev.+Free+tier+%7E10+gens%2Fmonth.%0A%0A**Would+love+brutal+feedback%3A**%0A1.+Is+this+a+fake+problem+or+do+you+hit+the+same+wall%3F%0A2.+Landing+page+%E2%80%94+clear+or+too+%22AI+slop%22%3F%0A3.+What+would+make+you+actually+try+it+once%3F%0A%0ANot+asking+for+upvotes+%E2%80%94+genuinely+trying+to+figure+out+if+I%27m+building+for+myself+or+for+others.+Link+in+comments+if+mods+prefer.)**

**Titre:** BeatStars scrolling was killing my sessions so I built a seed-based loop sketch tool (probably overbuilt it)

**Corps:**

```
Not another "AI will replace artists" pitch — I built this because I kept losing **hours** before I even opened FL.

**The annoying gap:**
- Suno/Udio → great for *finished songs*, useless when I need an 8-bar loop in **one BPM + key**
- BeatStars → infinite scroll, wrong vibe, wrong key
- Blank project → writer's block

**What I shipped (ProducerHit):**
- lock genre / BPM / key *before* generation
- seed variations → same mood, new melody (like rerolling an idea without starting over)
- export mp3 → I redo drums, 808, mix manually. AI = sketch pad only.

Solo dev. Free tier ~10 gens/month.

**Would love brutal feedback:**
1. Is this a fake problem or do you hit the same wall?
2. Landing page — clear or too "AI slop"?
3. What would make you actually try it once?

Not asking for upvotes — genuinely trying to figure out if I'm building for myself or for others. Link in comments if mods prefer.
```

---

## 3. Recherches threads récents

- [r/aiMusic · "make money"](https://www.reddit.com/r/aiMusic/search/?q=make+money&restrict_sr=1&sort=new&t=week)
- [r/aiMusic · "suno"](https://www.reddit.com/r/aiMusic/search/?q=suno&restrict_sr=1&sort=new&t=week)
- [r/SunoAI · "alternative"](https://www.reddit.com/r/SunoAI/search/?q=alternative&restrict_sr=1&sort=new&t=week)
- [r/SunoAI · "song"](https://www.reddit.com/r/SunoAI/search/?q=song&restrict_sr=1&sort=new&t=week)
- [r/Songwriting · "writer's block"](https://www.reddit.com/r/Songwriting/search/?q=writer%27s+block&restrict_sr=1&sort=new&t=week)
- [r/Songwriting · "ai"](https://www.reddit.com/r/Songwriting/search/?q=ai&restrict_sr=1&sort=new&t=week)
- [r/singing · "ai vocal"](https://www.reddit.com/r/singing/search/?q=ai+vocal&restrict_sr=1&sort=new&t=week)
- [r/singing · "demo"](https://www.reddit.com/r/singing/search/?q=demo&restrict_sr=1&sort=new&t=week)
- [r/composer · "ai"](https://www.reddit.com/r/composer/search/?q=ai&restrict_sr=1&sort=new&t=week)
- [r/composer · "melody"](https://www.reddit.com/r/composer/search/?q=melody&restrict_sr=1&sort=new&t=week)
- [r/musicians · "ai music"](https://www.reddit.com/r/musicians/search/?q=ai+music&restrict_sr=1&sort=new&t=week)
- [r/musicians · "songwriting"](https://www.reddit.com/r/musicians/search/?q=songwriting&restrict_sr=1&sort=new&t=week)

```bash
npm run reddit:manual   # ouvre les threads prioritaires + SideProject
```

