# TITAN Revenue Command — Odysseus Team 4

Most autonomous revenue stack. Built on [Odysseus](https://pewdiepie-archdaemon.github.io/odysseus/) self-hosted AI workspace.

## Why Odysseus for Team 4

| Capability | OpenClaw ph-* | Hermes ph-* | Apex apex-* | **TITAN (Odysseus)** |
|------------|---------------|-------------|-------------|----------------------|
| Scheduled agents | cron | cron | cron | **cron + UI tasks** |
| Web research | limited | limited | limited | **web_search + Deep Research** |
| Self-evolving skills | no | partial | partial | **manage_skills** |
| Persistent memory | files | files | files | **ChromaDB memory** |
| Autonomous decisions | low | medium | high | **highest (prompt + tools)** |

North Star: **Weekly Net Revenue Growth** | Targets: **100k → 1M MRR**

## Install (Windows native, no Docker)

```powershell
# 1. Clone Odysseus (once)
git -c http.sslVerify=false clone --depth 1 https://github.com/pewdiepie-archdaemon/odysseus.git C:\Users\dylar\odysseus

# 2. Full install + seed TITAN team
powershell -ExecutionPolicy Bypass -File "C:\Users\dylar\Documents\ProducerKit AI - Cursor 2\scripts\odysseus\install-titan-revenue.ps1"
```

Requires: Python 3.11+, Ollama with `qwen3.5`, Git for Windows (agent shell).

## Agents (9)

`titan-architect`, `titan-radar`, `titan-proof`, `titan-closer`, `titan-scale`, `titan-amplify`, `titan-capital`, `titan-quant`, `titan-engine`

## Cadence

| Agent | Schedule |
|-------|----------|
| Radar | every 15 min |
| Proof | hourly |
| Closer | hourly :15 |
| Scale | every 3h |
| Quant | every 4h |
| Capital | every 6h |
| Amplify | daily 06:00 |
| Engine | daily 04:00 |
| Architect | daily 07:30 |

## After install

1. Open http://127.0.0.1:7000
2. Login with admin password printed at first setup
3. Settings → add Ollama endpoint `http://127.0.0.1:11434/v1` if not auto-seeded
4. Notes & Tasks → verify TITAN scheduled jobs
5. Documents → `titan-revenue/` for reports

## Security

TITAN agents can web search and write documents/memory. They cannot access ProducerHit secrets (.env, Supabase). Human approval required for spend, public posts, and emails.
