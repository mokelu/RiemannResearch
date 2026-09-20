"""Tagging: turn a trial's outcome into tags anchored to candles.

The contract (from the tag law): type + name + from + to + value + props.
from/to are candle refs — "candle:412" — the same row index the candles
block carries, so any renderer can place a tag without re-deriving anything.

What the backtester already knows but used to throw away, we now say out loud:
  state flips      -> button tags (BUY / SELL / EXIT, with reason)
  drawdown window  -> region tag peak->trough (fail-colored if it breaks a rule)
  worst daily loss -> note tag on that day's first bar
  target reached   -> note tag on that bar
  best params      -> slider tags carrying their search bounds (a slider on a
                      survivor is a FORK invitation, not an edit)
"""

from __future__ import annotations

# bounds mirror make_suggest_fn in strategy.py — the slider's range IS the
# search space, so dragging one and re-running is exactly a forked study.
SLIDER_BOUNDS = {
    "fast_ma": (3, 60),
    "slow_ma": (3, 240),
    "rsi_period": (5, 30),
    "rsi_entry_max": (40.0, 85.0),
    "atr_stop_mult": (1.0, 5.0),
}


def _candle(i: int) -> str:
    return f"candle:{i}"


def _tag(type_: str, name: str, frm: int, to: int, trial: int,
         value=None, **props) -> dict:
    t = {"type": type_, "name": name, "from": _candle(frm), "to": _candle(to)}
    if value is not None:
        t["value"] = value
    t["props"] = {"trial": trial, **props}
    return t


def trade_tags(df, params: dict, positions: list[int], trial_no: int) -> list[dict]:
    """Buttons at every decision bar where exposure flips."""
    close = df["close"].to_numpy()
    tags = []
    state = 0
    for i, p in enumerate(positions):
        p = int(p)
        if p == state:
            continue
        if p == 1:
            name, color = "BUY", "up"
        elif p == -1:
            name, color = "SELL", "down"
        else:
            name, color = "EXIT", "neutral"
        tags.append(_tag("button", name, i, i, trial_no,
                         price=round(float(close[i]), 2), side=color))
        state = p
    return tags


def breach_tags(metrics: dict, violations: list[str], rules, trial_no: int) -> list[dict]:
    """Region + note tags for everything that hurt, survivors included."""
    tags = []
    dd = metrics.get("dd_window") or {}
    if dd:
        failed = metrics["max_drawdown_pct"] > rules.max_total_loss_pct
        tags.append(_tag(
            "region", "max drawdown", dd["from"], dd["to"], trial_no,
            value=f"-{dd['pct']}%",
            severity="fail" if failed else "info",
            color="red" if failed else "amber",
            limit=rules.max_total_loss_pct,
        ))
    wd = metrics.get("worst_day") or {}
    if wd and wd.get("loss_pct", 0) > 0:
        failed = wd["loss_pct"] > rules.max_daily_loss_pct
        tags.append(_tag(
            "note", "worst daily loss", wd["bar"], wd["bar"], trial_no,
            value=f"{wd['loss_pct']}% on {wd['date']}",
            severity="fail" if failed else "info",
            color="red" if failed else "neutral",
            limit=rules.max_daily_loss_pct,
        ))
    target_bar = (metrics.get("series") or {}).get("target_bar")
    if target_bar is not None:
        tags.append(_tag("note", "target reached", target_bar, target_bar, trial_no,
                         value=f"+{rules.profit_target_pct}%", severity="pass",
                         color="green"))
    return tags


def rejection_tags(metrics: dict, violations: list[str], trial_no: int) -> list[dict]:
    """One summary note for a rejected trial — a corpse gets a headstone,
    not its full trade log, so the artifact stays shareable."""
    return [_tag("note", f"trial #{trial_no} rejected", 0, 0, trial_no,
                 value="; ".join(violations[:2]) or "rejected",
                 severity="fail", color="red")]


def slider_tags(params: dict, trial_no: int) -> list[dict]:
    tags = []
    for key, value in params.items():
        if key not in SLIDER_BOUNDS or isinstance(value, bool):
            continue
        lo, hi = SLIDER_BOUNDS[key]
        tags.append(_tag("slider", key, 0, 0, trial_no,
                         value=value, min=lo, max=hi, step="any"))
    return tags


def survivor_tags(df, params, metrics, violations, rules, trial_no) -> list[dict]:
    series = metrics.get("series") or {}
    tags = trade_tags(df, params, series.get("positions", []), trial_no)
    tags += breach_tags(metrics, violations, rules, trial_no)
    return tags


def rejected_tags(metrics, violations, trial_no) -> list[dict]:
    # a single region tag for where it broke, if we know where
    dd = metrics.get("dd_window") or {}
    if dd and any(v.startswith("max_total_loss") for v in violations):
        return [_tag("region", "drawdown breach", dd["from"], dd["to"], trial_no,
                     value=f"-{dd['pct']}%", severity="fail", color="red")]
    wd = metrics.get("worst_day") or {}
    if wd and any(v.startswith("max_daily_loss") for v in violations):
        return [_tag("note", "daily-loss breach", wd["bar"], wd["bar"], trial_no,
                     value=f"{wd['loss_pct']}% on {wd['date']}",
                     severity="fail", color="red")]
    return rejection_tags(metrics, violations, trial_no)
