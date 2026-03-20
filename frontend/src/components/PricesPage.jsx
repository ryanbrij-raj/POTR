import { useEffect, useState } from "react";
import { usePriceHistory } from "../hooks/usePortfolioAPI.js";
import { LoadingOverlay, EmptyState, ErrorBanner } from "./ui.jsx";
import { ASSETS } from "./Controls.jsx";
import Plot from "react-plotly.js";

const DARK = {
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor:  "rgba(0,0,0,0)",
  font: { color: "#94a3b8", family: "DM Mono, monospace", size: 11 },
  xaxis: { gridcolor: "#1a2540", zerolinecolor: "#243352" },
  yaxis: { gridcolor: "#1a2540", zerolinecolor: "#243352", title: "Rebased Value (100 = start)" },
  legend: { bgcolor: "rgba(0,0,0,0.4)", bordercolor: "#1a2540", borderwidth: 1 },
  margin: { t: 20, r: 20, b: 55, l: 65 },
  hovermode: "x unified",
};

export default function PricesPage({ selectedTickers, period }) {
  const { data, loading, error, fetch } = usePriceHistory();
  const [fetched, setFetched] = useState(null);

  useEffect(() => {
    const key = selectedTickers.join(",") + period;
    if (key !== fetched && selectedTickers.length > 0) {
      fetch(selectedTickers, period);
      setFetched(key);
    }
  }, [selectedTickers, period]);

  if (loading) return <LoadingOverlay message="Fetching market data from yfinance..." />;
  if (error)   return <ErrorBanner message={error} />;
  if (!data)   return <EmptyState icon="📈" message="Select assets and run to load price history" />;

  const colors = ASSETS.filter(a => selectedTickers.includes(a.ticker)).map(a => a.color);

  const traces = Object.entries(data.prices).map(([ticker, vals], i) => {
    const base = vals[0] || 1;
    return {
      x: data.dates,
      y: vals.map(v => +((v / base) * 100).toFixed(2)),
      mode: "lines",
      name: ticker,
      line: { color: colors[i % colors.length], width: 1.8 },
      hovertemplate: `${ticker}: %{y:.1f}<extra></extra>`,
    };
  });

  traces.push({
    x: [data.dates[0], data.dates[data.dates.length - 1]],
    y: [100, 100],
    mode: "lines",
    name: "Baseline",
    line: { color: "#334155", width: 1, dash: "dot" },
    hoverinfo: "skip",
  });

  return (
    <div className="card fade-up">
      <div className="card-title">Price History · Rebased to 100 at start of period</div>
      <Plot
        data={traces}
        layout={{ ...DARK, height: 460 }}
        config={{ responsive: true, displayModeBar: true, displaylogo: false,
          modeBarButtonsToRemove: ["lasso2d","select2d","autoScale2d"] }}
        style={{ width: "100%" }}
        useResizeHandler
      />
    </div>
  );
}