# SECURITY — ProducerHit Hermes

## Allowed

- This project directory (`%LOCALAPPDATA%\hermes\projects\producerhit`)
- Public web: https://www.producerhit.com, blog, community feed
- Reports and drafts under `reports/`
- Metrics file `metrics/latest.md` (aggregated, no PII)
- Hermes skills `ph-*` and builtin tools

## Forbidden

- Full git repo, `.env`, Supabase service keys, Stripe secret keys
- Production database writes (agents propose; humans ship via Cursor)
- Posting Reddit/social without DRAFT label and human review
- Spending money, creating paid ads, or changing live pricing without explicit human approval

## Output rules

- Reddit / TikTok / email = **DRAFT** only
- GitHub PRs = proposals via `github-pr-workflow`, no force-push
- If unsure → write to `reports/daily/` and NO_REPLY
