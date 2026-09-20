"""Riemann core-loop dashboard: local web UI that runs the research loop.

    uv run python dashboard.py        -> http://127.0.0.1:8010

The page assembles a RunConfig, POSTs it here, the loop runs in a background
thread, and the page polls progress until the artifact lands. The same
config JSON can be exported and re-run headlessly with:

    uv run python optimize.py --config run.json
"""

from __future__ import annotations

import json
import re
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from config import RunConfig, DEFAULTS
from optimize import run, save_artifact

app = FastAPI(title="Riemann Core Loop")
RUNS: dict[str, dict] = {}
ARTIFACTS = Path("artifacts")


@app.get("/")
def index():
    return FileResponse("static/dashboard.html")


@app.get("/notebook")
def notebook():
    return FileResponse("static/notebook.html")


@app.get("/api/artifacts")
def list_artifacts():
    out = []
    if ARTIFACTS.is_dir():
        for p in ARTIFACTS.glob("*.json"):
            try:
                a = json.loads(p.read_text(encoding="utf-8"))
            except Exception:
                continue
            if not a.get("id"):        # pre-v2 dev files without an id aren't artifacts
                continue
            out.append({"id": a.get("id"), "title": a.get("title"),
                        "created_at": a.get("created_at"),
                        "derived_from": a.get("derived_from"),
                        "version": a.get("version", 1)})
    return sorted(out, key=lambda x: x.get("created_at") or "", reverse=True)


@app.get("/api/artifact/{aid}")
def get_artifact(aid: str):
    if not re.fullmatch(r"[\w.-]+", aid):
        raise HTTPException(400, "bad id")
    p = ARTIFACTS / f"{aid}.json"
    if not p.is_file():
        raise HTTPException(404, "no such artifact")
    return JSONResponse(json.loads(p.read_text(encoding="utf-8")))


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
    # results are files: expose the artifacts folder (registry.js, <id>.js, <id>.html)
    Path("artifacts").mkdir(exist_ok=True)
    app.mount("/artifacts", StaticFiles(directory="artifacts", html=True), name="artifacts")
    uvicorn.run(app, host="127.0.0.1", port=8010, log_level="warning")
