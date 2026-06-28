#!/usr/bin/env python3
"""Register Apex OpenClaw crons by editing jobs.json directly (CLI hangs on this machine)."""
from __future__ import annotations

import json
import time
import uuid
from pathlib import Path

JOBS_PATH = Path.home() / ".openclaw" / "cron" / "jobs.json"
NOW_MS = int(time.time() * 1000)

APEX_JOBS = [
    ("APEX Scout", "0,30 * * * *", "apex-scout", None, "Execute tasks/scout-30m.md. Follow agents/scout.md."),
    ("APEX Validator", "0 */2 * * *", "apex-validator", None, "Execute tasks/validator-2h.md. Follow agents/validator.md."),
    ("APEX Sales", "0 * * * *", "apex-sales", None, "Execute tasks/sales-hourly.md. Follow agents/sales.md."),
    ("APEX Growth", "0 */4 * * *", "apex-growth", None, "Execute tasks/growth-4h.md. Follow agents/growth.md."),
    ("APEX Distribution", "0 7 * * *", "apex-distribution", "Europe/Paris", "Execute tasks/distribution-daily.md."),
    ("APEX Analyst", "0 */6 * * *", "apex-analyst", None, "Execute tasks/analyst-6h.md. Follow agents/analyst.md."),
    ("APEX Automation", "0 3 * * *", "apex-automation", None, "Execute tasks/automation-daily.md."),
    ("APEX CEO Daily", "30 8 * * *", "apex-ceo", "Europe/Paris", "Execute tasks/ceo-daily.md. Synthesize all apex reports."),
    ("APEX CEO Weekly", "0 10 * * 0", "apex-ceo", "Europe/Paris", "Execute tasks/ceo-weekly.md."),
]


def make_job(name: str, cron: str, agent: str, tz: str | None, message: str) -> dict:
    schedule: dict = {"kind": "cron", "expr": cron}
    if tz:
        schedule["tz"] = tz
    else:
        schedule["staggerMs"] = 300000
    return {
        "id": str(uuid.uuid4()),
        "agentId": agent,
        "name": name,
        "enabled": True,
        "createdAtMs": NOW_MS,
        "updatedAtMs": NOW_MS,
        "schedule": schedule,
        "sessionTarget": "isolated",
        "wakeMode": "now",
        "payload": {
            "kind": "agentTurn",
            "message": message,
            "model": "ollama/qwen2.5",
            "lightContext": True,
        },
        "delivery": {"mode": "none", "channel": "last"},
        "state": {"nextRunAtMs": NOW_MS + 60_000},
    }


def main() -> int:
    if not JOBS_PATH.exists():
        print(f"ERROR: {JOBS_PATH} not found")
        return 1
    data = json.loads(JOBS_PATH.read_text(encoding="utf-8"))
    jobs = data.get("jobs", [])
    kept = [j for j in jobs if not str(j.get("name", "")).startswith("APEX ")]
    removed = len(jobs) - len(kept)
    new = [make_job(*spec) for spec in APEX_JOBS]
    data["jobs"] = kept + new
    backup = JOBS_PATH.with_suffix(".json.bak")
    backup.write_text(JOBS_PATH.read_text(encoding="utf-8"), encoding="utf-8")
    JOBS_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"Removed {removed} old APEX job(s)")
    print(f"Added {len(new)} APEX job(s)")
    for j in new:
        print(f"  - {j['name']} ({j['schedule']['expr']}) -> {j['agentId']}")
    print(f"Total jobs: {len(data['jobs'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
