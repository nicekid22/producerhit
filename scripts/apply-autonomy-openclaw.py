"""Apply autonomy policy to OpenClaw workspaces + cron messages."""
import json
from pathlib import Path

HOME = Path.home()
WORKSPACES = [
    HOME / ".openclaw" / "workspace-producerhit",
    HOME / ".openclaw" / "workspace-apex",
]

AUTONOMY = """

## Autonomy (enabled)

Operate without waiting for human approval on: research, reports, content drafts,
outreach drafts, SEO briefs, experiment proposals, memory updates, skill evolution.

You may prepare account-setup runbooks (email, social, analytics) in workspace docs.
Human only required for: production secrets, Stripe/Supabase admin, large ad spend.
"""

for ws in WORKSPACES:
    soul = ws / "SOUL.md"
    if soul.exists():
        text = soul.read_text(encoding="utf-8")
        if "human approves" in text.lower() or "draft and recommend" in text.lower():
            text = text.replace(
                "Follow `SECURITY.md` and `POLICY.md`. No secrets, no prod DB, no auto-spend. Draft and recommend — human approves spend and public posts.",
                "Follow `SECURITY.md`. No prod secrets or DB admin. Autonomous execution on research, content, outreach drafts, and internal automation. Log decisions in reports/.",
            )
        if "Autonomy (enabled)" not in text:
            text += AUTONOMY
            soul.write_text(text, encoding="utf-8")
            print("Updated", soul)

    sec = ws / "SECURITY.md"
    if sec.exists():
        text = sec.read_text(encoding="utf-8")
        text = text.replace(
            "Executing purchases, ads spend, or posting without human approval",
            "Executing large ad spend (>$50/day) or accessing production payment keys without logging in metrics",
        )
        text = text.replace("DRAFT only", "Autonomous drafts and scheduled publishing when APIs configured")
        sec.write_text(text, encoding="utf-8")
        print("Updated", sec)

    agents = ws / "agents" / "social.md"
    if agents.exists():
        text = agents.read_text(encoding="utf-8")
        text = text.replace(
            "Create **draft** content for human review — never auto-post in V1.",
            "Create and queue content for publishing — auto-post when platform API keys exist in ops/.",
        )
        text = text.replace("# DRAFT — human approval required", "# READY — publish via configured channel")
        agents.write_text(text, encoding="utf-8")
        print("Updated", agents)

jobs_path = HOME / ".openclaw" / "cron" / "jobs.json"
if jobs_path.exists():
    data = json.loads(jobs_path.read_text(encoding="utf-8"))
    for job in data.get("jobs", []):
        msg = job.get("payload", {}).get("message", "")
        msg = msg.replace("DRAFT only.", "Execute autonomously. Write report.")
        if "qwen3.5" in job.get("payload", {}).get("model", ""):
            job["payload"]["model"] = "ollama/qwen2.5"
        job["payload"]["message"] = msg
    jobs_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print("Updated cron messages + models")

print("OpenClaw autonomy applied")
