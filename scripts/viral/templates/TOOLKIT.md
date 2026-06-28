# VIRAL OS — $0 toolkit

Repo root (Windows):

```
C:\Users\dylar\Documents\ProducerKit AI - Cursor 2
```

## Agent runner (preferred entrypoint)

From repo root:

```powershell
cd "C:\Users\dylar\Documents\ProducerKit AI - Cursor 2"
node --use-system-ca scripts/viral/viral-agent-run.mjs status
node --use-system-ca scripts/viral/viral-agent-run.mjs pipeline
node --use-system-ca scripts/viral/viral-agent-run.mjs publish
node --use-system-ca scripts/viral/viral-agent-run.mjs hooks-draft
```

## Free render pipeline (CPU — no GPU)

| Command | Purpose |
|---------|---------|
| `npm run viral:seed` | Seed daily viral ACE plans |
| `npm run viral:generate` | Generate 1 viral track + queue |
| `npm run viral:run` | seed + generate |
| `npm run youtube:daily -- seed` | Seed community Shorts plans |
| `npm run youtube:daily -- run` | Render + optional publish 1 batch |
| `npm run youtube:setup-check` | Verify YouTube OAuth |
| `npm run community:youtube-preview` | Local preview one Short |

Render = ffmpeg + cover + player template (already in prod). **$0.**

## Free publish pipeline

| Command | Purpose |
|---------|---------|
| `npm run social:publish` | Process Supabase social queue (needs `SOCIAL_PUBLISH_CRON_SECRET` in `.env`) |
| `npm run tiktok:oauth` | One-time TikTok token (needs client key in `.env`) |
| `npm run growth:social` | Draft X posts (optional) |

YouTube: **7 accounts** already in `.env`. Shorts auto via `youtube:daily` when `YOUTUBE_DAILY_AUTO_PUBLISH=1`.

## Free intelligence

| Resource | Cost |
|----------|------|
| Ollama `qwen2.5` / `qwen2.5-64k` local | $0 |
| `GEMINI_API_KEY` in `.env` → Gemini Flash text only | $0 tier |
| Pollinations `flux` images | $0 |
| Hermes `web-ddgs` / Odysseus `web_search` | $0 |

**Do not use:** Veo, Seedance API, ltx-2 Pollinations (paid), Open-Sora local (no GPU).

## Optional IA video (only if GPU available)

- Wan 2.1 I2V via ComfyUI / Colab free tier — hero clips only, not daily volume
- Switch `generate-social-video` to Pollinations `seedance` free model if testing

## Browser posting (Reels / backup)

Playwright / Hermes `browser-use` with **persistent Chrome profile** per account:

- Profiles folder: `%LOCALAPPDATA%\hermes\browser-profiles\`
- Connect once manually → agent reuses session
- Max 2–3 Reels/day/account, random delays, headed mode
- **Risk:** ToS, bans — use poster accounts not personal

## Reports (write every run)

| Agent | Report path |
|-------|-------------|
| OpenClaw | `reports/daily/viral-*.md` in workspace-viral |
| Hermes | `%LOCALAPPDATA%\hermes\projects\viral-content\reports\daily\` |
| Odysseus | Documents → `viral-content/reports/daily/` |

## Discord monitoring (optional)

Post summary to Discord channel if `DISCORD_BOT_TOKEN` + channel env set — otherwise skip.
