#!/usr/bin/env python3
"""Register VIRAL OpenClaw crons via jobs.json (CLI-safe)."""
import json
import time
import uuid
from pathlib import Path

JOBS_PATH = Path.home() / ".openclaw" / "cron" / "jobs.json"
NOW_MS = int(time.time() * 1000)
MODEL = "ollama/qwen2.5"

VIRAL_JOBS = [
    ("VIRAL Strategist", "30 8 * * *", "ph-viral-strategist", "Europe/Paris",
     "Execute tasks/strategist-daily.md. Follow agents/strategist.md. Read BRIEF.md."),
    ("VIRAL Hooks", "0 */2 * * *", "ph-viral-hooks", None,
     "Execute tasks/hooks-2h.md. Follow agents/hooks.md."),
    ("VIRAL Render", "0 */4 * * *", "ph-viral-render", None,
     "Execute tasks/render-4h.md. Follow agents/render.md. Run viral-agent-run pipeline."),
    ("VIRAL Publish", "0 */6 * * *", "ph-viral-publish", None,
     "Execute tasks/publish-6h.md. Follow agents/publish.md."),
]


def make_job(name, cron, agent, tz, message):
    schedule = {"kind": "cron", "expr": cron, "staggerMs": 300000}
    if tz:
        schedule["tz"] = tz
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
            "model": MODEL,
            "lightContext": True,
        },
        "delivery": {"mode": "none", "channel": "last"},
        "state": {"nextRunAtMs": NOW_MS + 90_000},
    }


def main():
    if not JOBS_PATH.exists():
        print(f"ERROR: {JOBS_PATH} not found")
        return 1
    data = json.loads(JOBS_PATH.read_text(encoding="utf-8"))
    kept = [j for j in data.get("jobs", []) if not str(j.get("name", "")).startswith("VIRAL ")]
    new = [make_job(*spec) for spec in VIRAL_JOBS]
    data["jobs"] = kept + new
    backup = JOBS_PATH.with_suffix(".json.bak-viral")
    backup.write_text(JOBS_PATH.read_text(encoding="utf-8"), encoding="utf-8")
    JOBS_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"VIRAL OpenClaw crons: {len(new)} added, total jobs: {len(data['jobs'])}")
    for j in new:
        print(f"  - {j['name']} -> {j['agentId']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
