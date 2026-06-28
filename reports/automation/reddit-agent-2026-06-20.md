# Reddit agent — 2026-06-20

> `npm run reddit:agent -- --open` ouvre les pages dans **ton** navigateur Reddit (session connectée).

## ⚠️ r/makinghiphop — Rule 3

**Ne poste pas de beat / single / lien loop en thread principal** sur r/makinghiphop.
Utilise ce sub pour **commenter** (conseils workflow, comparaison Suno, FL tips) — pas pour publier un beat.

| Sub | Beat en post | Commentaires |
|-----|--------------|--------------|
| r/makinghiphop | ❌ Rule 3 | ✅ questions prod / AI / workflow |
| r/Typebeats | ✅ [FREE] type beat | ✅ |
| r/WeAreTheMusicMakers | ❌ sauf feedback thread | ✅ |

## Subs actifs (rotation)

- r/aiMusic (ai)
- r/SunoAI (ai)
- r/makinghiphop (beats)
- r/trapproduction (beats)
- r/futurebeatmakers (beats)
- r/Songwriting (song)
- r/singing (song)
- r/composer (song)
- r/musicians (song)
- r/WeAreTheMusicMakers (production)
- r/musicproduction (production)
- r/audioengineering (production)
- r/MusicInTheMaking (production)
- r/edmproduction (production)
- r/FL_Studio (daw)
- r/Ableton (daw)
- r/Logic_Studio (daw)

---

## Mode aujourd'hui

| Mode | Statut |
|------|--------|
| OAuth Reddit (auto comment/post) | ❌ — `npm run reddit:oauth -- --open` ou posts manuels |
| Threads repérés (API) | 0 |
| Commentaires auto postés | 0 |

---

## 1. Post discussion → r/SideProject

**Discussion fondateur — pas de beat, questions honnêtes**

**Titre:**
```
BeatStars scrolling was killing my sessions so I built a seed-based loop sketch tool (probably overbuilt it)
```

**Corps (self-post — pas de lien beat):**
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

**Ouvrir compose:** https://www.reddit.com/submit?sr=SideProject&title=BeatStars+scrolling+was+killing+my+sessions+so+I+built+a+seed-based+loop+sketch+tool+%28probably+overbuilt+it%29&selftext=Not+another+%22AI+will+replace+artists%22+pitch+%E2%80%94+I+built+this+because+I+kept+losing+**hours**+before+I+even+opened+FL.%0A%0A**The+annoying+gap%3A**%0A-+Suno%2FUdio+%E2%86%92+great+for+*finished+songs*%2C+useless+when+I+need+an+8-bar+loop+in+**one+BPM+%2B+key**%0A-+BeatStars+%E2%86%92+infinite+scroll%2C+wrong+vibe%2C+wrong+key%0A-+Blank+project+%E2%86%92+writer%27s+block%0A%0A**What+I+shipped+%28ProducerHit%29%3A**%0A-+lock+genre+%2F+BPM+%2F+key+*before*+generation%0A-+seed+variations+%E2%86%92+same+mood%2C+new+melody+%28like+rerolling+an+idea+without+starting+over%29%0A-+export+mp3+%E2%86%92+I+redo+drums%2C+808%2C+mix+manually.+AI+%3D+sketch+pad+only.%0A%0ASolo+dev.+Free+tier+%7E10+gens%2Fmonth.%0A%0A**Would+love+brutal+feedback%3A**%0A1.+Is+this+a+fake+problem+or+do+you+hit+the+same+wall%3F%0A2.+Landing+page+%E2%80%94+clear+or+too+%22AI+slop%22%3F%0A3.+What+would+make+you+actually+try+it+once%3F%0A%0ANot+asking+for+upvotes+%E2%80%94+genuinely+trying+to+figure+out+if+I%27m+building+for+myself+or+for+others.+Link+in+comments+if+mods+prefer.

**Commentaire #1 — apres publish (lien seulement si on demande):**
```
context: i'm the dev — https://www.producerhit.com/?utm_source=reddit&utm_medium=social&utm_campaign=sideproject if you want to poke holes in it
```

_SideProject répond bien le matin US (9h–12h EST)_

_Option manuelle beat (hors auto): r/Typebeats — `[FREE] Stoner Rock @ 49 BPM — "Stoner Rock" (sketch, not a finished type beat)`_

💡 Launch pack complet: `npm run reddit:launch -- --open`

---

## 2. r/aiMusic + r/makinghiphop — commenter (discussions monétisation, workflow)

**Exemple thread prioritaire** — [Does anyone actually make money from AI generated...](https://www.reddit.com/r/aiMusic/comments/1u9y2i0/does_anyone_actually_make_money_from_ai_generated/)

Reponse **subtile** (copier-coller, pas de lien) :

```
honest take, not trying to sell you anything:

most "make money from ai music" threads are really 3 different games — streaming finished tracks (brutal margins + noise), leasing beats (still needs real mixing + branding), or selling workflow/tools to other creators (unsexy but real).

raw generator dumps rarely last. the people i still see doing *something* treat ai as sketch/reference, finish in a daw, or they build for producers instead of competing on spotify.

what lane are you actually aiming for? streaming, beats, or services? the answer matters more than which model you use.
```

r/makinghiphop — [recherche](https://www.reddit.com/r/makinghiphop/search/?q=type+beat+generator&restrict_sr=1&sort=new&t=week) — meme ton, pas de beat link :

```
honest take, not trying to sell you anything:

most "make money from ai music" threads are really 3 different games — streaming finished tracks (brutal margins + noise), leasing beats (still needs real mixing + branding), or selling workflow/tools to other creators (unsexy but real).

raw generator dumps rarely last. the people i still see doing *something* treat ai as sketch/reference, finish in a daw, or they build for producers instead of competing on spotify.

what lane are you actually aiming for? streaming, beats, or services? the answer matters more than which model you use.
```

---

## 3. Autres discussions (commentaires)

Pas de threads via API (OAuth absent ou quota). Ouvre ces recherches et réponds **à la main** (max 3–5/jour) :

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

---

## 4. Regles anti-ban Reddit

1. **Posts auto** = discussion / questions — jamais [FREE] beat en cron
2. **r/makinghiphop** : jamais de post beat (Rule 3) — commentaires conseil only
3. **Max 3–5 interactions/jour** sur des subs differents
4. Ratio ~90 % participation / 10 % promo
5. r/Typebeats beat → **manuel uniquement** si tu veux du trafic producer
6. Upvote des posts sans lien (karma)

---

## 5. Beats publics (option manuelle r/Typebeats seulement)

1. **Neo Soul Smooth Female Vocal Jazzy #01** (Auto) → https://www.producerhit.com/loop/ab1639f8-d6cb-408a-b13d-9c027a10eb31?utm_source=reddit&utm_medium=social&utm_campaign=agent_reply
2. **French Pop Chanson Soft Female Vocal #01** (Auto) → https://www.producerhit.com/loop/eb10bd9a-ef45-4edd-8bd1-b2cfdb5c6dc7?utm_source=reddit&utm_medium=social&utm_campaign=agent_reply
3. **Cloud Rap Dreamy Pads Soft 808 #01** (Auto) → https://www.producerhit.com/loop/e1029082-b980-4a83-a23e-e42a9356242e?utm_source=reddit&utm_medium=social&utm_campaign=agent_reply
4. **Crush Who Doesn't Know Yet Song #02** (Auto) → https://www.producerhit.com/loop/f067aed4-289f-4230-9560-c0d00b8eda08?utm_source=reddit&utm_medium=social&utm_campaign=agent_reply
5. **Crush Who Doesn't Know Yet Song #01** (Auto) → https://www.producerhit.com/loop/693b774c-817a-4d73-9f77-d387cbbe2cf1?utm_source=reddit&utm_medium=social&utm_campaign=agent_reply
6. **Horror Cinématique Clusters Piano Bowed Metal #01** (Auto) → https://www.producerhit.com/loop/dc255784-7b85-4787-9b82-378a6610bd37?utm_source=reddit&utm_medium=social&utm_campaign=agent_reply

---

## 6. Automatisation complète (optionnel)

```bash
# Si tu as une app Reddit script + refresh token :
npm run reddit:oauth:check
npm run reddit:agent -- scout --post-comments
```

Secrets Supabase prod : `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_REFRESH_TOKEN`
