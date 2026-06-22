# ProducerHit iOS (Expo)

Native iOS client — **same Supabase DB** as [producerhit.com](https://www.producerhit.com).

## Prerequisites

- Node 22+
- Xcode + CocoaPods (Mac for device builds)
- Expo EAS CLI: `npm i -g eas-cli`
- Supabase redirect URL: `producerhit://auth/callback` (+ optional `https://www.producerhit.com/auth/callback`)

## Setup

```bash
cd apps/mobile
cp .env.example .env
# Fill EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY from root .env (VITE_*)
npm install
```

## Run (development)

```bash
npm start
# Press i for iOS simulator — auth works; IAP needs dev client
```

## Dev client (IAP + native modules)

```bash
npx expo prebuild --platform ios
npx expo run:ios
```

IAP **does not work in Expo Go**. Use a development build.

## EAS / TestFlight

```bash
eas login
eas build:configure
eas build --platform ios --profile preview
eas submit --platform ios
```

See [TESTFLIGHT.md](./TESTFLIGHT.md).

## MVP scope

See [MVP_SCOPE.md](./MVP_SCOPE.md) and [DESIGN.md](./DESIGN.md).

## Icons

From repo root:

```bash
npm run mobile:assets
```

Generates `apps/mobile/assets/` from the cloud brand SVG.

## Apple IAP sandbox

1. Create subscription in App Store Connect: `com.producerhit.app.pro.monthly`
2. Set `EXPO_PUBLIC_IAP_PRO_MONTHLY` in `.env`
3. Supabase secret for sandbox sync: `APPLE_IAP_ALLOW_CLIENT_SYNC=1` (dev only)
4. Deploy edge function: `supabase functions deploy apple-iap-sync`
5. Apply migration `078_apple_iap_entitlements.sql`

Production: use RevenueCat or Apple Server Notifications — disable `APPLE_IAP_ALLOW_CLIENT_SYNC`.
