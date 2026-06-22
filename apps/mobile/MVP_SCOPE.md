# ProducerHit iOS — MVP v1.0 scope

Voir **IOS_PARITY_PLAN.md** pour la roadmap complète web ↔ iOS.

## Inclus v1

- Auth email + mot de passe + Google OAuth (PKCE, même Supabase)
- Génération **Song** (mode principal, vocals ACE) + **Type Beat** (instrumental, toggle)
- Beat : genre, BPM, mood, loop length, **clé & gamme**, prompt — aligné ACE web
- Song : idée + paroles AI ou manuelles + **style vocal** — aligné Dashboard web
- Jobs async ACE Step + progression temps réel
- Bibliothèque : cartes cover, recherche, détail (rename, public, delete, share, download Pro)
- Tab **Explore** : loops publiques communauté
- Variantes **Variation / Remix** depuis le détail loop (aligné web)
- Download beat (Pro) + stems ZIP (Plus)
- Bonus du jour (`claim_daily_generation_bonus`)
- i18n **FR/EN** (tabs, auth, studio, onboarding — toggle Account, défaut FR)
- Lecteur : mini-player + full player (seek, queue prev/next)
- Quota plan + barre usage (bonus crédits)
- Paywall IAP Pro (react-native-iap v14)
- Onboarding **4 slides** song-first + checklist « Premiers pas »

## Exclu v1 (web only)

- Remix, Voice Studio, Sample Lab
- Export vidéo social, dual parallel, cover reroll
- Stripe checkout in-app (lien web settings)
- Dictée vocale / gamification XP sync web

## Critère d’acceptation compte unifié

Générer sur iOS → loop visible sur https://www.producerhit.com/library avec le même compte (< 30 s).

## Release

Voir **RELEASE.md** pour TestFlight et soumission App Store.
