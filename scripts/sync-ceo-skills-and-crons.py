#!/usr/bin/env python3
"""Sync CEO skill briefs from repo templates to Hermes + enable CEO crons on daily grid."""
from __future__ import annotations

import json
import shutil
from datetime import datetime
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
HERMES_HOME = Path.home() / "AppData/Local/hermes"
HERMES_SKILLS = HERMES_HOME / "skills"
HERMES_JOBS = HERMES_HOME / "cron" / "jobs.json"
OLLAMA_LOCAL_MARKER = HERMES_HOME / ".ollama-local-mode"

SKILL_SOURCES = {
    "ph-ceo": REPO / "scripts/hermes/templates/hermes/skills/ph-ceo/SKILL.md",
    "apex-ceo": REPO / "scripts/apex/templates/hermes/skills/apex-ceo/SKILL.md",
    "influ-ceo": REPO / "scripts/influ/templates/hermes/skills/influ-ceo/SKILL.md",
}

# Paris daily grid — CEOs staggered after their teams report in
CEO_CRONS: dict[str, dict[str, str]] = {
    "PH CEO": {
        "expr": "30 8 * * *",
        "prompt": (
            "Execute ph-ceo skill fully. Synthesize PH division reports (24h). "
            "Write executive report + agent directives + kill list. Update roadmap.md."
        ),
    },
    "APEX CEO": {
        "expr": "30 9 * * *",
        "prompt": (
            "Execute apex-ceo skill fully. Synthesize APEX reports (48h). "
            "Top 3 licensing/B2B deals + directives for scout/sales/validator. Update roadmap.md."
        ),
    },
    "INFLU CEO": {
        "expr": "0 19 * * *",
        "prompt": (
            "Execute influ-ceo skill fully. Synthesize INFLU pipeline after enrich run. "
            "Top 3 partnership actions + scale/kill lists. Update memory/learnings.md."
        ),
    },
}


def sync_skills() -> list[str]:
    synced: list[str] = []
    for name, src in SKILL_SOURCES.items():
        if not src.exists():
            raise FileNotFoundError(f"Missing template: {src}")
        dest_dir = HERMES_SKILLS / name
        dest_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest_dir / "SKILL.md")
        synced.append(name)
    return synced


def enable_ceo_crons() -> list[str]:
    if not HERMES_JOBS.exists():
        print(f"[SKIP] {HERMES_JOBS} missing — run npm run hermes:crons first")
        return []
    data = json.loads(HERMES_JOBS.read_text(encoding="utf-8"))
    now = datetime.now().astimezone().isoformat()
    updated: list[str] = []
    lean = OLLAMA_LOCAL_MARKER.exists()
    allowed = {"PH CEO"} if lean else set(CEO_CRONS.keys())

    for job in data.get("jobs", []):
        name = str(job.get("name", ""))
        if name not in allowed:
            continue
        cfg = CEO_CRONS[name]
        expr = cfg["expr"]
        job["enabled"] = True
        job["state"] = "scheduled"
        job["paused_at"] = None
        job["paused_reason"] = None
        job["prompt"] = cfg["prompt"]
        job["provider"] = None
        job["model"] = None
        job["base_url"] = None
        job["schedule"] = {"kind": "cron", "expr": expr, "display": expr}
        job["schedule_display"] = expr
        updated.append(f"{name} @ {expr}")
        _ = now

    data["updated_at"] = now
    HERMES_JOBS.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return updated


def main() -> int:
    skills = sync_skills()
    crons = enable_ceo_crons()
    print("CEO skills synced:", ", ".join(skills))
    print("CEO crons enabled:")
    for line in crons:
        print(f"  - {line}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
