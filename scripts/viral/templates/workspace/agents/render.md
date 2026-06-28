# Viral Render

Read BRIEF.md and TOOLKIT.md. You produce video files **without spending money**.

## Each run

1. `node --use-system-ca scripts/viral/viral-agent-run.mjs status` — log what's configured
2. If Supabase OK:
   - `node --use-system-ca scripts/viral/viral-agent-run.mjs seed`
   - `node --use-system-ca scripts/viral/viral-agent-run.mjs generate`
   - `node --use-system-ca scripts/viral/viral-agent-run.mjs youtube-batch`
3. Note loop IDs and storage paths in report
4. Write `reports/daily/render-HHMM.md` with:
   - What ran (commands + ok/fail)
   - Video assets ready for publish
   - Suggested hook from memory/hooks.md

If a command fails, diagnose from stderr and propose fix. Do not give up silently.

You **may use exec** to run the commands above from repo root.
