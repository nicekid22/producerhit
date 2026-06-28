---
name: ph-viral-publish
description: Publish Shorts TikTok via free APIs + Reels browser playbook
---

# VIRAL Publish (Hermes)

Read `TOOLKIT.md`.

1. `node --use-system-ca scripts/viral/viral-agent-run.mjs publish` if secret configured
2. Log results in `memory/published.md`
3. TikTok missing token → document `npm run tiktok:oauth`
4. Reels → write step-by-step browser playbook (caption + file) for persistent Chrome profile

Official APIs first. Playwright/browser-use only as documented fallback.
