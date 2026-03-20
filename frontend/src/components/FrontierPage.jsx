import { useMemo } from "react";
import { EmptyState } from "./ui.jsx";
import Plot from "react-plotly.js";

const DARK = {
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor:  "rgba(0,0,0,0)",
  font: { color: "#94a3b8", family: "DM Mono, monospace", size: 11 },
  xaxis: { gridcolor: "#1a2540", zerolinecolor: "#243352", title: "Annualized Risk (%)" },
  yaxis: { gridcolor: "#1a2540", zerolinecolor: "#243352", title: "Annualized Return (%)" },
  legend: { bgcolor: "rgba(0,0,0,0)", borderwidth: 0 },
  margin: { t: 20, r: 20, b: 55, l: 60 },
  hovermode: "closest",
};

export default function FrontierPage({ result }) {
  if (!result) return <EmptyState icon="◈" message="Run an optimization to see the Efficient Frontier" />;

  const { portfolios, max_sharpe, min_variance, frontier_curve } = result;

  const data = useMemo(() => {
    const cloud = {
      x: portfolios.map(p => +(p.risk * 100).toFixed(3)),
      y: portfolios.map(p => +(p.ret  * 100).toFixed(3)),
      mode: "markers",
      type: "scatter",
      name: "Monte Carlo Portfolios",
      marker: {
        size: 4,
        color: portfolios.map(p => p.sharpe),
        colorscale: [[0,"#0f1f4a"],[0.4,"#1d4ed8"],[0.7,"#3b82f6"],[1,"#fbbf24"]],
        showscale: true,
        colorbar: {
          title: { text: "Sharpe", font: { color: "#94a3b8" } },
          thickness: 10,
          tickfont: { color: "#94a3b8", size: 10 },
          len: 0.7,
        },
        opacity: 0.65,
      },
      hovertemplate: "Risk: %{x:.2f}%<br>Return: %{y:.2f}%<extra></extra>",
    };

    const curve = frontier_curve?.length ? {
      x: frontier_curve.map(p => +(p.risk * 100).toFixed(3)),
      y: frontier_curve.map(p => +(p.ret  * 100).toFixed(3)),
      mode: "lines",
      type: "scatter",
      name: "Efficient Frontier",
      line: { color: "#60a5fa", width: 2, dash: "dot" },
      hoverinfo: "skip",
    } : null;

    const maxS = max_sharpe ? {
      x: [+(max_sharpe.volatility * 100).toFixed(3)],
      y: [+(max_sharpe.expected_return * 100).toFixed(3)],
      mode: "markers+text",
      type: "scatter",
      name: "Max Sharpe",
      text: ["  ★ Max Sharpe"],
      textposition: "middle right",
      textfont: { color: "#fbbf24", size: 11 },
      marker: { color: "#fbbf24", size: 16, symbol: "star", line: { color: "#fff", width: 1 } },
      hovertemplate: `Max Sharpe<br>Return: ${(max_sharpe.expected_return*100).toFixed(2)}%<br>Risk: ${(max_sharpe.volatility*100).toFixed(2)}%<br>Sharpe: ${max_sharpe.sharpe_ratio.toFixed(3)}<extra></extra>`,
    } : null;

    const minV = min_variance ? {
      x: [+(min_variance.volatility * 100).toFixed(3)],
      y: [+(min_variance.expected_return * 100).toFixed(3)],
      mode: "markers+text",
      type: "scatter",
      name: "Min Variance",
      text: ["  ● Min Variance"],
      textposition: "middle right",
      textfont: { color: "#60a5fa", size: 11 },
      marker: { color: "#60a5fa", size: 14, symbol: "circle", line: { color: "#fff", width: 1 } },
      hovertemplate: `Min Variance<br>Return: ${(min_variance.expected_return*100).toFixed(2)}%<br>Risk: ${(min_variance.volatility*100).toFixed(2)}%<extra></extra>`,
    } : null;

    return [cloud, curve, maxS, minV].filter(Boolean);
  }, [portfolios, max_sharpe, min_variance, frontier_curve]);

  return (
    <div className="card fade-up">
      <div className="card-title">
        Efficient Frontier — {portfolios.length.toLocaleString()} simulated portfolios
        &nbsp;·&nbsp; RF rate: {(result.risk_free_rate * 100).toFixed(2)}%
      </div>
      <Plot
        data={data}
        layout={{ ...DARK, height: 480 }}
        config={{
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: ["lasso2d","select2d","autoScale2d"],
          displaylogo: false,
        }}
        style={{ width: "100%" }}
        useResizeHandler
      />
      <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 10, color: "var(--text-muted)" }}>
        <span>Gradient: Low Sharpe <span style={{ color: "#1d4ed8" }}>■</span> → High Sharpe <span style={{ color: "#fbbf24" }}>■</span></span>
        <span><span style={{ color: "#fbbf24" }}>★</span> Max Sharpe Ratio</span>
        <span><span style={{ color: "#60a5fa" }}>●</span> Min Variance</span>
      </div>
    </div>
  );
}