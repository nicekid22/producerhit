import sqlite3
c = sqlite3.connect(r"C:\Users\dylar\odysseus\data\app.db")
print("=== TITAN tasks ===")
for row in c.execute(
    "SELECT name, status, cron_expression, model, endpoint_url, last_error, last_run "
    "FROM scheduled_tasks WHERE name LIKE 'TITAN%' ORDER BY name"
):
    print(row)
print("\n=== Endpoints ===")
for row in c.execute("SELECT id, name, url, cached_models FROM llm_endpoints"):
    print(row)
