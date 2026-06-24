# ProducerHit iOS — Plan de parité web

Objectif : app iOS **premium**, compte unifié Supabase, flux studio alignés sur le Dashboard web.  
Hors scope v1 : Remix, Voice Studio, Sample Lab, export vidéo, Stripe in-app, SEO/blog.

---

## Phase 1 — Core studio (✅ fait)

| Feature | Web | iOS | Statut |
|---------|-----|-----|--------|
| Auth email + Google PKCE | Auth.tsx | `(auth)/*` | ✅ |
| Song mode (ACE vocals) | Dashboard | create.tsx | ✅ |
| Type beat (instrumental) | Dashboard | create.tsx toggle | ✅ |
| Jobs async + progression | generationJobs | generationClient | ✅ |
| Quota / plans | planLimits | usageSummary | ✅ |
| Paywall Pro IAP | Pricing | paywall.tsx | ✅ (dev build) |
| Onboarding | checklist | v3 swipe + preview audio + personnalisation genre | ✅ |

---

## Phase 2 — Player & library (✅ fait)

| Feature | Priorité | iOS cible | Statut |
|---------|----------|-----------|--------|
| Mini player + seek + durée | Critical | AudioPlaybackHost + MiniPlayer | ✅ |
| Full player sheet (cover, scrub) | Critical | FullPlayerSheet | ✅ |
| Library cards avec cover | High | LoopCard + LoopCover | ✅ |
| Recherche / filtre genre | High | library.tsx | ✅ |
| Détail loop (prompt, actions) | High | LoopDetailSheet | ✅ |
| Supprimer loop | High | loopsApi.deleteLoop | ✅ |
| Rendre public / privé | High | loopsApi.setLoopPublic | ✅ |
| Partage lien web | High | Share API | ✅ |
| Queue prev/next | Medium | playerStore queue | ✅ |

---

## Phase 3 — Create avancé & compte (✅ fait)

| Feature | Priorité | Statut |
|---------|----------|--------|
| Beat : mood + loop length | High | ✅ |
| Account : barre usage, bonus crédits | High | ✅ |
| Paywall design premium | High | ✅ |
| Beat : clé / échelle | Medium | ✅ |
| Song : style vocal | Medium | ✅ |
| Parrainage (lien copy) | Medium | ✅ |
| Renommer loop | Medium | ✅ LoopDetailSheet |

---

## Phase 4 — Parité étendue (✅ fait)

| Feature | Priorité | Statut |
|---------|----------|--------|
| Tab Communauté / Explore | Medium | ✅ |
| Téléchargement beat (Pro) | High | ✅ |
| Parrainage (lien share) | Medium | ✅ |
| Variante seed (regenerate) | Medium | ✅ LoopDetailSheet |
| Stems download (Plus) | Medium | ✅ |
| i18n FR/EN | Medium | ✅ (tabs, auth, studio, onboarding) |
| Daily bonus claim | Medium | ✅ |
| Prompts : chips inspiration + dé aléatoire + ACE override | High | ✅ |
| Placeholders rotatifs (pools curated FR/EN) | Medium | ✅ |

---

## Phase 5 — Onboarding & release (✅ fait)

| Feature | Statut |
|---------|--------|
| Onboarding v3 (swipe, preview audio, genre picker, i18n EN/FR) | ✅ |
| Coach marks Studio (première visite Create) | ✅ |
| Library filtre genre → GenrePicker 600+ | ✅ |
| Checklist activation « Premiers pas » | ✅ |
| Auth screens i18n + polish | ✅ |
| Tab labels i18n dynamiques | ✅ |
| i18n complet (account, paywall, create, library, détail loop) | ✅ |
| TestFlight / RELEASE.md | 📄 doc prête |
| App Store Connect submit config | 📄 `APP_STORE_METADATA.md` + placeholders `eas.json` |
| Design 3 thèmes (Prism / Air / Warm) | ✅ |
| Sign in with Apple | ✅ |
| Tab bar flottante + player premium | ✅ |
| iPad layouts (library, community) | ✅ |

---

## Critères d’acceptation

1. Générer song ou beat sur iOS → visible sur web library < 30 s
2. Lecture : play/pause/seek, cover si disponible
3. Library : search, delete, share, public toggle
4. Quota cohérent web ↔ iOS même compte
5. `npm run mobile:lint` vert

---

## Ordre d’implémentation (cette session)

1. `loopsApi` — delete / update / public
2. `AudioPlaybackHost` + player store étendu
3. `FullPlayerSheet` + MiniPlayer v2
4. `LoopCard` + `LoopDetailSheet` + library v2
5. Account + paywall polish
6. Create — mood + loop length
