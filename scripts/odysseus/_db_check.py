import sqlite3
from pathlib import Path

c = sqlite3.connect(Path(r"C:\Users\dylar\odysseus\data\app.db"))
print("tables:", [r[0] for r in c.execute("select name from sqlite_master where type='table'")])
row = c.execute(
    "select name, model, endpoint_url, status from scheduled_tasks where name='TITAN Radar Scan'"
).fetchone()
print("TITAN Radar:", row)
rows = c.execute("select id, name, endpoint_url, model from crew_members where id like 'titan-%' limit 3").fetchall()
print("crew sample:", rows)
