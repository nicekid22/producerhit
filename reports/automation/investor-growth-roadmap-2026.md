# ProducerHit — Roadmap Growth & Rétention (levée €10M)

Document d’audit produit / investisseur — juin 2026.

## Executive summary

ProducerHit possède déjà une **base growth solide** (parrainage, gamification, upsell, analytics admin, communauté, SEO massif). Les gaps vs un SaaS « Series A ready » concernent surtout : **persistance cross-device**, **notifications lifecycle**, **CRM produit**, **expérimentation**, et **mesure cohorte automatisée**.

**Implémenté dans cette itération (fort impact) :**
- Sync XP / streak serveur (`sync_gamification_state`)
- Stats parrainage visibles (`get_referral_stats` + `ReferralStatsPanel`)
- Centre de notifications in-app (`user_notifications` + cloche sidebar)
- Checklist d’activation mesurable (`onboarding_progress`)
- Bannière rétention audio (`AudioRetentionBanner`)
- Upsell automatique aux milestones free (gen 4, 8, 10)
- Notification parrain à l’inscription d’un filleul

---

## Matrice de maturité

| Pilier | État actuel | Score | Gap principal |
|--------|-------------|-------|---------------|
| Growth / acquisition | SEO 150+ pages, UTM, GA4, landing optimisée | 8/10 | A/B landing, paid loop closed |
| Viral loops | Share post-gen, community, YouTube pack | 7/10 | Watermark export, embed player |
| Referral | Code + loot + bonus DB | 8/10 | Leaderboard, double-sided tiers |
| Gamification | XP, streak, levels, daily loot | 7/10 | Achievements serveur, ligues |
| Notifications | Toasts only → **inbox ajoutée** | 5/10 | Email/push lifecycle |
| Analytics | `growth_events`, admin dashboard | 7/10 | Cohortes auto, revenue analytics |
| CRM | Scripts agents externes | 2/10 | Pipeline in-app, churn alerts |
| Onboarding | Coach tour → **checklist serveur** | 6/10 | Personnalisation par persona |
| Retention | Audio retention, Discord backend | 7/10 | Win-back email, re-engagement |

---

## Roadmap priorisée

### P0 — 0–30 jours (revenue & activation)

| # | Initiative | Impact | Effort | Statut |
|---|------------|--------|--------|--------|
| 1 | Sync gamification serveur | Rétention, anti-fraude | S | ✅ Fait |
| 2 | Stats referral + notif parrain | Viral K-factor | S | ✅ Fait |
| 3 | Upsell milestones free | Conversion Free→Pro | S | ✅ Fait |
| 4 | Bannière expiration audio | Upgrade Plus/Studio | S | ✅ Fait |
| 5 | Inbox notifications | Engagement DAU | M | ✅ Fait |
| 6 | Checklist activation serveur | Mesure onboarding | S | ✅ Fait |
| 7 | Email welcome + quota alert | Activation J1/J7 | M | À faire |
| 8 | Export watermark « Made with ProducerHit » | Viral B2C | S | À faire |

### P1 — 30–90 jours (scale)

| # | Initiative | Impact | Effort |
|---|------------|--------|--------|
| 9 | Web push (OneSignal / FCM) | Rétention D7/D30 | M |
| 10 | Referral leaderboard + tiers | K-factor ×2 | M |
| 11 | Discord link in-app + challenges UI | Communauté | M |
| 12 | Cohort dashboard (signup→gen→pay) | Investor metrics | M |
| 13 | NPS + CES in-product | Product-market fit | S |
| 14 | Stripe revenue + LTV dans Growth Admin | Finance | M |
| 15 | A/B framework (feature flags + events) | Conversion | L |

### P2 — 90–180 jours (moat)

| # | Initiative | Impact | Effort |
|---|------------|--------|--------|
| 16 | CRM léger (segments, tags, campaigns) | B2B pros / labels | L |
| 17 | Affiliate / ambassador program | Scale acquisition | L |
| 18 | Ligues producteurs + saisons | Gamification sociale | L |
| 19 | API publique + webhooks créateurs | Platform play | L |
| 20 | Mobile app (React Native) | Rétention mobile | XL |

---

## Détail par pilier

### Growth
- **Existant :** landing SEO, 14 langues, funnels events, agents OpenClaw/Hermes scripts
- **Manque :** paid attribution closed-loop, creative testing, landing A/B
- **KPIs cibles :** CAC payback < 6 mois, signup→first gen > 45%, free→paid > 4%

### Viral loops
- **Existant :** `ShareMomentModal`, community trending, previews YouTube
- **Manque :** lien public avec CTA signup, OG dynamique par track, TikTok share native
- **Loop idéal :** Gen → Share → Play public → Signup → Gen (mesurer `community_play` → `signup_completed`)

### Referral
- **Existant :** +10 filleul / +20 parrain, loot reveal, UTM referral
- **Ajouté :** stats dashboard, notif parrain
- **Next :** paliers (5 filleuls = 1 mois Pro), leaderboard hebdo

### Gamification
- **Existant :** 25 niveaux, daily bonus, achievements locaux
- **Ajouté :** sync XP/streak DB
- **Next :** achievements serveur, ligues, récompenses exclusives (presets, covers)

### Notifications
- **Ajouté :** table `user_notifications`, cloche, mark read
- **Next :** triggers email (quota 80%, audio expire 24h), web push

### Analytics
- **Existant :** `growth_events`, `/admin/growth`, `funnel_weekly.sql`
- **Manque :** Mixpanel/Amplitude-style cohortes, revenue MRR dashboard
- **Investor pack :** WAU/MAU, D1/D7/D30, ARPU, net revenue retention

### CRM
- **Existant :** templates agents `scripts/influ/` (hors produit)
- **Manque :** segments utilisateurs, campagnes in-app, notes support
- **Quick win :** exporter `profiles` + events vers HubSpot/Customer.io

### Onboarding
- **Existant :** `OnboardingCoach`, mobile sheet
- **Ajouté :** checklist 5 étapes + `onboarding_progress` serveur
- **Next :** parcours par intent (beatmaker vs artiste vocal)

### Retention
- **Existant :** rétention audio par plan, mastering upsell
- **Ajouté :** bannière expiration proactive
- **Next :** « Reviens créer » push J+3 sans gen, streak recovery

---

## Architecture technique (growth platform)

```
supabase/migrations/070_growth_platform_v1.sql
├── sync_gamification_state(xp, streak, visit)
├── get_referral_stats()
├── user_notifications + list/mark RPCs
├── onboarding_progress + complete/get RPCs
└── claim_referral → notif parrain

src/lib/
├── gamificationSync.ts
├── referralStats.ts
├── notifications.ts
└── onboardingProgress.ts

src/components/
├── notifications/NotificationBell.tsx
├── growth/ReferralStatsPanel.tsx
├── growth/AudioRetentionBanner.tsx
├── growth/GrowthPlatformBootstrap.tsx
└── onboarding/OnboardingChecklist.tsx
```

**Deploy :** appliquer migration `070_growth_platform_v1` sur Supabase prod.

---

## Narratif investisseur (pitch)

1. **Produit** — Génération IA musique avec loop viral communautaire + gamification native (pas un wrapper ChatGPT).
2. **Distribution** — SEO programmatic + referral double-sided + UGC YouTube/TikTok.
3. **Monétisation** — Freemium 10 gen/mois → Pro/Studio/Plus avec rétention audio comme levier upgrade.
4. **Rétention** — Streak, daily loot, inbox, checklist activation (metrics Series A).
5. **Expansion** — 14 locales, Discord challenges, voice studio = ARPU upsell.

**Use of funds (€10M indicatif) :** 40% produit/infra IA, 30% growth paid + contenu, 20% équipe (eng + growth), 10% ops/legal.

---

## Prochaines actions recommandées

1. `supabase db push` ou MCP `apply_migration` pour `070_growth_platform_v1`
2. Mesurer baseline : activation checklist completion rate, referral invites/user, upsell conversion post milestone
3. Brancher Customer.io ou Resend pour email lifecycle (P0 #7)
4. Dashboard cohortes dans Growth Admin (P1 #12)
