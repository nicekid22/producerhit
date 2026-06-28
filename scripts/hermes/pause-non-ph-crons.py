#!/usr/bin/env python3
"""Pause non-ProducerHit Hermes crons (APEX, INFLU, VIRAL) for lean Ollama-local stack."""
from __future__ import annotations

import json
from pathlib import Path

JOBS_PATH = Path.home() / "AppData" / "Local" / "hermes" / "cron" / "jobs.json"
PAUSE_PREFIXES = ("APEX ", "INFLU ", "VIRAL ")


def main() -> int:
    if not JOBS_PATH.exists():
        print("jobs.json missing")
        return 1
    data = json.loads(JOBS_PATH.read_text(encoding="utf-8"))
    jobs = data.get("jobs", [])
    paused = 0
    for j in jobs:
        name = str(j.get("name", ""))
        if not any(name.startswith(p) for p in PAUSE_PREFIXES):
            continue
        if j.get("enabled", True) and j.get("state") != "paused":
            j["enabled"] = False
            j["state"] = "paused"
            j["paused_reason"] = "lean-local: ProducerHit Ollama stack only"
            paused += 1
    JOBS_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    ph_active = sum(
        1
        for j in jobs
        if str(j.get("name", "")).startswith("PH ")
        and j.get("enabled", True)
        and j.get("state") != "paused"
    )
    print(f"Paused {paused} non-PH job(s). PH active: {ph_active}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
