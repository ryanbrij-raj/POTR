import { useMemo } from "react";
import { EmptyState } from "./ui.jsx";
import { ASSETS } from "./Controls.jsx";
import Plot from "react-plotly.js";

const DARK = {
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor:  "rgba(0,0,0,0)",
  font: { color: "#94a3b8", family: "DM Mono, monospace", size: 11 },
  margin: { t: 20, r: 20, b: 20, l: 20 },
};

function estimateCorrFromMC(portfolios, tickers) {
  const n = tickers.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  const contributions = tickers.map((_, i) =>
    portfolios.map(p => (p.weights[tickers[i]] ?? 0) * p.ret)
  );
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const xi = contributions[i], xj = contributions[j];
      const mi = xi.reduce((a, b) => a + b, 0) / xi.length;
      const mj = xj.reduce((a, b) => a + b, 0) / xj.length;
      const covVal = xi.reduce((s, v, k) => s + (v - mi) * (xj[k] - mj), 0) / xi.length;
      const si = Math.sqrt(xi.reduce((s, v) => s + (v - mi) ** 2, 0) / xi.length);
      const sj = Math.sqrt(xj.reduce((s, v) => s + (v - mj) ** 2, 0) / xj.length);
      matrix[i][j] = si && sj ? +(covVal / (si * sj)).toFixed(2) : (i === j ? 1 : 0);
    }
  }
  return matrix;
}

export default function CorrelationPage({ result, selectedTickers }) {
  if (!result) return <EmptyState icon="⊞" message="Run an optimization to see the correlation matrix" />;

  const tickers = ASSETS.filter(a => selectedTickers.includes(a.ticker)).map(a => a.ticker);
  const matrix  = useMemo(() => estimateCorrFromMC(result.portfolios, tickers), [result, tickers]);

  return (
    <div className="card fade-up">
      <div className="card-title">Pairwise Correlation Matrix</div>
      <Plot
        data={[{
          type: "heatmap",
          x: tickers,
          y: tickers,
          z: matrix,
          colorscale: [[0,"#ef4444"],[0.5,"#1a2540"],[1,"#3b82f6"]],
          zmin: -1, zmax: 1,
          text: matrix.map(row => row.map(v => v.toFixed(2))),
          texttemplate: "%{text}",
          textfont: { size: 12, color: "#e2e8f0" },
          showscale: true,
          colorbar: {
            title: { text: "ρ", font: { color: "#94a3b8" } },
            thickness: 12,
            tickfont: { color: "#94a3b8", size: 10 },
          },
          hovertemplate: "%{y} × %{x}: %{z:.2f}<extra></extra>",
        }]}
        layout={{ ...DARK, height: 420, yaxis: { autorange: "reversed" } }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: "100%" }}
        useResizeHandler
      />
      <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 10, color: "var(--text-muted)" }}>
        <span><span style={{ color: "#ef4444" }}>■</span> Strong negative (−1)</span>
        <span><span style={{ color: "#64748b" }}>■</span> Uncorrelated (0)</span>
        <span><span style={{ color: "#3b82f6" }}>■</span> Strong positive (+1)</span>
      </div>
    </div>
  );
}