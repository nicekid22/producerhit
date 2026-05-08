import base64
import os
import subprocess
import tempfile
import time
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


OUTPUT_DIR = Path(os.environ.get("HEARTMULA_OUTPUT_DIR", str(Path(__file__).parent / "outputs"))).resolve()
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def _sanitize_tags(tags: str) -> str:
    t = tags.strip().lower()
    t = t.replace(", ", ",")
    parts = [p.strip() for p in t.split(",") if p.strip()]
    parts = [p.replace(" ", "_") for p in parts]
    return ",".join(parts)


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/audio/{file_name}")
def get_audio(file_name: str):
    p = (OUTPUT_DIR / file_name).resolve()
    if not str(p).startswith(str(OUTPUT_DIR)):
        raise HTTPException(status_code=400, detail="Invalid file path")
    if not p.exists():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(p, media_type="audio/mpeg", filename=file_name)


@app.post("/generate")
async def generate(req: Request):
    body = await req.json()
    prompt = str(body.get("prompt", "")).strip()
    seconds_total = int(body.get("duration", 10))
    seconds_total = max(5, min(seconds_total, 60))

    if not prompt:
        raise HTTPException(status_code=400, detail="Missing prompt")

    heartlib_path = os.environ.get("HEARTLIB_PATH", "")
    model_path = os.environ.get("HEARTMULA_MODEL_PATH", "")
    python_bin = os.environ.get("HEARTMULA_PYTHON", "python")
    version = os.environ.get("HEARTMULA_VERSION", "3B")
    lazy_load = os.environ.get("HEARTMULA_LAZY_LOAD", "true").lower() in ("1", "true", "yes")

    if not heartlib_path:
        raise HTTPException(status_code=500, detail="HEARTLIB_PATH is not set")
    if not model_path:
        raise HTTPException(status_code=500, detail="HEARTMULA_MODEL_PATH is not set")

    heartlib_path = str(Path(heartlib_path).resolve())
    script_path = str(Path(heartlib_path) / "examples" / "run_music_generation.py")
    if not Path(script_path).exists():
        raise HTTPException(status_code=500, detail=f"HeartMuLa script not found: {script_path}")

    tags = _sanitize_tags(body.get("tags", "") or "instrumental,loop")
    lyrics = str(body.get("lyrics", "")).strip()
    if not lyrics:
        lyrics = "[Verse]\n(instrumental)\n"

    job_id = uuid.uuid4().hex
    out_file = OUTPUT_DIR / f"heartmula_{job_id}.mp3"

    with tempfile.TemporaryDirectory() as td:
        td_path = Path(td)
        lyrics_file = td_path / "lyrics.txt"
        tags_file = td_path / "tags.txt"
        lyrics_file.write_text(lyrics, encoding="utf-8")
        tags_file.write_text(tags, encoding="utf-8")

        max_audio_length_ms = seconds_total * 1000

        cmd = [
            python_bin,
            script_path,
            f"--model_path={model_path}",
            f"--version={version}",
            f"--lyrics={str(lyrics_file)}",
            f"--tags={str(tags_file)}",
            f"--save_path={str(out_file)}",
            f"--max_audio_length_ms={max_audio_length_ms}",
        ]
        if lazy_load:
            cmd.append("--lazy_load=true")

        start = time.time()
        proc = subprocess.run(
            cmd,
            cwd=heartlib_path,
            capture_output=True,
            text=True,
        )
        elapsed = time.time() - start

        if proc.returncode != 0:
            detail = {
                "message": "HeartMuLa generation failed",
                "returncode": proc.returncode,
                "stdout": proc.stdout[-4000:],
                "stderr": proc.stderr[-4000:],
            }
            raise HTTPException(status_code=500, detail=detail)

    if not out_file.exists():
        raise HTTPException(status_code=500, detail="No output file generated")

    base_url = os.environ.get("HEARTMULA_BASE_URL", "http://localhost:8008")
    audio_url = f"{base_url.rstrip('/')}/audio/{out_file.name}"

    return {
        "audioUrl": audio_url,
        "elapsedSeconds": round(elapsed, 2),
        "tagsUsed": tags,
    }

