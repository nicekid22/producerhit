#!/usr/bin/env python3
"""Seed INFLU Influencer Marketing crew on Odysseus."""
from __future__ import annotations

import json
import os
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

ODYSSEUS_HOME = Path(os.environ.get("ODYSSEUS_HOME", r"C:\Users\dylar\odysseus"))
DATA_DIR = ODYSSEUS_HOME / "data"
DOCS_DIR = DATA_DIR / "personal_docs" / "influencer-marketing"
SCRIPTS_ROOT = Path(__file__).resolve().parent
TEMPLATES = SCRIPTS_ROOT / "templates" / "workspace"
OWNER = os.environ.get("ODYSSEUS_ADMIN_USER", "admin").strip() or "admin"
OLLAMA_URL = "http://127.0.0.1:11434/v1"
MODEL = "qwen2.5"
TZ = "Europe/Paris"

OUTPUT_RULE = (
    "CRITICAL: Always finish with a complete markdown report. Never empty response. "
    "If search fails, use memory and web_fetch on known URLs."
)

AUTONOMY = (
    "Fully autonomous influencer marketing for ProducerHit. Send partnership emails via "
    "email tools when configured. Choose offer tiers from OFFER.md yourself. Learn and "
    "update CRM. No human approval for outreach drafts or sends."
)

TOOLS = json.dumps([
    "web_search", "web_fetch", "manage_memory", "manage_skills", "manage_documents",
    "create_document", "update_document", "manage_tasks", "grep", "read_file",
    "list_email_accounts", "send_email", "list_emails", "read_email", "reply_to_email",
])

AGENTS = [
    ("influ-strategist", "INFLU Strategist", "30 9 * * *", "INFLU Strategist Daily",
     "Daily exec: read CRM + reports. Top 3 actions. Update roadmap.md."),
    ("influ-scout-ody", "INFLU Scout", "0 */4 * * *", "INFLU Scout Discovery",
     "Find beatmaker/singer influencers. Update prospects.md and scout report."),
    ("influ-outreach-ody", "INFLU Outreach", "0 10,15 * * 1-5", "INFLU Outreach Send",
     "Send partnership emails to CRM prospects with email. Use OFFER.md tiers. Update CRM."),
    ("influ-followup-ody", "INFLU Followup", "0 11 * * *", "INFLU Followup Sequence",
     "Follow up contacted influencers max 2 times. Update CRM."),
    ("influ-learn-ody", "INFLU Learn", "0 8 * * 0", "INFLU Learn Weekly",
     "Analyze what offers/hooks work. Update learnings.md and skills."),
]


def _copy_docs():
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    for name in ("SOUL.md", "OFFER.md"):
        src = TEMPLATES / name
        if src.exists():
            shutil.copy2(src, DOCS_DIR / name)
    mem = TEMPLATES / "memory"
    if mem.exists():
        dest = DOCS_DIR / "memory"
        dest.mkdir(exist_ok=True)
        for f in mem.iterdir():
            if f.is_file():
                shutil.copy2(f, dest / f.name)


def _seed_db():
    import sys
    sys.path.insert(0, str(ODYSSEUS_HOME))
    from core.database import SessionLocal, CrewMember, ScheduledTask, Session as DbSession, ModelEndpoint
    from src.task_scheduler import compute_next_run

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    db = SessionLocal()
    try:
        ep = db.query(ModelEndpoint).filter(ModelEndpoint.id == "titan-ollama-local").first()
        if not ep:
            ep = ModelEndpoint(
                id="titan-ollama-local",
                name="Ollama Local",
                base_url=OLLAMA_URL,
                api_key="ollama",
                is_enabled=True,
                cached_models=json.dumps([MODEL, "qwen2.5-coder"]),
                endpoint_kind="local",
                supports_tools=True,
                owner=OWNER,
            )
            db.add(ep)

        personality = f"{AUTONOMY} {OUTPUT_RULE}"

        for crew_id, name, cron, task_name, prompt in AGENTS:
            existing = db.query(CrewMember).filter(CrewMember.id == crew_id).first()
            if existing:
                session_id = existing.session_id
            else:
                session_id = str(uuid.uuid4())
                db.add(DbSession(
                    id=session_id, name=name, endpoint_url=OLLAMA_URL, model=MODEL,
                    owner=OWNER, is_important=True, mode="agent", folder="INFLU Marketing",
                    crew_member_id=crew_id, created_at=now, updated_at=now,
                ))
                db.add(CrewMember(
                    id=crew_id, owner=OWNER, name=name, personality=personality,
                    model=MODEL, endpoint_url=OLLAMA_URL, enabled_tools=TOOLS,
                    session_id=session_id, is_active=True, timezone=TZ, sort_order=0,
                ))
                print(f"  crew: {crew_id}")

            if db.query(ScheduledTask).filter(ScheduledTask.name == task_name, ScheduledTask.owner == OWNER).first():
                print(f"  skip task: {task_name}")
                continue

            full_prompt = prompt + " " + OUTPUT_RULE
            next_run = compute_next_run("cron", "09:00", None, None, cron_expression=cron)
            db.add(ScheduledTask(
                id=str(uuid.uuid4()), owner=OWNER, name=task_name, prompt=full_prompt,
                task_type="llm", schedule="cron", cron_expression=cron,
                trigger_type="schedule", next_run=next_run, status="active",
                output_target="session", session_id=session_id, crew_member_id=crew_id,
                model=MODEL, endpoint_url=OLLAMA_URL, max_steps=50,
                notifications_enabled=True,
            ))
            print(f"  task: {task_name}")

        db.commit()
    finally:
        db.close()


def main():
    print("=== INFLU Odysseus seed ===")
    if not (ODYSSEUS_HOME / "data" / "app.db").exists():
        print("ERROR: run Odysseus setup.py first")
        return 1
    _copy_docs()
    _seed_db()
    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
