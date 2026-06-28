import sqlite3
from pathlib import Path

c = sqlite3.connect(Path(r"C:\Users\dylar\odysseus\data\app.db"))
print("=== last TITAN runs ===")
q = """
select st.name, tr.status, tr.model, substr(tr.error,1,120), substr(tr.result,1,100)
from task_runs tr
join scheduled_tasks st on st.id = tr.task_id
where st.name like 'TITAN%'
order by tr.started_at desc limit 8
"""
for r in c.execute(q):
    print(r)
