"""Patch OpenClaw config + cron jobs for reliable local Ollama (qwen2.5-64k, long timeout)."""
import json
from pathlib import Path

OPENCLAW = Path.home() / ".openclaw"
CFG = OPENCLAW / "openclaw.json"
CRON = OPENCLAW / "cron" / "jobs.json"
MODEL = "ollama/qwen2.5-64k"
TIMEOUT = 1200


def patch_config():
    data = json.loads(CFG.read_text(encoding="utf-8"))
    defaults = data.setdefault("agents", {}).setdefault("defaults", {})
    defaults["timeoutSeconds"] = TIMEOUT
    defaults.setdefault("model", {})["primary"] = MODEL

    providers = data.setdefault("models", {}).setdefault("providers", {})
    ollama = providers.setdefault("ollama", {})
    models = ollama.setdefault("models", [])
    ids = {m.get("id") for m in models}
    if "qwen2.5-64k" not in ids:
        models.append(
            {
                "id": "qwen2.5-64k",
                "name": "qwen2.5-64k",
                "input": ["text"],
                "contextWindow": 65536,
                "cost": {"input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0},
            }
        )

    for agent in data.get("agents", {}).get("list", []):
        if agent.get("id") == "main":
            continue
        if agent.get("model", "").startswith("ollama/qwen"):
            agent["model"] = MODEL if "coder" not in agent.get("model", "") else agent["model"]

    CFG.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"openclaw.json: timeout={TIMEOUT}s model={MODEL}")


def patch_crons():
    data = json.loads(CRON.read_text(encoding="utf-8"))
    n = 0
    for job in data.get("jobs", []):
        payload = job.get("payload") or {}
        if payload.get("kind") == "agentTurn":
            m = payload.get("model", "")
            if m.startswith("ollama/qwen") and "coder" not in m:
                payload["model"] = MODEL
                n += 1
        # Stagger heavy teams to reduce Ollama stampede
        sched = job.get("schedule") or {}
        if sched.get("kind") == "cron" and not sched.get("staggerMs"):
            sched["staggerMs"] = 120000
    CRON.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"cron/jobs.json: updated {n} job model(s), added staggerMs where missing")


if __name__ == "__main__":
    patch_config()
    patch_crons()
