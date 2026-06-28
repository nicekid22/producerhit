# ProducerHit CEO — Hermes stack (lean)

**Ton environnement detecte :**

| | |
|--|--|
| Hermes | **v0.16.0** (376 commits behind → `hermes update`) |
| OS | **Windows** local PC |
| Home | `%LOCALAPPDATA%\hermes` |
| Projet | `%LOCALAPPDATA%\hermes\projects\producerhit` |
| Skills actifs | **86** (60 builtin + 26 local) — deja suffisant, pas 500 |

## Regle d'or

N'installe pas 100 skills. **10-20 max** + laisse Hermes creer les siens via `hermes-agent-skill-autogen` (deja builtin).

---

## Ou trouver les skills (Hermes v0.16)

| Source | Commande |
|--------|----------|
| **Deja installes** | `hermes skills list` |
| **Hub / marketplace** | `hermes skills search <mot-cle>` |
| **Installer** | `hermes skills install <identifier> -y` |
| **Desactiver bloat** | `hermes skills disable apex-ceo` |
| **Bundle CEO** | `hermes bundles create producerhit-ceo --skill ph-ceo ...` |
| **Charger bundle** | `/producerhit-ceo` dans chat |

Pas de `hermes hub` en v0.16 — utilise `hermes skills search`.

Stockage : `%LOCALAPPDATA%\hermes\skills\`

---

## Install en 1 commande (recommande)

```powershell
cd "C:\Users\dylar\Documents\ProducerKit AI - Cursor 2"
npm run hermes:start
# ou setup complet:
npm run hermes:setup
```

Cela fait : bootstrap projet, skills, Ollama `qwen3-8b-64k`, 13 crons PH locaux, pause APEX/VIRAL/INFLU.

**Ne pas lancer** `npm run agents:setup` (force cloud et casse Ollama).

```powershell
# Ancienne commande equivalente
powershell -ExecutionPolicy Bypass -File scripts\hermes\install-ceo-stack.ps1 -LeanOnly
```

Options :

```powershell
# + 2 skills hub communaute (research, agent harness)
.\scripts\hermes\install-ceo-stack.ps1 -InstallHubSkills -LeanOnly

# Sans desactiver apex/influ
.\scripts\hermes\install-ceo-stack.ps1
```

---

## Execution Pack (données + workflows exécutables)

**`EXECUTION-PACK.md`** — migration Supabase, `npm run hermes:metrics:sync`, agents Stripe/Growth/Funnel, crons 24h.

```powershell
powershell -File scripts\hermes\register-execution-pack.ps1
```

## Compagnie autonome (blueprint complet)

Voir **`AUTONOMOUS-COMPANY.md`** — 3 OS (Growth / Revenue / Product), boucle autonome, KPI, content machine, regles CEO.

## Architecture ProducerHit (deja en place)

```
CEO  ph-ceo  (/producerhit-ceo)
│
├── Growth OS
│   ├── ph-acquisition   (cron hourly)
│   ├── ph-growth        (cron 6h)
│   ├── ph-reddit        (drafts — beats + mode chanson)
│   ├── ph-content       (cron daily 09:00)
│   └── ph-viral-*       (TikTok hooks/publish)
│
├── Revenue OS
│   └── ph-conversion    (cron nightly)
│
├── Product OS
│   └── ph-conversion + ph-automation (funnel + issue drafts)
│
├── Research OS
│   └── ph-competitor    (cron 4h) + builtin arxiv
│
└── Automation OS
    └── ph-automation    + github-pr-workflow + npm reddit:cron
```

**Divisions separees (desactiver en -LeanOnly) :** apex-* (B2B), influ-* (influenceurs)

---

## 20 skills utiles — statut chez toi

| Skill | Role | Statut |
|-------|------|--------|
| ph-ceo | Orchestration | local OK |
| ph-acquisition | Leads | local OK |
| ph-growth | Experiments | local OK |
| ph-reddit | Reddit Army | sync via install script |
| ph-content | Content factory | local OK |
| ph-competitor | Research | local OK |
| ph-conversion | CRO / MRR | local OK |
| ph-automation | Workflows | local OK |
| ph-viral-* | TikTok | local OK |
| plan | Strategic planning | **builtin** |
| github-pr-workflow | PR / code | **builtin** |
| arxiv | Deep research | **builtin** |
| blogwatcher | Trend watch | **builtin** |
| hermes-agent-skill-autogen | Auto-create skills | **builtin** |
| MEMORY.md / USER.md | Memoire persistante | **builtin** |
| firecrawl-deep-research | Web research | hub (optionnel) |
| autonomous-agent-harness | Multi-agent | hub (optionnel) |
| computer-use | UI automation | **macOS only** — skip Windows |
| codex / claude-code | Dev delegation | hub — installer si besoin dev auto |

---

## Hub — commandes exactes (optionnel)

```powershell
hermes skills search codex
hermes skills search research
hermes skills install skills-sh/firecrawl/firecrawl-workflows/firecrawl-deep-research -y
hermes skills install skills-sh/affaan-m/everything-claude-code/autonomous-agent-harness -y
```

Memoire externe (optionnel) :

```powershell
hermes memory setup
```

---

## Multi-model Ollama (routing automatique)

```
CEO (qwen3-8b-64k) ── Ollama 127.0.0.1:11434/v1
    ├── all PH crons   → qwen3-8b-64k (single model)
    └── fallback      → Groq llama-3.3-70b (research lourd)
```

```powershell
powershell -ExecutionPolicy Bypass -File scripts\hermes\configure-ollama-multi-model.ps1
```

Voir `README.md` pour le tableau complet. **Ne pas** utiliser `http://localhost:11434` sans `/v1`.

## Demarrer le CEO 24/7

```powershell
# Terminal 1
ollama serve

# Terminal 2
hermes gateway start

# Terminal 3 — crons
powershell -File scripts\hermes\register-cron-jobs.ps1

# Chat CEO
hermes chat --workdir "%LOCALAPPDATA%\hermes\projects\producerhit"
# puis: /producerhit-ceo
# test: What model are you using?
```

---

## Reddit : Hermes vs Cursor

| Couche | Outil | Role |
|--------|-------|------|
| Strategie + copy | **ph-reddit** (Hermes) | Brouillons, threads prioritaires |
| Execution API | **npm run reddit:cron** (Cursor) | Post auto avec quotas |

---

## VPS plus tard

Quand MRR > quelques centaines EUR : migrer gateway + crons sur Oracle Free ou VPS 5EUR. Meme stack, meme `%HERMES_HOME%` sync.
