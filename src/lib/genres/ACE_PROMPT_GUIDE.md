# ACE-Step XL 1.5 — Guide prompts genres (ProducerHit)

## Objectif

Chaque genre doit décrire le **son** (instruments, groove, harmonies, texture, énergie, voix), pas une catégorie marketing.

## Structure d’un bon prompt (20–40 mots)

1. Slug du genre en minuscules (`jazz rap, …`)
2. Batterie / groove
3. Basse
4. Instruments mélodiques + harmonies
5. Sound design / ambiance / énergie
6. Voix si pertinent (rap, falsetto, choeurs…)

## Interdit

- `modern underground pocket`
- `clean mix` / `polished mix` / `radio-ready polish`
- `authentic production` / `modern production`
- Répéter uniquement le nom du genre

## Genres esthétiques / internet

Traduire en caractéristiques concrètes :

| Nom | Exemple de direction |
|-----|---------------------|
| Chrome Soul | neo-soul futuriste, Rhodes glossy, basse smooth, batteries R&B |
| Dreamcore Rap | hip hop ambient, pads, reverb, mélodies nostalgiques |
| Digital Romance | plucks synth, chords chaleureux, percussion légère, mood intime |

## Fichiers

| Fichier | Genres |
|---------|--------|
| `hipHopSoulCatalog.ts` | 266 (trap, drill, boom bap, R&B, aesthetics…) |
| `extendedCatalog.ts` | 182 (EDM, rock, ambient, viral, global…) |

## Regénérer les catalogues

```bash
# Hip-hop / R&B / trap (266 genres)
node scripts/rebuild-hiphop-catalog.mjs

# EDM, ambient, viral, lifestyle… (182 genres)
node scripts/merge-ext-json.mjs
node scripts/rebuild-extended-catalog.mjs
```

Données sources :
- Hip-hop : `scripts/prompts-*.json` + `scripts/ace-soul-genre-prompts.json`
- Extended : `scripts/ext/*.json` → `scripts/prompts-extended-all.json`
