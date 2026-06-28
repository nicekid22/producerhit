#!/usr/bin/env python3
"""Verify ProducerHit Hermes local stack (Ollama + crons + project)."""
from __future__ import annotations

import json
import socket
import subprocess
import sys
from pathlib import Path

HERMES = Path.home() / "AppData" / "Local" / "hermes"
HERMES_EXE = HERMES / "hermes-agent" / ".venv" / "Scripts" / "hermes.exe"
JOBS_PATH = HERMES / "cron" / "jobs.json"
PROJECT = HERMES / "projects" / "producerhit"
MARKER = HERMES / ".ollama-local-mode"
CONFIG = HERMES / "config.yaml"


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
    if not HERMES_EXE.exists():
        return False
    import os

    r = subprocess.run(
        [str(HERMES_EXE), "gateway", "status"],
        capture_output=True,
        text=True,
        env={**os.environ, "HERMES_HOME": str(HERMES)},
    )
    out = (r.stdout + r.stderr).lower()
    if "not running" in out or "is not running" in out:
        return False
    return r.returncode == 0 and "running" in out


def gateway_installed() -> bool:
    """Windows scheduled task installed by `hermes gateway install`."""
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
    return "scheduled task" in out or "installed" in out


def main() -> int:
    ok = True
    print("=== Hermes local stack ===\n")

    print("Services:")
    ollama = port_ok(11434)
    gw = gateway_running()
    gw_task = gateway_installed()
    print(f"  Ollama (11434): {'OK' if ollama else 'DOWN — ollama serve'}")
    if gw:
        print("  Hermes gateway: OK (running)")
    elif gw_task:
        print("  Hermes gateway: INSTALLED (not running now — will start at logon)")
    else:
        print("  Hermes gateway: DOWN — npm run hermes:gateway-install")
    if not ollama:
        ok = False
    if not gw and not gw_task:
        ok = False

    print("\nConfig:")
    print(f"  Hermes binary: {'OK' if HERMES_EXE.exists() else 'MISSING'}")
    print(f"  .ollama-local-mode: {'OK' if MARKER.exists() else 'MISSING — run configure-ollama-multi-model.ps1'}")
    if CONFIG.exists():
        text = CONFIG.read_text(encoding="utf-8", errors="replace")
        print(f"  config.yaml Ollama: {'OK' if '127.0.0.1:11434' in text else 'NOT OLLAMA'}")
    else:
        print("  config.yaml: MISSING")
        ok = False

    print("\nProject producerhit:")
    for f in ("SECURITY.md", "business.md", "roadmap.md", "metrics/latest.md"):
        p = PROJECT / f
        print(f"  {f}: {'OK' if p.exists() else 'missing'}")

    print("\nPH crons:")
    if not JOBS_PATH.exists():
        print("  jobs.json: MISSING")
        ok = False
    else:
        jobs = json.loads(JOBS_PATH.read_text(encoding="utf-8")).get("jobs", [])
        ph = [j for j in jobs if str(j.get("name", "")).startswith("PH ")]
        cloud = [j for j in ph if j.get("provider") or j.get("base_url")]
        bad_model = [j for j in ph if not j.get("model")]
        err = [j for j in ph if j.get("last_error")]
        print(f"  PH jobs: {len(ph)} (expect 13)")
        if len(ph) < 13:
            ok = False
        if cloud:
            print(f"  WARN: {len(cloud)} PH job(s) have cloud provider override")
            ok = False
        else:
            print("  provider: Ollama (no cloud override)")
        if bad_model:
            print(f"  WARN: {len(bad_model)} PH job(s) missing per-skill model")
        else:
            models = sorted({str(j.get("model")) for j in ph})
            print(f"  models: {', '.join(models)}")
        paused_legacy = sum(
            1
            for j in jobs
            if any(str(j.get("name", "")).startswith(p) for p in ("APEX ", "INFLU ", "VIRAL "))
            and (not j.get("enabled", True) or j.get("state") == "paused")
        )
        print(f"  legacy jobs paused: {paused_legacy} (APEX/VIRAL/INFLU)")

    print()
    if ok and ollama and (gw or gw_task):
        print("Stack OK for continuous local operation.")
        return 0
    print("Fix issues above, then:")
    print("  npm run hermes:start")
    print("  npm run hermes:gateway-install")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
