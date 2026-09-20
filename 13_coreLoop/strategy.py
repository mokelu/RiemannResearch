"""The strategy family Optuna searches over — configurable knobs.

Indicators are computed on a transformed price series (raw OHLC, Heikin-Ashi
or Renko — see transforms.py). The search space itself is built from the run
config: which MA types to try, whether the RSI gate and ATR stop are in play,
whether shorts are allowed. Riemann 1's future job is to PROPOSE this space
from the market question; the dashboard is the human version of that.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from transforms import transform


def rsi(close: pd.Series, period: int) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0).ewm(alpha=1 / period, adjust=False).mean()
    loss = (-delta.clip(upper=0)).ewm(alpha=1 / period, adjust=False).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - 100 / (1 + rs)


def atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    prev_close = df["close"].shift(1)
    tr = pd.concat(
        [
            df["high"] - df["low"],
            (df["high"] - prev_close).abs(),
            (df["low"] - prev_close).abs(),
        ],
        axis=1,
    ).max(axis=1)
    return tr.ewm(alpha=1 / period, adjust=False).mean()


def make_suggest_fn(search: dict):
    """Build the search-space function from config options."""
    ma_types = search.get("ma_types") or ["sma"]
    use_rsi = bool(search.get("use_rsi_gate", True))
    use_atr_stop = bool(search.get("use_atr_stop", False))
    allow_short = bool(search.get("allow_short", False))

    def suggest(trial) -> dict:
        params: dict = {
            "ma_type": trial.suggest_categorical("ma_type", ma_types),
            "fast_ma": trial.suggest_int("fast_ma", 3, 60),
        }
        params["slow_ma"] = trial.suggest_int("slow_ma", params["fast_ma"] + 2, 240)
        params["rsi_period"] = trial.suggest_int("rsi_period", 5, 30) if use_rsi else 14
        params["rsi_entry_max"] = (
            trial.suggest_float("rsi_entry_max", 40.0, 85.0) if use_rsi else 101.0
        )
        params["atr_stop_mult"] = (
            trial.suggest_float("atr_stop_mult", 1.0, 5.0) if use_atr_stop else 0.0
        )
        params["use_short"] = (
            trial.suggest_categorical("use_short", [True, False]) if allow_short else False
        )
        return params

    return suggest


def moving_average(series: pd.Series, length: int, ma_type: str) -> pd.Series:
    if ma_type == "ema":
        return series.ewm(span=length, adjust=False).mean()
    return series.rolling(length).mean()


def generate_signals(
    df: pd.DataFrame, params: dict, chart_type: str = "ohlc", renko_mult: float = 1.0
) -> pd.Series:
    """Target position in {-1, 0, 1} per bar. Indicators on the transformed
    series; entries/exits/stops evaluated against REAL prices. No look-ahead."""
    price = transform(df, chart_type, renko_mult)
    fast = moving_average(price, params["fast_ma"], params["ma_type"]).to_numpy()
    slow = moving_average(price, params["slow_ma"], params["ma_type"]).to_numpy()
    r = rsi(price, params["rsi_period"]).to_numpy()
    atr_vals = (
        atr(df).to_numpy() if params.get("atr_stop_mult", 0.0) > 0 else None
    )
    real_close = df["close"].to_numpy()

    warmup = max(params["fast_ma"], params["slow_ma"], params["rsi_period"], 14)
    rsi_max = params["rsi_entry_max"]
    stop_mult = params.get("atr_stop_mult", 0.0)
    use_short = bool(params.get("use_short"))

    pos = np.zeros(len(df))
    state = 0.0
    entry_price = 0.0
    for i in range(warmup, len(df)):
        cross_up = fast[i] > slow[i] and fast[i - 1] <= slow[i - 1]
        cross_down = fast[i] < slow[i] and fast[i - 1] >= slow[i - 1]

        if state == 1.0:
            stopped = (
                stop_mult > 0
                and np.isfinite(atr_vals[i])
                and real_close[i] < entry_price - stop_mult * atr_vals[i]
            )
            if fast[i] < slow[i] or stopped:
                state = 0.0
        elif state == -1.0:
            stopped = (
                stop_mult > 0
                and np.isfinite(atr_vals[i])
                and real_close[i] > entry_price + stop_mult * atr_vals[i]
            )
            if fast[i] > slow[i] or stopped:
                state = 0.0
        elif cross_up and r[i] < rsi_max:
            state, entry_price = 1.0, real_close[i]
        elif use_short and cross_down and r[i] > 100.0 - rsi_max:
            state, entry_price = -1.0, real_close[i]
        pos[i] = state

    return pd.Series(pos, index=df.index)
