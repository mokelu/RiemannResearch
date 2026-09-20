"""Riemann core-loop dashboard: local web UI that runs the research loop.

    uv run python dashboard.py        -> http://127.0.0.1:8010

The page assembles a RunConfig, POSTs it here, the loop runs in a background
thread, and the page polls progress until the artifact lands. The same
config JSON can be exported and re-run headlessly with:

    uv run python optimize.py --config run.json
"""

from __future__ import annotations

import threading
import uuid
from datetime import datetime, timezone

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse

from config import RunConfig, DEFAULTS
from optimize import run, save_artifact

app = FastAPI(title="Riemann Core Loop")
RUNS: dict[str, dict] = {}


@app.get("/")
def index():
    return FileResponse("static/dashboard.html")


@app.get("/api/defaults")
def defaults():
    return DEFAULTS


@app.post("/api/run")
def start_run(config: dict):
    cfg = RunConfig.from_dict(config)
    run_id = uuid.uuid4().hex[:8]
    entry = {
        "id": run_id,
        "status": "running",
        "config": cfg.to_dict(),
        "progress": {"trials_done": 0, "trials_total": cfg.trials, "survivors": 0},
        "artifact": None,
        "error": None,
        "started_at": datetime.now(timezone.utc).isoformat(),
    }
    RUNS[run_id] = entry

    def work():
        try:
            artifact = run(cfg, progress_cb=lambda p: entry.update(progress=p))
            save_artifact(artifact)
            entry["artifact"] = artifact
            entry["status"] = "done"
        except Exception as exc:  # surface failures in the UI, don't kill the server
            entry["status"] = "error"
            entry["error"] = f"{type(exc).__name__}: {exc}"

    threading.Thread(target=work, daemon=True).start()
    return {"run_id": run_id}


@app.get("/api/run/{run_id}")
def get_run(run_id: str):
    entry = RUNS.get(run_id)
    if not entry:
        raise HTTPException(404, "unknown run")
    return JSONResponse(entry)


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8010, log_level="warning")
