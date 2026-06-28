#!/usr/bin/env python3
"""Seed TITAN Revenue Command on Odysseus (Team 4).

Run after `python setup.py` inside the Odysseus repo:
  ODYSSEUS_HOME=C:\\Users\\dylar\\odysseus python seed-titan-team.py

Creates crew personas, scheduled tasks, skills, and workspace documents.
"""

from __future__ import annotations

import json
import os
import shutil
import sys
import uuid
from datetime import datetime
from pathlib import Path

ODYSSEUS_HOME = Path(os.environ.get("ODYSSEUS_HOME", r"C:\Users\dylar\odysseus"))
DATA_DIR = ODYSSEUS_HOME / "data"
SKILLS_DIR = DATA_DIR / "skills"
DOCS_DIR = DATA_DIR / "personal_docs" / "titan-revenue"
REPORTS_DIR = DOCS_DIR / "reports" / "daily"
SCRIPTS_ROOT = Path(__file__).resolve().parent
TEMPLATES = SCRIPTS_ROOT / "templates"
OWNER = os.environ.get("ODYSSEUS_ADMIN_USER", "admin").strip() or "admin"
OLLAMA_URL = os.environ.get("TITAN_OLLAMA_URL", "http://127.0.0.1:11434/v1")
MODEL = os.environ.get("TITAN_MODEL", "qwen2.5")
TZ = "Europe/Paris"

TITAN_TOOLS = json.dumps([
    "web_search", "web_fetch", "manage_memory", "manage_skills",
    "manage_documents", "create_document", "update_document",
    "manage_tasks", "trigger_research", "grep", "read_file", "search_chats",
])

ARCHITECT_TOOLS = json.dumps([
    "web_search", "web_fetch", "manage_memory", "manage_skills",
    "manage_documents", "create_document", "manage_tasks",
    "trigger_research", "grep", "read_file", "search_chats",
])

CEO_PERSONALITY = """You are the TITAN Architect — executive intelligence of an autonomous revenue organization.

Mission: maximize revenue, profit, and enterprise value as fast as legally and ethically possible.
You are NOT limited to ProducerHit. Hunt any opportunity with highest ROI.

North Star: Weekly Net Revenue Growth.
Targets: $100,000 MRR then $1,000,000 MRR.

You decide priorities without waiting for humans. You command the TITAN crew:
Radar (market), Proof (validation), Closer (sales), Scale (experiments), Amplify (distribution),
Capital (partnerships), Quant (metrics), Engine (automation).

Every action must increase revenue, profit, users, or strategic advantage.
Measure everything. Kill low-ROI work aggressively. Reinvest into winners.

Use tools — never describe what you would do. Write reports to Documents/titan-revenue/reports/.
Store durable insights with manage_memory. Encode winning playbooks with manage_skills.
You may create follow-up tasks via manage_tasks for other agents.

Never spend production payment keys or run large paid ads without logging in metrics.md first.
You operate autonomously: research, outreach, content, partnerships, experiments, email via configured accounts.
"""

AGENTS = [
    {
        "id": "titan-architect",
        "name": "TITAN Architect",
        "personality": CEO_PERSONALITY,
        "tools": ARCHITECT_TOOLS,
        "cron": "30 7 * * *",
        "task_name": "TITAN Architect Daily",
        "prompt": (
            "Run TITAN Architect daily executive cycle. Read all reports in "
            "Documents/titan-revenue/reports/. Write executive-YYYY-MM-DD.md. "
            "Top 3 revenue actions today. Kill list. Directives for each TITAN agent. "
            "Update Documents/titan-revenue/roadmap.md."
        ),
    },
    {
        "id": "titan-radar",
        "name": "TITAN Radar",
        "personality": (
            "You are TITAN Radar. Autonomously scan global markets for monetizable pain: "
            "AI music, SaaS, creators, affiliate, B2B. Score ROI 1-10. Push >=8 to Proof queue. "
            "ProducerHit is default bet unless data shows higher ROI elsewhere. Use web_search heavily."
        ),
        "tools": TITAN_TOOLS,
        "cron": "*/15 * * * *",
        "task_name": "TITAN Radar Scan",
        "prompt": (
            "15-minute revenue radar. Search buying intent last 7 days. Update "
            "Documents/titan-revenue/opportunities.md and write reports/daily/radar-HHMM.md."
        ),
    },
    {
        "id": "titan-proof",
        "name": "TITAN Proof",
        "personality": (
            "You are TITAN Proof. Kill or validate opportunities fast with evidence. "
            "No hype. GO/KILL/NEEDS_DATA. Move VALIDATED to pipeline.md."
        ),
        "tools": TITAN_TOOLS,
        "cron": "0 * * * *",
        "task_name": "TITAN Proof Validation",
        "prompt": "Validate top 3 unvalidated opportunities. Evidence + verdict. Update pipeline.md.",
    },
    {
        "id": "titan-closer",
        "name": "TITAN Closer",
        "personality": (
            "You are TITAN Closer. Find hot leads ready to pay. Draft outreach — never auto-post. "
            "Focus Suno/Udio complaints, AI beat makers, TikTok creators."
        ),
        "tools": TITAN_TOOLS,
        "cron": "15 * * * *",
        "task_name": "TITAN Closer Pipeline",
        "prompt": "Hourly pipeline push. Hot threads + reply drafts. Update pipeline.md.",
    },
    {
        "id": "titan-scale",
        "name": "TITAN Scale",
        "personality": (
            "You are TITAN Scale. Design high-velocity revenue experiments. "
            "Hypothesis, metric, expected uplift. Autonomously propose — human approves deploy."
        ),
        "tools": TITAN_TOOLS,
        "cron": "0 */3 * * *",
        "task_name": "TITAN Scale Experiments",
        "prompt": "Propose 1-3 experiments. Update Documents/titan-revenue/experiments.md.",
    },
    {
        "id": "titan-amplify",
        "name": "TITAN Amplify",
        "personality": (
            "You are TITAN Amplify. SEO, viral content, distribution leverage at scale. DRAFT only."
        ),
        "tools": TITAN_TOOLS,
        "cron": "0 6 * * *",
        "task_name": "TITAN Amplify Distribution",
        "prompt": "Daily distribution pack: SEO brief, 3 social drafts, 1 partnership pitch.",
    },
    {
        "id": "titan-capital",
        "name": "TITAN Capital",
        "personality": (
            "You are TITAN Capital. Partnerships, affiliate programs, new product bets, M&A-style opportunities."
        ),
        "tools": TITAN_TOOLS,
        "cron": "0 */6 * * *",
        "task_name": "TITAN Capital Deals",
        "prompt": "Scan partnership/affiliate/new-bet opportunities. Update capital.md.",
    },
    {
        "id": "titan-quant",
        "name": "TITAN Quant",
        "personality": (
            "You are TITAN Quant. Measure everything. Rank ROI. Recommend kills autonomously."
        ),
        "tools": TITAN_TOOLS,
        "cron": "0 */4 * * *",
        "task_name": "TITAN Quant Metrics",
        "prompt": "Update metrics.md. Flag low-ROI loops for Architect kill list.",
    },
    {
        "id": "titan-engine",
        "name": "TITAN Engine",
        "personality": (
            "You are TITAN Engine. Automate high-ROI work. Eliminate waste. Propose new scheduled tasks."
        ),
        "tools": TITAN_TOOLS,
        "cron": "0 4 * * *",
        "task_name": "TITAN Engine Automation",
        "prompt": "Automation proposals + kill list. Update automation.md.",
    },
]


def _ensure_dirs():
    for d in (REPORTS_DIR, SKILLS_DIR, DOCS_DIR):
        d.mkdir(parents=True, exist_ok=True)


def _copy_skills():
    src = TEMPLATES / "skills"
    if not src.exists():
        return
    for skill_dir in src.iterdir():
        if skill_dir.is_dir():
            dest = SKILLS_DIR / "revenue" / skill_dir.name
            dest.mkdir(parents=True, exist_ok=True)
            for f in skill_dir.iterdir():
                if f.is_file():
                    shutil.copy2(f, dest / f.name)
            print(f"  skill: revenue/{skill_dir.name}")


def _write_workspace_docs():
    files = {
        "SOUL.md": (
            "# TITAN Revenue Command (Odysseus Team 4)\n\n"
            "North Star: Weekly Net Revenue Growth\n"
            "Targets: 100k MRR -> 1M MRR\n\n"
            "Most autonomous revenue stack. Uses Odysseus agents, skills, memory, scheduled tasks.\n"
        ),
        "opportunities.md": "# Opportunities\n\n| ROI | Title | Status |\n|-----|-------|--------|\n",
        "pipeline.md": "# Pipeline\n\n",
        "experiments.md": "# Experiments\n\n",
        "metrics.md": "# Metrics\n\n",
        "roadmap.md": "# Roadmap (max 5 bets)\n\n1. ProducerHit MRR\n",
        "capital.md": "# Capital / partnerships\n\n",
        "automation.md": "# Automation\n\n",
    }
    for name, body in files.items():
        path = DOCS_DIR / name
        if not path.exists():
            path.write_text(body, encoding="utf-8")
            print(f"  doc: {name}")


def _seed_db():
    sys.path.insert(0, str(ODYSSEUS_HOME))
    os.environ.setdefault("DATABASE_URL", f"sqlite:///{DATA_DIR / 'app.db'}")
    from core.database import SessionLocal, CrewMember, ScheduledTask, Session as DbSession, ModelEndpoint
    from src.task_scheduler import compute_next_run

    db = SessionLocal()
    endpoint_id = ""
    try:
        ep = db.query(ModelEndpoint).filter(ModelEndpoint.base_url == OLLAMA_URL).first()
        if not ep:
            ep_id = "titan-ollama-local"
            ep = ModelEndpoint(
                id=ep_id,
                name="Ollama Local (TITAN)",
                base_url=OLLAMA_URL,
                api_key="ollama",
                is_enabled=True,
                cached_models=json.dumps([MODEL, "qwen2.5", "qwen2.5-coder"]),
                endpoint_kind="local",
                supports_tools=True,
                owner=OWNER,
            )
            db.add(ep)
            print(f"  endpoint: {OLLAMA_URL}")
        else:
            ep_id = ep.id

        for spec in AGENTS:
            existing = db.query(CrewMember).filter(CrewMember.id == spec["id"]).first()
            if existing:
                print(f"  skip crew: {spec['id']}")
                crew_id = existing.id
                session_id = existing.session_id
            else:
                session_id = str(uuid.uuid4())
                sess = DbSession(
                    id=session_id,
                    name=spec["name"],
                    endpoint_url=OLLAMA_URL,
                    model=MODEL,
                    owner=OWNER,
                    is_important=True,
                    mode="agent",
                    folder="TITAN Revenue",
                    crew_member_id=spec["id"],
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                db.add(sess)
                crew = CrewMember(
                    id=spec["id"],
                    owner=OWNER,
                    name=spec["name"],
                    personality=spec["personality"],
                    model=MODEL,
                    endpoint_url=OLLAMA_URL,
                    enabled_tools=spec["tools"],
                    session_id=session_id,
                    is_active=True,
                    timezone=TZ,
                    sort_order=0,
                )
                db.add(crew)
                crew_id = spec["id"]
                print(f"  crew: {spec['id']}")

            task = db.query(ScheduledTask).filter(
                ScheduledTask.owner == OWNER,
                ScheduledTask.name == spec["task_name"],
            ).first()
            if task:
                print(f"  skip task: {spec['task_name']}")
                continue

            next_run = compute_next_run(
                "cron", "09:00", None, None, cron_expression=spec["cron"]
            )
            task = ScheduledTask(
                id=str(uuid.uuid4()),
                owner=OWNER,
                name=spec["task_name"],
                prompt=spec["prompt"],
                task_type="llm",
                schedule="cron",
                cron_expression=spec["cron"],
                trigger_type="schedule",
                next_run=next_run,
                status="active",
                output_target="session",
                session_id=session_id,
                crew_member_id=crew_id,
                model=MODEL,
                endpoint_url=OLLAMA_URL,
                max_steps=40,
                notifications_enabled=True,
            )
            db.add(task)
            print(f"  task: {spec['task_name']} ({spec['cron']})")

        db.commit()
        endpoint_id = ep.id
    finally:
        db.close()

    settings_path = DATA_DIR / "settings.json"
    settings = {}
    if settings_path.exists():
        try:
            settings = json.loads(settings_path.read_text(encoding="utf-8"))
        except Exception:
            settings = {}
    settings["default_model"] = MODEL
    settings["default_endpoint_id"] = endpoint_id
    settings["task_endpoint_id"] = endpoint_id
    settings_path.write_text(json.dumps(settings, indent=2), encoding="utf-8")
    print("  settings.json updated")


def main():
    print("=== TITAN Revenue Command — Odysseus seed ===")
    print(f"Home: {ODYSSEUS_HOME}")
    if not (ODYSSEUS_HOME / "setup.py").exists():
        print("ERROR: Odysseus not found. Clone to ODYSSEUS_HOME first.")
        return 1
    if not (DATA_DIR / "app.db").exists():
        print("ERROR: Run setup.py first (creates database).")
        return 1
    _ensure_dirs()
    _copy_skills()
    _write_workspace_docs()
    _seed_db()
    print("")
    print("Done. Start Odysseus: launch-windows.ps1")
    print("UI: http://127.0.0.1:7000 -> Notes & Tasks -> scheduled TITAN jobs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
