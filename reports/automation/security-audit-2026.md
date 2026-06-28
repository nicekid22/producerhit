# Audit de sécurité ProducerHit — juin 2026

**Projet** : ProducerKit / ProducerHit  
**Base Supabase** : `pmfnzenqemnonpglmjqx` (us-west-1)  
**Date** : 2026-06-16  
**Migration appliquée** : `071_security_hardening.sql` ✅

---

## Résumé exécutif

| Sévérité | Trouvé | Corrigé auto | Reste ouvert |
|----------|--------|--------------|--------------|
| Critique | 0 | — | — |
| Haute | 4 | 4 | 0 |
| Moyenne | 6 | 5 | 1 |
| Info | 8+ | — | documenté |

**Verdict** : surface d’attaque réduite sur gamification, OAuth admin, headers HTTP et webhooks. Risque résiduel principal : **clés ACE exposées côté navigateur** (architecture volontaire, nécessite refactor Edge-only).

---

## 1. Authentification

### État actuel (OK)
- Supabase Auth avec **PKCE** côté client (`detectSessionInUrl: false`, callback `/auth/callback`).
- Edge Functions billing (`create-checkout`) : JWT Bearer obligatoire via `supabase.auth.getUser(token)`.
- Génération ACE (`generate-loop-ace`) : JWT + secret job `x-ace-job-secret`.

### Corrections
- Aucune modification du flux auth utilisateur (déjà sain).

### Recommandations
- Activer **MFA** pour comptes admin Supabase / Vercel.
- Vérifier que `OAUTH_SETUP_SECRET` est défini **en production Vercel** avant prochain setup TikTok/YouTube.

---

## 2. Permissions & RLS

### Findings
| Issue | Sévérité | Statut |
|-------|----------|--------|
| `claim_level_rewards(p_xp)` fusionnait XP client → inflation bonus | **Haute** | ✅ Corrigé |
| `sync_gamification_state` acceptait XP client illimité | **Haute** | ✅ Plafond +2000/sync |
| Trigger `profiles_protect_billing_fields` ne couvrait pas referral/XP | **Moyenne** | ✅ Étendu |
| `create_user_notification` callable par tout user authentifié | **Moyenne** | ✅ REVOKE authenticated/anon |
| RPC `SECURITY DEFINER` exposées (106 WARN Supabase linter) | Info | Partiel — voir § Supabase |

### Corrections (`071_security_hardening.sql`)
- `claim_level_rewards` : source de vérité = `profiles.gamification_xp` uniquement.
- `sync_gamification_state` : delta max +2000 XP, streak +1 max par sync.
- Trigger : protection de `referral_bonus`, `level_bonus`, `gamification_xp`, `referred_by`, etc.
- `create_user_notification` : plus exécutable depuis le client (insert direct dans `claim_referral` conservé).

---

## 3. API (Vercel + Edge)

### Findings & fixes

| Endpoint | Problème | Fix |
|----------|----------|-----|
| `api/tiktok-oauth-callback.ts` | XSS (`error`, JSON), refresh token en clair | ✅ `escapeHtml`, masquage, `OAUTH_SETUP_SECRET` state |
| `api/youtube-oauth-callback.ts` | Idem | ✅ Idem |
| `api/youtube-render.ts` | — | Déjà protégé (`x-social-cron-secret`) |
| `api/loop-social.ts` | — | Déjà `escapeHtml` OG |
| `create-checkout` | CORS `*` | ✅ Origines allowlist ProducerHit + localhost |

**Nouveau module** : `api/lib/oauthPage.ts` (échappement HTML, masquage secrets, validation `state`).

---

## 4. Stripe

### État (OK)
- Webhook : vérification HMAC `v1`, comparaison constant-time.
- Champs billing protégés par trigger (plan, stripe_*).
- Checkout : auth JWT + validation URLs.

### Corrections
- **Anti-replay timestamp** : rejet si `|now - t| > 300s` (configurable `STRIPE_WEBHOOK_TOLERANCE_SEC`).

### Recommandations
- Idempotency keys sur mutations critiques (future).
- Monitorer webhooks 400 dans Stripe Dashboard.

---

## 5. Supabase

### Advisors sécurité (snapshot)
- **106 WARN** : `function_search_path_mutable` sur RPC legacy — risque faible si signatures stables ; corriger progressivement avec `SET search_path = public`.
- **WARN** : buckets publics listables (`loop-audio`, `loop-covers`, `social-videos`) — acceptable pour CDN public ; éviter fichiers privés dans ces buckets.
- **INFO** : tables RLS sans policy directe (`growth_events`, `billing_stripe_prices`) — accès via RPC `SECURITY DEFINER` (intentionnel).

### Corrections appliquées
- Rate limit `log_growth_event` : 60 events / minute / session.
- Bornes longueur session_id, name, path, props.

---

## 6. Variables d'environnement

### Bonnes pratiques observées
- Secrets serveur (`STRIPE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `SOCIAL_PUBLISH_CRON_SECRET`) non préfixés `VITE_`.
- `.env.example` documenté sans valeurs réelles.

### Risques
| Variable | Risque | Action |
|----------|--------|--------|
| `VITE_ACE_STEP_API_KEY(S)` | **Haute** — extractibles du bundle | Documenté ; migrer génération 100% Edge |
| `OAUTH_SETUP_SECRET` | Nouveau — requis prod | Ajouté `.env.example` + scripts CLI |

### Action requise (manuelle)
```bash
# Vercel + .env local admin
OAUTH_SETUP_SECRET=<32+ chars random>
```

---

## 7. Uploads

### État
- Storage Supabase avec policies par bucket (loops audio/covers utilisateur).
- Pas de upload arbitraire sans auth identifié dans l’audit.

### Recommandations
- Valider MIME type + taille max côté Edge avant `storage.upload`.
- Scanner antivirus optionnel pour uploads community (future).

---

## 8. XSS

### Corrigé
- Callbacks OAuth TikTok/YouTube : tous paramètres dynamiques échappés.
- Réponses JSON d’erreur OAuth échappées dans `<pre>`.

### Déjà OK
- Pas de `dangerouslySetInnerHTML` sur contenu utilisateur dans le blog/app principale.
- OG/prerender avec `escapeHtml`.

### Mitigation globale
- **CSP** ajoutée dans `vercel.json` (Stripe, Supabase, media https autorisés ; `frame-ancestors 'none'`).

---

## 9. CSRF

### Analyse
- SPA Supabase : auth **Bearer JWT** (localStorage), pas cookies session classiques → CSRF classique **faible**.
- OAuth setup : risque CSRF sur callback → mitigé par **`state` = `OAUTH_SETUP_SECRET`**.

---

## 10. SQL Injection

### Analyse
- Requêtes via `@supabase/supabase-js` et RPC paramétrées.
- Aucune concaténation SQL côté client détectée.
- Migrations utilisent paramètres PL/pgSQL.

**Risque** : faible.

---

## 11. Abuse protection

| Vecteur | Mesure |
|---------|--------|
| Spam analytics | ✅ 60 evt/min/session |
| Spam notifications inbox | ✅ RPC client révoquée |
| XP / bonus farming | ✅ Server XP + delta cap |
| Growth event payload | ✅ Taille props limitée |
| Stripe webhook replay | ✅ Timestamp tolerance |
| OAuth token theft via page | ✅ Masquage + state secret |

### À renforcer (backlog)
- Rate limit Edge `generate-loop-ace` par user_id (Redis ou table `rate_limits`).
- CAPTCHA sur signup si bots détectés.
- `complete_onboarding_step` : limite steps autorisés (enum).

---

## Fichiers modifiés

| Fichier | Changement |
|---------|------------|
| `supabase/migrations/071_security_hardening.sql` | RPC + trigger + grants |
| `api/lib/oauthPage.ts` | Helpers XSS / state |
| `api/tiktok-oauth-callback.ts` | Durcissement |
| `api/youtube-oauth-callback.ts` | Durcissement |
| `supabase/functions/stripe-webhook/index.ts` | Timestamp |
| `supabase/functions/create-checkout/index.ts` | CORS |
| `vercel.json` | Security headers + CSP |
| `src/lib/notifications.ts` | Suppression RPC client |
| `scripts/tiktok-oauth.mjs` | State secret |
| `scripts/youtube-oauth.mjs` | State secret |
| `.env.example` | `OAUTH_SETUP_SECRET` |

---

## Déploiement

1. **Supabase** : migration `071` déjà appliquée via MCP.
2. **Vercel** : redéployer pour headers + callbacks OAuth.
3. **Edge Functions** : redeploy `stripe-webhook`, `create-checkout` :
   ```bash
   supabase functions deploy stripe-webhook create-checkout
   ```
4. **Secrets** : définir `OAUTH_SETUP_SECRET` sur Vercel avant prochain OAuth web.

---

## Risques résiduels (acceptés / planifiés)

1. **Clés ACE dans le bundle** — refactor vers proxy Edge uniquement (impact perf/coût).
2. **RPC SECURITY DEFINER nombreuses** — revue grant par grant (priorité : fonctions modifiant crédits/plan).
3. **Buckets publics listables** — OK pour contenu public ; ne pas y stocker de données privées.
4. **CSP `unsafe-inline` / `unsafe-eval`** — requis par Vite/React ; durcir avec nonces si migration SSR.

---

*Rapport généré après audit automatisé + correctifs appliqués dans le repo et Supabase prod.*
