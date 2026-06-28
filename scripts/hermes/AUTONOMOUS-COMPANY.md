# ProducerHit — Compagnie autonome (Hermes + multi-agents + Ollama)

Blueprint opérationnel : machine de croissance structurée, pas des agents isolés.

## 1. Architecture globale

```
                 ┌─────────────────────────┐
                 │   CEO (ph-ceo)        │
                 │   stratégie · ROI     │
                 │   création / kill     │
                 └──────────┬────────────┘
                            │
     ┌──────────────────────┼──────────────────────┐
     │                      │                      │
     ▼                      ▼                      ▼
 Growth OS            Revenue OS             Product OS
 (trafic viral)        (MRR · pricing)        (activation · UX)
     │                      │                      │
     ▼                      ▼                      ▼
 ph-acquisition        ph-conversion          (futur ph-product)
 ph-growth             Stripe audit*          funnel via ph-conversion
 ph-reddit             upsell ideas*
 ph-content
 ph-viral-*
     │
     └─ Research OS ── ph-competitor + arxiv
     └─ Automation OS ─ ph-automation + crons + npm scripts
```

\* Pas d'accès Stripe/Supabase direct depuis Hermes — drafts + directives pour humain/Cursor.

## 2. Stack modèles (ton PC — installé)

| Rôle | Modèle | Hermes config |
|------|--------|---------------|
| CEO (stratégie, arbitrage) | **qwen3.5** | `model.default` |
| Workers reasoning (growth, funnels) | **qwen2.5** | `delegation.*` |
| Fast (parsing, hooks, titres) | **qwen2.5-coder** | `auxiliary.*` |
| Research cloud | **Groq** llama-3.3-70b | `fallback_providers` + `web_extract` |

```powershell
powershell -ExecutionPolicy Bypass -File scripts\hermes\configure-ollama-multi-model.ps1
```

> Blueprint générique cite llama3.1 / mistral — chez toi **qwen3.5 / qwen2.5** = équivalent ou mieux.

## 3. Organigramme → skills existants

### Growth OS (moteur viral)

| Agent blueprint | Skill ProducerHit | Cron |
|-----------------|-------------------|------|
| Acquisition / leads | **ph-acquisition** | hourly |
| Growth experiments | **ph-growth** | 6h |
| Reddit Army | **ph-reddit** | 4h |
| SEO / content | **ph-content** | daily 09:00 |
| TikTok hooks | **ph-viral-hooks** | on-demand |
| TikTok strategy | **ph-viral-strategist** | on-demand |
| TikTok publish | **ph-viral-publish** | on-demand |

**Objectif :** trafic, signups, viral loops.

### Revenue OS (cash machine)

| Agent blueprint | Skill | Cron |
|-----------------|-------|------|
| Funnel / CRO | **ph-conversion** | nightly 02:00 |
| Pricing / upsell | CEO + ph-conversion | weekly review |
| Stripe analytics | CEO directive → humain | — |
| Affiliate / partnerships | futur (skill-autogen) | — |

**Objectif :** MRR ↑, churn ↓, LTV ↑.

### Product OS (conversion produit)

| Agent blueprint | Skill | Statut |
|-----------------|-------|--------|
| Funnel optimization | **ph-conversion** (overlap) | actif |
| Onboarding / UX | CEO → issue drafts **ph-automation** | partiel |
| Retention / features | CEO kill list + roadmap | actif |

**Objectif :** activation, rétention, trial→paid.

### Research OS

| Agent | Skill | Cron |
|-------|-------|------|
| Competitor intel | **ph-competitor** | 4h |
| Deep research | **arxiv** (builtin) | on-demand |
| Market trends | Groq fallback + web | on-demand |

### Automation OS

| Agent | Skill / outil |
|-------|----------------|
| Workflows | **ph-automation** |
| Crons Hermes | `register-cron-jobs.ps1` |
| Reddit API | `npm run reddit:cron` (Cursor) |
| Code / PR | **github-pr-workflow** |

## 4. Boucle autonome (cycle CEO daily)

```
1. Collect   → reports/daily/* (tous agents, 24h)
2. Analyze   → business.md, competitors.md, pricing.md
3. Detect    → opportunités ROI (H/M/L)
4. Create    → nouveau skill si workflow répété 3× (skill-autogen)
5. Launch    → directives mesurables par agent
6. Measure   → KPI dans executive report
7. Optimize  → roadmap max 5 bets actifs
8. Kill      → experiments sans KPI → stop
9. Repeat    → cron CEO 08:30
```

## 5. KPI globaux (CEO surveille uniquement)

| KPI | Source | Accès Hermes |
|-----|--------|--------------|
| MRR | Stripe | indirect (rapports humains) |
| Trial→paid % | PostHog / rapports | fichiers projet |
| Activation | PostHog | fichiers projet |
| Rétention D1/D7/D30 | PostHog | fichiers projet |
| Organic sessions | SEO reports ph-content | reports/daily |
| Reddit UTM | ph-reddit reports | reports/daily |
| CAC / LTV | CEO estimates | roadmap |

Hermes **ne lit pas** Supabase prod ni `.env` — voir `SECURITY.md`.

## 6. Content machine (TikTok / Shorts)

Pipeline via **ph-viral-*** :

1. **ph-viral-strategist** — tendances, angles ProducerHit
2. **ph-viral-hooks** — hooks 3s, scripts courts
3. **ph-viral-render** — assets (si configuré)
4. **ph-viral-publish** — drafts publication (humain valide)

Objectif : trafic gratuit massif → landing → trial.

## 7. Revenue engine ProducerHit

```
Abonnements SaaS (Free / Pro / Studio / Plus)
  → ph-conversion audite funnel + trial→paid
Upsells / packs crédits
  → CEO + conversion reports
Affiliate / studios (futur)
  → skill-autogen quand process répété
```

## 8. Data layer

| Source | Usage CEO |
|--------|-----------|
| `reports/daily/*.md` | Synthèse agents |
| `business.md`, `roadmap.md` | Stratégie |
| `competitors.md`, `pricing.md` | Research |
| Stripe / Supabase / PostHog | **hors Hermes** — snapshots manuels dans projet |

## 9. Erreurs à éviter

- Trop d'agents sans KPI mesurable
- Pas de kill list hebdomadaire
- Un seul modèle pour tout (coût + lenteur)
- CEO qui exécute au lieu de déléguer (`delegate_task`)
- Dupliquer apex-* / influ-* en mode lean
- Poster sans validation humaine (Reddit, TikTok, X)

## 10. Démarrage

```powershell
# 1. Stack CEO + skills
powershell -ExecutionPolicy Bypass -File scripts\hermes\install-ceo-stack.ps1 -LeanOnly

# 2. Multi-model Ollama
powershell -ExecutionPolicy Bypass -File scripts\hermes\configure-ollama-multi-model.ps1

# 3. 24/7
ollama serve
hermes gateway start
powershell -File scripts\hermes\register-cron-jobs.ps1
hermes chat --workdir "%LOCALAPPDATA%\hermes\projects\producerhit"
# /producerhit-ceo
```

## 11. Créer un nouvel agent (règle CEO)

Quand une tâche se répète **3+ fois** avec le même format :

1. CEO documente le workflow dans `reports/daily/`
2. Invoke **hermes-agent-skill-autogen** → skill `ph-<nom>`
3. Ajoute au bundle si critique
4. Optionnel : cron via `register-cron-jobs.ps1`

Ne pas pré-installer 50 agents — laisser le CEO les faire naître par la boucle.
