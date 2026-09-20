"""Run configuration: the single JSON shape both the dashboard and CLI use.

This is the "recipe" half of reproducible research — every artifact records
the config that produced it, and a config file can be re-run headlessly:

    uv run python optimize.py --config my_run.json
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field, asdict
from pathlib import Path

DEFAULTS = {
    "question": "Find a BTCUSDT daily strategy that passes the FTMO Challenge: "
                "10% target, max 5% daily loss, max 10% total loss, ≥4 trading days.",
    "symbol": "BTCUSDT",
    "interval": "1d",          # 1m 5m 15m 1h 4h 1d
    "bars": 1000,              # candles pulled from Binance (API cap 1000)
    "trials": 500,
    "seed": 42,
    "chart_type": "ohlc",      # ohlc | heikin_ashi | renko
    "renko_brick_atr_mult": 1.0,
    "pin": {},                 # forced strategy params — a notebook fork draws these
    "derived_from": None,      # artifact id this run was forked from (provenance)
    "search": {
        "ma_types": ["sma", "ema"],
        "use_rsi_gate": True,
        "use_atr_stop": True,
        "allow_short": True,
    },
    "rules": {   # real, verified 2026 FTMO numbers — ftmo.com/en/trading-objectives
        "name": "FTMO Challenge · 2-Step (Stage 1)",
        "initial_balance": 100_000.0,
        "profit_target_pct": 10.0,
        "max_daily_loss_pct": 5.0,
        "max_total_loss_pct": 10.0,
        "min_trades": 1,             # FTMO requires no trade count — min trading days is the real rule
        "min_trading_days": 4,
        "target_within_days": None,  # FTMO removed the time limit
    },
}


@dataclass
class RunConfig:
    question: str = DEFAULTS["question"]
    symbol: str = DEFAULTS["symbol"]
    interval: str = DEFAULTS["interval"]
    bars: int = DEFAULTS["bars"]
    trials: int = DEFAULTS["trials"]
    seed: int = DEFAULTS["seed"]
    chart_type: str = DEFAULTS["chart_type"]
    renko_brick_atr_mult: float = DEFAULTS["renko_brick_atr_mult"]
    pin: dict = field(default_factory=dict)
    derived_from: str | None = None
    search: dict = field(default_factory=lambda: dict(DEFAULTS["search"]))
    rules: dict = field(default_factory=lambda: dict(DEFAULTS["rules"]))

    @classmethod
    def from_dict(cls, d: dict) -> "RunConfig":
        merged = json.loads(json.dumps(DEFAULTS))  # deep copy
        for k, v in (d or {}).items():
            if k in ("search", "rules") and isinstance(v, dict):
                merged[k].update(v)
            elif k in merged:
                merged[k] = v
        return cls(**merged)

    @classmethod
    def from_file(cls, path: str | Path) -> "RunConfig":
        return cls.from_dict(json.loads(Path(path).read_text(encoding="utf-8")))

    def to_dict(self) -> dict:
        return asdict(self)
