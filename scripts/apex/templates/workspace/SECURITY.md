# SECURITY — Apex Revenue OS

Strict isolation. This team hunts revenue in public data only.

## FORBIDDEN

- `.env`, Supabase, Stripe, OAuth tokens, API keys
- Full repo `ProducerKit AI - Cursor 2` (supabase/, edge functions, migrations)
- User PII, payment data, production logs
- `openclaw.json`, Hermes auth, credential pools
- Executing purchases, ads spend, or posting without human approval

## ALLOWED

- This workspace (`workspace-apex`) read/write
- Hermes project `projects/apex-revenue` (parallel memory)
- Public web: sites, Reddit, X, Product Hunt, competitor pages
- Public ProducerHit context in `public-context/`

## Terminal

- Stay inside workspace paths
- No `cd` to Documents secrets or `.openclaw` config dirs
