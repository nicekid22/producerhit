---
name: human-prompts
description: >-
  Écrire des prompts musicaux (dé, placeholders, curated) comme un humain — sujets
  de la vie réelle, pas de formules IA. Utiliser avant d'éditer les pools ProducerHit.
---

# Prompts humains — ProducerHit

**Quand utiliser ce skill :**
- Ajout / modification de prompts dans `packages/shared/src/prompt/`
- Placeholders rotatifs, dé d'inspiration, pools curated v2, thèmes ACE prose
- Copy utilisateur qui doit sonner naturel (studio, onboarding, paywall)

**Ne pas utiliser pour :** code technique, migrations SQL, noms de variables.

## Règles d'écriture

1. **Un sujet concret** — pas « vibe nocturne » ou « émotion brute ». Préfère : « le texto que tu n'oses pas envoyer », « la file au pressing un samedi », « ton coloc qui cuisine à 1h ».
2. **Voix parlée** — contractions, détails sensoriels, un peu d'humour. Comme si tu parlais à un pote producteur.
3. **Variété** — pas deux prompts sur la pluie / la nuit / le drive dans le même pool. Alterner : travail, famille, argent, crush, studio, sport, transport, réseaux.
4. **Pas de doublons structurels** — éviter 4× « chanson X nocturne sur Y nocturne ». Mood + genre + thème doivent diversifier.
5. **Court et actionnable** — une phrase pour le dé ; 1–2 lignes max pour curated display.

## Fichiers à toucher

| Zone | Fichiers |
|------|----------|
| Thèmes ACE (EN) | `packages/shared/src/prompt/aceProse/lexicon.ts` |
| Thèmes ACE (FR) | `packages/shared/src/prompt/aceProse/locales/fr.ts` (+ es, etc.) |
| Dé par genre | `packages/shared/src/prompt/genreDiceLocales.ts` |
| Curated riches | `packages/shared/src/prompt/curated/v2/*.ts` |
| Merge dé / placeholder | `packages/shared/src/prompt/inspirationAndDice.ts` |

Après changement des thèmes ACE non-EN : `npx tsx scripts/generate-ace-prose-locale-pools.ts`

## Humanizer (optionnel)

Skill officiel API (crédits) : `humanizerai/agent-skills` → `/humanize`

```bash
npx skills add humanizerai/agent-skills -a cursor -y --skill humanize
```

Si l'install échoue (SSL Windows), copier manuellement depuis :
https://github.com/humanizerai/agent-skills/tree/main/skills/humanize

Pour les prompts ProducerHit, **ce skill suffit** — pas besoin de l'API sauf polish final sur une grosse batch.

## Checklist avant commit

- [ ] Aucun thème générique « histoire nocturne / raw emotion / moment of truth » en fallback
- [ ] Pas de 4 hooks « sifflet » identiques
- [ ] Pools régénérés si `locales/fr.ts` ou lexicon modifié
- [ ] Relire à voix haute : ça sonne humain ?
