import { useState, useCallback } from "react";
import "./index.css";
import { useOptimization }                        from "./hooks/usePortfolioAPI.js";
import Controls, { ASSETS }                       from "./components/Controls.jsx";
import { StatCard, ErrorBanner }                  from "./components/ui.jsx";
import FrontierPage    from "./components/FrontierPage.jsx";
import AllocationPage  from "./components/AllocationPage.jsx";
import PricesPage      from "./components/PricesPage.jsx";
import CorrelationPage from "./components/CorrelationPage.jsx";
import CustomPage      from "./components/CustomPage.jsx";
import SavedPage       from "./components/SavedPage.jsx";

const TABS = [
  { id: "frontier",    label: "Efficient Frontier" },
  { id: "allocation",  label: "Allocation" },
  { id: "prices",      label: "Price History" },
  { id: "correlation", label: "Correlation" },
  { id: "custom",      label: "Custom Portfolio" },
  { id: "saved",       label: "Saved" },
];

const DEFAULT_TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"];

export default function App() {
  const [selectedTickers, setSelectedTickers] = useState(DEFAULT_TICKERS);
  const [period,          setPeriod]          = useState("2y");
  const [simCount,        setSimCount]        = useState(2000);
  const [activeTab,       setActiveTab]       = useState("frontier");
  const { result, loading, error, run }       = useOptimization();

  const toggleTicker = useCallback((ticker) => {
    setSelectedTickers(prev =>
      prev.includes(ticker)
        ? prev.length > 2 ? prev.filter(t => t !== ticker) : prev
        : [...prev, ticker]
    );
  }, []);

  const handleRun = useCallback(() => {
    run({ tickers: selectedTickers, period, nPortfolios: simCount });
  }, [selectedTickers, period, simCount, run]);

  const ms = result?.max_sharpe;
  const mv = result?.min_variance;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 200,
        borderBottom: "1px solid var(--border)",
        background: "rgba(4,7,15,0.92)",
        backdropFilter: "blur(16px)",
        padding: "14px 32px",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17,
          }}>◈</div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, letterSpacing: -0.5 }}>
              POTR
              <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: 12, marginLeft: 8 }}>
                Portfolio Optimization Tool
              </span>
            </div>
            <div style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em", marginTop: 1 }}>
              Python · NumPy · Pandas · SciPy · Plotly · React · Flask · AWS · Docker
            </div>
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          {loading && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--yellow)", animation: "pulse 1s ease infinite", display: "inline-block" }} />
              Optimizing...
            </div>
          )}
          {result && !loading && (
            <span className="badge badge-green">
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
              {result.metadata?.trading_days} days · {result.portfolios?.length?.toLocaleString()} portfolios
            </span>
          )}
          <a href="http://localhost:5000/api/health" target="_blank" rel="noreferrer"
            className="badge badge-blue" style={{ textDecoration: "none" }}>
            API ↗
          </a>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px 60px" }}>
        <Controls
          selectedTickers={selectedTickers} onToggle={toggleTicker}
          period={period}     onPeriod={setPeriod}
          simCount={simCount} onSimCount={setSimCount}
          onRun={handleRun}   loading={loading}
        />

        {error && <ErrorBanner message={`Optimization failed: ${error}. Is the Flask backend running on :5000?`} />}

        {ms && mv && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
            <StatCard label="Max Sharpe Return"  value={`${(ms.expected_return*100).toFixed(2)}%`} sub={`Risk: ${(ms.volatility*100).toFixed(2)}%`}             color="var(--green-lt)" />
            <StatCard label="Max Sharpe Ratio"   value={ms.sharpe_ratio.toFixed(3)}                sub="Risk-adjusted return"                                    color="var(--yellow-lt)" />
            <StatCard label="Min Variance Risk"  value={`${(mv.volatility*100).toFixed(2)}%`}      sub={`Return: ${(mv.expected_return*100).toFixed(2)}%`}       color="var(--blue-lt)" />
            <StatCard label="VaR 95% (daily)"    value={`${(ms.var_95*100).toFixed(2)}%`}          sub="Max Sharpe portfolio"                                    color="var(--red-lt)" />
            <StatCard label="Max Drawdown"       value={`${(Math.abs(ms.max_drawdown)*100).toFixed(2)}%`} sub="Max Sharpe portfolio"                            color="var(--red-lt)" />
          </div>
        )}

        <div className="tab-bar">
          {TABS.map(t => (
            <button key={t.id} className={`tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {activeTab === "frontier"    && <FrontierPage    result={result} />}
        {activeTab === "allocation"  && <AllocationPage  result={result} selectedTickers={selectedTickers} />}
        {activeTab === "prices"      && <PricesPage      selectedTickers={selectedTickers} period={period} />}
        {activeTab === "correlation" && <CorrelationPage result={result} selectedTickers={selectedTickers} />}
        {activeTab === "custom"      && <CustomPage      result={result} selectedTickers={selectedTickers} period={period} />}
        {activeTab === "saved"       && <SavedPage       result={result} selectedTickers={selectedTickers} />}
      </main>
    </div>
  );
}