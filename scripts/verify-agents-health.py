"""Verify agent stack + apply fixes. Run: python scripts/verify-agents-health.py"""
import json
import os
import socket
import sqlite3
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
HERMES_LOG = Path.home() / "AppData/Local/hermes/logs/agent.log"
ODYSSEUS_DB = Path(r"C:\Users\dylar\odysseus\data\app.db")
HERMES_HOME = Path.home() / "AppData/Local/hermes"


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


def hermes_gateway_running() -> bool:
    hermes_exe = HERMES_HOME / "hermes-agent/.venv/Scripts/hermes.exe"
    if not hermes_exe.exists():
        return False
    env = os.environ.copy()
    env["HERMES_HOME"] = str(HERMES_HOME)
    r = subprocess.run(
        [str(hermes_exe), "gateway", "status"],
        capture_output=True,
        text=True,
        env=env,
    )
    return r.returncode == 0 and "running" in (r.stdout + r.stderr).lower()


def hermes_recent_successes(hours: int = 12) -> list[str]:
    if not HERMES_LOG.exists():
        return []
    cutoff = datetime.now() - timedelta(hours=hours)
    out = []
    for line in HERMES_LOG.read_text(encoding="utf-8", errors="replace").splitlines():
        if "completed successfully" not in line:
            continue
        try:
            ts = datetime.strptime(line[:19], "%Y-%m-%d %H:%M:%S")
        except ValueError:
            continue
        if ts >= cutoff:
            name = line.split("Job '")[1].split("'")[0] if "Job '" in line else "?"
            out.append(name)
    return out[-10:]


def odysseus_recent_runs(limit: int = 8) -> list[tuple]:
    if not ODYSSEUS_DB.exists():
        return []
    c = sqlite3.connect(ODYSSEUS_DB)
    rows = c.execute(
        """
        SELECT st.name, tr.status, substr(coalesce(tr.result,''),1,80)
        FROM task_runs tr
        JOIN scheduled_tasks st ON st.id = tr.task_id
        ORDER BY tr.started_at DESC LIMIT ?
        """,
        (limit,),
    ).fetchall()
    c.close()
    return rows


def openclaw_cron_errors() -> list[str]:
    p = Path.home() / ".openclaw/cron/jobs.json"
    if not p.exists():
        return []
    jobs = json.loads(p.read_text(encoding="utf-8")).get("jobs", [])
    err = []
    for j in jobs:
        st = j.get("state") or {}
        le = st.get("lastError") or ""
        if le and "timeout" in le.lower():
            err.append(j.get("name", "?"))
    return err


def hermes_active_count() -> tuple[int, int]:
    p = Path.home() / "AppData/Local/hermes/cron/jobs.json"
    if not p.exists():
        return 0, 0
    jobs = json.loads(p.read_text(encoding="utf-8")).get("jobs", [])
    active = sum(1 for j in jobs if j.get("enabled", True) and j.get("state") != "paused")
    paused = sum(1 for j in jobs if not j.get("enabled", True) or j.get("state") == "paused")
    return active, paused


def openclaw_enabled_count() -> int:
    p = Path.home() / ".openclaw/cron/jobs.json"
    if not p.exists():
        return 0
    jobs = json.loads(p.read_text(encoding="utf-8")).get("jobs", [])
    return sum(1 for j in jobs if j.get("enabled", True))


def main():
    print("=== SERVICES ===")
    hermes_ok = hermes_gateway_running()
    print(f"  Ollama: {'OK' if port_ok(11434) else 'DOWN'}")
    print(f"  Hermes gateway: {'OK' if hermes_ok else 'DOWN'}")
    print(f"  OpenClaw (should be DOWN): {'OK (noise)' if port_ok(18789) else 'DOWN (good)'}")
    print(f"  Odysseus (should be DOWN): {'OK (noise)' if port_ok(7000) else 'DOWN (good)'}")

    h_on, h_off = hermes_active_count()
    oc_on = openclaw_enabled_count()
    print(f"\n=== LIGHT ARCHITECTURE ===")
    print(f"  Hermes crons active: {h_on} (paused: {h_off})")
    print(f"  OpenClaw crons enabled: {oc_on} (target: 0)")

    print("\n=== HERMES (12h successes) ===")
    ok = hermes_recent_successes()
    if ok:
        for n in ok:
            print(f"  OK  {n}")
    else:
        print("  (none logged)")

    if oc_on:
        print("\n=== OPENCLAW cron timeouts ===")
        oc_err = openclaw_cron_errors()
        print(f"  {len(oc_err)} jobs with last timeout error" if oc_err else "  none")

    print("\n=== ODYSSEUS (optional UI) ===")
    for name, status, result in odysseus_recent_runs()[:4]:
        flag = "OK" if result and "empty response" not in (result or "").lower() else "WARN"
        print(f"  [{flag}] {name}: {(result or status or '')[:70]}")

    print("\n=== COMMANDS ===")
    print("  npm run agents:light")
    print("  npm run agents:restore")
    print("  See scripts/AGENTS-ARCHITECTURE.md")


if __name__ == "__main__":
    main()
