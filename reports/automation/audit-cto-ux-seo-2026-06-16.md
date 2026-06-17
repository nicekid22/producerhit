# Audit ProducerHit — CTO / UX / SEO / Conversion (2026-06-16)

## Corrections appliquées dans cette session

| Domaine | Fix |
|---------|-----|
| SEO | Meta `/trending` et `/community/vibe/*` (early return supprimé) |
| SEO | `og-image.png` au lieu de SVG (réseaux sociaux) |
| SEO | hreflang ja/ko/zh/th dans `index.html` |
| SEO | `robots.txt` — voice-studio, sample-lab, admin, theme-preview |
| SEO | noindex app routes étendu (voice-studio, admin, theme-preview) |
| UX | Page 404 dédiée (plus de redirect silencieux vers `/`) |
| Perf | `console.log` génération → `console.debug` dev-only |
| UX | Contraste pricing Warm Glass (teaser + page tarifs) |
| i18n | Clés SEO trending + voiceStudio (10 locales) |

---

## Bugs détectés

| Priorité | Problème | Impact |
|----------|----------|--------|
| P0 | ~~`/trending` sans meta tags~~ | **Corrigé** |
| P1 | SPA 404 renvoyait vers home (soft 404 Google) | **Corrigé** — vrai composant 404 |
| P1 | `console.log` prod dans Dashboard génération | **Corrigé** |
| P2 | Routes inconnues HTTP 200 (pas de vrai status 404 serveur) | Nécessite config Vercel `_redirects` ou edge |
| P2 | Blog/SEO pages comparaison : contenu surtout EN/FR | ja/ko/zh/th retombent sur EN |
| P2 | `SeoBootstrap` FAQ home/pricing toujours en anglais | Incohérence locale FR |
| P3 | Wildcard `Navigate to /` masquait les erreurs de liens internes | **Corrigé** |

---

## Problèmes UX

| Priorité | Problème |
|----------|----------|
| P0 | **~400+ ternaires `locale === "fr"`** — 10 langues UI mais contenu EN/FR seulement (Dashboard: 125, LoopCard: 54) |
| P1 | Error boundary racine en anglais uniquement |
| P1 | Accent Cloud absent bottom nav mobile app |
| P2 | Onboarding coach / WAV coach non i18n |
| P2 | Page Loader messages partiellement FR-only |
| P2 | Pas d'error boundary par route (crash dashboard = écran blanc partiel possible) |
| P3 | Voice Studio / Sample Lab peu discoverable sans auth |

---

## Problèmes SEO

| Priorité | Problème |
|----------|----------|
| P0 | ~~Pages trending/vibe sans indexation meta~~ **Corrigé** |
| P1 | ~~hreflang incomplet (6/10 langues dans HTML statique)~~ **Corrigé** |
| P1 | OG image SVG (LinkedIn/Twitter préfèrent PNG/JPG) **Corrigé** |
| P1 | Contenu marketing long-form (blog, compare) pas localisé au-delà EN/FR |
| P2 | `/explore` redirect canonical vers `/community` — OK mais lien interne mixte |
| P2 | Pages loop publiques : meta générique, pas titre track dynamique côté SPA initial |
| P2 | Pas de sitemap blog par locale (hreflang query `?lang=`) |
| P3 | Creator profiles `/u/:username` — SEO faible, pas de JSON-LD Person |

---

## Problèmes performance

| Priorité | Problème |
|----------|----------|
| P1 | **20+ fichiers CSS** importés synchronously dans `main.tsx` |
| P1 | Google Fonts Inter blocking (preload help but still render-blocking) |
| P2 | Pas de code-splitting CSS par thème (warm/cloud chargés via preload async — bien) |
| P2 | Dashboard.tsx ~4500 lignes — bundle lourd, TTI mobile |
| P2 | Images covers loops sans `loading="lazy"` systématique |
| P3 | `backdrop-filter` massif sur mobile — coût GPU (accepté pour brand) |

---

## Opportunités marketing / conversion

| Priorité | Opportunité |
|----------|-------------|
| P0 | Finaliser i18n toasts Dashboard + upsell (moment post-génération) |
| P1 | A/B test hero CTA (Try free vs Open studio) avec events existants `trackClientEvent` |
| P1 | Pricing : auto-checkout `?checkout=1` existe — documenter + email recovery |
| P1 | Referral modal + gamification déjà présents — pousser après 1ère génération réussie |
| P2 | Blog SEO par marché (ja/ko pour acquisition Asie) |
| P2 | Landing sticky CTA mobile — déjà présent, mesurer scroll depth |
| P2 | Discord community CTA post-limit credits |
| P3 | TikTok/YouTube pack viral — scripts présents, funnel web → social faible |

---

## Fonctionnalités manquantes (SaaS 2026)

| Priorité | Feature |
|----------|---------|
| P1 | **Workspace teams / collab** — absent |
| P1 | **Export stems / MIDI** — partiel via ACE, pas self-serve clair |
| P1 | Notifications email (génération prête, crédits bas) |
| P2 | API publique / webhooks pour intégrateurs |
| P2 | Historique facturation self-serve (Stripe portal link) |
| P2 | Mode offline / PWA install prompt |
| P2 | Analytics product in-app (usage par genre, rétention) |
| P3 | SSO enterprise |
| P3 | Mobile app native (IAP rules séparées) |

---

## Backlog priorisé (prochaines sprints)

1. **P0** — Migration i18n Dashboard toasts + LoopCard actions (fichier `dashboardMessages.ts`)
2. **P1** — Meta dynamique `/loop/:id` (titre + og:audio si possible)
3. **P1** — Vercel true 404 headers pour routes inconnues
4. **P1** — FAQ JSON-LD localisée (FR/ES/…)
5. **P2** — Split Dashboard en sous-routes lazy
6. **P2** — Cloud accent picker mobile bottom nav
7. **P2** — Error boundaries par page app

---

*Généré automatiquement — session audit Cursor 2026-06-16*
