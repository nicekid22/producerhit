# Bugs ProducerHit — audit 2026-06-04

Audit : code review post-login + Playwright public (`npm run test:e2e:public` sur https://www.producerhit.com).

Légende gravité : **P0** bloquant · **P1** majeur · **P2** mineur · **P3** cosmétique / infra

---

## Statut audit (2026-06-04)

| Élément | Résultat |
|---------|----------|
| Deploy prod | ✅ `www.producerhit.com` (fixes flash + profil) |
| Playwright public | ✅ **9/9** sur prod |
| Playwright auth | ⏭ skipped sans `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` |

---

## Corrigés dans cette session (déployés)

| ID | Gravité | Description | Fix |
|----|---------|-------------|-----|
| BUG-001 | **P1** | Dashboard « Mon espace » : 8 skeletons « Chargement de tes créations… » qui clignotent en boucle | `loopsHydrated` + loader uniquement à la 1re sync ; 2 skeletons max ; suppression du retry `loadMyLoops` dupliqué dans Dashboard |
| BUG-002 | **P1** | « Chargement du quota… » / Plan… en boucle après login | `profileReady` n’est plus remis à `false` si le profil est déjà chargé ; sync profil en mode `soft` |
| BUG-003 | **P1** | Impossible de sauvegarder le username (profil DB absent ou RPC échoue) | `repair_missing_profile` avant load/save ; migration 045 (déjà appliquée) |
| BUG-004 | **P0** | Google OAuth nouveaux comptes : `Database error saving new user` | Migration `045_handle_new_user_hardening.sql` |

---

## Confirmés (prod ou tests Playwright)

| ID | Gravité | Description | Repro / notes |
|----|---------|-------------|---------------|
| BUG-005 | **P2** | Page `/auth` : champs sans `label` accessible | ✅ Corrigé (`htmlFor` + `id` email/password) |
| BUG-006 | **P2** | `/auth` : violation axe **color-contrast** (serious) | Passé au run Playwright post-deploy ; surveiller texte `text-pk-muted` |
| BUG-007 | **P3** | Console extensions wallet (`ObjectMultiplex`, TronLink, `injected.js`) | Bruit navigateur utilisateur — pas un bug app |
| BUG-008 | **P3** | Warning preload Google Fonts non utilisé dans les 3s | Performance / console only |

---

## Suspects / à valider après deploy des fixes

| ID | Gravité | Description | Action |
|----|---------|-------------|--------|
| BUG-009 | **P1** | Génération ×2 : timeouts Edge ~150s, message « réseau chargé » | Mode adaptatif parallel→sequential déployé ; monitorer |
| BUG-012 | **P1** | Dashboard quota footer affiche 8/10 au lieu de 10/10 (versions=2 par défaut) | Affichait `remaining - versions` au lieu de `remaining` — corrigé |
| BUG-011 | **P2** | `npm install` / Vercel CLI : `UNABLE_TO_VERIFY_LEAF_SIGNATURE` sur cette machine | Proxy/antivirus TLS — `strict-ssl false` temporaire ou `--use-system-ca` |

---

## Session nuit 2026-06-05 (auto)

| Élément | Résultat |
|---------|----------|
| Commit prod | `3d1ca9d` — UI Settings/Library, sitemap 500 URLs, social pipeline |
| sitemap-loops.xml prod | ✅ 200 — 500 URLs |
| Playwright public | ✅ 9/9 |
| rss-tracks.xml | 🔧 fix `updated_at` → `created_at` (feed était vide) |
| Mode Beat | ✅ dropdown Énergie + reset chips au changement de genre |
| robots.txt | 🔧 RSS retiré des Sitemap (commentaire à la place) |
| Social queue | ⏳ 200 pending — secrets Supabase/GitHub à configurer |

### À faire demain (priorité)

1. **GSC** : resoumettre `sitemap-loops.xml`
2. **Secrets** : `SOCIAL_PUBLISH_CRON_SECRET`, `SOCIAL_WEBHOOK_URL`, Twitter dans Supabase + GitHub
3. **Social backfill** : garder ou vider les 200 pending (`delete from social_publish_queue where status = 'pending'`)
4. **E2E auth** : tester avec `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`
5. **Checklist manuelle** bugs.md § scénario E2E complet


```bash
# Pages publiques
npm run test:e2e:public

# Compte test (email/password Supabase)
set E2E_TEST_EMAIL=...
set E2E_TEST_PASSWORD=...
npm run test:e2e:auth
```

Checklist manuelle recommandée :

1. [ ] Créer compte Google (email neuf)
2. [ ] Dashboard : empty state stable, pas de flash skeleton
3. [ ] Settings : définir username → toast « Profil sauvegardé »
4. [ ] Générer 1 chanson → loop visible, quota débité
5. [ ] Télécharger MP3
6. [ ] Logs Supabase : `generate-loop-ace`, pas d’erreur RLS `profiles` / `loops`

---

## Fichiers touchés (fix flash + profil)

- `src/stores/loopsStore.ts` — `loopsHydrated`, loader 1ère sync
- `src/stores/authStore.ts` — sync profil soft
- `src/pages/Dashboard.tsx` — skeleton condition
- `src/lib/profileBootstrap.ts` — `repair_missing_profile`
- `src/lib/creatorProfile.ts` — repair avant save
- `e2e/public-audit.spec.ts`, `e2e/authenticated.spec.ts`, `playwright.config.ts`
