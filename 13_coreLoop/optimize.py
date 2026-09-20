"""The Riemann core loop: question -> search -> survivors -> research artifact.

Library entry point:  run(cfg: RunConfig, progress_cb) -> artifact dict
CLI entry point:      uv run python optimize.py --config my_run.json
                      uv run python optimize.py --trials 500 --symbol ETHUSDT --interval 1h
"""

from __future__ import annotations

import argparse
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

import optuna
from optuna.trial import TrialState

from backtest import run_backtest, strip_series
from config import RunConfig
from data import load_series
from prop_firm import PropFirmRules
from strategy import generate_signals, make_suggest_fn
from tagging import rejected_tags, slider_tags, survivor_tags

ARTIFACT_DIR = Path(__file__).parent / "artifacts"

METRIC_KEYS = (
    "total_return_pct", "max_drawdown_pct", "worst_daily_loss_pct",
    "n_trades", "trading_days", "profit_factor", "days_to_target", "final_balance",
)


def _backtest(cfg: RunConfig, rules: PropFirmRules, df, params):
    positions = generate_signals(df, params, cfg.chart_type, cfg.renko_brick_atr_mult)
    return run_backtest(df, positions, rules.initial_balance, rules.profit_target_pct)


def run(cfg: RunConfig, progress_cb=None) -> dict:
    """Execute the full loop. Safe to call from a background thread."""
    rules = PropFirmRules.from_dict(cfg.rules)
    df, data_meta = load_series(cfg.symbol, cfg.interval, cfg.bars)
    data_meta.update({
        "bars": int(len(df)),
        "first": str(df.index[0]),
        "last": str(df.index[-1]),
    })
    suggest = make_suggest_fn(cfg.search)

    def objective(trial: optuna.Trial) -> float:
        params = suggest(trial)
        if cfg.pin:
            params = {**params, **cfg.pin}  # notebook fork: pinned draws override the search
        metrics = _backtest(cfg, rules, df, params)
        violations = rules.violated_by(metrics)
        trial.set_user_attr("params", params)
        trial.set_user_attr("violations", violations)
        trial.set_user_attr("metrics", strip_series(metrics))
        if violations:
            breach = max(metrics["max_drawdown_pct"] - rules.max_total_loss_pct, 0.0)
            breach += max(metrics["worst_daily_loss_pct"] - rules.max_daily_loss_pct, 0.0)
            return -100.0 - breach
        return metrics["total_return_pct"]

    optuna.logging.set_verbosity(optuna.logging.WARNING)
    study_name = f"riemann1-{cfg.symbol.lower()}-{cfg.interval}-{uuid.uuid4().hex[:8]}"
    study = optuna.create_study(
        study_name=study_name,
        direction="maximize",
        sampler=optuna.samplers.TPESampler(seed=cfg.seed, multivariate=True),
        storage="sqlite:///riemann.db",
    )

    def _cb(study_arg, _trial):  # optuna callback -> dashboard progress
        if progress_cb:
            done = len([t for t in study_arg.trials if t.state == TrialState.COMPLETE])
            surv = len([t for t in study_arg.trials
                        if t.state == TrialState.COMPLETE and not t.user_attrs["violations"]])
            progress_cb({"trials_done": done, "trials_total": cfg.trials, "survivors": surv})

    study.optimize(objective, n_trials=cfg.trials, callbacks=[_cb])

    survivors = _collect_survivors(cfg, rules, df, study)
    tags = _collect_tags(cfg, rules, df, study, survivors)
    artifact = _build_artifact(cfg, data_meta, rules, study, survivors, tags, df)

    # cleanup: drop this study so the sqlite file doesn't grow unbounded
    storage = optuna.storages.RDBStorage(url="sqlite:///riemann.db")
    try:
        storage.delete_study(study_name)
    except KeyError:
        pass
    return artifact


def _collect_survivors(cfg: RunConfig, rules: PropFirmRules, df, study, top: int = 3) -> list[dict]:
    complete = [t for t in study.trials if t.state == TrialState.COMPLETE]
    survivors = []
    for t in sorted(complete, key=lambda x: x.value, reverse=True):
        if t.user_attrs["violations"]:
            continue
        metrics = _backtest(cfg, rules, df, t.user_attrs["params"])
        survivors.append({"trial": t.number, "params": t.user_attrs["params"], **metrics})
        if len(survivors) >= top:
            break
    return survivors


def _collect_tags(cfg: RunConfig, rules: PropFirmRules, df, study, survivors,
                  max_rejected: int = 5) -> list[dict]:
    """Say out loud what the backtester already knew: survivors get their
    full trade log as buttons, every trial that hurt gets anchored breach
    tags, the top survivor gets fork-invitation sliders, and the most
    instructive failures get headstones — not full logs."""
    tags: list[dict] = []
    for rank, s in enumerate(survivors):
        tags += survivor_tags(df, s["params"], s, [], rules, s["trial"])
        if rank == 0:
            tags += slider_tags(s["params"], s["trial"])
    complete = [t for t in study.trials if t.state == TrialState.COMPLETE]
    fails = sorted(
        (t for t in complete if t.user_attrs["violations"]),
        key=lambda x: x.value, reverse=True,
    )[:max_rejected]
    for t in fails:
        tags += rejected_tags(t.user_attrs["metrics"], t.user_attrs["violations"], t.number)
    return tags


def _candles_block(df) -> dict:
    rows = [
        [i, ts.strftime("%Y-%m-%d %H:%M") if ts.hour or ts.minute else ts.strftime("%Y-%m-%d"),
         round(float(o), 2), round(float(h), 2), round(float(l), 2), round(float(c), 2)]
        for i, (ts, o, h, l, c) in enumerate(
            zip(df.index, df["open"], df["high"], df["low"], df["close"]))
    ]
    return {"type": "candles",
            "content": {"count": len(rows), "columns": ["i", "t", "open", "high", "low", "close"]},
            "rows": rows}


def _build_artifact(cfg: RunConfig, data_meta, rules: PropFirmRules, study,
                    survivors, tags, df) -> dict:
    """The research artifact: notebook-shaped blocks, URL-ready JSON."""
    n_total = len([t for t in study.trials if t.state == TrialState.COMPLETE])
    n_surviving = len([t for t in study.trials
                       if t.state == TrialState.COMPLETE and not t.user_attrs["violations"]])
    best = survivors[0] if survivors else None

    blocks = [
        {"type": "question", "text": cfg.question},
        {"type": "config", "content": cfg.to_dict()},
        {"type": "rules", "content": rules.as_dict()},
        {"type": "data", "content": data_meta},
        _candles_block(df),
        {"type": "tags", "tags": tags,
         "content": {"count": len(tags),
                     "vocab": sorted({t["type"] for t in tags})}},
        {"type": "computation", "content": {
            "engine": "optuna", "trials_run": n_total,
            "trials_failed_rules": n_total - n_surviving,
            "trials_survived": n_surviving,
            "reported_top": len(survivors),
        }},
    ]
    if best:
        blocks.append({"type": "strategy", "content": best["params"]})
        blocks.append({"type": "metrics", "content": {k: best[k] for k in METRIC_KEYS}})
        blocks.append({"type": "chart", "chart": "equity_curve", "data": best["equity_curve"]})
        conclusion = (
            f"{n_surviving} of {n_total} configurations survived the "
            f"'{rules.name}' rules. Best: +{best['total_return_pct']}% with "
            f"{best['max_drawdown_pct']}% max drawdown over {best['n_trades']} trades. "
            f"Backtest only — no claim about live performance."
        )
    else:
        conclusion = (
            f"No configuration among {n_total} trials satisfied every rule of "
            f"'{rules.name}'. The search space or rule set needs revisiting."
        )
    blocks.append({"type": "conclusion", "text": conclusion})

    return {
        "id": f"research-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}",
        "version": 2,
        "derived_from": cfg.derived_from,
        "type": "research",
        "title": cfg.question,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "blocks": blocks,
    }


def save_artifact(artifact: dict) -> Path:
    ARTIFACT_DIR.mkdir(exist_ok=True)
    path = ARTIFACT_DIR / f"{artifact['id']}.json"
    path.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
    export_sidecars(artifact)
    return path


def export_sidecars(artifact: dict) -> None:
    """The notebook needs NO SERVER. Every save writes, beside the JSON:
      <id>.js      the artifact as a plain script (window.RIEMANN_ARTIFACTS)
      <id>.html    one double-clickable, self-contained notebook file
      registry.js  index of all artifacts, rebuilt every run
    Any of these can be emailed, zipped, or dropped on any static host.
    """
    aid = artifact["id"]
    payload = json.dumps(artifact).replace("</", "<\\/")
    (ARTIFACT_DIR / f"{aid}.js").write_text(
        "window.RIEMANN_ARTIFACTS = window.RIEMANN_ARTIFACTS || {};\n"
        f"window.RIEMANN_ARTIFACTS[{json.dumps(aid)}] = {payload};\n",
        encoding="utf-8")
    template = (Path(__file__).parent / "static" / "notebook.html").read_text(encoding="utf-8")
    inject = f"<script>window.RIEMANN_ARTIFACT = {payload};</script>\n</body>"
    (ARTIFACT_DIR / f"{aid}.html").write_text(
        template.replace("</body>", inject, 1), encoding="utf-8")
    rebuild_registry()


def rebuild_registry() -> None:
    index = []
    for p in sorted(ARTIFACT_DIR.glob("research-*.json")):
        try:
            a = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        if not a.get("id"):
            continue
        index.append({"id": a["id"], "title": a.get("title"),
                      "created_at": a.get("created_at"),
                      "derived_from": a.get("derived_from"), "version": a.get("version", 1)})
    index.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    (ARTIFACT_DIR / "registry.js").write_text(
        "window.RIEMANN_INDEX = " + json.dumps(index) + ";\n", encoding="utf-8")


def _cli() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", help="path to a run.json produced by the dashboard")
    parser.add_argument("--trials", type=int)
    parser.add_argument("--symbol")
    parser.add_argument("--interval")
    parser.add_argument("--bars", type=int)
    args = parser.parse_args()

    cfg = RunConfig.from_file(args.config) if args.config else RunConfig.from_dict({})
    for key in ("trials", "symbol", "interval", "bars"):
        val = getattr(args, key)
        if val is not None:
            setattr(cfg, key, val)

    print(f"QUESTION: {cfg.question}\n")

    def report(p):
        print(f"\r  {p['trials_done']}/{p['trials_total']} trials, "
              f"{p['survivors']} survivors", end="", flush=True)

    artifact = run(cfg, progress_cb=report)
    path = save_artifact(artifact)
    print()

    for block in artifact["blocks"]:
        if block["type"] == "computation":
            c = block["content"]
            print(f"TRIALS: {c['trials_run']} run, {c['trials_survived']} survived")
        if block["type"] == "conclusion":
            print(block["text"])
    print(f"\nARTIFACT: {path}")


if __name__ == "__main__":
    _cli()
