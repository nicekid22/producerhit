import json
import sqlite3
from pathlib import Path

print("=== SERVICES ===")
import socket
for p, n in [(11434, "Ollama"), (18789, "OpenClaw"), (7000, "Odysseus"), (9119, "Hermes dash")]:
    s = socket.socket()
    s.settimeout(2)
    ok = s.connect_ex(("127.0.0.1", p)) == 0
    s.close()
    print(f"  {n}: {'OK' if ok else 'DOWN'}")

print("\n=== OPENCLAW CRONS ===")
oc = json.loads((Path.home() / ".openclaw/cron/jobs.json").read_text(encoding="utf-8"))
for j in oc["jobs"]:
    st = j.get("state") or {}
    err = st.get("lastError") or st.get("last_error") or ""
    sched = j.get("schedule") or {}
    print("\t".join([
        j.get("name", "?"),
        j.get("agentId", "?"),
        sched.get("expr", "?"),
        "ON" if j.get("enabled", True) else "OFF",
        (err[:50] + "..." if len(err) > 50 else err) or "—",
    ]))

print("\n=== HERMES CRONS ===")
hj = json.loads(Path(r"C:\Users\dylar\AppData\Local\hermes\cron\jobs.json").read_text(encoding="utf-8"))
for j in hj["jobs"]:
    st = j.get("state") or {}
    if isinstance(st, str):
        err = st
    else:
        err = st.get("last_error") or ""
    skills = ",".join(j.get("skills") or [])
    print("\t".join([
        j.get("name", "?"),
        skills,
        str(j.get("schedule", "?")),
        "ON" if j.get("enabled", True) else "OFF",
        (err[:50] + "..." if len(err) > 50 else err) or "—",
    ]))

print("\n=== ODYSSEUS TASKS (active) ===")
c = sqlite3.connect(r"C:\Users\dylar\odysseus\data\app.db")
for r in c.execute(
    "SELECT name, cron_expression, model FROM scheduled_tasks WHERE status='active' ORDER BY name"
):
    print("\t".join(str(x) for x in r))

print("\n=== ODYSSEUS LAST RUNS ===")
for r in c.execute(
    """SELECT st.name, tr.status, substr(tr.result,1,70)
    FROM task_runs tr JOIN scheduled_tasks st ON st.id=tr.task_id
    ORDER BY tr.started_at DESC LIMIT 10"""
):
    print("\t".join(str(x) if x else "—" for x in r))
c.close()
