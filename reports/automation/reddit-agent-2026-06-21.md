# Reddit agent — 2026-06-21

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
| Agent Reach — OpenCLI | ❌ extension Chrome (voir ci-dessous) |
| Agent Reach — Exa scout | ✅ Exa/mcporter |
| Subs scoutés (rotation) | r/aiMusic, r/SunoAI, r/makinghiphop, r/trapproduction, r/futurebeatmakers, r/Songwriting |
| OAuth Reddit (auto comment/post) | ❌ — posts manuels recommandés |
| Threads repérés | 12 |
| Commentaires auto postés | 0 |

> **OpenCLI** : charge l'extension depuis `%USERPROFILE%\.agent-reach\tools\opencli-extension` → chrome://extensions → Load unpacked. Puis login reddit.com dans Chrome.


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

_Option manuelle beat (hors auto): r/Typebeats — `[FREE] 73 BPM slow plugg sketch — "Chanson Ambient Plugg Histoire Nocturne" (raw before FL, roast the bounce?)`_

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

### 1. is ai going to replace type beat producers? : r/trapproduction - Reddit

- **Sub:** r/trapproduction · score 12 · intent `help` · source `exa`
- **Thread:** https://www.reddit.com/r/trapproduction/comments/134pggt/is_ai_going_to_replace_type_beat_producers
- **Réponse (copier-coller):**

```
when i'm blocked i set a 15 min timer for "ugly loops only" — permission to trash everything. usually one sketch is worth developing.

what's your actual unblock ritual?
```

### 2. Does anyone see any ACTUAL value in AI tools? : r/makinghiphop

- **Sub:** r/makinghiphop · score 10 · intent `discussion` · source `exa`
- **Thread:** https://www.reddit.com/r/makinghiphop/comments/1oeujfg/does_anyone_see_any_actual_value_in_ai_tools
- **Réponse (copier-coller):**

```
following this — been on both sides (trying to ship beats + building tools). the unsexy pattern is always the same: ai gets you to **draft fast**, money shows up after human finishing (mix, arrangement, brand).

what's your actual goal with this — side income or replace a day job?
```

### 3. [DISCUSSION] Putting Well Known Vocals On Top Of Original Beats

- **Sub:** r/makinghiphop · score 10 · intent `songwriting` · source `exa`
- **Thread:** https://www.reddit.com/r/makinghiphop/comments/hnjphq/discussion_putting_well_known_vocals_on_top_of.json
- **Réponse (copier-coller):**

```
for songwriting i use ai more like a messy voice memo — chord mood + melody idea, then i rewrite lyrics and ditch the ai vocal.

anyone else or is that still a line you won't cross?
```

### 4. What are the alternatives to Suno? : r/SunoAI - Reddit

- **Sub:** r/SunoAI · score 9 · intent `workflow` · source `exa`
- **Thread:** https://www.reddit.com/r/SunoAI/comments/1p7zesj/what_are_the_alternatives_to_suno
- **Réponse (copier-coller):**

```
workflow that's been working: lock bpm/key → 3–4 ugly sketches → pick one → replace 100% of drums/808 in daw.

ai = reference, not the final beat. anyone else doing this or is it a crutch?
```

### 5. What's the best AI song you've made recently? I genuinely want to ...

- **Sub:** r/SunoAI · score 9 · intent `help` · source `exa`
- **Thread:** https://www.reddit.com/r/SunoAI/comments/1t746eu/whats_the_best_ai_song_youve_made_recently_i
- **Réponse (copier-coller):**

```
when i'm blocked i set a 15 min timer for "ugly loops only" — permission to trash everything. usually one sketch is worth developing.

what's your actual unblock ritual?
```

### 6. As producers, how do we all plan to deal with competing against AI?

- **Sub:** r/makinghiphop · score 9 · intent `help` · source `exa`
- **Thread:** https://www.reddit.com/r/makinghiphop/comments/1d3apis/as_producers_how_do_we_all_plan_to_deal_with
- **Réponse (copier-coller):**

```
when i'm blocked i set a 15 min timer for "ugly loops only" — permission to trash everything. usually one sketch is worth developing.

what's your actual unblock ritual?
```

### 7. Quais conversores de YouTube para MP3 são seguros para usar? : r/makinghiphop

- **Sub:** r/makinghiphop · score 9 · intent `workflow` · source `exa`
- **Thread:** https://www.reddit.com/r/makinghiphop/comments/cmauj9/what_youtube_to_mp3_converters_are_safe_to_use
- **Réponse (copier-coller):**

```
workflow that's been working: lock bpm/key → 3–4 ugly sketches → pick one → replace 100% of drums/808 in daw.

ai = reference, not the final beat. anyone else doing this or is it a crutch?
```

### 8. Extend song functionality rewriting the song. Help?

- **Sub:** r/SunoAI · score 8 · intent `songwriting` · source `exa`
- **Thread:** https://www.reddit.com/r/SunoAI/comments/1qjs84w/extend_song_functionality_rewriting_the_song_help
- **Réponse (copier-coller):**

```
songwriting angle — i split "beat loops" vs "song sketches" in my head completely.

song mode for me = melody/structure demo → rewrite lyrics → real vocal later. not shipping raw ai vocals.

curious if songwriters here use ai for hooks/lyrics or avoid it entirely?
```

### 9. is there a difference between a beat that a rapper would sing over it and a beat that a rapper would rap over it? : r/trapproduction

- **Sub:** r/trapproduction · score 8 · intent `songwriting` · source `exa`
- **Thread:** https://www.reddit.com/r/trapproduction/comments/1hj4w16/is_there_a_difference_between_a_beat_that_a
- **Réponse (copier-coller):**

```
for songwriting i use ai more like a messy voice memo — chord mood + melody idea, then i rewrite lyrics and ditch the ai vocal.

anyone else or is that still a line you won't cross?
```

### 10. How do you come up with inspiration when you haven't experienced that stuff? : r/Songwriting

- **Sub:** r/Songwriting · score 8 · intent `songwriting` · source `exa`
- **Thread:** https://www.reddit.com/r/Songwriting/comments/1kltybz/how_do_you_come_up_with_inspiration_when_you
- **Réponse (copier-coller):**

```
for songwriting i use ai more like a messy voice memo — chord mood + melody idea, then i rewrite lyrics and ditch the ai vocal.

anyone else or is that still a line you won't cross?
```

### 11. How do you approach songwriting when concept comes before melody/music?

- **Sub:** r/Songwriting · score 8 · intent `songwriting` · source `exa`
- **Thread:** https://www.reddit.com/r/Songwriting/comments/1nlzl0b/how_do_you_approach_songwriting_when_concept.json
- **Réponse (copier-coller):**

```
for songwriting i use ai more like a messy voice memo — chord mood + melody idea, then i rewrite lyrics and ditch the ai vocal.

anyone else or is that still a line you won't cross?
```

### 12. Ever feel bored with all but one part of a song you write?

- **Sub:** r/Songwriting · score 8 · intent `songwriting` · source `exa`
- **Thread:** https://www.reddit.com/r/Songwriting/comments/18gd9zb/ever_feel_bored_with_all_but_one_part_of_a_song.json
- **Réponse (copier-coller):**

```
for songwriting i use ai more like a messy voice memo — chord mood + melody idea, then i rewrite lyrics and ditch the ai vocal.

anyone else or is that still a line you won't cross?
```

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

1. **Chanson Neo Fashion Rap Émotion Brute #02** (Neo Fashion Rap) → https://www.producerhit.com/loop/628f2427-4092-4a51-952b-fc8806a1652b?utm_source=reddit&utm_medium=social&utm_campaign=agent_reply
2. **Chanson Neo Fashion Rap Émotion Brute #01** (Auto) → https://www.producerhit.com/loop/0bd298ef-fb66-4691-aa1b-fb4b8861c458?utm_source=reddit&utm_medium=social&utm_campaign=agent_reply
3. **Chanson Tango Love Story Afro-urban #01** (Tango) → https://www.producerhit.com/loop/d18f00d8-e61d-4ac7-b376-507072b20d31?utm_source=reddit&utm_medium=social&utm_campaign=agent_reply
4. **Chanson Amapiano Nuit Reggaeton #01** (Amapiano) → https://www.producerhit.com/loop/73ccc620-f527-4088-b491-cf9898586282?utm_source=reddit&utm_medium=social&utm_campaign=agent_reply
5. **Chanson Chill Electronic Groove Club #02** (Chill Electronic) → https://www.producerhit.com/loop/abd97d47-cffb-4f6b-8c30-95a2c0c36d57?utm_source=reddit&utm_medium=social&utm_campaign=agent_reply
6. **Chanson Art Gallery Rap Moment Vérité #01** (Art Gallery Rap) → https://www.producerhit.com/loop/9832def6-f0da-465e-b9d9-3408cdffd238?utm_source=reddit&utm_medium=social&utm_campaign=agent_reply

---

## 6. Automatisation complète (optionnel)

```bash
# Si tu as une app Reddit script + refresh token :
npm run reddit:oauth:check
npm run reddit:agent -- scout --post-comments
```

Secrets Supabase prod : `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_REFRESH_TOKEN`
