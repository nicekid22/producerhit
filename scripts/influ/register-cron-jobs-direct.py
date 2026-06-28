#!/usr/bin/env python3
"""Register INFLU OpenClaw crons via jobs.json (CLI-safe)."""
import json
import time
import uuid
from pathlib import Path

JOBS_PATH = Path.home() / ".openclaw" / "cron" / "jobs.json"
NOW_MS = int(time.time() * 1000)
MODEL = "ollama/qwen2.5"

INFLU_JOBS = [
    ("INFLU Scout", "0 */2 * * *", "influ-scout", "Execute tasks/scout-2h.md. Follow agents/scout.md."),
    ("INFLU Enrich", "0 */4 * * *", "influ-enrich", "Execute tasks/enrich-4h.md. Find emails. Update CRM."),
    ("INFLU Pitch", "0 8 * * *", "influ-pitch", "Draft pitches for top CRM prospects. Use OFFER.md."),
    ("INFLU Outreach", "0 10 * * 1-5", "influ-outreach", "Execute tasks/outreach-daily.md. Send emails autonomously."),
    ("INFLU Followup", "0 11 * * *", "influ-followup", "Execute tasks/followup-daily.md."),
    ("INFLU Learn", "0 9 * * 0", "influ-learn", "Analyze week. Update memory/learnings.md."),
    ("INFLU CEO", "0 19 * * *", "influ-ceo", "Execute influ-ceo skill fully. Synthesize INFLU pipeline. Top 3 partnership actions. Update memory/learnings.md."),
]


def make_job(name, cron, agent, message):
    return {
        "id": str(uuid.uuid4()),
        "agentId": agent,
        "name": name,
        "enabled": True,
        "createdAtMs": NOW_MS,
        "updatedAtMs": NOW_MS,
        "schedule": {"kind": "cron", "expr": cron, "staggerMs": 300000},
        "sessionTarget": "isolated",
        "wakeMode": "now",
        "payload": {
            "kind": "agentTurn",
            "message": message,
            "model": MODEL,
            "lightContext": True,
        },
        "delivery": {"mode": "none", "channel": "last"},
        "state": {"nextRunAtMs": NOW_MS + 120_000},
    }


def main():
    data = json.loads(JOBS_PATH.read_text(encoding="utf-8"))
    kept = [j for j in data.get("jobs", []) if not str(j.get("name", "")).startswith("INFLU ")]
    new = [make_job(*spec) for spec in INFLU_JOBS]
    data["jobs"] = kept + new
    JOBS_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"INFLU crons: {len(new)} added, total jobs: {len(data['jobs'])}")


if __name__ == "__main__":
    main()
