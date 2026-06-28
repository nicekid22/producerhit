#!/usr/bin/env python3
"""Register VIRAL OpenClaw agents in openclaw.json."""
import json
from pathlib import Path

CFG = Path.home() / ".openclaw" / "openclaw.json"
WS = str(Path.home() / ".openclaw" / "workspace-viral")
MODEL = "ollama/qwen2.5"
DENY_SAFE = ["gateway", "cron", "sessions_spawn", "sessions_send", "apply_patch"]
DENY_RESEARCH = DENY_SAFE + ["exec", "process", "browser"]
DENY_EXEC = DENY_SAFE  # render/publish may exec

AGENTS = [
    ("ph-viral-strategist", "VIRAL Strategist", DENY_RESEARCH),
    ("ph-viral-hooks", "VIRAL Hooks", DENY_RESEARCH),
    ("ph-viral-render", "VIRAL Render", DENY_EXEC),
    ("ph-viral-publish", "VIRAL Publish", DENY_EXEC),
]


def main():
    cfg = json.loads(CFG.read_text(encoding="utf-8"))
    lst = cfg.setdefault("agents", {}).setdefault("list", [])
    ids = {a.get("id") for a in lst}
    added = 0
    for aid, name, deny in AGENTS:
        if aid in ids:
            continue
        lst.append({
            "id": aid,
            "name": name,
            "workspace": WS,
            "agentDir": str(Path.home() / ".openclaw" / "agents" / aid / "agent"),
            "model": MODEL,
            "sandbox": {"mode": "off", "scope": "agent", "workspaceAccess": "rw"},
            "tools": {"deny": deny, "elevated": {"enabled": False}},
        })
        added += 1
    cfg["agents"]["defaults"]["model"]["primary"] = MODEL
    CFG.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    print(f"VIRAL OpenClaw agents added: {added}")


if __name__ == "__main__":
    main()
