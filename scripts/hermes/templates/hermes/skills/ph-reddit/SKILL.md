---
name: ph-reddit
description: Reddit Army — scout Agent Reach (OpenCLI + Exa), brouillons subtils, jamais spam beat
---

# Reddit Army — ProducerHit

**Mission :** acquisition organique via **participation** (pas promo beat en cron).

Website: https://www.producerhit.com

## Strategie

| Faire | Eviter |
|-------|--------|
| Repondre aux threads monétisation / workflow / songwriting | [FREE] beat auto en cron |
| Posts discussion (fondateur, questions) | Lien beat sur r/makinghiphop (Rule 3) |
| Ratio 9:1 commentaires utiles / 1 post | 500 subs spam |

## Subs prioritaires

**AI:** r/aiMusic, r/SunoAI  
**Beats:** r/makinghiphop, r/trapproduction, r/futurebeatmakers  
**Songwriting:** r/Songwriting, r/singing, r/composer, r/musicians  
**Prod:** r/WeAreTheMusicMakers, r/musicproduction, r/MusicInTheMaking  

## Scout — Agent Reach (sans OAuth Reddit)

Priorité des backends :

1. **OpenCLI** (Chrome + extension + login reddit.com) — threads récents par sub
2. **Exa/mcporter** — recherche `site:reddit.com/r/{sub} {query}` quand OpenCLI absent
3. **Liens manuels** — fallback dans le rapport

```bash
npm run reddit:scout:reach          # scout + rapport markdown
npm run reddit:agent -- --open      # scout + ouvre threads dans le navigateur
agent-reach doctor --json           # état OpenCLI / Exa
opencli reddit subreddit aiMusic -f yaml
```

Extension Chrome (si doctor dit NOT connected) :
`%USERPROFILE%\.agent-reach\tools\opencli-extension` → chrome://extensions → Load unpacked

## Modes ProducerHit a mentionner (si demande)

- **Loop / type beat** — BPM + key lock, sketch DAW
- **Mode chanson** — melody/structure, pas vocal final

## Chaque run

1. Scout Agent Reach (6 subs en rotation) — threads 7 derniers jours
2. Prioriser : questions ouvertes, monétisation, workflow (pas promo)
3. Ecrire `reports/automation/reddit-agent-YYYY-MM-DD.md` avec :
   - Top threads (URL, score, intent, brouillon **sans lien** sauf demande)
   - 1 brouillon post discussion (self-post)
   - Statut OpenCLI / Exa
4. **NE PAS** poster automatiquement — DRAFT only jusqu'à approbation humaine

## Exemple reponse subtile (monétisation)

```
honest take, not trying to sell you anything:
most "make money from ai music" threads are 3 different games — streaming, leasing beats, or selling workflow to creators.
raw generator dumps rarely last. what lane are you aiming for?
```

## Execution technique

```bash
npm run reddit:scout:reach
npm run reddit:agent -- --open
```

OAuth Reddit (optionnel, souvent bloqué pour nouvelles apps) :
`npm run reddit:oauth:check` — ne pas bloquer le scout si absent.

Hermes = strategie + copy. Humain = coller commentaires (3–5/jour max).

## KPIs

Replies envoyees, karma trend, clics utm_source=reddit (si partages dans rapport CEO)
