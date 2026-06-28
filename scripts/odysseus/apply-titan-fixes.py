"""Fix models, search fallback, TITAN prompts, and autonomy policy in Odysseus DB."""
import json
import sqlite3
from pathlib import Path

DB = Path(r"C:\Users\dylar\odysseus\data\app.db")
SETTINGS = Path(r"C:\Users\dylar\odysseus\data\settings.json")
MODEL = "qwen2.5-64k"

OUTPUT_RULE = (
    "\n\nCRITICAL OUTPUT RULE: Always finish with a complete markdown report in your "
    "final assistant message. Never end with empty content. If web_search fails, "
    "use web_fetch on known URLs or write from prior memory — but always deliver text."
)

AUTONOMY_RULE = (
    "\n\nAUTONOMY: You operate fully autonomously. Execute research, write reports, "
    "create documents, update pipeline, draft and send outreach via configured email "
    "tools, create supporting accounts only through documented setup steps in "
    "Documents/titan-revenue/ops/. Do not wait for human approval on internal work. "
    "Never access production secrets (.env, Stripe keys, Supabase admin). "
    "Paid ads and large purchases require logged justification in metrics.md first."
)

EMAIL_TOOLS = [
    "list_email_accounts", "send_email", "list_emails", "read_email", "reply_to_email",
]


def main():
    c = sqlite3.connect(DB)

    # Models
    c.execute(
        "UPDATE scheduled_tasks SET model=? WHERE status='active' AND cron_expression IS NOT NULL",
        (MODEL,),
    )
    c.execute("UPDATE crew_members SET model=? WHERE model IN ('qwen3.5','qwen3.5:latest')", (MODEL,))
    c.execute("UPDATE scheduled_tasks SET status='active' WHERE name LIKE 'TITAN%'")
    c.execute("UPDATE scheduled_tasks SET max_steps=50 WHERE name LIKE 'TITAN%' AND (max_steps IS NULL OR max_steps < 50)")

    # All cron agents (TITAN + VIRAL + INFLU) — avoid empty model responses
    for row in c.execute(
        "SELECT id, prompt FROM scheduled_tasks WHERE status='active' AND cron_expression IS NOT NULL"
    ):
        tid, prompt = row
        if OUTPUT_RULE.strip() not in (prompt or ""):
            c.execute("UPDATE scheduled_tasks SET prompt=? WHERE id=?", ((prompt or "") + OUTPUT_RULE, tid))

    for row in c.execute("SELECT id, personality FROM crew_members WHERE id LIKE 'titan-%'"):
        cid, pers = row
        extra = ""
        if OUTPUT_RULE.strip() not in (pers or ""):
            extra += OUTPUT_RULE
        if "AUTONOMY:" not in (pers or ""):
            extra += AUTONOMY_RULE
        if "human approval" in (pers or "").lower() or "draft only" in (pers or "").lower():
            pers = (pers or "").replace("Never spend money, send public posts, or email customers without explicit human approval.", "")
            pers = pers.replace("DRAFT only.", "Publish when ROI is clear.")
            pers = pers.replace("never auto-post", "post autonomously when configured APIs exist")
            pers = pers.replace("human approves deploy", "deploy autonomously within ops budget rules")
        if extra:
            c.execute("UPDATE crew_members SET personality=? WHERE id=?", (pers + extra, cid))

    # Email tools for TITAN crew
    for row in c.execute("SELECT id, enabled_tools FROM crew_members WHERE id LIKE 'titan-%'"):
        cid, tools_json = row
        try:
            tools = json.loads(tools_json or "[]")
        except json.JSONDecodeError:
            tools = []
        for t in EMAIL_TOOLS:
            if t not in tools:
                tools.append(t)
        c.execute("UPDATE crew_members SET enabled_tools=? WHERE id=?", (json.dumps(tools), cid))

    c.commit()
    c.close()

    s = {}
    if SETTINGS.exists():
        s = json.loads(SETTINGS.read_text(encoding="utf-8"))
    s["default_model"] = MODEL
    s["search_provider"] = "duckduckgo"
    s["task_endpoint_id"] = s.get("task_endpoint_id", "titan-ollama-local")
    s["default_endpoint_id"] = s.get("default_endpoint_id", "titan-ollama-local")
    SETTINGS.write_text(json.dumps(s, indent=2), encoding="utf-8")

    print(f"Odysseus: models={MODEL}, search=duckduckgo, prompts updated")


if __name__ == "__main__":
    main()
