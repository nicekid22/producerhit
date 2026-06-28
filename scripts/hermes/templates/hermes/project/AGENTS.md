# ProducerHit Hermes — project context for agents

Read `SECURITY.md` first. Workspace only.

## Files to read every run

1. `metrics/latest.md` — CEO dashboard (synced from Supabase)
2. `business.md`, `roadmap.md`, `competitors.md`, `pricing.md`
3. `reports/daily/*` from last 24h

## Output

- Daily reports → `reports/daily/<topic>-YYYY-MM-DD.md`
- Strategy updates → `roadmap.md`, `competitors.md` (CEO only)
- DRAFT only for Reddit/TikTok/social

## Models (Ollama local)

- CEO / crons / workers: `qwen3-8b-64k`

Keep responses concise. Prefer files over long chat output.
