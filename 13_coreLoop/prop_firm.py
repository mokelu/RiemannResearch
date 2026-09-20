"""Prop-firm rule sets a strategy must survive — fully configurable.

Every field is editable from the dashboard or a run.json config. The core
loop treats all of these as HARD constraints: a trial that breaks any rule
is rejected outright, never "penalized but ranked".

target_within_days is the human-condition: real challenges expect you to
reach the profit target in a bounded window, not after two idle years.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict


@dataclass(frozen=True)
class PropFirmRules:
    name: str = "ftmo-style-25k"
    initial_balance: float = 25_000.0
    profit_target_pct: float = 10.0
    max_daily_loss_pct: float = 5.0
    max_total_loss_pct: float = 10.0
    min_trades: int = 1
    min_trading_days: int = 4
    target_within_days: int | None = None   # e.g. 60; None = no time box

    @classmethod
    def from_dict(cls, d: dict) -> "PropFirmRules":
        known = {f for f in cls.__dataclass_fields__}
        return cls(**{k: v for k, v in (d or {}).items() if k in known})

    def as_dict(self) -> dict:
        return asdict(self)

    def violated_by(self, metrics: dict) -> list[str]:
        """Return the list of rule violations for a backtest result."""
        violations = []
        if metrics["max_drawdown_pct"] > self.max_total_loss_pct:
            violations.append(
                f"max_total_loss: {metrics['max_drawdown_pct']:.2f}% "
                f"> {self.max_total_loss_pct}%"
            )
        if metrics["worst_daily_loss_pct"] > self.max_daily_loss_pct:
            violations.append(
                f"max_daily_loss: {metrics['worst_daily_loss_pct']:.2f}% "
                f"> {self.max_daily_loss_pct}%"
            )
        if metrics["n_trades"] < self.min_trades:
            violations.append(f"min_trades: {metrics['n_trades']} < {self.min_trades}")
        if metrics["trading_days"] < self.min_trading_days:
            violations.append(
                f"min_trading_days: {metrics['trading_days']} < {self.min_trading_days}"
            )
        if self.target_within_days is not None:
            dtt = metrics.get("days_to_target")
            if dtt is None:
                violations.append(f"target_never_reached: +{self.profit_target_pct}%")
            elif dtt > self.target_within_days:
                violations.append(f"target_too_slow: {dtt}d > {self.target_within_days}d")
        return violations
