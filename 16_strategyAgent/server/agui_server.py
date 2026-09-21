"""Folder 16 — the right panel, wired to a real AG-UI agent.

What this is
------------
A tiny FastAPI server that speaks the AG-UI protocol. The browser sends a
conversation turn; we forward it to Inception's `mercury-2.5` (an OpenAI-
compatible chat API) and stream the reply back as AG-UI events:

    RUN_STARTED
      TEXT_MESSAGE_START
      TEXT_MESSAGE_CONTENT   (repeated — one per streamed token-chunk)
      TEXT_MESSAGE_END
    RUN_FINISHED

The panel (web/chat.html) is the AI chat copied from file 15. Its job here is
narrow: the user types a market question, the AI answers and writes the Optuna
strategy — the search space + signal family that folder 13's optimize.py actually
searches. This first cut STREAMS that reply live; running it against folder 13 is
the next step.

Run it
------
    cd 16_strategyAgent
    uv sync
    uv run python server/agui_server.py
    # then open http://localhost:8000
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from openai import OpenAI

from ag_ui.core import (
    RunAgentInput,
    EventType,
    RunStartedEvent,
    RunFinishedEvent,
    RunErrorEvent,
    TextMessageStartEvent,
    TextMessageContentEvent,
    TextMessageEndEvent,
)
from ag_ui.encoder import EventEncoder

HERE = Path(__file__).resolve().parent
WEB_DIR = HERE.parent / "web"
ENV_FILE = HERE / ".env"


def load_env(path: Path) -> None:
    """Minimal .env reader so we don't pull another dependency. Real env wins."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        os.environ.setdefault(key.strip(), val.strip())


load_env(ENV_FILE)

API_KEY = os.environ.get("INCEPTION_API_KEY", "")
BASE_URL = os.environ.get("INCEPTION_BASE_URL", "https://api.inceptionlabs.ai/v1")
MODEL = os.environ.get("INCEPTION_MODEL", "mercury-2.5")

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

# The AI's brief: it is a research partner that turns a sentence into the Optuna
# strategy folder 13 searches. Keep the shape of its answer predictable so the
# next step (auto-running it) has something to grab onto.
SYSTEM_PROMPT = """\
You are Riemann 1, a quantitative research assistant inside a research notebook.

When the user poses a market question, do two things:
1. In one or two short sentences, say what you read the question to be.
2. Write the Optuna strategy for it — the SEARCH SPACE that folder 13's
   optimize.py will sample. Express it as a Python function in a fenced code
   block named `suggest(trial)`, choosing from these knobs the engine supports:
     - ma_type        : trial.suggest_categorical("ma_type", [...])   # e.g. ["sma","ema"]
     - fast_ma        : trial.suggest_int("fast_ma", lo, hi)           # ~3..60
     - slow_ma        : trial.suggest_int("slow_ma", fast_hi, hi)      # ~fast+2 .. 240
     - rsi_period     : trial.suggest_int("rsi_period", 5, 30)         # only if an RSI gate is wanted
     - rsi_entry_max  : trial.suggest_float("rsi_entry_max", 40.0, 85.0)
     - atr_stop_mult  : trial.suggest_float("atr_stop_mult", 1.0, 5.0) # only if an ATR stop is wanted
     - use_short      : trial.suggest_categorical("use_short", [True, False])  # only if shorts allowed
   Return the chosen params dict.

Be concrete about WHY you widened or narrowed any range for this specific
question. Keep it compact — this is a chat panel, not a report. Never claim the
backtest is done; you only propose the space to search.
"""

app = FastAPI(title="Riemann AG-UI Panel (folder 16)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def index() -> FileResponse:
    return FileResponse(WEB_DIR / "chat.html")


@app.get("/health")
def health() -> dict:
    return {"ok": bool(API_KEY), "model": MODEL, "base_url": BASE_URL}


def _to_chat_messages(input_data: RunAgentInput) -> list[dict]:
    """AG-UI messages -> OpenAI chat messages. Only plain text roles survive."""
    out = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in input_data.messages:
        role = getattr(msg, "role", None)
        content = getattr(msg, "content", None)
        if role in ("user", "assistant", "system") and content:
            out.append({"role": role, "content": content})
    return out


@app.post("/agent")
async def agent(input_data: RunAgentInput, request: Request) -> StreamingResponse:
    encoder = EventEncoder(accept=request.headers.get("accept"))

    async def event_generator():
        yield encoder.encode(
            RunStartedEvent(
                type=EventType.RUN_STARTED,
                thread_id=input_data.thread_id,
                run_id=input_data.run_id,
            )
        )
        message_id = str(uuid.uuid4())
        try:
            stream = client.chat.completions.create(
                model=MODEL,
                stream=True,
                messages=_to_chat_messages(input_data),
            )

            yield encoder.encode(
                TextMessageStartEvent(
                    type=EventType.TEXT_MESSAGE_START,
                    message_id=message_id,
                    role="assistant",
                )
            )

            for chunk in stream:
                if not getattr(chunk, "choices", None):
                    continue
                delta = chunk.choices[0].delta
                piece = getattr(delta, "content", None)
                if piece:
                    yield encoder.encode(
                        TextMessageContentEvent(
                            type=EventType.TEXT_MESSAGE_CONTENT,
                            message_id=message_id,
                            delta=piece,
                        )
                    )

            yield encoder.encode(
                TextMessageEndEvent(
                    type=EventType.TEXT_MESSAGE_END,
                    message_id=message_id,
                )
            )
            yield encoder.encode(
                RunFinishedEvent(
                    type=EventType.RUN_FINISHED,
                    thread_id=input_data.thread_id,
                    run_id=input_data.run_id,
                )
            )
        except Exception as error:  # surface model/stream failures to the panel
            yield encoder.encode(
                RunErrorEvent(type=EventType.RUN_ERROR, message=str(error))
            )

    return StreamingResponse(event_generator(), media_type=encoder.get_content_type())


def main() -> None:
    import uvicorn

    if not API_KEY:
        raise SystemExit("No INCEPTION_API_KEY — put it in server/.env")
    port = int(os.environ.get("PORT", "8000"))
    print(f"Riemann AG-UI panel → http://localhost:{port}  (model: {MODEL})")
    uvicorn.run(app, host="127.0.0.1", port=port)


if __name__ == "__main__":
    main()
