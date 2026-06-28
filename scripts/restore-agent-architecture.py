#!/usr/bin/env python3
"""Restore agent configs from latest light-architecture backup."""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

BACKUP_ROOT = Path.home() / "AppData/Local/producerhit-agent-backups"
STATE_FILE = BACKUP_ROOT / "latest-restore-manifest.json"
OPENCLAW_JOBS = Path.home() / ".openclaw/cron/jobs.json"
HERMES_JOBS = Path.home() / "AppData/Local/hermes/cron/jobs.json"
ODYSSEUS_DB = Path(r"C:\Users\dylar\odysseus\data\app.db")


def main() -> int:
    if not STATE_FILE.exists():
        print("No backup manifest found. Nothing to restore.")
        return 1

    manifest = json.loads(STATE_FILE.read_text(encoding="utf-8"))
    run_dir = Path(manifest["backup_dir"])
    if not run_dir.is_dir():
        print(f"Backup dir missing: {run_dir}")
        return 1

    restored: list[str] = []
    pairs = [
        (run_dir / "openclaw-jobs.json", OPENCLAW_JOBS, "OpenClaw crons"),
        (run_dir / "hermes-jobs.json", HERMES_JOBS, "Hermes crons"),
        (run_dir / "odysseus-app.db", ODYSSEUS_DB, "Odysseus DB"),
    ]
    for src, dest, label in pairs:
        if src.exists():
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
            restored.append(label)

    if not restored:
        print(f"No restorable files in {run_dir}")
        return 1

    print("Restored:", ", ".join(restored))
    print("Restart Hermes gateway (+ OpenClaw if you re-enable crons).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
