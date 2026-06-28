#!/usr/bin/env python3
"""Register ProducerHit Hermes crons — idempotent, Ollama-local (inherits config.yaml).

Edits jobs.json directly (CLI create can duplicate jobs / leave cloud provider overrides).
"""
from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERMES = Path.home() / "AppData" / "Local" / "hermes"
JOBS_PATH = HERMES / "cron" / "jobs.json"
WORKDIR = str(HERMES / "projects" / "producerhit")
PH_PREFIX = "PH "
TELEGRAM_DELIVER_JOBS = frozenset({"PH CEO", "PH Acquisition"})
TELEGRAM_USER_ID = "8495702663"

# Single local model (16GB RAM / Iris Xe — one model loaded at a time)
LOCAL_MODEL = "qwen3-8b-64k"
SKILL_MODELS: dict[str, str] = {
    "ph-ceo": LOCAL_MODEL,
    "ph-growth-commander": LOCAL_MODEL,
    "ph-stripe-analytics": LOCAL_MODEL,
    "ph-revenue-optimizer": LOCAL_MODEL,
    "ph-market-intelligence": LOCAL_MODEL,
    "ph-automation-builder": LOCAL_MODEL,
    "ph-funnel-doctor": LOCAL_MODEL,
    "ph-conversion": LOCAL_MODEL,
    "ph-content": LOCAL_MODEL,
    "ph-competitor": LOCAL_MODEL,
    "ph-acquisition": LOCAL_MODEL,
    "ph-growth": LOCAL_MODEL,
    "ph-reddit": LOCAL_MODEL,
}
PH_JOBS: list[tuple[str, str, str, str]] = [
    (
        "PH Metrics Sync",
        "55 6 * * *",
        "ph-automation-builder",
        "REMINDER ONLY: metrics sync runs via Windows Task + npm run hermes:metrics:sync. "
        "Verify metrics/latest.md exists and is <26h old. If stale, note in reports/daily/metrics-reminder.md. "
        "NO_REPLY if OK.",
    ),
    (
        "PH Growth Commander",
        "0 7 * * *",
        "ph-growth-commander",
        "Execute full daily quotas: 10 viral ideas, 5 TikTok scripts, 3 Reddit drafts, 1 SEO outline. "
        "Read metrics/latest.md first.",
    ),
    (
        "PH Stripe Analytics",
        "15 7 * * *",
        "ph-stripe-analytics",
        "Analyze metrics/latest.md. MRR trend, churn, upgrades, pricing inefficiencies. Revenue actions ranked ROI.",
    ),
    (
        "PH Acquisition",
        "every 1h",
        "ph-acquisition",
        "Run acquisition scan. Write report. NO_REPLY if done.",
    ),
    (
        "PH Competitor",
        "every 4h",
        "ph-competitor",
        "Run competitor intel. Update competitors.md and report.",
    ),
    (
        "PH Content",
        "0 9 * * *",
        "ph-content",
        "Generate daily content pack. DRAFT only.",
    ),
    (
        "PH Conversion",
        "0 2 * * *",
        "ph-conversion",
        "Audit producerhit.com conversion funnel. Read metrics/latest.md.",
    ),
    (
        "PH Funnel Doctor",
        "30 2 * * *",
        "ph-funnel-doctor",
        "3 UX fixes + 1 experiment. Diagnose signup→activation→paywall from metrics/latest.md.",
    ),
    (
        "PH Revenue Optimizer",
        "0 3 * * *",
        "ph-revenue-optimizer",
        "Maximize MRR. Pricing tests, upsells, packaging. Revenue-only focus.",
    ),
    (
        "PH Market Intel",
        "0 5 * * *",
        "ph-market-intelligence",
        "Daily opportunity report + feature ideas + viral patterns.",
    ),
    (
        "PH Growth",
        "every 6h",
        "ph-growth",
        "Growth scan: dissatisfied Suno/Udio users + experiments.",
    ),
    (
        "PH Reddit",
        "every 4h",
        "ph-reddit",
        "Reddit Army: scout threads. DRAFT comments + 1 discussion post. Report to reports/daily/reddit-*.md",
    ),
    (
        "PH CEO",
        "30 8 * * *",
        "ph-ceo",
        "Execute ph-ceo fully. Read metrics/latest.md + reports/daily (24h). CEO dashboard format. "
        "Directives + kill list. Update roadmap.md.",
    ),
]


def _now_local() -> datetime:
    try:
        from zoneinfo import ZoneInfo

        return datetime.now(ZoneInfo("Europe/Paris"))
    except Exception:
        return datetime.now(timezone(timedelta(hours=2)))


def parse_schedule(expr: str) -> dict:
    m = re.fullmatch(r"every (\d+)h", expr.strip(), re.I)
    if m:
        hours = int(m.group(1))
        minutes = hours * 60
        return {
            "kind": "interval",
            "minutes": minutes,
            "display": f"every {minutes}m",
        }
    return {"kind": "cron", "expr": expr.strip(), "display": expr.strip()}


def make_job(name: str, schedule: str, skill: str, prompt: str) -> dict:
    jid = uuid.uuid4().hex[:12]
    now = _now_local()
    sched = parse_schedule(schedule)
    display = sched.get("display", schedule)
    model = SKILL_MODELS.get(skill, LOCAL_MODEL)
    deliver = (
        f"telegram:{TELEGRAM_USER_ID}"
        if name in TELEGRAM_DELIVER_JOBS
        else "local"
    )
    return {
        "id": jid,
        "name": name,
        "prompt": prompt,
        "skills": [skill],
        "skill": skill,
        "model": model,
        "provider": None,
        "base_url": None,
        "script": None,
        "no_agent": False,
        "context_from": None,
        "schedule": sched,
        "schedule_display": display,
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
        "deliver": deliver,
        "origin": None,
        "enabled_toolsets": None,
        "workdir": WORKDIR,
    }


def main() -> int:
    JOBS_PATH.parent.mkdir(parents=True, exist_ok=True)
    if JOBS_PATH.exists():
        data = json.loads(JOBS_PATH.read_text(encoding="utf-8"))
    else:
        data = {"jobs": []}

    jobs = data.get("jobs", [])
    kept = [j for j in jobs if not str(j.get("name", "")).startswith(PH_PREFIX)]
    removed = len(jobs) - len(kept)
    new = [make_job(*spec) for spec in PH_JOBS]
    data["jobs"] = kept + new

    backup = JOBS_PATH.with_suffix(".json.bak-ph")
    if JOBS_PATH.exists():
        backup.write_text(JOBS_PATH.read_text(encoding="utf-8"), encoding="utf-8")
    JOBS_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")

    print(f"ProducerHit Hermes crons: removed {removed} old PH job(s), added {len(new)}")
    print(f"  model/provider: Ollama per-skill ({', '.join(sorted(set(SKILL_MODELS.values())))})")
    print(f"  total jobs: {len(data['jobs'])}")
    for j in new:
        print(f"  - {j['name']} ({j['schedule_display']}) -> {j['skill']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
