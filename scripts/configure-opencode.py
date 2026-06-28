#!/usr/bin/env python3
"""Configure OpenCode CLI — OpenRouter free + Groq fallback (ProducerHit stack)."""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ENV_FILE = REPO / ".env"
HERMES_ENV = Path.home() / "AppData/Local/hermes/.env"

OPENCODE_AUTH = Path.home() / ".local/share/opencode/auth.json"
OPENCODE_GLOBAL = Path.home() / ".config/opencode/opencode.json"
OPENCODE_PROJECT = REPO / "opencode.json"

OPENROUTER_MODEL = "openrouter/free"  # route auto vers modèles free dispo
OPENROUTER_MODEL_FAST = "meta-llama/llama-3.1-8b-instruct:free"
OPENROUTER_MODEL_CODER = "qwen/qwen3-coder:free"
OPENCODE_FREE_MODEL = "opencode/mimo-v2.5-free"  # free inclus OpenCode
GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"


def load_env() -> dict[str, str]:
    out: dict[str, str] = {}
    for path in (ENV_FILE, HERMES_ENV):
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
            t = line.strip()
            if not t or t.startswith("#") or "=" not in t:
                continue
            k, _, v = t.partition("=")
            out[k.strip()] = v.strip()
    return out


def opencode_config(openrouter_key: str, groq_key: str) -> dict:
    cfg: dict = {
        "$schema": "https://opencode.ai/config.json",
        "model": OPENCODE_FREE_MODEL,
        "small_model": OPENCODE_FREE_MODEL,
        "provider": {
            "opencode": {
                "models": {
                    OPENCODE_FREE_MODEL: {},
                    "opencode/deepseek-v4-flash-free": {},
                    "opencode/nemotron-3-ultra-free": {},
                }
            },
            "openrouter": {
                "models": {
                    OPENROUTER_MODEL: {},
                    OPENROUTER_MODEL_FAST: {},
                    OPENROUTER_MODEL_CODER: {},
                }
            },
        },
        "instructions": ["AGENTS.md"],
    }
    if groq_key:
        cfg["provider"]["groq"] = {
            "models": {
                GROQ_MODEL: {},
                "llama-3.1-8b-instant": {},
                "llama-3.3-70b-versatile": {},
            }
        }
    if openrouter_key:
        cfg["provider"]["openrouter"]["options"] = {
            "apiKey": "{env:OPENROUTER_API_KEY}"
        }
    return cfg


def write_auth(openrouter_key: str, groq_key: str) -> None:
    OPENCODE_AUTH.parent.mkdir(parents=True, exist_ok=True)
    auth: dict = {}
    if OPENCODE_AUTH.exists():
        try:
            auth = json.loads(OPENCODE_AUTH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            auth = {}
    if openrouter_key:
        auth["openrouter"] = {"type": "api", "key": openrouter_key}
    if groq_key:
        auth["groq"] = {"type": "api", "key": groq_key}
    OPENCODE_AUTH.write_text(json.dumps(auth, indent=2) + "\n", encoding="utf-8")


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def ensure_opencode_installed() -> bool:
    try:
        r = subprocess.run(
            ["opencode", "--version"],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if r.returncode == 0:
            ver = (r.stdout or r.stderr).strip().splitlines()[0]
            print(f"[OK] OpenCode {ver}")
            return True
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    print("[..] Installing OpenCode (npm global, --use-system-ca)...")
    env = os.environ.copy()
    env["NODE_OPTIONS"] = "--use-system-ca"
    r = subprocess.run(
        ["npm", "install", "-g", "opencode-ai"],
        env=env,
        capture_output=True,
        text=True,
        shell=True,
    )
    if r.returncode != 0:
        print(f"[ERR] npm install opencode-ai failed: {(r.stderr or r.stdout)[-300:]}")
        return False
    print("[OK] OpenCode installed")
    return True


def main() -> int:
    env = load_env()
    or_key = env.get("OPENROUTER_API_KEY", "")
    groq_key = env.get("GROQ_API_KEY", "")

    print("=== Configure OpenCode ===\n")
    if not ensure_opencode_installed():
        return 1
    if not or_key and not groq_key:
        print("[ERR] Need OPENROUTER_API_KEY or GROQ_API_KEY in .env or %LOCALAPPDATA%\\hermes\\.env")
        return 1

    cfg = opencode_config(or_key, groq_key)
    write_auth(or_key, groq_key)
    write_json(OPENCODE_GLOBAL, cfg)
    write_json(OPENCODE_PROJECT, cfg)

    print(f"[OK] Auth -> {OPENCODE_AUTH}")
    print(f"[OK] Global config -> {OPENCODE_GLOBAL}")
    print(f"[OK] Project config -> {OPENCODE_PROJECT}")
    if or_key:
        print(f"[OK] Default model: {OPENCODE_FREE_MODEL} (+ openrouter/free backup)")
    print("\nUsage:")
    print("  cd repo && opencode              # TUI agent")
    print("  opencode run \"your task\"         # one-shot")
    print("  opencode providers list          # verify keys")
    return 0


if __name__ == "__main__":
    sys.exit(main())
