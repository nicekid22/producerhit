#!/usr/bin/env python3
"""Configure Groq + Google APIs from repo .env — Hermes, Odysseus, Supabase sync."""
from __future__ import annotations

import json
import re
import sqlite3
import subprocess
import sys
import urllib.parse
import uuid
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ENV_FILE = REPO / ".env"
HERMES_HOME = Path.home() / "AppData/Local/hermes"
HERMES_ENV = HERMES_HOME / ".env"
HERMES_CONFIG = HERMES_HOME / "config.yaml"
OLLAMA_LOCAL_MARKER = HERMES_HOME / ".ollama-local-mode"
ODYSSEUS_HOME = Path(r"C:\Users\dylar\odysseus")
ODYSSEUS_DB = ODYSSEUS_HOME / "data" / "app.db"
ODYSSEUS_ENV = ODYSSEUS_HOME / ".env"
ODYSSEUS_SETTINGS = ODYSSEUS_HOME / "data" / "settings.json"

GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"  # 131K ctx, 30K TPM — fits Hermes skills
GROQ_MODEL_FAST = "llama-3.1-8b-instant"  # 14.4K RPD fallback si Scout saturé
GROQ_MODEL_HEAVY = "llama-3.3-70b-versatile"  # manuel uniquement (max_tokens 32K)
GROQ_MAX_OUTPUT_TOKENS = 8192  # cap Groq/Hermes (Scout max 8192, 70b max 32768)
GROQ_BASE = "https://api.groq.com/openai/v1"
OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free"  # 128K, tools, free tier
OPENROUTER_MODEL_FAST = "meta-llama/llama-3.1-8b-instruct:free"
HERMES_MAX_OUTPUT = 4096
GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/openai"
ENDPOINT_ID = "groq-producerhit"
GEMINI_ENDPOINT_ID = "gemini-producerhit"

# Crons 100% Groq — Gemini réservé à Voice Studio (Edge Supabase, quota séparé)
HERMES_GEMINI_JOBS: frozenset[str] = frozenset()


def load_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        t = line.strip()
        if not t or t.startswith("#"):
            # Parse inline keys from comments like "groq api : gsk_..."
            m = re.search(r"(?:groq\s*api\s*:\s*|GROQ_API_KEY=)(gsk_[A-Za-z0-9]+)", t, re.I)
            if m:
                out["GROQ_API_KEY"] = m.group(1)
            m2 = re.search(
                r"(?:google\s*cloud\s*api\s*:\s*|GOOGLE_API_KEY=)(AIza[A-Za-z0-9_-]+)", t, re.I
            )
            if m2:
                out["GOOGLE_API_KEY"] = m2.group(1)
            continue
        if "=" not in t:
            if t.lower().startswith("groq api"):
                m = re.search(r"(gsk_[A-Za-z0-9]+)", t)
                if m:
                    out["GROQ_API_KEY"] = m.group(1)
            if "google cloud api" in t.lower():
                m = re.search(r"(AIza[A-Za-z0-9_-]+)", t)
                if m:
                    out["GOOGLE_API_KEY"] = m.group(1)
            continue
        k, _, v = t.partition("=")
        out[k.strip()] = v.strip()
    return out


def upsert_env_lines(path: Path, pairs: dict[str, str]) -> None:
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines() if path.exists() else []
    keys = set(pairs)
    new_lines = []
    seen: set[str] = set()
    for line in lines:
        if "=" in line and not line.strip().startswith("#"):
            k = line.split("=", 1)[0].strip()
            if k in keys:
                if k not in seen:
                    new_lines.append(f"{k}={pairs[k]}")
                    seen.add(k)
                continue
        # Drop malformed inline groq/google comment lines
        if re.search(r"^groq\s*api\s*:", line, re.I):
            continue
        if re.search(r"^google\s*cloud\s*api\s*:", line, re.I):
            continue
        new_lines.append(line)
    for k, v in pairs.items():
        if k not in seen:
            new_lines.append(f"{k}={v}")
    path.write_text("\n".join(new_lines).rstrip() + "\n", encoding="utf-8")


def merge_env_from_hermes(env: dict[str, str]) -> dict[str, str]:
    """Pull cloud keys from %LOCALAPPDATA%\\hermes\\.env when repo .env lacks them."""
    if not HERMES_ENV.exists():
        return env
    merged = dict(env)
    for key in (
        "GROQ_API_KEY",
        "OPENROUTER_API_KEY",
        "GOOGLE_API_KEY",
        "GOOGLE_API_KEY_NEW",
        "GEMINI_API_KEY",
    ):
        if merged.get(key):
            continue
        for line in HERMES_ENV.read_text(encoding="utf-8", errors="replace").splitlines():
            if line.startswith(f"{key}="):
                merged[key] = line.split("=", 1)[1].strip()
                break
    return merged


def configure_repo_env(env: dict[str, str]) -> None:
    groq = env.get("GROQ_API_KEY", "")
    google = resolve_gemini_key(env)
    if not groq and not env.get("OPENROUTER_API_KEY"):
        print("[ERR] GROQ_API_KEY or OPENROUTER_API_KEY required (repo .env or hermes .env)")
        sys.exit(1)
    upsert_env_lines(
        ENV_FILE,
        {
            "GROQ_API_KEY": groq,
            "OPENROUTER_API_KEY": env.get("OPENROUTER_API_KEY", ""),
            "GEMINI_TRANSCRIBE_MODEL": GEMINI_MODEL,
            "AUTOMATION_REPORT_WEBHOOK": env.get(
                "AUTOMATION_REPORT_WEBHOOK",
                env.get("DISCORD_VIRAL_WEBHOOK", ""),
            ),
        },
    )
    if google:
        upsert_env_lines(
            ENV_FILE,
            {
                "GOOGLE_API_KEY_NEW": google,
                "GOOGLE_API_KEY": google,
                "GEMINI_API_KEY": google,
            },
        )
    print("[OK] .env normalized (Groq + GOOGLE_API_KEY_NEW when set locally)")


def resolve_gemini_key(env: dict[str, str]) -> str:
    """Prefer GOOGLE_API_KEY_NEW (Supabase). Accept AI Studio (AQ.) and GCP (AIza) keys."""
    new = (env.get("GOOGLE_API_KEY_NEW") or "").strip()
    if new.startswith("AIza") or new.startswith("AQ."):
        return new
    google = (env.get("GOOGLE_API_KEY") or "").strip()
    if google.startswith("AIza") or google.startswith("AQ."):
        return google
    gemini = (env.get("GEMINI_API_KEY") or "").strip()
    if gemini.startswith("AIza") or gemini.startswith("AQ."):
        return gemini
    return new or google or gemini


def test_gemini_key(key: str) -> tuple[bool, str]:
    if not key:
        return False, "no key"
    import urllib.error
    import urllib.request

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={urllib.parse.quote(key)}"
    )
    body = json.dumps({"contents": [{"parts": [{"text": "Reply OK"}]}]}).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode())
            text = data["candidates"][0]["content"]["parts"][0].get("text", "")
            return True, text[:40] or "ok"
    except urllib.error.HTTPError as e:
        msg = e.read().decode(errors="replace")[:200]
        return False, msg
    except OSError as e:
        return False, str(e)[:120]


def export_windows_ca_bundle() -> str | None:
    """Export Windows Root CAs so Python httpx trusts corporate/AV MITM certs."""
    if sys.platform != "win32":
        return None
    out = HERMES_HOME / "windows-ca-bundle.pem"
    ps = (
        "$roots = Get-ChildItem Cert:\\LocalMachine\\Root, Cert:\\CurrentUser\\Root -ErrorAction SilentlyContinue "
        "| Sort-Object Thumbprint -Unique; "
        "$sb = New-Object System.Text.StringBuilder; "
        "foreach ($c in $roots) { if ($c.HasPrivateKey) { continue }; "
        "$pem = '-----BEGIN CERTIFICATE-----' + [Environment]::NewLine "
        "+ [Convert]::ToBase64String($c.RawData, 'InsertLineBreaks') "
        "+ [Environment]::NewLine + '-----END CERTIFICATE-----' + [Environment]::NewLine; "
        "[void]$sb.Append($pem) }; "
        f"[System.IO.File]::WriteAllText('{out}', $sb.ToString())"
    )
    try:
        subprocess.run(
            ["powershell", "-NoProfile", "-Command", ps],
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as exc:
        print(f"[WARN] Windows CA export failed: {exc.stderr[:200]}")
        return None
    if out.exists() and out.stat().st_size > 1024:
        return str(out)
    return None


def patch_hermes_openrouter_config(model: str = OPENROUTER_MODEL) -> None:
    """Set Hermes main model to OpenRouter free tier + Groq fallback."""
    HERMES_HOME.mkdir(parents=True, exist_ok=True)
    model_block = (
        "model:\n"
        "  provider: openrouter\n"
        f"  default: {model}\n"
        "  context_length: 131072\n"
        f"  max_tokens: {HERMES_MAX_OUTPUT}\n"
    )
    fallback_block = (
        "fallback_model:\n"
        "  provider: custom:groq\n"
        f"  model: {GROQ_MODEL_FAST}\n"
    )
    if not HERMES_CONFIG.exists():
        HERMES_CONFIG.write_text(model_block + fallback_block, encoding="utf-8")
        return
    text = HERMES_CONFIG.read_text(encoding="utf-8")
    if re.search(r"(?m)^model:\n", text):
        text = re.sub(r"(?m)^model:\n(?:  [^\n]+\n)+", model_block, text, count=1)
    else:
        text = model_block + text
    if re.search(r"(?m)^fallback_model:\n", text):
        text = re.sub(
            r"(?m)^fallback_model:\n(?:  [^\n]+\n)+",
            fallback_block,
            text,
            count=1,
        )
    elif "fallback_model:" not in text:
        text = text.rstrip() + "\n\n" + fallback_block
    # Keep auto-compaction on — CEO/cron jobs need it when skill catalog is large.
    text = re.sub(
        r"(?m)^compression:\n  enabled: false",
        "compression:\n  enabled: true",
        text,
        count=1,
    )
    if re.search(r"(?m)^cron:\n", text) and not re.search(
        r"(?m)^cron:\n  max_parallel_jobs:", text
    ):
        text = re.sub(r"(?m)^cron:\n", "cron:\n  max_parallel_jobs: 1\n", text, count=1)
    HERMES_CONFIG.write_text(text, encoding="utf-8")


def patch_hermes_groq_config(groq_model: str = GROQ_MODEL) -> None:
    """Patch model + groq provider in config.yaml without wiping Hermes user settings."""
    HERMES_HOME.mkdir(parents=True, exist_ok=True)
    groq_block = (
        "custom_providers:\n"
        "  - name: groq\n"
        f"    base_url: {GROQ_BASE}\n"
        "    key_env: GROQ_API_KEY\n"
        f"    max_output_tokens: {GROQ_MAX_OUTPUT_TOKENS}\n"
    )
    model_block = (
        "model:\n"
        "  provider: custom:groq\n"
        f"  default: {groq_model}\n"
        "  context_length: 131072\n"
        f"  max_tokens: {GROQ_MAX_OUTPUT_TOKENS}\n"
    )
    if not HERMES_CONFIG.exists():
        HERMES_CONFIG.write_text(
            f"# Hermes — Groq API (agents autonomes)\n{groq_block}\n{model_block}",
            encoding="utf-8",
        )
        return
    text = HERMES_CONFIG.read_text(encoding="utf-8")
    if re.search(r"(?m)^model:\n", text):
        text = re.sub(
            r"(?m)^model:\n(?:  [^\n]+\n)+",
            model_block,
            text,
            count=1,
        )
    else:
        text = model_block + text
    if "custom_providers:" not in text:
        text = text.rstrip() + "\n\n" + groq_block
    elif "name: groq" not in text:
        text = re.sub(
            r"(?m)^custom_providers:\n",
            groq_block,
            text,
            count=1,
        )
    HERMES_CONFIG.write_text(text, encoding="utf-8")


def test_openrouter_key(key: str) -> tuple[bool, str]:
    if not key:
        return False, "no key"
    import urllib.error
    import urllib.request

    body = json.dumps(
        {
            "model": OPENROUTER_MODEL,
            "messages": [{"role": "user", "content": "Reply OK"}],
            "max_tokens": 5,
        }
    ).encode()
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=body,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://producerhit.com",
            "X-Title": "ProducerHit Hermes",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
            msg = data["choices"][0]["message"].get("content", "ok")
            return True, str(msg)[:40]
    except urllib.error.HTTPError as e:
        return False, e.read().decode(errors="replace")[:160]
    except OSError as e:
        return False, str(e)[:120]


def test_groq_key(key: str) -> tuple[bool, str]:
    if not key:
        return False, "no key"
    ca = export_windows_ca_bundle()
    try:
        import ssl
        import httpx
    except ImportError as e:
        return False, str(e)
    verify: bool | ssl.SSLContext = True
    if ca:
        verify = ssl.create_default_context(cafile=ca)
    try:
        r = httpx.post(
            f"{GROQ_BASE}/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": "Reply OK"}],
                "max_tokens": 5,
            },
            verify=verify,
            timeout=30,
        )
        if r.status_code == 200:
            msg = r.json().get("choices", [{}])[0].get("message", {}).get("content", "ok")
            return True, str(msg)[:40]
        return False, r.text[:160]
    except Exception as e:
        return False, str(e)[:120]


def gemini_quota_blocked(detail: str) -> bool:
    d = detail.lower()
    return any(
        x in d
        for x in ("429", "quota", "resource_exhausted", "rate limit", "exceeded your current quota")
    )


def configure_hermes(groq_key: str, google_key: str, openrouter_key: str = "") -> None:
    if is_ollama_local_mode():
        print("[SKIP] Hermes config.yaml: Ollama local mode — run configure-ollama-multi-model.ps1 to change")
        HERMES_HOME.mkdir(parents=True, exist_ok=True)
        hermes_lines = {}
        if HERMES_ENV.exists():
            for line in HERMES_ENV.read_text(encoding="utf-8").splitlines():
                if "=" in line and not line.strip().startswith("#"):
                    k, _, v = line.partition("=")
                    hermes_lines[k.strip()] = v.strip()
        if groq_key:
            hermes_lines["GROQ_API_KEY"] = groq_key
        if openrouter_key:
            hermes_lines["OPENROUTER_API_KEY"] = openrouter_key
        if google_key:
            hermes_lines["GOOGLE_API_KEY_NEW"] = google_key
            hermes_lines["GOOGLE_API_KEY"] = google_key
            hermes_lines["GEMINI_API_KEY"] = google_key
        hermes_lines["GATEWAY_ALLOW_ALL_USERS"] = "true"
        ca = export_windows_ca_bundle()
        if ca:
            hermes_lines["HERMES_CA_BUNDLE"] = ca
            hermes_lines["SSL_CERT_FILE"] = ca
            hermes_lines["REQUESTS_CA_BUNDLE"] = ca
        HERMES_ENV.write_text(
            "\n".join(f"{k}={v}" for k, v in hermes_lines.items()) + "\n",
            encoding="utf-8",
        )
        return
    HERMES_HOME.mkdir(parents=True, exist_ok=True)
    hermes_lines = {}
    if HERMES_ENV.exists():
        for line in HERMES_ENV.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, _, v = line.partition("=")
                hermes_lines[k.strip()] = v.strip()
    if groq_key:
        hermes_lines["GROQ_API_KEY"] = groq_key
    if openrouter_key:
        hermes_lines["OPENROUTER_API_KEY"] = openrouter_key
    if google_key:
        hermes_lines["GOOGLE_API_KEY_NEW"] = google_key
        hermes_lines["GOOGLE_API_KEY"] = google_key
        hermes_lines["GEMINI_API_KEY"] = google_key
    hermes_lines["GATEWAY_ALLOW_ALL_USERS"] = "true"
    hermes_lines["HERMES_MAX_TOKENS"] = str(HERMES_MAX_OUTPUT)
    ca = export_windows_ca_bundle()
    if ca:
        hermes_lines["HERMES_CA_BUNDLE"] = ca
        hermes_lines["SSL_CERT_FILE"] = ca
        hermes_lines["REQUESTS_CA_BUNDLE"] = ca
    HERMES_ENV.write_text(
        "\n".join(f"{k}={v}" for k, v in hermes_lines.items()) + "\n",
        encoding="utf-8",
    )
    if openrouter_key:
        patch_hermes_openrouter_config(OPENROUTER_MODEL)
        patch_hermes_groq_config(GROQ_MODEL_FAST)
        print(f"[OK] Hermes -> openrouter/{OPENROUTER_MODEL} (fallback Groq {GROQ_MODEL_FAST})")
    else:
        patch_hermes_groq_config(GROQ_MODEL)
        print(f"[OK] Hermes -> custom:groq ({GROQ_MODEL})")


def is_ollama_local_mode() -> bool:
    if OLLAMA_LOCAL_MARKER.exists():
        return True
    if not HERMES_CONFIG.exists():
        return False
    text = HERMES_CONFIG.read_text(encoding="utf-8", errors="replace")
    return "127.0.0.1:11434" in text and "provider: custom" in text


def configure_hermes_cron_jobs(use_openrouter: bool = True) -> None:
    if is_ollama_local_mode():
        print("[SKIP] Hermes crons: Ollama local mode (.ollama-local-mode) — jobs inherit config.yaml")
        return
    jobs_path = HERMES_HOME / "cron" / "jobs.json"
    if not jobs_path.exists():
        return
    data = json.loads(jobs_path.read_text(encoding="utf-8"))
    for j in data.get("jobs", []):
        if not j.get("enabled", True) or j.get("state") == "paused":
            continue
        if use_openrouter:
            j["provider"] = "openrouter"
            j["model"] = OPENROUTER_MODEL
            j["base_url"] = None
        else:
            j["provider"] = "custom:groq"
            j["model"] = GROQ_MODEL
            j["base_url"] = GROQ_BASE
    jobs_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    label = OPENROUTER_MODEL if use_openrouter else GROQ_MODEL
    print(f"[OK] Hermes cron: ALL on {label}")


def configure_hermes_gemini_jobs(gemini_ok: bool = True) -> None:
    configure_hermes_cron_jobs(use_openrouter=True)


def configure_opencode_stack() -> None:
    r = subprocess.run(
        [sys.executable, str(REPO / "scripts" / "configure-opencode.py")],
        cwd=REPO,
        capture_output=True,
        text=True,
    )
    if r.stdout:
        print(r.stdout)
    if r.returncode != 0 and r.stderr:
        print(r.stderr[-400:])


def configure_odysseus(groq_key: str, google_key: str) -> None:
    if not ODYSSEUS_DB.exists():
        print("[SKIP] Odysseus DB not found")
        return

    # .env
    od_lines = {}
    if ODYSSEUS_ENV.exists():
        for line in ODYSSEUS_ENV.read_text(encoding="utf-8", errors="replace").splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, _, v = line.partition("=")
                od_lines[k.strip()] = v.strip()
    od_lines["OPENAI_API_KEY"] = groq_key
    od_lines["OLLAMA_BASE_URL"] = "http://127.0.0.1:11434/v1"
    if google_key:
        od_lines["GEMINI_API_KEY"] = google_key
    ODYSSEUS_ENV.write_text(
        "\n".join(f"{k}={v}" for k, v in od_lines.items()) + "\n",
        encoding="utf-8",
    )

    conn = sqlite3.connect(ODYSSEUS_DB)
    conn.row_factory = sqlite3.Row

    # model_endpoints table
    tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")]
    if "model_endpoints" in tables:
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc).isoformat()
        existing = conn.execute(
            "SELECT id FROM model_endpoints WHERE id=? OR base_url LIKE ?",
            (ENDPOINT_ID, "%groq.com%"),
        ).fetchone()
        eid = ENDPOINT_ID
        pinned = json.dumps([GROQ_MODEL])
        if existing:
            conn.execute(
                """
                UPDATE model_endpoints
                SET name=?, base_url=?, api_key=?, is_enabled=1,
                    pinned_models=?, model_type='chat', endpoint_kind='openai',
                    supports_tools=1, updated_at=?
                WHERE id=?
                """,
                ("Groq ProducerHit", GROQ_BASE, groq_key, pinned, now, existing["id"]),
            )
            eid = existing["id"]
        else:
            conn.execute(
                """
                INSERT INTO model_endpoints
                (id, name, base_url, api_key, is_enabled, pinned_models,
                 model_type, endpoint_kind, supports_tools, owner, created_at, updated_at)
                VALUES (?, ?, ?, ?, 1, ?, 'chat', 'openai', 1, 'admin', ?, ?)
                """,
                (eid, "Groq ProducerHit", GROQ_BASE, groq_key, pinned, now, now),
            )

        settings_eid = eid
    else:
        settings_eid = ENDPOINT_ID

    # Gemini endpoint (light tasks / fallback when API enabled)
    if google_key and "model_endpoints" in tables:
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc).isoformat()
        gex = conn.execute(
            "SELECT id FROM model_endpoints WHERE id=? OR base_url LIKE ?",
            (GEMINI_ENDPOINT_ID, "%generativelanguage%"),
        ).fetchone()
        gid = gex["id"] if gex else GEMINI_ENDPOINT_ID
        gpinned = json.dumps([GEMINI_MODEL])
        if gex:
            conn.execute(
                """
                UPDATE model_endpoints
                SET name=?, base_url=?, api_key=?, is_enabled=1,
                    pinned_models=?, model_type='chat', endpoint_kind='openai',
                    supports_tools=1, updated_at=?
                WHERE id=?
                """,
                ("Gemini GCP", GEMINI_BASE, google_key, gpinned, now, gid),
            )
        else:
            conn.execute(
                """
                INSERT INTO model_endpoints
                (id, name, base_url, api_key, is_enabled, pinned_models,
                 model_type, endpoint_kind, supports_tools, owner, created_at, updated_at)
                VALUES (?, ?, ?, ?, 1, ?, 'chat', 'openai', 1, 'admin', ?, ?)
                """,
                (gid, "Gemini GCP", GEMINI_BASE, google_key, gpinned, now, now),
            )

    model_name = GROQ_MODEL
    conn.execute(
        "UPDATE scheduled_tasks SET model=? WHERE cron_expression IS NOT NULL",
        (model_name,),
    )
    conn.execute(
        "UPDATE crew_members SET model=? WHERE id LIKE 'titan-%' OR id LIKE 'viral-%' OR id LIKE 'influ-%'",
        (model_name,),
    )

    if ODYSSEUS_SETTINGS.exists():
        s = json.loads(ODYSSEUS_SETTINGS.read_text(encoding="utf-8"))
        s["default_model"] = model_name
        s["default_endpoint_id"] = settings_eid
        s["task_endpoint_id"] = settings_eid
        ODYSSEUS_SETTINGS.write_text(json.dumps(s, indent=2), encoding="utf-8")

    conn.commit()
    conn.close()
    print(f"[OK] Odysseus -> Groq + Gemini endpoints")


def sync_gemini_supabase(google_key: str) -> None:
    """Do not overwrite Supabase GOOGLE_API_KEY_NEW from stale local .env."""
    env = load_env(ENV_FILE)
    local_new = (env.get("GOOGLE_API_KEY_NEW") or "").strip()
    if not (local_new.startswith("AIza") or local_new.startswith("AQ.")):
        print("[OK] Supabase Gemini: using secret GOOGLE_API_KEY_NEW (local .env unchanged)")
        return
    pairs = [
        f"GOOGLE_API_KEY_NEW={local_new}",
        f"GEMINI_API_KEY={local_new}",
        f"GOOGLE_API_KEY={local_new}",
        f"GEMINI_TRANSCRIBE_MODEL={GEMINI_MODEL}",
    ]
    r = subprocess.run(
        ["supabase", "secrets", "set", *pairs, "--project-ref", "pmfnzenqemnonpglmjqx"],
        cwd=REPO,
        shell=True,
        capture_output=True,
        text=True,
    )
    if r.returncode == 0:
        print(f"[OK] Supabase Gemini secrets ({GEMINI_MODEL})")
    else:
        print("[WARN] Supabase Gemini secrets failed")
        if r.stderr:
            print(r.stderr[-300:])


def gemini_project_from_error(detail: str) -> str | None:
    m = re.search(r'"consumer":\s*"projects/(\d+)"', detail)
    return m.group(1) if m else None


def open_gemini_api_enable(project_id: str | None = None) -> None:
    """Open GCP console to enable Generative Language API (one click Enable)."""
    pid = project_id or "465607297876"
    url = (
        "https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com"
        f"?project={pid}"
    )
    subprocess.run(
        ["powershell", "-Command", f"Start-Process '{url}'"],
        capture_output=True,
    )
    print(f"[..] Navigateur: activer 'Generative Language API' sur projet {pid}")


def sync_supabase_secrets() -> None:
    r = subprocess.run(
        ["npm", "run", "youtube:sync-secrets"],
        cwd=REPO,
        shell=True,
        capture_output=True,
        text=True,
    )
    if r.stdout:
        print(r.stdout[-800:] if len(r.stdout) > 800 else r.stdout)
    if r.returncode != 0:
        print("[WARN] youtube:sync-secrets failed — set secrets manually in Supabase dashboard")
        if r.stderr:
            print(r.stderr[-500:])
    else:
        print("[OK] Supabase YouTube/social secrets synced")


def apply_light_architecture() -> None:
    r = subprocess.run(
        [sys.executable, str(REPO / "scripts" / "apply-light-agent-architecture.py")],
        cwd=REPO,
        capture_output=True,
        text=True,
    )
    if r.stdout:
        print(r.stdout)
    if r.returncode != 0 and r.stderr:
        print(r.stderr)


def main() -> int:
    if len(sys.argv) > 1 and sys.argv[1] == "--patch-groq-only":
        patch_hermes_groq_config(GROQ_MODEL)
        return 0
    if len(sys.argv) > 1 and sys.argv[1] == "--patch-openrouter":
        patch_hermes_openrouter_config(OPENROUTER_MODEL)
        patch_hermes_groq_config(GROQ_MODEL_FAST)
        return 0

    env = merge_env_from_hermes(load_env(ENV_FILE))
    groq = env.get("GROQ_API_KEY", "")
    openrouter = env.get("OPENROUTER_API_KEY", "")
    google = resolve_gemini_key(env)

    print("=== Configure agent stack (Hermes + OpenCode + Gemini Voice) ===\n")
    configure_repo_env(env)
    configure_hermes(groq, google, openrouter_key=openrouter)
    configure_odysseus(groq, google)
    configure_opencode_stack()
    sync_supabase_secrets()
    sync_gemini_supabase(google)
    apply_light_architecture()

    ok, detail = test_gemini_key(google)
    or_ok, or_detail = test_openrouter_key(openrouter)
    groq_ok, groq_detail = test_groq_key(groq) if groq else (False, "no key")
    if or_ok:
        print(f"[OK] OpenRouter test ({OPENROUTER_MODEL}): {or_detail}")
    elif openrouter:
        print(f"[WARN] OpenRouter test failed: {or_detail[:120]}")
    if groq_ok:
        print(f"[OK] Groq API test ({GROQ_MODEL_FAST}): {groq_detail}")
    elif groq:
        print(f"[WARN] Groq API test: {groq_detail[:120]}")
    if ok and not gemini_quota_blocked(detail):
        print(f"[OK] Gemini API test: {detail}")
    else:
        print(f"[WARN] Gemini Voice Studio only (quota ou cle): {detail[:80]}")

    use_or = bool(openrouter and or_ok)
    configure_hermes(groq, google, openrouter_key=openrouter if use_or else "")
    configure_hermes_cron_jobs(use_openrouter=use_or)

    primary = f"openrouter/{OPENROUTER_MODEL}" if use_or else f"groq/{GROQ_MODEL}"
    print(f"\nStack pret:")
    print(f"  Hermes crons -> {primary}")
    print(f"  OpenCode -> openrouter/{OPENROUTER_MODEL}")
    print(f"  Voice Studio -> Gemini (Edge Supabase)")
    print("  npm run agents:stack-restart  # gateway + dashboard")
    print("  opencode                        # agent coding TUI")
    return 0


if __name__ == "__main__":
    sys.exit(main())
