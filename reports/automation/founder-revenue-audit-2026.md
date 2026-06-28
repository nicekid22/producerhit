# Audit fondateur — ×10 revenus en 6 mois (juin 2026)

## Synthèse exécutive

ProducerHit a une base produit solide (génération ACE/Sonauto, Voice Studio, gamification, parrainage, checkout Stripe embedded). Le goulot d’étranglement principal n’est **pas** la qualité audio — c’est la **conversion free → paid** et la **rétention post-première génération**.

**Hypothèse ×10** : passer de ~X MRR à ~10X en 6 mois via 4 leviers parallèles :

1. **Réduire les fuites du funnel** (auth email, abandon checkout, quota mal expliqué)
2. **Monétiser les moments d’intention** (download, stems, watermark, audio expiré)
3. **Amplifier la croissance organique** (SEO, viral, parrainage gamifié)
4. **Activer le paid** (CAPI checkout_abandoned, audiences retargeting)

---

## Bugs & risques corrigés / documentés

| Problème | Impact | Statut |
|----------|--------|--------|
| Upsell priorité incohérent (Plus pour utilisateurs Pro) | Confiance + conversion | ✅ Corrigé (`planEntitlements`, `growthUpsell`) |
| OAuth callbacks permissifs | Sécurité | ✅ Migration 071 + durcissement |
| RPC XP/bonus abusables côté client | Fraude quota | ✅ Migration 071 |
| `VITE_ACE_*` exposées client | Clés API volables | ⚠️ Backlog — migrer Edge-only |
| Quota desync non tracké | Debug impossible | ✅ Event `quota_desync` |
| Footer SEO Voice Studio sans clé i18n | TS + lien mort SEO | ✅ Corrigé |

---

## Frictions UX — traitées

### Auth & activation

- **Google en CTA principal** à l’inscription (évite la friction email confirmation)
- **Écran confirmation email** : preview création en attente, Google instantané, **renvoi du lien**
- **Pending generation** conservée en localStorage → restaurée au dashboard post-login

### Checkout

- **Abandon tracké** : modal Stripe fermée, URL cancel, event `checkout_abandoned`
- **Recovery banner** : page Pricing + **Dashboard** (reprise 1 clic)
- **CAPI retargeting** : `checkout_abandoned` + `checkout_resume_click` mappés pixels + serveur

### Génération & quota

- Upsell **priorité** étendu Pro/Studio (pas seulement free)
- Download MP3 free → modal **droits commerciaux**
- Stems → `PlanUpsellModal` in-app (plus redirect pricing froid)
- Watermark share → CTA upgrade Pro
- Bannière **rétention audio** avec copy orientée upgrade permanent

---

## Opportunités SEO

| Action | Effort | Impact |
|--------|--------|--------|
| Lien footer `/voice-studio` | S | ✅ Fait |
| Meta SEO Voice Studio (`SeoBootstrap`) | S | ✅ Existant |
| Pages comparatif Suno/Udio/Mubert | M | ✅ Routes marketing |
| Sitemap loops communauté (CI regen) | M | Backlog |
| Landing SEO « AI voice clone » dédiée | M | Backlog |
| Blog posts long-tail « type beat AI » | L | Backlog contenu |

---

## Opportunités virales

| Levier | Statut |
|--------|--------|
| Parrainage +20/+10 gen | ✅ Prod |
| `ViralShareBar` Settings + share moment | ✅ Prod |
| Leaderboard parrains | ✅ Prod |
| **Paliers Bronze / Argent / Or** | ✅ UI gamification Settings |
| Loot reveal parrainage | ✅ Prod |
| Watermark → upgrade | ✅ Prod |
| TikTok/YouTube pack previews | Assets existants — distribuer |

---

## Premium, upsells & pricing

### Upsells contextuels implémentés

- `feature_priority` — file d’attente (free → Plus, Pro/Studio aussi)
- `feature_stems` — stems complets
- `feature_watermark` — export sans watermark
- `feature_permanent_audio` — audio hébergé permanent
- `feature_commercial_download` — droits commerciaux MP3

### Backlog monétisation (impact élevé)

| Idée | Pourquoi |
|------|----------|
| **Packs crédits one-shot** ($9 / +50 gen) | Convertit les free au plafond sans abonnement |
| **Facturation annuelle -20%** | LTV + cash upfront |
| **Voice Studio add-on** | Différenciation vs Suno |
| **Mastering export Pro** | Déjà dans funnel mastering |
| **Upsell annual au checkout** | Toggle Stripe price annuel |

---

## Automatisations

| Automation | Statut |
|------------|--------|
| Growth events → CAPI | ✅ |
| Checkout abandon → sessionStorage recovery | ✅ |
| Cron agents Hermes/OpenClaw | Scripts repo (ops) |
| **Nurture leads email** (Resend/Beehiiv) | Backlog — table `marketing_leads` prête |
| **Daily bonus → notif push/email** | Backlog |
| **Win-back checkout abandon J+1 email** | Backlog (brancher `checkout_abandoned` → cron) |

---

## Fidélisation

- Daily bonus + niveaux XP (gamification)
- Audio retention banner (peur de perte → upgrade)
- Referral tiers visuels (progression)
- Discord communauté (lien pricing)
- **Backlog** : streak 7 jours, email « ta loop expire dans 48h »

---

## Stack ads — événements clés post-audit

| Event | Usage campagne |
|-------|----------------|
| `landing_auto_generate_blocked` | Lookalike intent forte |
| `checkout_abandoned` | Retargeting panier abandonné |
| `checkout_resume_click` | Optimisation creative recovery |
| `generate_success` | Broad conversion |
| `subscription_activated` | ROAS primary |

Configurer audiences Meta/TikTok : **InitiateCheckout sans Subscribe** sous 7 jours.

---

## Roadmap 6 mois (priorisée)

### Mois 1 — Conversion (quick wins restants)

- [ ] Packs crédits Stripe one-shot
- [ ] Email nurture leads (Edge cron + Resend)
- [ ] Win-back checkout J+1

### Mois 2 — SEO & contenu

- [ ] Regen sitemap loops CI
- [ ] 3 landing SEO Voice / Sample Lab
- [ ] 5 articles blog comparatifs

### Mois 3 — Produit premium

- [ ] Voice Studio tier add-on
- [ ] Annual billing toggle
- [ ] ACE keys Edge-only (sécurité + marge)

### Mois 4–6 — Scale

- [ ] Paid acquisition budgets sur audiences abandon + generate_success
- [ ] Programme créateurs (affiliate %)
- [ ] Localisation ES/PT ads landing

---

## Fichiers modifiés (session fondateur)

| Fichier | Changement |
|---------|------------|
| `src/lib/planEntitlements.ts` | Priorité alignée plans |
| `src/lib/growthUpsell.ts` | Nouveaux upsells + priorité Pro |
| `src/lib/generationErrors.ts` | Upsell priorité étendu |
| `src/lib/checkoutRecovery.ts` | Abandon sessionStorage |
| `src/lib/adPixels.ts` | checkout_abandoned CAPI |
| `src/lib/pendingGeneration.ts` | Helper auth pending |
| `src/lib/referralConfig.ts` | Tiers bronze/silver/gold |
| `src/pages/Auth.tsx` | Google first, resend, pending preview |
| `src/pages/Dashboard.tsx` | Recovery banner, events |
| `src/pages/Pricing.tsx` | Recovery + email capture |
| `src/components/billing/CheckoutRecoveryBanner.tsx` | Nouveau |
| `src/components/billing/StripeCheckoutModal.tsx` | Abandon track |
| `src/components/growth/ReferralStatsPanel.tsx` | Tiers UI |
| `src/components/growth/AudioRetentionBanner.tsx` | Copy upgrade |
| `src/components/landing/LandingFooter.tsx` | Lien Voice Studio |
| `src/stores/authStore.ts` | resendSignupConfirmation |

---

## KPIs à suivre (hebdo)

1. **Signup → 1ère génération** (%) — cible +15 pts
2. **Free → Pro conversion 30j** — cible 3–5%
3. **Checkout start → Subscribe** — cible 45%+
4. **Checkout abandon recovery rate** — baseline puis +20%
5. **Referral invites / MAU** — cible 0.15
6. **MRR** — objectif ×10 à M+6

---

*Rapport généré en mode fondateur — itérations code appliquées directement sur la branche de travail.*
