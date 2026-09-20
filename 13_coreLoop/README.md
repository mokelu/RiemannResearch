# Riemann Core Loop

The search engine behind **Riemann 1 — Market Intelligence Model**.

Given a market question of the form:

> "Find a strategy on BTC/USD that survives this prop-firm challenge."

this folder runs the loop:

```text
market data → strategy search space → Optuna trials → constraint filter → surviving candidates → research artifact (JSON)
```

## Run

```powershell
uv run python optimize.py --trials 200
```

Each trial backtests one parameterised strategy configuration. Trials that
violate the prop-firm rules are rejected; survivors are written to
`artifacts/` as a Riemann research artifact.

## Files

| File | Role |
|---|---|
| `data.py` | Loads daily candles (Binance public API, synthetic fallback) |
| `strategy.py` | The strategy family Optuna searches over (MA crossover + RSI filter + risk gates) |
| `backtest.py` | Turns signals into an equity curve, trades, and metrics |
| `optimize.py` | The Optuna study: search space, objective, prop-firm constraints, artifact output |
| `prop_firm.py` | The rule set (FTMO-style) that a strategy must survive |
