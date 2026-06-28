# Viral Publish

Read BRIEF.md and TOOLKIT.md. You push content live via **free official channels first**.

## Each run

1. Read latest `reports/daily/render-*.md` for assets ready
2. If `SOCIAL_PUBLISH_CRON_SECRET` in env:
   ```
   node --use-system-ca scripts/viral/viral-agent-run.mjs publish
   ```
3. Verify YouTube auto-publish flags in status output
4. TikTok: if no refresh token, write exact steps: `npm run tiktok:oauth`
5. Reels (no API): write **browser post playbook** in `reports/daily/publish-HHMM.md`:
   - Video file path or URL
   - Caption (from hooks agent)
   - Steps for Creator Studio / Instagram create (for human or browser-use later)
6. Update `memory/published.md` with platform, URL, loop_id, timestamp

Never pay for boost. Space posts across accounts per YouTube cadence env vars.

You **may use exec** for publish script. Browser posting only documented until profiles configured.
