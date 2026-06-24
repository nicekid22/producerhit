# App Store Connect — IAP 3 tiers

## Bundle ID

`com.producerhit.app` (voir `app.json`)

## Groupe d'abonnements

| Champ | Valeur |
|-------|--------|
| **Reference Name** | ProducerHit Subscriptions |
| **Group ID** | `producerhit_pro` |

### Niveaux (ordre upgrade Apple)

| Level | Product ID | Prix US |
|-------|------------|---------|
| 1 | `com.producerhit.app.pro.monthly` | $6.99 |
| 2 | `com.producerhit.app.studio.monthly` | $19.99 |
| 3 | `com.producerhit.app.plus.monthly` | $39.99 |

## Métadonnées à coller (EN + FR)

### Pro — `com.producerhit.app.pro.monthly`

| | EN | FR |
|---|----|----|
| **Display Name** | ProducerHit Pro | ProducerHit Pro |
| **Description** | 75 AI beats & songs per month. Commercial use on your tracks. Priority generation queue. Full library sync on iPhone and web. | 75 beats & chansons IA par mois. Usage commercial inclus. File prioritaire. Bibliothèque synchronisée iPhone et web. |

### Studio — `com.producerhit.app.studio.monthly`

| | EN | FR |
|---|----|----|
| **Display Name** | ProducerHit Studio | ProducerHit Studio |
| **Description** | 250 generations per month. Everything in Pro plus heavy production workflow. Commercial rights & WAV export. Best for active producers. | 250 générations par mois. Tout Pro + workflow production intensive. Droits commerciaux & export WAV. Idéal producteurs actifs. |

### Plus — `com.producerhit.app.plus.monthly`

| | EN | FR |
|---|----|----|
| **Display Name** | ProducerHit Plus | ProducerHit Plus |
| **Description** | 1000 generations per month. Pro stems ZIP when available. Maximum volume for labels, catalogs & power users. | 1000 générations par mois. Stems ZIP pro quand disponibles. Volume maximum pour labels, catalogues & power users. |

## Variables app

```env
EXPO_PUBLIC_IAP_PRO_MONTHLY=com.producerhit.app.pro.monthly
EXPO_PUBLIC_IAP_STUDIO_MONTHLY=com.producerhit.app.studio.monthly
EXPO_PUBLIC_IAP_PLUS_MONTHLY=com.producerhit.app.plus.monthly
```

## Prix (référence interne)

| Plan | iOS App Store | Ancre paywall | Web Stripe |
|------|---------------|---------------|------------|
| Pro | $6.99 | $12 | $8 |
| Studio | $19.99 | $32 | $24 |
| Plus | $39.99 | $59 | $47 |

Positionnement app : **tarif lancement App Store** (ne pas comparer au web dans l’UI).

## Offres introductoires (optionnel — plus tard)

Configurer dans ASC ; l’app affiche le texte StoreKit automatiquement si présent.

| SKU | Recommandation |
|-----|----------------|
| Pro | Essai gratuit 7 jours **ou** 1er mois $4.99 |
| Studio | Prix plein |
| Plus | Prix plein |

## Backend

- Migration `079_apple_plan_entitlement` : `apply_apple_plan_entitlement`, `plan_from_apple_product_id`
- Edge `apple-iap-sync` : sync sandbox si `APPLE_IAP_ALLOW_CLIENT_SYNC=1`
- **Production** : validation receipt serveur ; ne pas laisser `ALLOW_CLIENT_SYNC` en prod

## react-native-iap v14

- `fetchProducts({ skus, type: 'subs' })` — 3 SKUs
- `requestPurchase({ request: { apple: { sku } }, type: 'subs' })`
- Listeners `purchaseUpdatedListener` / `purchaseErrorListener`
- `displayPrice` pour l’affichage localisé

Implémentation : `lib/iapCatalog.ts`, `lib/subscriptionService.ts`, `app/paywall.tsx`, `components/PaywallTierPicker.tsx`.

## Review

- Screenshot paywall par IAP (prix + Subscribe + Restore + Privacy/Terms)
- Compte démo dans les notes
- 3 abonnements auto-renouvelables dans `producerhit_pro`

## TestFlight

Voir [`TESTFLIGHT.md`](TESTFLIGHT.md) — acheter/restaurer les 3 tiers en sandbox, vérifier `profiles.plan` sur Supabase.
