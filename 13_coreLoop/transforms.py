"""Chart types: the price series the strategy indicators are computed on.

ohlc         — raw closes (baseline)
heikin_ashi  — averaged candles; HA close = (O+H+L+C)/4 of the real bar
renko         — brick series built from closes; brick size from average range.
               Returned as a step-function aligned to the time index so the
               time-based backtester still works (position decisions remain
               per-bar, but indicators see the denoised renko line).
"""

from __future__ import annotations

import numpy as np
import pandas as pd


def transform(df: pd.DataFrame, chart_type: str, renko_brick_atr_mult: float = 1.0) -> pd.Series:
    """Return the close-series the strategy should compute indicators on."""
    if chart_type == "ohlc":
        return df["close"]
    if chart_type == "heikin_ashi":
        return heikin_ashi_close(df)
    if chart_type == "renko":
        return renko_series(df, renko_brick_atr_mult)
    raise ValueError(f"unknown chart_type: {chart_type}")


def heikin_ashi_close(df: pd.DataFrame) -> pd.Series:
    o, h, l, c = df["open"], df["high"], df["low"], df["close"]
    ha_close = (o + h + l + c) / 4.0
    return ha_close


def renko_series(df: pd.DataFrame, atr_mult: float) -> pd.Series:
    """Reversible renko: a step-function of confirmed brick levels on the time axis."""
    close = df["close"].to_numpy()
    avg_range = float((df["high"] - df["low"]).mean())
    brick = max(avg_range * atr_mult, 1e-9)

    n = len(close)
    out = np.zeros(n)
    level = close[0]
    for i in range(n):
        move = close[i] - level
        if abs(move) >= brick:
            steps = int(abs(move) // brick)
            level += np.sign(move) * steps * brick
        out[i] = level
    return pd.Series(out, index=df.index, name="renko_close")
