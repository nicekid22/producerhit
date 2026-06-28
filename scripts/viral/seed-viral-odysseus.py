#!/usr/bin/env python3
"""Seed VIRAL Content OS crew on Odysseus (aligned with OpenClaw + Hermes)."""
from __future__ import annotations

import json
import os
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

ODYSSEUS_HOME = Path(os.environ.get("ODYSSEUS_HOME", r"C:\Users\dylar\odysseus"))
DATA_DIR = ODYSSEUS_HOME / "data"
DOCS_DIR = DATA_DIR / "personal_docs" / "viral-content"
SCRIPTS_ROOT = Path(__file__).resolve().parent
TEMPLATES = SCRIPTS_ROOT / "templates"
OWNER = os.environ.get("ODYSSEUS_ADMIN_USER", "admin").strip() or "admin"
OLLAMA_URL = "http://127.0.0.1:11434/v1"
MODEL = "qwen2.5"
TZ = "Europe/Paris"

OUTPUT_RULE = (
    "CRITICAL: Always finish with a complete markdown report. Never empty response. "
    "If a tool fails, document it and continue with what you have."
)

BRIEF_SNIPPET = (
    "Mission: viral TikTok/Shorts/Reels content driving traffic to https://www.producerhit.com. "
    "Budget $0 — use ffmpeg pipeline, viral-agent-run scripts, hooks, no paid APIs. "
    "Read Documents/viral-content/BRIEF.md and TOOLKIT.md every run."
)

TOOLS = json.dumps([
    "web_search", "web_fetch", "manage_memory", "manage_skills", "manage_documents",
    "create_document", "update_document", "manage_tasks", "grep", "read_file", "search_chats",
])

AGENTS = [
    ("viral-strategist-ody", "VIRAL Strategist", "30 8 * * *", "VIRAL Strategist Daily",
     "Executive cycle: read reports, update metrics and directives, top 3 traffic actions."),
    ("viral-hooks-ody", "VIRAL Hooks", "0 */2 * * *", "VIRAL Hooks Pack",
     "10 hooks + 5 captions + hashtags. Save to reports/daily/ and memory/hooks.md."),
    ("viral-render-ody", "VIRAL Render", "0 */4 * * *", "VIRAL Render Batch",
     "Document running viral-agent-run pipeline from TOOLKIT.md. Log loop IDs and errors."),
    ("viral-publish-ody", "VIRAL Publish", "0 */6 * * *", "VIRAL Publish Queue",
     "Publish via API scripts or write Reels browser playbook. Update published.md."),
]


def _copy_docs():
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    (DOCS_DIR / "reports" / "daily").mkdir(parents=True, exist_ok=True)
    (DOCS_DIR / "memory").mkdir(parents=True, exist_ok=True)
    for name in ("BRIEF.md", "TOOLKIT.md"):
        src = TEMPLATES / name
        if src.exists():
            shutil.copy2(src, DOCS_DIR / name)
    ws_mem = TEMPLATES / "workspace" / "memory"
    if ws_mem.exists():
        for f in ws_mem.iterdir():
            if f.is_file():
                dest = DOCS_DIR / "memory" / f.name
                if not dest.exists():
                    shutil.copy2(f, dest)


def _seed_db():
    import sys
    sys.path.insert(0, str(ODYSSEUS_HOME))
    from core.database import SessionLocal, CrewMember, ScheduledTask, Session as DbSession, ModelEndpoint
    from src.task_scheduler import compute_next_run

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    db = SessionLocal()
    try:
        ep = db.query(ModelEndpoint).filter(ModelEndpoint.base_url == OLLAMA_URL).first()
        if not ep:
            ep = ModelEndpoint(
                id="viral-ollama-local",
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

        personality = f"{BRIEF_SNIPPET} {OUTPUT_RULE}"

        for crew_id, name, cron, task_name, prompt in AGENTS:
            existing = db.query(CrewMember).filter(CrewMember.id == crew_id).first()
            if existing:
                session_id = existing.session_id
            else:
                session_id = str(uuid.uuid4())
                db.add(DbSession(
                    id=session_id, name=name, endpoint_url=OLLAMA_URL, model=MODEL,
                    owner=OWNER, is_important=True, mode="agent", folder="VIRAL Content",
                    crew_member_id=crew_id, created_at=now, updated_at=now,
                ))
                db.add(CrewMember(
                    id=crew_id, owner=OWNER, name=name, personality=personality,
                    model=MODEL, endpoint_url=OLLAMA_URL, enabled_tools=TOOLS,
                    session_id=session_id, is_active=True, timezone=TZ, sort_order=0,
                ))
                print(f"  crew: {crew_id}")

            if db.query(ScheduledTask).filter(
                ScheduledTask.name == task_name, ScheduledTask.owner == OWNER
            ).first():
                print(f"  skip task: {task_name}")
                continue

            full_prompt = prompt + " " + OUTPUT_RULE + " Read BRIEF.md and TOOLKIT.md in Documents/viral-content/."
            next_run = compute_next_run("cron", "09:00", None, None, cron_expression=cron)
            db.add(ScheduledTask(
                id=str(uuid.uuid4()), owner=OWNER, name=task_name, prompt=full_prompt,
                task_type="llm", schedule="cron", cron_expression=cron,
                trigger_type="schedule", next_run=next_run, status="active",
                output_target="session", session_id=session_id, crew_member_id=crew_id,
                model=MODEL, endpoint_url=OLLAMA_URL, max_steps=45, notifications_enabled=True,
            ))
            print(f"  task: {task_name} ({cron})")

        db.commit()
    finally:
        db.close()


def main():
    print("=== VIRAL Content OS — Odysseus seed ===")
    if not (ODYSSEUS_HOME / "setup.py").exists():
        print("ERROR: Odysseus not found at", ODYSSEUS_HOME)
        return 1
    if not (DATA_DIR / "app.db").exists():
        print("ERROR: Run Odysseus setup.py first")
        return 1
    _copy_docs()
    _seed_db()
    print("Done. UI: http://127.0.0.1:7000 -> VIRAL Content folder")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
