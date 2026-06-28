"""Fix all model references + re-apply Odysseus TITAN config."""
import json
import sqlite3
from pathlib import Path

NEW = "qwen2.5"
OLD_VARIANTS = ("qwen3.5", "qwen3.5:latest", "ollama/qwen3.5")


def fix_odysseus():
    db = Path(r"C:\Users\dylar\odysseus\data\app.db")
    settings = Path(r"C:\Users\dylar\odysseus\data\settings.json")
    c = sqlite3.connect(db)
    n = 0
    for table in ("scheduled_tasks", "crew_members", "sessions"):
        for old in OLD_VARIANTS:
            cur = c.execute(f"UPDATE {table} SET model=? WHERE model=?", (NEW, old))
            n += cur.rowcount
    c.execute("UPDATE scheduled_tasks SET status='active' WHERE name LIKE 'TITAN%'")
    c.commit()
    rows = c.execute(
        "SELECT model, COUNT(*) FROM scheduled_tasks WHERE name LIKE 'TITAN%' GROUP BY model"
    ).fetchall()
    c.close()
    if settings.exists():
        s = json.loads(settings.read_text(encoding="utf-8"))
        s["default_model"] = NEW
        settings.write_text(json.dumps(s, indent=2), encoding="utf-8")
    print("Odysseus TITAN models:", rows)
    return n


def fix_openclaw_jobs():
    p = Path.home() / ".openclaw" / "cron" / "jobs.json"
    d = json.loads(p.read_text(encoding="utf-8"))
    n = 0
    for job in d.get("jobs", []):
        m = job.get("payload", {}).get("model", "")
        if "qwen3.5" in m:
            job["payload"]["model"] = m.replace("qwen3.5", "qwen2.5")
            n += 1
    p.write_text(json.dumps(d, indent=2), encoding="utf-8")
    print("OpenClaw cron jobs updated:", n)


def fix_openclaw_config():
    p = Path.home() / ".openclaw" / "openclaw.json"
    if not p.exists():
        return
    text = p.read_text(encoding="utf-8")
    if "qwen3.5" not in text:
        print("OpenClaw config: no qwen3.5")
        return
    text = text.replace("ollama/qwen3.5", "ollama/qwen2.5").replace("qwen3.5", "qwen2.5")
    p.write_text(text, encoding="utf-8")
    print("OpenClaw openclaw.json: qwen3.5 -> qwen2.5")


if __name__ == "__main__":
    fix_odysseus()
    fix_openclaw_jobs()
    fix_openclaw_config()
