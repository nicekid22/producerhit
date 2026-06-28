#!/usr/bin/env python3
"""Register VIRAL Hermes crons by editing jobs.json directly."""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERMES = Path.home() / "AppData" / "Local" / "hermes"
JOBS_PATH = HERMES / "cron" / "jobs.json"
WORKDIR = str(HERMES / "projects" / "viral-content")

VIRAL_JOBS = [
    ("VIRAL Strategist", "30 8 * * *", "ph-viral-strategist",
     "Read BRIEF.md. Executive synthesis. Update directives + metrics. Full report."),
    ("VIRAL Hooks", "0 */2 * * *", "ph-viral-hooks",
     "10 hooks + 5 captions + hashtags. Update memory/hooks.md. Report required."),
    ("VIRAL Render", "0 */4 * * *", "ph-viral-render",
     "Run viral-agent-run status + pipeline from repo TOOLKIT.md. Report render status."),
    ("VIRAL Publish", "0 */6 * * *", "ph-viral-publish",
     "Publish via social:publish script. Reels browser playbook if needed. Log published.md."),
]


def _now_local():
    return datetime.now(timezone(timedelta(hours=2)))


def make_job(name: str, cron_expr: str, skill: str, prompt: str) -> dict:
    jid = uuid.uuid4().hex[:12]
    now = _now_local()
    return {
        "id": jid,
        "name": name,
        "prompt": prompt,
        "skills": [skill],
        "skill": skill,
        "model": None,
        "provider": None,
        "base_url": None,
        "script": None,
        "no_agent": False,
        "context_from": None,
        "schedule": {"kind": "cron", "expr": cron_expr, "display": cron_expr},
        "schedule_display": cron_expr,
        "repeat": {"times": None, "completed": 0},
        "enabled": True,
        "state": "scheduled",
        "paused_at": None,
        "paused_reason": None,
        "created_at": now.isoformat(),
        "next_run_at": (now + timedelta(minutes=5)).isoformat(),
        "last_run_at": None,
        "last_status": None,
        "last_error": None,
        "last_delivery_error": None,
        "deliver": "local",
        "origin": None,
        "enabled_toolsets": None,
        "workdir": WORKDIR,
    }


def main() -> int:
    if not JOBS_PATH.exists():
        print(f"ERROR: {JOBS_PATH} not found")
        return 1
    data = json.loads(JOBS_PATH.read_text(encoding="utf-8"))
    jobs = data.get("jobs", [])
    kept = [j for j in jobs if not str(j.get("name", "")).startswith("VIRAL ")]
    new = [make_job(*spec) for spec in VIRAL_JOBS]
    data["jobs"] = kept + new
    backup = JOBS_PATH.with_suffix(".json.bak-viral")
    backup.write_text(JOBS_PATH.read_text(encoding="utf-8"), encoding="utf-8")
    JOBS_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"VIRAL Hermes crons: {len(new)} added, total: {len(data['jobs'])}")
    for j in new:
        print(f"  - {j['name']} ({j['skill']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
