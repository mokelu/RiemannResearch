"""Backtest: positions -> equity curve -> metrics.

Deliberately simple and honest:
- signals on bar t earn/skip bar t+1 returns (execution lag, no look-ahead)
- fixed 0.1% cost per side (fee + slippage placeholder)
- daily loss is computed per CALENDAR day, so intraday intervals
  (5m, 1h, ...) measure the prop-firm rule the way firms do
- days_to_target measures how long the strategy needs to reach +target%
"""

from __future__ import annotations

import numpy as np
import pandas as pd

COST_PER_SIDE = 0.001  # 0.1%


def run_backtest(
    df: pd.DataFrame,
    positions: pd.Series,
    initial_balance: float,
    profit_target_pct: float | None = None,
) -> dict:
    """Return metrics plus the equity curve the artifact will render."""
    close = df["close"]
    bar_returns = close.pct_change().fillna(0.0)

    exposure = positions.shift(1).fillna(0.0)          # decided yesterday, traded today
    turnover = exposure.diff().abs().fillna(exposure.abs())
    strategy_returns = exposure * bar_returns - turnover * COST_PER_SIDE

    equity = initial_balance * (1.0 + strategy_returns).cumprod()
    running_max = equity.cummax()
    drawdown_pct = (1.0 - equity / running_max) * 100.0

    days = pd.DatetimeIndex(df.index).tz_convert("UTC").normalize() if getattr(df.index, "tz", None) is not None \
        else pd.DatetimeIndex(df.index).normalize()
    daily_pnl = strategy_returns.groupby(days).sum()   # per-calendar-day P&L
    worst_daily_loss_pct = float(-daily_pnl.min() * 100.0) if len(daily_pnl) else 0.0

    total_return_pct = (equity.iloc[-1] / initial_balance - 1.0) * 100.0
    positives = strategy_returns[strategy_returns > 0].sum()
    negatives = -strategy_returns[strategy_returns < 0].sum()

    # drawdown window: peak -> trough of the worst drawdown (candle indices)
    dd_vals = drawdown_pct.to_numpy()
    trough = int(dd_vals.argmax())
    peak = int(equity.iloc[: trough + 1].values.argmax())

    # worst calendar day, anchored to the first bar of that day
    worst_day = daily_pnl.idxmin()
    wd_series = daily_pnl.min()
    wd_bar = int(np.argmax((days == worst_day).astype(int)))

    days_to_target = None
    target_bar = None
    if profit_target_pct is not None:
        hit = equity >= initial_balance * (1.0 + profit_target_pct / 100.0)
        if hit.any():
            target_bar = int(hit.to_numpy().argmax())
            days_to_target = int((days[target_bar] - days[0]).days)

    return {
        "final_balance": round(float(equity.iloc[-1]), 2),
        "total_return_pct": round(float(total_return_pct), 2),
        "max_drawdown_pct": round(float(drawdown_pct.max()), 2),
        "worst_daily_loss_pct": round(max(worst_daily_loss_pct, 0.0), 2),
        "n_trades": int(trade_count(turnover)),
        "trading_days": int((exposure.groupby(days).apply(lambda s: (s != 0).any())).sum()),
        "profit_factor": round(float(positives / negatives), 2) if negatives > 0 else float("inf"),
        "days_to_target": days_to_target,
        "dd_window": {"from": peak, "to": trough, "pct": round(float(dd_vals[trough]), 2)},
        "worst_day": {
            "bar": wd_bar,
            "date": str(worst_day.date()) if hasattr(worst_day, "date") else str(worst_day),
            "loss_pct": round(float(max(-wd_series * 100.0, 0.0)), 2),
        },
        # raw series for tagging — callers strip these before JSON/artifact use
        "series": {
            "equity": [round(float(v), 2) for v in equity.tolist()],
            "positions": [int(v) for v in positions.reindex(df.index).fillna(0).to_numpy()],
            "target_bar": target_bar,
        },
        "equity_curve": _sample_curve(equity),
    }


SERIES_KEYS = ("series",)


def strip_series(metrics: dict) -> dict:
    """Drop bulky keys before storing metrics on a trial (dd_window/worst_day
    are small and candle-anchored — they stay)."""
    return {k: v for k, v in metrics.items() if k not in SERIES_KEYS and k != "equity_curve"}


def trade_count(turnover: pd.Series) -> int:
    """Count closed round trips (entries, minus an open position at the end)."""
    entries = int((turnover > 0).sum())
    return max(entries // 2, 0 if entries == 0 else 1)


def _sample_curve(equity: pd.Series, max_points: int = 250) -> list[dict]:
    """Down-sample the curve so the JSON artifact stays shareable."""
    step = max(1, len(equity) // max_points)
    pts = equity.iloc[::step]
    fmt = "%Y-%m-%d %H:%M" if _sub_daily(equity.index) else "%Y-%m-%d"
    return [{"t": ts.strftime(fmt), "equity": round(float(v), 2)} for ts, v in pts.items()]


def _sub_daily(index: pd.DatetimeIndex) -> bool:
    spans = index.to_series().diff().dropna()
    return bool(spans.median() < pd.Timedelta(days=1))
