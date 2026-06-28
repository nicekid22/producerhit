# Growth Marketing Stack — ProducerHit (juin 2026)

## Vue équipe (Growth / CMO / Ads)

**Diagnostic** : la stack first-party (`growth_events`, UTM, parrainage) était mature, mais les **pixels ads** ne recevaient que des page views — aucun pont signup → purchase → Meta/TikTok CAPI.

**Livré** : tracking unifié client + serveur, capture email, partage viral, leaderboard parrainage, attribution persistée en DB.

---

## Architecture tracking

```
trackClientEvent()
  ├─ localStorage queue → log_growth_event (Supabase)
  ├─ mirrorEventToAdPixels() → GA4 + TikTok + Meta (event_id dédup)
  └─ sendServerConversion() → Edge track-conversion → Meta CAPI + TikTok Events API
```

### Events mappés vers ads

| Event produit | GA4 | TikTok | Meta | CAPI serveur |
|---------------|-----|--------|------|--------------|
| signup_completed | sign_up | CompleteRegistration | CompleteRegistration | ✅ |
| generate_success | generate_lead | SubmitForm | Lead | ✅ |
| checkout_start | begin_checkout | InitiateCheckout | InitiateCheckout | ✅ |
| subscription_activated | purchase | Subscribe | Subscribe | ✅ |
| email_capture | generate_lead | SubmitForm | Lead | ✅ |
| growth_share_click | share | ClickButton | Lead | — |

---

## Fichiers clés

| Module | Rôle |
|--------|------|
| `src/lib/adPixels.ts` | Pont events → gtag / ttq / fbq |
| `src/lib/conversionApi.ts` | Client → Edge CAPI |
| `src/lib/utmManager.ts` | Presets campagnes + append UTM |
| `src/lib/emailCapture.ts` | RPC capture + sync attribution |
| `src/lib/deferredAnalytics.ts` | GTM + TikTok + Meta (env) |
| `supabase/functions/track-conversion/` | Meta CAPI + TikTok Events API |
| `072_growth_marketing_stack.sql` | leads, attribution, leaderboard |

### UI growth

- `EmailCaptureSection` — footer landing
- `ViralShareBar` — Settings parrainage + modal invite
- `ReferralLeaderboard` — Settings
- `GrowthAdsBootstrap` — identify user + sync attribution login

---

## Configuration production

### Vercel (front)

```env
VITE_GA_MEASUREMENT_ID=G-...
VITE_GTM_ID=GTM-...
VITE_TIKTOK_PIXEL_ID=...
VITE_META_PIXEL_ID=...
```

### Supabase secrets (CAPI)

```bash
supabase secrets set \
  META_PIXEL_ID=... \
  META_CONVERSION_API_ACCESS_TOKEN=... \
  TIKTOK_PIXEL_ID=... \
  TIKTOK_EVENTS_API_ACCESS_TOKEN=...

supabase functions deploy track-conversion
```

---

## Campagnes ads — recommandations

### TikTok Ads
- Optimiser sur **CompleteRegistration** (signup) puis **Subscribe** (achat).
- UTM : `utm_source=tiktok&utm_medium=paid&utm_campaign=...`
- `ttclid` capturé automatiquement → forward CAPI.

### Meta Ads
- Campagne Advantage+ app promotion → pixel **CompleteRegistration**.
- Retargeting 7j : `generate_success` + `checkout_start` custom audiences via GTM.

### Google Ads
- Import conversions GA4 : sign_up, begin_checkout, purchase.
- `gclid` en attribution first-touch (localStorage 30j).

---

## KPIs à suivir (dashboard `/admin/growth`)

- Funnel : landing → signup → generate → checkout
- `marketing_leads` par utm_source
- `viral_share` par channel
- Referral : filleuls / bonus / leaderboard

---

## Backlog CMO

1. Export `marketing_leads` → Resend / Beehiiv (Edge cron)
2. A/B hero landing (feature flag)
3. PostHog ou Mixpanel si besoin session replay
4. Tier referral (bronze/silver/gold)

---

*Migration `072_growth_marketing_stack` appliquée sur Supabase prod.*
