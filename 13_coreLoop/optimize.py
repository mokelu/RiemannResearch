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

from backtest import run_backtest
from config import RunConfig
from data import load_series
from prop_firm import PropFirmRules
from strategy import generate_signals, make_suggest_fn

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
        metrics = _backtest(cfg, rules, df, params)
        violations = rules.violated_by(metrics)
        trial.set_user_attr("params", params)
        trial.set_user_attr("violations", violations)
        trial.set_user_attr(
            "metrics", {k: v for k, v in metrics.items() if k != "equity_curve"}
        )
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
    artifact = _build_artifact(cfg, data_meta, rules, study, survivors)

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


def _build_artifact(cfg: RunConfig, data_meta, rules: PropFirmRules, study, survivors) -> dict:
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
        "type": "research",
        "title": cfg.question,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "blocks": blocks,
    }


def save_artifact(artifact: dict) -> Path:
    ARTIFACT_DIR.mkdir(exist_ok=True)
    path = ARTIFACT_DIR / f"{artifact['id']}.json"
    path.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
    return path


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
