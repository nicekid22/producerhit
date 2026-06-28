"""Mini serveur dashboard Hermes (quand npm build echoue)."""
import json
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

HERMES = Path.home() / "AppData" / "Local" / "hermes"
JOBS = HERMES / "cron" / "jobs.json"
WEB = Path(__file__).resolve().parent / "hermes-dashboard"
PORT = 9119


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(WEB), **k)

    def do_GET(self):
        if self.path == "/api/jobs":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            if JOBS.exists():
                self.wfile.write(JOBS.read_bytes())
            else:
                self.wfile.write(b'{"jobs":[]}')
            return
        return super().do_GET()


if __name__ == "__main__":
    print(f"Hermes dashboard: http://127.0.0.1:{PORT}")
    HTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
