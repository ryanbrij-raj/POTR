import { TickerChip } from "./ui.jsx";

export const ASSETS = [
  { ticker: "AAPL",  name: "Apple",              color: "#60a5fa" },
  { ticker: "MSFT",  name: "Microsoft",           color: "#a78bfa" },
  { ticker: "GOOGL", name: "Alphabet",            color: "#34d399" },
  { ticker: "AMZN",  name: "Amazon",              color: "#fbbf24" },
  { ticker: "TSLA",  name: "Tesla",               color: "#f87171" },
  { ticker: "NVDA",  name: "NVIDIA",              color: "#fb923c" },
  { ticker: "META",  name: "Meta",                color: "#e879f9" },
  { ticker: "JPM",   name: "JPMorgan",            color: "#38bdf8" },
  { ticker: "BRK-B", name: "Berkshire Hathaway",  color: "#facc15" },
  { ticker: "GLD",   name: "Gold ETF",            color: "#d4a574" },
  { ticker: "TLT",   name: "20yr Treasury ETF",   color: "#6ee7b7" },
  { ticker: "SPY",   name: "S&P 500 ETF",         color: "#93c5fd" },
];

const PERIODS = ["6mo", "1y", "2y", "5y"];
const SIM_OPTIONS = [500, 2000, 5000];

export default function Controls({ selectedTickers, onToggle, period, onPeriod, simCount, onSimCount, onRun, loading }) {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
      <div className="card" style={{ flex: "1 1 340px" }}>
        <div className="card-title">Select Assets (min 2)</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ASSETS.map(a => (
            <TickerChip key={a.ticker} asset={a}
              active={selectedTickers.includes(a.ticker)}
              onClick={() => onToggle(a.ticker)} />
          ))}
        </div>
      </div>
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 220 }}>
        <div>
          <div className="card-title">Period</div>
          <div style={{ display: "flex", gap: 6 }}>
            {PERIODS.map(p => (
              <button key={p} className={`btn ${period === p ? "btn-active" : "btn-ghost"}`}
                style={{ padding: "5px 11px", fontSize: 11 }} onClick={() => onPeriod(p)}>{p}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="card-title">Simulations</div>
          <div style={{ display: "flex", gap: 6 }}>
            {SIM_OPTIONS.map(n => (
              <button key={n} className={`btn ${simCount === n ? "btn-active" : "btn-ghost"}`}
                style={{ padding: "5px 11px", fontSize: 11 }} onClick={() => onSimCount(n)}>{n.toLocaleString()}</button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={onRun}
          disabled={loading || selectedTickers.length < 2} style={{ marginTop: "auto" }}>
          {loading ? "⟳ Optimizing..." : "▶ Run Optimization"}
        </button>
      </div>
    </div>
  );
}