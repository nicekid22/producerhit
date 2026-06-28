"""Switch all OpenClaw cron jobs from qwen3.5 to qwen2.5 (qwen3.5 returns empty via Ollama)."""
import json
from pathlib import Path

p = Path.home() / ".openclaw" / "cron" / "jobs.json"
data = json.loads(p.read_text(encoding="utf-8"))
n = 0
for job in data.get("jobs", []):
    payload = job.get("payload", {})
    model = payload.get("model", "")
    if "qwen3.5" in model:
        payload["model"] = model.replace("qwen3.5", "qwen2.5")
        n += 1
p.write_text(json.dumps(data, indent=2), encoding="utf-8")
print(f"Updated {n} job(s) to ollama/qwen2.5")
