# TestFlight checklist — ProducerHit iOS v1

## Before first build

- [ ] Bundle ID `com.producerhit.app` registered in Apple Developer
- [ ] App Store Connect app created
- [ ] Subscription group `producerhit_pro` with levels 1/2/3:
  - Pro `com.producerhit.app.pro.monthly` ($6.99)
  - Studio `com.producerhit.app.studio.monthly` ($19.99)
  - Plus `com.producerhit.app.plus.monthly` ($39.99)
- [ ] Métadonnées EN/FR + review screenshot par IAP (voir `APP_STORE_CONNECT.md`)
- [ ] Supabase redirect: `producerhit://auth/callback`
- [ ] Migration `078_apple_iap_entitlements` + `079_apple_plan_entitlement` applied
- [ ] Edge `apple-iap-sync` deployed (sandbox: `APPLE_IAP_ALLOW_CLIENT_SYNC=1`) — **deployed v1**

## Internal testers (max 5 for first pass)

1. Sign up on iOS → sign in on web `/library` (same email)
2. Generate **one** beat on iOS → appears on web within 30s
3. Hit free quota → paywall opens with **Studio** pre-selected (no spam generations)
4. Sandbox IAP — test **each tier**:
   - Purchase Pro → `profiles.plan` = `pro`
   - Purchase Studio → `profiles.plan` = `studio`
   - Purchase Plus → `profiles.plan` = `plus`
5. Restore purchases on second device (highest active tier wins)
6. Stems ZIP on free/Pro → paywall opens with **Plus** pre-selected
7. Soft upsell: ≤2 generations left → dismissible sheet (Pro); first beat → Studio sheet

## Do NOT

- Run automated generation loops (ACE cost + quota)
- Post tweets or spam social from test accounts
- Enable `APPLE_IAP_ALLOW_CLIENT_SYNC=1` in production

## Review notes for Apple

- Demo account email + password in App Review notes
- 30s screen recording: onboarding → generate → library → play → paywall (3 plans visible)
- Explain: 3 auto-renewable subscriptions in group `producerhit_pro`; web uses Stripe for same account (tiers independent per platform)

## Commands

```bash
cd apps/mobile
eas build --platform ios --profile preview
eas submit --platform ios --latest
```

## Verify plan in Supabase (after sandbox purchase)

```sql
select id, plan, billing_source, apple_original_transaction_id
from profiles
where email = 'your-sandbox-test@email.com';
```
