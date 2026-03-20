import { useState, useEffect, useCallback } from "react";
import { useEvaluatePortfolio } from "../hooks/usePortfolioAPI.js";
import { AllocationBar, EmptyState, Spinner } from "./ui.jsx";
import { ASSETS } from "./Controls.jsx";

function pct(v) { return `${(v * 100).toFixed(2)}%`; }

const PRESETS = [
  { label: "Equal Weight",    fn: (n)        => Array(n).fill(1 / n) },
  { label: "Max Sharpe",      fn: (_, ms)    => ms },
  { label: "Min Variance",    fn: (_, __, mv)=> mv },
  { label: "60/40 (first 2)", fn: (n)        => { const w = Array(n).fill(0); w[0] = 0.6; if (n > 1) w[1] = 0.4; return w; } },
];

export default function CustomPage({ result, selectedTickers, period }) {
  const assets = ASSETS.filter(a => selectedTickers.includes(a.ticker));
  const n      = assets.length;

  const [weights, setWeights] = useState(() => assets.map(() => 1 / n));
  const { result: evalResult, loading, evaluate } = useEvaluatePortfolio();

  const normalized = (() => {
    const s = weights.reduce((a, b) => a + b, 0);
    return s > 0 ? weights.map(v => v / s) : weights;
  })();

  const runEval = useCallback(() => {
    evaluate({ tickers: assets.map(a => a.ticker), weights: normalized, period });
  }, [normalized, period]);

  useEffect(() => {
    const t = setTimeout(runEval, 600);
    return () => clearTimeout(t);
  }, [weights]);

  useEffect(() => {
    setWeights(assets.map(() => 1 / n));
  }, [selectedTickers.join(",")]);

  if (!result) return <EmptyState icon="◧" message="Run an optimization first, then build a custom portfolio" />;

  const msWeights = result.max_sharpe?.weights;
  const mvWeights = result.min_variance?.weights;

  const applyPreset = (fn) => {
    const msArr = assets.map(a => msWeights?.[a.ticker] ?? 0);
    const mvArr = assets.map(a => mvWeights?.[a.ticker] ?? 0);
    setWeights(fn(n, msArr, mvArr));
  };

  const optSharpe = result.max_sharpe?.sharpe_ratio ?? 1;
  const mySharpe  = evalResult?.sharpe_ratio ?? 0;
  const efficiency = Math.min(100, (mySharpe / optSharpe) * 100);

  const metrics = evalResult ? [
    { label: "Expected Return",  val: pct(evalResult.expected_return),        color: "var(--green-lt)" },
    { label: "Volatility (σ)",   val: pct(evalResult.volatility),             color: "var(--red-lt)" },
    { label: "Sharpe Ratio",     val: evalResult.sharpe_ratio.toFixed(3),     color: "var(--yellow-lt)" },
    { label: "VaR 95% (daily)",  val: pct(evalResult.var_95),                 color: "var(--red-lt)" },
    { label: "CVaR 95% (daily)", val: pct(evalResult.cvar_95),                color: "var(--red-lt)" },
    { label: "Max Drawdown",     val: pct(Math.abs(evalResult.max_drawdown)), color: "var(--red-lt)" },
  ] : [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div className="card fade-up">
        <div className="card-title">Manual Weight Editor · auto-normalized to 100%</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
          {PRESETS.map(p => (
            <button key={p.label} className="btn btn-ghost"
              style={{ padding: "5px 11px", fontSize: 10 }}
              onClick={() => applyPreset(p.fn)}>{p.label}</button>
          ))}
        </div>
        <AllocationBar weights={normalized} assets={assets} />
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {assets.map((a, i) => (
            <div key={a.ticker} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: a.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "var(--text-secondary)", width: 54 }}>{a.ticker}</span>
              <input type="range" min={0} max={1} step={0.01}
                value={weights[i] ?? 0}
                style={{ accentColor: a.color }}
                onChange={e => {
                  const nw = [...weights];
                  nw[i] = parseFloat(e.target.value);
                  setWeights(nw);
                }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: a.color, width: 44, textAlign: "right" }}>
                {pct(normalized[i] ?? 0)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card fade-up">
          <div className="card-title" style={{ display: "flex", justifyContent: "space-between" }}>
            Portfolio Metrics {loading && <Spinner size={14} />}
          </div>
          {metrics.map(m => (
            <div key={m.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.label}</span>
              <span style={{ fontSize: 15, fontWeight: 500, color: m.color }}>{m.val}</span>
            </div>
          ))}
        </div>

        {evalResult && (
          <div className="card fade-up">
            <div className="card-title">Sharpe Efficiency vs Optimal</div>
            <div style={{
              fontSize: 28, fontWeight: 500, marginBottom: 10,
              color: efficiency > 80 ? "var(--green-lt)" : efficiency > 50 ? "var(--yellow-lt)" : "var(--red-lt)"
            }}>
              {efficiency.toFixed(1)}%
            </div>
            <div style={{ height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 4, width: `${efficiency}%`,
                background: efficiency > 80 ? "var(--green)" : efficiency > 50 ? "var(--yellow)" : "var(--red)",
                transition: "width 0.4s ease",
              }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-muted)" }}>
              Your Sharpe: {mySharpe.toFixed(3)} · Optimal: {optSharpe.toFixed(3)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}