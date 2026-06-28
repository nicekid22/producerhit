#!/usr/bin/env python3
"""Add INFLU agents to openclaw.json if missing."""
import json
from pathlib import Path

CFG = Path.home() / ".openclaw" / "openclaw.json"
WS = str(Path.home() / ".openclaw" / "workspace-influ")
MODEL = "ollama/qwen2.5"
DENY = ["exec", "process", "browser", "gateway", "cron", "sessions_spawn", "sessions_send", "apply_patch"]

AGENTS = [
    ("influ-ceo", "INFLU CEO"),
    ("influ-scout", "INFLU Scout"),
    ("influ-enrich", "INFLU Enrich"),
    ("influ-pitch", "INFLU Pitch"),
    ("influ-outreach", "INFLU Outreach"),
    ("influ-followup", "INFLU Followup"),
    ("influ-learn", "INFLU Learn"),
]


def main():
    cfg = json.loads(CFG.read_text(encoding="utf-8"))
    ids = {a.get("id") for a in cfg.get("agents", {}).get("list", [])}
    added = 0
    for aid, name in AGENTS:
        if aid in ids:
            continue
        cfg["agents"]["list"].append({
            "id": aid,
            "name": aid,
            "workspace": WS,
            "agentDir": str(Path.home() / ".openclaw" / "agents" / aid / "agent"),
            "model": MODEL,
            "sandbox": {"mode": "off", "scope": "agent", "workspaceAccess": "rw"},
            "tools": {"deny": DENY, "elevated": {"enabled": False}},
        })
        added += 1
    cfg["agents"]["defaults"]["model"]["primary"] = MODEL
    CFG.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    print(f"OpenClaw INFLU agents added: {added}")


if __name__ == "__main__":
    main()
