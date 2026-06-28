# ProducerHit — Execution Pack (Hermes exécutable)

Transforme le blueprint en **données + agents + workflows + boucle revenu**.

Voir aussi: `AUTONOMOUS-COMPANY.md`, `CEO-STACK.md`.

## 1. Data foundation

### Déjà en prod (pas de table `users` séparée)

| Blueprint | Réel ProducerHit |
|-----------|------------------|
| users | `profiles` (plan, stripe_*, created_at) |
| events | `growth_events` + `client_events` |
| funnels | RPC `get_growth_dashboard` + session funnel dans `get_hermes_execution_metrics` |
| revenue | **`billing_revenue_events`** (migration 077) + Stripe webhook |

### Nouveau (migration `077_hermes_execution_metrics.sql`)

- Table `billing_revenue_events` — ledger Stripe (service_role only)
- RPC `get_hermes_execution_metrics(p_days)` — snapshot CEO (service_role only)

```powershell
# Appliquer migration (Supabase CLI ou MCP apply_migration)
npx supabase db push

# Sync → fichiers Hermes
npm run hermes:metrics:sync
```

**Bridge obligatoire:** Hermes lit `metrics/latest.md` — jamais Supabase direct (SECURITY.md).

## 2. Stripe tracking engine

| Métrique | Source |
|----------|--------|
| MRR / ARR | RPC (estimate par plan) + optional Stripe API cross-check |
| Churn | `billing_revenue_events` cancellations 7d |
| LTV | estimate (MRR × durée moyenne — CEO) |
| Free→paid | signups 7d vs activations |
| Refund rate | `refund` events (futur invoice handler) |

**Agent:** `ph-stripe-analytics` — lit `metrics/latest.md`, écrit rapport daily.

## 3. Growth machine

| Agent | Skill | Cron |
|-------|-------|------|
| Growth Commander | `ph-growth-commander` | 07:00 daily |
| TikTok | `ph-tiktok-growth` + `ph-viral-*` | on-demand |
| Reddit | `ph-reddit` | 4h |
| SEO | `ph-content` | 09:00 |

**Quotas Growth Commander:** 10 idées / 5 scripts TikTok / 3 Reddit / 1 SEO outline.

## 4. Revenue engine

| Agent | Skill | Cron |
|-------|-------|------|
| Revenue Optimizer | `ph-revenue-optimizer` | 03:00 daily |
| Stripe Analytics | `ph-stripe-analytics` | 07:15 daily |
| Funnel CRO | `ph-conversion` | 02:00 |

## 5. Product optimization

| Agent | Skill |
|-------|-------|
| Funnel Doctor | `ph-funnel-doctor` | 02:30 daily |

Output: 3 UX fixes + 1 experiment/day.

## 6. Research engine

| Agent | Skill |
|-------|-------|
| Market Intelligence | `ph-market-intelligence` |
| Competitor | `ph-competitor` | 4h |

## 7. Automation engine

| Agent | Skill |
|-------|-------|
| Automation Builder | `ph-automation-builder` |

Détecte tâches répétées → propose script + cron.

## 8. Boucle autonome 24h

```
06:55  npm run hermes:metrics:sync     (Windows Task ou manuel)
07:00  ph-growth-commander
07:15  ph-stripe-analytics
02:00  ph-conversion
02:30  ph-funnel-doctor
03:00  ph-revenue-optimizer
08:30  ph-ceo (synthèse + directives + kill list)
```

## 9. CEO dashboard (format obligatoire)

Le CEO (`ph-ceo`) doit toujours retourner :

```
Executive Summary:
- MRR:
- Growth Rate:
- Churn:
- Top Channel:

Opportunities: (ranked ROI)
Risks: (ranked impact)
Active Agents: (performance score 1-10)
Next Actions: (highest ROI only)
```

Source data: `metrics/latest.md` + `reports/daily/*`.

## 10. Model routing

| Blueprint | Chez toi |
|-----------|----------|
| llama3.1 CEO | **qwen3.5** |
| qwen2.5 reasoning | **qwen2.5** |
| mistral fast | **qwen2.5-coder** |

High impact → qwen3.5 | Content → qwen2.5-coder | Business → qwen2.5

## 11. Content → Revenue loop

```
TikTok/Reddit → traffic → signup (growth_events) → activation → Stripe → MRR → CEO re-optimizes
```

## 12. Failure rules

- No metrics → `npm run hermes:metrics:sync` first
- No revenue impact → kill agent/experiment
- No growth → pivot channel (CEO)
- No data → create tracking before new agents

## 13. Install complet

```powershell
npm run hermes:setup
# ou
powershell -File scripts\hermes\register-execution-pack.ps1
```

Commandes ops :

```powershell
npm run hermes:verify          # health
npm run hermes:status          # crons + rapports
npm run hermes:smoke           # test 1 cron PH
npm run hermes:metrics:sync    # metriques CEO
npm run hermes:gateway-install # autostart gateway
```

Ou manuel :

```powershell
powershell -File scripts\hermes\install-ceo-stack.ps1 -LeanOnly
npm run hermes:metrics:sync
powershell -File scripts\hermes\register-cron-jobs.ps1
hermes chat --workdir "%LOCALAPPDATA%\hermes\projects\producerhit"
# /producerhit-ceo
```

## 14. Next level (non inclus)

- TikTok auto-post (OAuth + humain valide)
- Outreach influenceurs automatique (`influ-*` archivé en lean)
- Dashboard MRR temps réel (PostHog/Stripe live UI)

Demander explicitement pour implémenter ces modules.
