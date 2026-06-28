#!/usr/bin/env python3
"""Hermes ProducerHit status — services, PH crons, recent reports."""
from __future__ import annotations

import json
import socket
import subprocess
from datetime import datetime, timezone
from pathlib import Path

HERMES = Path.home() / "AppData" / "Local" / "hermes"
HERMES_EXE = HERMES / "hermes-agent" / ".venv" / "Scripts" / "hermes.exe"
JOBS_PATH = HERMES / "cron" / "jobs.json"
PROJECT = HERMES / "projects" / "producerhit"
REPORTS = PROJECT / "reports" / "daily"
METRICS = PROJECT / "metrics" / "latest.md"


def port_ok(port: int) -> bool:
    s = socket.socket()
    s.settimeout(2)
    try:
        s.connect(("127.0.0.1", port))
        return True
    except OSError:
        return False
    finally:
        s.close()


def gateway_running() -> bool:
    import os

    if not HERMES_EXE.exists():
        return False
    r = subprocess.run(
        [str(HERMES_EXE), "gateway", "status"],
        capture_output=True,
        text=True,
        env={**os.environ, "HERMES_HOME": str(HERMES)},
    )
    out = (r.stdout + r.stderr).lower()
    if "not running" in out:
        return False
    return "running" in out and "process running" in out


def metrics_age_hours() -> float | None:
    if not METRICS.exists():
        return None
    mtime = METRICS.stat().st_mtime
    return (datetime.now(timezone.utc).timestamp() - mtime) / 3600


def main() -> int:
    print("=== ProducerHit Hermes Status ===\n")
    print(f"Ollama:   {'UP' if port_ok(11434) else 'DOWN'}")
    print(f"Gateway:  {'UP' if gateway_running() else 'DOWN'}")
    age = metrics_age_hours()
    if age is None:
        print("Metrics:  MISSING")
    else:
        print(f"Metrics:  {age:.1f}h old ({'OK' if age < 26 else 'STALE'})")

    if not JOBS_PATH.exists():
        print("\nNo jobs.json")
        return 1

    jobs = json.loads(JOBS_PATH.read_text(encoding="utf-8")).get("jobs", [])
    ph = [j for j in jobs if str(j.get("name", "")).startswith("PH ")]

    print(f"\nPH crons ({len(ph)}):")
    for j in sorted(ph, key=lambda x: str(x.get("name", ""))):
        name = j.get("name", "?")
        status = j.get("last_status") or "never"
        err = j.get("last_error")
        last = j.get("last_run_at") or "-"
        flag = "!" if err else ("ok" if status == "ok" else " ")
        line = f"  [{flag}] {name}: {status} (last: {last[:19] if last != '-' else '-'})"
        print(line)
        if err and status == "error":
            print(f"       {str(err)[:120]}")

    if REPORTS.exists():
        recent = sorted(REPORTS.glob("*.md"), key=lambda p: p.stat().st_mtime, reverse=True)[:8]
        print(f"\nRecent reports ({len(recent)}):")
        for p in recent:
            if p.name == ".gitkeep":
                continue
            print(f"  - {p.name}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
