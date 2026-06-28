#!/usr/bin/env python3
"""
Apply Option A — light agent architecture (reversible).

- Pause all OpenClaw crons + recommend gateway off
- Pause all Odysseus scheduled LLM tasks
- Keep 8 Hermes jobs on a daily staggered grid; pause the rest
- Stop local YouTube catch-up node processes
- Optional: switch Hermes to Groq if GROQ_API_KEY is set

Backups: %LOCALAPPDATA%\\producerhit-agent-backups\\
Restore: python scripts/restore-agent-architecture.py
"""
from __future__ import annotations

import json
import shutil
import sqlite3
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
BACKUP_ROOT = Path.home() / "AppData/Local/producerhit-agent-backups"
OPENCLAW_JOBS = Path.home() / ".openclaw/cron/jobs.json"
HERMES_JOBS = Path.home() / "AppData/Local/hermes/cron/jobs.json"
HERMES_CONFIG = Path.home() / "AppData/Local/hermes/config.yaml"
ODYSSEUS_DB = Path(r"C:\Users\dylar\odysseus\data\app.db")
STATE_FILE = BACKUP_ROOT / "latest-restore-manifest.json"

# One LLM job per slot — no overlap (Paris time, cron expr)
HERMES_LIGHT_ACTIVE: dict[str, str] = {
    "INFLU Scout": "0 6 * * *",
    "PH Acquisition": "0 7 * * *",
    "APEX Scout": "0 8 * * *",
    "PH CEO": "30 8 * * *",
    "PH Competitor": "0 9 * * *",
    "APEX CEO": "30 9 * * *",
    "VIRAL Hooks": "0 10 * * *",
    "APEX Sales": "0 12 * * *",
    "APEX Growth": "0 15 * * *",
    "INFLU Enrich": "0 18 * * *",
    "INFLU CEO": "0 19 * * *",
}

PAUSE_REASON = "light-architecture-v1"


def stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")


def backup_file(src: Path, run_dir: Path, dest_name: str | None = None) -> Path | None:
    if not src.exists():
        return None
    dest = run_dir / (dest_name or src.name)
    shutil.copy2(src, dest)
    return dest


def stop_youtube_catchup() -> int:
    killed = 0
    try:
        out = subprocess.check_output(
            [
                "powershell",
                "-NoProfile",
                "-Command",
                (
                    "Get-CimInstance Win32_Process -Filter \"name='node.exe'\" | "
                    "Where-Object { ($_.CommandLine -match 'youtube-daily-run\\.mjs') "
                    "-and ($_.CommandLine -match 'catch-up') } | "
                    "Select-Object -ExpandProperty ProcessId"
                ),
            ],
            text=True,
            errors="replace",
        )
        for line in out.strip().splitlines():
            pid = line.strip()
            if not pid.isdigit():
                continue
            subprocess.run(
                ["taskkill", "/PID", pid, "/F"],
                capture_output=True,
                check=False,
            )
            killed += 1
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    return killed


def pause_openclaw(run_dir: Path) -> tuple[int, int]:
    if not OPENCLAW_JOBS.exists():
        return 0, 0
    backup_file(OPENCLAW_JOBS, run_dir, "openclaw-jobs.json")
    data = json.loads(OPENCLAW_JOBS.read_text(encoding="utf-8"))
    jobs = data.get("jobs", [])
    paused = 0
    for j in jobs:
        if j.get("enabled", True):
            j["enabled"] = False
            paused += 1
    OPENCLAW_JOBS.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return len(jobs), paused


def pause_odysseus(run_dir: Path) -> int:
    if not ODYSSEUS_DB.exists():
        return 0
    backup_file(ODYSSEUS_DB, run_dir, "odysseus-app.db")
    conn = sqlite3.connect(ODYSSEUS_DB)
    cur = conn.execute(
        """
        UPDATE scheduled_tasks
        SET status = 'paused'
        WHERE status = 'active'
          AND (cron_expression IS NOT NULL AND cron_expression != '')
        """
    )
    conn.commit()
    n = cur.rowcount
    conn.close()
    return n


def apply_hermes_light(run_dir: Path) -> tuple[int, int, int]:
    if not HERMES_JOBS.exists():
        return 0, 0, 0
    backup_file(HERMES_JOBS, run_dir, "hermes-jobs.json")
    data = json.loads(HERMES_JOBS.read_text(encoding="utf-8"))
    jobs = data.get("jobs", [])
    now = datetime.now().astimezone().isoformat()
    active = paused = updated = 0

    for j in jobs:
        name = str(j.get("name", ""))
        if name in HERMES_LIGHT_ACTIVE:
            expr = HERMES_LIGHT_ACTIVE[name]
            j["enabled"] = True
            j["state"] = "scheduled"
            j["paused_at"] = None
            j["paused_reason"] = None
            j["schedule"] = {"kind": "cron", "expr": expr, "display": expr}
            j["schedule_display"] = expr
            active += 1
            updated += 1
        else:
            if j.get("enabled", True) or j.get("state") != "paused":
                j["enabled"] = False
                j["state"] = "paused"
                j["paused_at"] = now
                j["paused_reason"] = PAUSE_REASON
                paused += 1

    data["jobs"] = jobs
    HERMES_JOBS.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return active, paused, updated


def maybe_apply_groq() -> str:
    env_path = Path.home() / "AppData/Local/hermes/.env"
    if not env_path.exists():
        return "skip (no .env)"
    text = env_path.read_text(encoding="utf-8", errors="replace")
    if "GROQ_API_KEY=" not in text and "OPENROUTER_API_KEY=" not in text:
        return "skip (add GROQ_API_KEY or OPENROUTER_API_KEY to %LOCALAPPDATA%\\hermes\\.env)"

    if not HERMES_CONFIG.exists():
        return "skip (no config.yaml)"

    snap = BACKUP_ROOT / "config-snapshots"
    snap.mkdir(parents=True, exist_ok=True)
    backup_file(HERMES_CONFIG, snap, f"config-{stamp()}.yaml")

    if "GROQ_API_KEY=" in text:
        r = subprocess.run(
            [sys.executable, str(REPO / "scripts" / "configure-cloud-apis.py"), "--patch-openrouter"],
            cwd=REPO,
            capture_output=True,
            text=True,
        )
        if r.returncode != 0:
            return f"patch failed: {(r.stderr or r.stdout)[-200:]}"
        return "patched openrouter free + groq fallback — restart Hermes gateway"

    return "skip (OPENROUTER only — set GROQ_API_KEY for cloud agents)"


def write_manifest(run_dir: Path, summary: dict) -> None:
    BACKUP_ROOT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "backup_dir": str(run_dir),
        "pause_reason": PAUSE_REASON,
        "summary": summary,
    }
    STATE_FILE.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def main() -> int:
    run_dir = BACKUP_ROOT / stamp()
    run_dir.mkdir(parents=True, exist_ok=True)

    print("=== Apply light agent architecture (Option A) ===\n")

    yt = stop_youtube_catchup()
    print(f"[OK] YouTube catch-up local: {yt} process(es) stopped")

    oc_total, oc_paused = pause_openclaw(run_dir)
    print(f"[OK] OpenClaw: {oc_paused}/{oc_total} crons disabled")

    odys = pause_odysseus(run_dir)
    print(f"[OK] Odysseus: {odys} scheduled task(s) paused")

    h_active, h_paused, _ = apply_hermes_light(run_dir)
    print(f"[OK] Hermes: {h_active} active (daily grid), {h_paused} paused")

    groq = maybe_apply_groq()
    print(f"[..] Hermes model: {groq}")

    summary = {
        "youtube_catchup_stopped": yt,
        "openclaw_jobs_disabled": oc_paused,
        "odysseus_tasks_paused": odys,
        "hermes_active": h_active,
        "hermes_paused": h_paused,
    }
    write_manifest(run_dir, summary)

    print(f"\nBackup: {run_dir}")
    print("Restore: npm run agents:restore")
    print("\nNext steps:")
    print("  1. Close OpenClaw gateway window (optional - crons already off)")
    print("  2. Keep only: ollama serve + hermes gateway run")
    print("  3. YouTube/Viral -> GitHub Actions only (no local catch-up)")
    print("  4. Add GROQ_API_KEY to %LOCALAPPDATA%\\hermes\\.env then re-run for cloud LLM")
    return 0


if __name__ == "__main__":
    sys.exit(main())
