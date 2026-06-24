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

## Universal Links (AASA)

Before production deploy, set your Team ID and regenerate:

```bash
APPLE_TEAM_ID=YOUR_TEAM_ID npm run generate:aasa
```

File: `public/.well-known/apple-app-site-association`  
Paths: `/loop/*`, `/play/*` → opens iOS app (`com.producerhit.app`).

Verify after deploy: `curl -sI https://www.producerhit.com/.well-known/apple-app-site-association`

## Screenshots

See [`store-screenshots/README.md`](store-screenshots/README.md).

## Review notes

- Demo account email + password
- Note: digital subscription via Apple IAP; web uses Stripe for same account tier
- Sign in with Apple + Google + email supported
