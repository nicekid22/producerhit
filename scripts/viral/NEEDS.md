# VIRAL OS — ce dont les agents ont besoin de toi

Les agents tournent **maintenant** avec budget $0. Ces items débloquent la publication auto complète :

## Requis pour publication YouTube auto (probablement déjà OK)

- [ ] PC allumé + `ollama serve` + gateways Hermes/OpenClaw/Odysseus
- [ ] `.env` avec `SUPABASE_SERVICE_ROLE_KEY`, `SOCIAL_PUBLISH_CRON_SECRET`
- [ ] `YOUTUBE_DAILY_AUTO_PUBLISH=1` ou `COMMUNITY_YOUTUBE_AUTO_PUBLISH=1`
- [ ] Refresh tokens YouTube valides : `npm run youtube:setup-check`

## TikTok API (gratuit — une fois)

```powershell
npm run tiktok:oauth
```

Puis ajouter `TIKTOK_REFRESH_TOKEN=...` dans `.env` + secrets Supabase.

## Gemini Flash (gratuit — optionnel, meilleurs hooks)

Dans `.env` (pas en clair dans le chat) :

```
GEMINI_API_KEY=your_key_here
```

## Instagram Reels via navigateur (optionnel)

1. Créer profils Chrome dédiés (comptes « poster », pas perso) :
   `%LOCALAPPDATA%\hermes\browser-profiles\reels-account1`
2. Se connecter une fois manuellement à Instagram Creator
3. Dire aux agents d’utiliser Hermes `browser-use` avec ce profil — **risque ban ToS**

## Playwright posting

Possible mais fragile. Les agents documentent d’abord un **playbook** dans leurs rapports ; l’auto-post navigateur vient après que tu valides les profils.

## Discord monitoring (optionnel)

Déjà configuré dans `.env` — les agents peuvent résumer dans `#announcements` si tu ajoutes une skill webhook plus tard.

## Vérifier que tout tourne

```powershell
python "C:\Users\dylar\Documents\ProducerKit AI - Cursor 2\scripts\status-all-agents.py"
cd "C:\Users\dylar\Documents\ProducerKit AI - Cursor 2"
npm run viral:agent -- status
npm run viral:agent -- pipeline
```
