import { AllocationBar, EmptyState } from "./ui.jsx";
import { ASSETS } from "./Controls.jsx";

function pct(v) { return `${(v * 100).toFixed(2)}%`; }

function PortfolioCard({ title, port, color, selectedTickers }) {
  if (!port) return null;
  const assets  = ASSETS.filter(a => selectedTickers.includes(a.ticker));
  const weights = assets.map(a => port.weights[a.ticker] ?? 0);

  const rows = [
    { label: "Expected Return",  val: pct(port.expected_return),           color: "var(--green-lt)" },
    { label: "Volatility (σ)",   val: pct(port.volatility),                color: "var(--red-lt)" },
    { label: "Sharpe Ratio",     val: port.sharpe_ratio.toFixed(3),        color: "var(--yellow-lt)" },
    { label: "VaR 95% (daily)",  val: pct(port.var_95),                    color: "var(--red-lt)" },
    { label: "CVaR 95% (daily)", val: pct(port.cvar_95),                   color: "var(--red-lt)" },
    { label: "Max Drawdown",     val: pct(Math.abs(port.max_drawdown)),    color: "var(--red-lt)" },
  ];

  return (
    <div className="card fade-up" style={{ borderTop: `2px solid ${color}` }}>
      <div className="card-title">{title}</div>
      <AllocationBar weights={weights} assets={assets} />

      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 9 }}>
        {assets.map((a, i) => (
          <div key={a.ticker} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: a.color, flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1 }}>
              {a.ticker} <span style={{ color: "var(--text-muted)", fontSize: 10 }}>· {a.name}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: weights[i] > 0.05 ? a.color : "var(--text-muted)" }}>
              {pct(weights[i])}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
        <div className="card-title">Risk / Return Metrics</div>
        {rows.map(r => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.label}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: r.color }}>{r.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AllocationPage({ result, selectedTickers }) {
  if (!result) return <EmptyState icon="◫" message="Run an optimization to see portfolio allocations" />;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <PortfolioCard title="MAX SHARPE RATIO PORTFOLIO"
        port={result.max_sharpe} color="var(--yellow-lt)" selectedTickers={selectedTickers} />
      <PortfolioCard title="MIN VARIANCE PORTFOLIO"
        port={result.min_variance} color="var(--blue-lt)" selectedTickers={selectedTickers} />
    </div>
  );
}