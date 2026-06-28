---
name: ph-x-trend-radar
description: Radar tendances X — scout rapide, compte officiel + satellites music AI, brouillons only
---

# X Trend Radar — ProducerHit

**Mission :** repérer les sujets viraux **avant** la masse et préparer des réponses/postes rapides — sans spam.

Website: https://www.producerhit.com

## Comptes (à configurer par le fondateur)

| Rôle | Usage | Promo ProducerHit |
|------|--------|-------------------|
| **Officiel** (@producerhit…) | Annonces produit, wins, liens utm | Directe, mesurée |
| **Satellites** (music AI, beatmaking tips…) | Replies dans les threads tendance | Subtile — 90 % valeur / 10 % mention |

**Ne jamais** poster auto sans validation humaine tant que la stratégie n'est pas validée.

## Fenêtre de réaction

| Délai depuis le pic | Action |
|---------------------|--------|
| < 30 min | Priorité max — brouillon reply + angle unique |
| 30 min – 2 h | Reply utile ou quote avec insight |
| > 2 h | Skip sauf evergreen (tutorial, comparaison Suno) |

## Scout (Agent Reach)

Quand les cookies X sont configurés :

```bash
agent-reach doctor --json          # vérifier twitter active_backend
agent-reach configure twitter-cookies   # comptes secondaires recommandés
twitter search "suno OR ai music" -n 20
twitter feed -n 30
```

Sans cookies : Exa / recherche web pour URLs x.com récentes — **DRAFT only**.

## Chaque run Hermes

1. Lister 5–10 signaux tendance (AI music, Suno, Udio, beat licensing, Spotify AI)
2. Pour chaque signal : URL, auteur, angle, **brouillon reply** (sans lien sauf demande)
3. Indiquer quel compte (officiel vs satellite) et fenêtre (< 30 min = urgent)
4. Écrire `reports/daily/x-trend-YYYY-MM-DD-HH.md`
5. **NE PAS** publier — DRAFT jusqu'à approbation

## Règles anti-ban

1. Max 5–8 interactions/jour **par compte**
2. Pas de copier-coller identique entre comptes
3. Pas de lien ProducerHit dans les 10 premiers replies d'un thread viral
4. Satellites = persona cohérente (prod tips, pas "buy my tool")
5. Officiel = annonces et threads fondateur seulement

## Exemple reply satellite (thread Suno viral)

```
hot take: the winners aren't chasing every model drop — they're locking one workflow (idea → loop → song structure → export).
what's your bottleneck right now — melody, lyrics, or actually finishing?
```

## KPIs

Impressions replies, profil visits, clics utm_source=x, followers net (hebdo)

## Exécution technique (hors Hermes)

```bash
npm run x:scout          # à brancher quand auth X prête
```

Hermes = radar + copy. Humain = publish depuis comptes connectés.
