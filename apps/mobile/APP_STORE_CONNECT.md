# App Store Connect — IAP Pro

## Product ID (obligatoire avant test sandbox)

| Champ | Valeur |
|-------|--------|
| **Product ID** | `com.producerhit.app.pro.monthly` |
| Type | Auto-renewable subscription |
| Groupe | `producerhit_pro` (créer si absent) |
| Prix | Aligné web Pro (~75 gen/mois) |

Variable app : `EXPO_PUBLIC_IAP_PRO_MONTHLY=com.producerhit.app.pro.monthly`

## Bundle ID

`com.producerhit.app` (voir `app.json`)

## Backend

- Migration `078_apple_iap_entitlements` : `profiles.billing_source`, `apply_apple_pro_entitlement`
- Edge `apple-iap-sync` : sync sandbox si `APPLE_IAP_ALLOW_CLIENT_SYNC=1`
- **Production** : RevenueCat ou validation receipt serveur ; ne pas laisser `ALLOW_CLIENT_SYNC` en prod

## react-native-iap v14 (pattern Niyyah)

- `fetchProducts({ skus, type: 'subs' })`
- `requestPurchase({ request: { apple: { sku } }, type: 'subs' })`
- Listeners `purchaseUpdatedListener` / `purchaseErrorListener`
- `displayPrice` (pas `localizedPrice` seul)

Implémentation : `lib/subscriptionService.ts`, hook `lib/useSubscription.ts`, écran `app/paywall.tsx` (modal).

## Sign in with Apple

- Plugin `expo-apple-authentication`, `usesAppleSignIn: true` dans `app.json`
- Bouton natif sur `app/(auth)/login.tsx`
- Supabase `signInWithIdToken({ provider: 'apple' })` via `lib/appleAuth.ts`

## Boutons paywall requis Apple

- Subscribe (IAP)
- Restore purchases
- Lien vers gestion abonnement (Settings → Apple ID)
