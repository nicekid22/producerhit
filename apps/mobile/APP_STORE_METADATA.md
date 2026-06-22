# App Store metadata checklist

Fill before `eas submit`:

## eas.json → submit.production.ios

| Key | Where to find |
|-----|----------------|
| `appleId` | Apple ID email (developer account) |
| `ascAppId` | App Store Connect → App → General → Apple ID (numeric) |
| `appleTeamId` | developer.apple.com → Membership → Team ID |

## App Store Connect

- **Name**: ProducerHit
- **Subtitle**: AI beats & songs
- **Category**: Music
- **Privacy Policy**: https://www.producerhit.com/privacy
- **Support URL**: https://www.producerhit.com
- **Age rating**: complete questionnaire (no unrestricted web, no tracking)

## Screenshots

See [`store-screenshots/README.md`](store-screenshots/README.md).

## Review notes

- Demo account email + password
- Note: digital subscription via Apple IAP; web uses Stripe for same account tier
- Sign in with Apple + Google + email supported
