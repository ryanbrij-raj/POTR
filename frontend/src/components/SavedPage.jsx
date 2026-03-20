import { useEffect, useState } from "react";
import { useSavedPortfolios } from "../hooks/usePortfolioAPI.js";
import { AllocationBar, EmptyState, ErrorBanner, Spinner } from "./ui.jsx";
import { ASSETS } from "./Controls.jsx";

function pct(v) { return `${(v * 100).toFixed(2)}%`; }

export default function SavedPage({ result, selectedTickers }) {
  const { portfolios, load, save, remove } = useSavedPortfolios();
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);
  const [name,   setName]   = useState("");

  useEffect(() => { load(); }, []);

  const assets = ASSETS.filter(a => selectedTickers.includes(a.ticker));

  const handleSave = async (type) => {
    const port = type === "sharpe" ? result?.max_sharpe : result?.min_variance;
    if (!port) return;
    setSaving(true); setError(null);
    try {
      await save({
        name: name || `${type === "sharpe" ? "Max Sharpe" : "Min Variance"} — ${new Date().toLocaleDateString()}`,
        tickers: assets.map(a => a.ticker),
        weights: port.weights,
        metrics: {
          expected_return: port.expected_return,
          volatility:      port.volatility,
          sharpe_ratio:    port.sharpe_ratio,
        },
      });
      setName("");
    } catch (e) { setError(e.message); }
    finally     { setSaving(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {result && (
        <div className="card fade-up">
          <div className="card-title">Save Current Optimization Result</div>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Portfolio name (optional)..."
              style={{
                flex: 1, minWidth: 200,
                background: "var(--bg-card)", border: "1px solid var(--border-bright)",
                borderRadius: "var(--radius-md)", padding: "8px 14px",
                color: "var(--text-primary)", fontSize: 12,
                fontFamily: "var(--font-mono)", outline: "none",
              }} />
            <button className="btn btn-primary" onClick={() => handleSave("sharpe")} disabled={saving}>
              {saving ? <Spinner size={12} /> : "Save Max Sharpe"}
            </button>
            <button className="btn btn-ghost" onClick={() => handleSave("variance")} disabled={saving}>
              Save Min Variance
            </button>
          </div>
        </div>
      )}

      <div className="card-title" style={{ paddingLeft: 4 }}>
        Saved Portfolios ({portfolios.length})
      </div>

      {portfolios.length === 0 && (
        <EmptyState icon="🗂" message="No saved portfolios yet. Run an optimization and save it above." />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))", gap: 14 }}>
        {portfolios.map(p => {
          const tickAssets = ASSETS.filter(a => p.tickers.includes(a.ticker));
          const wArr = tickAssets.map(a => p.weights[a.ticker] ?? 0);
          return (
            <div key={p.id} className="card fade-up">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{new Date(p.created_at).toLocaleString()}</div>
                </div>
                <button onClick={() => remove(p.id)} style={{
                  background: "none", border: "none", color: "var(--text-muted)",
                  cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px",
                }}>×</button>
              </div>
              <AllocationBar weights={wArr} assets={tickAssets} />
              <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                {[
                  { l: "Return", v: pct(p.metrics.expected_return ?? 0), c: "var(--green-lt)" },
                  { l: "Risk",   v: pct(p.metrics.volatility ?? 0),      c: "var(--red-lt)" },
                  { l: "Sharpe", v: (p.metrics.sharpe_ratio ?? 0).toFixed(3), c: "var(--yellow-lt)" },
                ].map(m => (
                  <div key={m.l}>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em" }}>{m.l}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: m.c }}>{m.v}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}