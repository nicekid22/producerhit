# TestFlight checklist — ProducerHit iOS v1

## Before first build

- [ ] Bundle ID `com.producerhit.app` registered in Apple Developer
- [ ] App Store Connect app created
- [ ] Subscription `com.producerhit.app.pro.monthly` created (Pro)
- [ ] Supabase redirect: `producerhit://auth/callback`
- [ ] Migration `078_apple_iap_entitlements` applied
- [ ] Edge `apple-iap-sync` deployed (sandbox: `APPLE_IAP_ALLOW_CLIENT_SYNC=1`) — **deployed v1**

## Internal testers (max 5 for first pass)

1. Sign up on iOS → sign in on web `/library` (same email)
2. Generate **one** beat on iOS → appears on web within 30s
3. Hit free quota → paywall opens (no spam generations)
4. Sandbox IAP purchase → `profiles.plan` = pro on web Settings
5. Restore purchases on second device

## Do NOT

- Run automated generation loops (ACE cost + quota)
- Post tweets or spam social from test accounts
- Enable `APPLE_IAP_ALLOW_CLIENT_SYNC=1` in production

## Review notes for Apple

- Demo account email + password in App Review notes
- 30s screen recording: onboarding → generate → library → play
- Explain: digital subscription via IAP; web uses Stripe for same account tier

## Commands

```bash
cd apps/mobile
eas build --platform ios --profile preview
eas submit --platform ios --latest
```
