# Prompts — rappel écriture humaine

Les agents Cursor doivent lire **`.cursor/skills/human-prompts/SKILL.md`** avant de modifier les pools legacy.

## Banque test 2000 (v1 + v2)

Fichiers : `packages/shared/data/prompt-bank/v1.json`, `v2.json`

- **Display** → champ idée (UI)
- **acestep.caption** → `captionOverride` ACE
- **acestep.lyrics_structure** → lyrics envoyées à la génération

Activée par défaut en mode **chanson**. Désactiver : `EXPO_PUBLIC_PROMPT_BANK=0` (mobile) ou `VITE_PROMPT_BANK=0` (web).

```bash
npx tsx -e "import { promptBankStats } from './packages/shared/src/prompt/promptBank/index.ts'; console.log(promptBankStats())"
```
