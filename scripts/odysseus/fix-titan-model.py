"""Fix Odysseus TITAN: switch qwen3.5 -> qwen2.5 (qwen3.5 returns empty on this machine)."""
import json
import sqlite3
from pathlib import Path

HOME = Path(r"C:\Users\dylar\odysseus")
DB = HOME / "data" / "app.db"
SETTINGS = HOME / "data" / "settings.json"
OLD = "qwen3.5"
NEW = "qwen2.5"

c = sqlite3.connect(DB)
cur = c.cursor()

cur.execute(
    "UPDATE scheduled_tasks SET status='active' WHERE name LIKE 'TITAN%'"
)
cur.execute(
    "UPDATE scheduled_tasks SET model=? WHERE name LIKE 'TITAN%' OR model=?",
    (NEW, OLD),
)
cur.execute(
    "UPDATE crew_members SET model=? WHERE id LIKE 'titan-%' OR model=?",
    (NEW, OLD),
)
cur.execute(
    "UPDATE sessions SET model=? WHERE crew_member_id LIKE 'titan-%' OR model=?",
    (NEW, OLD),
)
print("Models switched to", NEW)

c.commit()
c.close()

if SETTINGS.exists():
    s = json.loads(SETTINGS.read_text(encoding="utf-8"))
    s["default_model"] = NEW
    SETTINGS.write_text(json.dumps(s, indent=2), encoding="utf-8")
    print("settings.json default_model ->", NEW)

print("Done. Restart Odysseus or wait for next cron tick.")
