# ProducerHit iOS — Release & TestFlight

## Prérequis

- Compte Apple Developer actif
- App créée dans [App Store Connect](https://appstoreconnect.apple.com) (`com.producerhit.app`)
- EAS CLI : `npm i -g eas-cli` puis `eas login`
- Product ID IAP Pro validé dans ASC (voir paywall / `react-native-iap`)

## Configuration `eas.json`

Remplacer les placeholders dans `submit.production.ios` :

| Clé | Description |
|-----|-------------|
| `appleId` | Email Apple ID du compte développeur |
| `ascAppId` | ID numérique de l’app dans App Store Connect |
| `appleTeamId` | Team ID (Developer → Membership) |

## Build interne (TestFlight)

**Première fois** : EAS doit configurer les credentials Apple (certificat + profil). Lance en **mode interactif** dans ton terminal PowerShell :

```powershell
cd apps/mobile
$env:NODE_OPTIONS="--use-system-ca"
npx eas-cli build --platform ios --profile production
```

Ou depuis la racine du monorepo :

```bash
npm run mobile:build:ios
```

EAS te demandera de te connecter à ton compte Apple Developer et créera les certificats sur les serveurs Expo.

Variables d’environnement **déjà configurées** sur EAS (preview + production) :
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_IAP_PRO_MONTHLY`

> Si `unable to verify the first certificate` : ajoute `$env:NODE_OPTIONS="--use-system-ca"` avant la commande.

### Ad Hoc (preview, sans TestFlight)

Enregistre l’UDID de ton iPhone puis build preview :

```powershell
npx eas-cli device:create
npm run mobile:build:ios:preview
```

### TestFlight (recommandé pour IAP)

```bash
eas build --platform ios --profile production
```

Après le build :

```bash
eas submit --platform ios --profile production --latest
```

Ou upload manuel du `.ipa` dans App Store Connect → TestFlight.

## Build production App Store

```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production --latest
```

## Variables d’environnement

Copier `.env.example` → `.env` à la racine du monorepo (ou config EAS secrets) :

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Les secrets sensibles (service role, etc.) ne vont **pas** dans l’app mobile.

## Checklist avant soumission

- [ ] `npm run mobile:lint` vert
- [ ] Auth email + Google sur device réel
- [ ] Génération song + beat → sync web library
- [ ] IAP Pro testé via Sandbox Apple (pas Expo Go)
- [ ] Privacy Policy URL dans ASC
- [ ] Captures 6.7" / 6.5" / iPad si universal
- [ ] Notes TestFlight pour reviewers (compte démo)

## Notes IAP

- `react-native-iap` v14 nécessite un **development build** ou build EAS — pas Expo Go.
- Product IDs : à confirmer avec App Store Connect avant release.

## Commandes utiles

```bash
npm run mobile:start      # Expo Go (sans IAP)
npm run mobile:lint       # Typecheck
eas build:list            # Historique builds
```
