"""Market data loading for the Riemann core loop.

Tries the Binance public klines API first (no key required). If the network
is unavailable, falls back to a deterministic synthetic series so the loop
always runs — the synthetic path is clearly marked in the returned metadata.
"""

from __future__ import annotations

import json
import urllib.request
import zlib
from datetime import datetime, timezone

import numpy as np
import pandas as pd

BINANCE_KLINES_URL = (
    "https://api.binance.com/api/v3/klines"
    "?symbol={symbol}&interval={interval}&limit={limit}"
)

COLUMNS = [
    "open_time", "open", "high", "low", "close", "volume",
    "close_time", "quote_volume", "trades",
    "taker_base", "taker_quote", "ignore",
]


def load_series(symbol: str = "BTCUSDT", interval: str = "1d", bars: int = 1000) -> tuple[pd.DataFrame, dict]:
    """Return (ohlcv_df, meta). meta records the source so artifacts stay honest."""
    try:
        df = _fetch_binance(symbol, interval, bars)
        meta = {"source": "binance-public", "symbol": symbol, "interval": interval}
        return df, meta
    except Exception as exc:  # network down, rate limited, offline machine
        df = _synthetic(bars, seed=zlib.crc32(f"{symbol}{interval}".encode()))
        meta = {
            "source": "synthetic-fallback",
            "symbol": symbol,
            "interval": interval,
            "reason": str(exc),
        }
        return df, meta


def _fetch_binance(symbol: str, interval: str, bars: int) -> pd.DataFrame:
    limit = min(bars, 1000)  # public endpoint caps at 1000 rows per call
    url = BINANCE_KLINES_URL.format(symbol=symbol, interval=interval, limit=limit)
    with urllib.request.urlopen(url, timeout=10) as resp:
        raw = json.loads(resp.read().decode("utf-8"))
    if not raw:
        raise RuntimeError(f"empty response for {symbol}")
    df = pd.DataFrame(raw, columns=COLUMNS)
    numeric = ["open", "high", "low", "close", "volume"]
    df[numeric] = df[numeric].apply(pd.to_numeric)
    df["date"] = pd.to_datetime(df["open_time"].astype("int64"), unit="ms", utc=True)
    df = df.set_index("date")[numeric].sort_index()
    return df


def _synthetic(days: int, seed: int) -> pd.DataFrame:
    """Deterministic GBM-with-regimes so results are reproducible across runs."""
    rng = np.random.default_rng(seed)
    drift = 0.0003
    vol = 0.035
    shocks = rng.normal(0, vol * 3, days) * (rng.random(days) < 0.03)
    log_returns = rng.normal(drift, vol, days) + shocks
    close = 40000.0 * pd.Series(log_returns).add(1).cumprod().to_numpy()
    idx = pd.date_range(
        end=datetime.now(timezone.utc).date(), periods=days, freq="D", tz="UTC"
    )
    open_ = pd.Series(close).shift(1).fillna(close[0]).to_numpy()
    high = np.maximum(open_, close) * (1 + np.abs(rng.normal(0, vol / 2, days)))
    low = np.minimum(open_, close) * (1 - np.abs(rng.normal(0, vol / 2, days)))
    volume = rng.uniform(1000, 5000, days)
    return pd.DataFrame(
        {"open": open_, "high": high, "low": low, "close": close, "volume": volume},
        index=pd.DatetimeIndex(idx, name="date"),
    )
