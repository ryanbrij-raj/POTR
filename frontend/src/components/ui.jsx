export function Spinner({ size = 24, color = "var(--blue-lt)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="spin">
      <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2.5"
        strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
    </svg>
  );
}

export function StatCard({ label, value, sub, color = "var(--blue-lt)" }) {
  return (
    <div className="card fade-up" style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 500, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function AllocationBar({ weights, assets }) {
  return (
    <div className="alloc-bar">
      {assets.map((a, i) => {
        const w = weights[i] ?? 0;
        if (w < 0.005) return null;
        return (
          <div key={a.ticker} className="alloc-segment"
            style={{ width: `${w * 100}%`, background: a.color }}
            title={`${a.ticker}: ${(w * 100).toFixed(1)}%`}>
            {w > 0.09 ? `${(w * 100).toFixed(0)}%` : ""}
          </div>
        );
      })}
    </div>
  );
}

export function TickerChip({ asset, active, onClick }) {
  return (
    <button className={`ticker-chip ${active ? "active" : ""}`}
      style={active ? { color: asset.color, borderColor: asset.color, background: asset.color + "18" } : {}}
      onClick={onClick}>
      {asset.ticker}
    </button>
  );
}

export function EmptyState({ icon = "◈", message }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "60px 20px", color: "var(--text-muted)", fontSize: 13 }}>
      <span style={{ fontSize: 32, opacity: 0.3 }}>{icon}</span>
      <span>{message}</span>
    </div>
  );
}

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "var(--radius-md)", padding: "12px 16px", color: "var(--red-lt)", fontSize: 12, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <span>⚠ {message}</span>
      {onDismiss && <button onClick={onDismiss} style={{ background: "none", border: "none", color: "var(--red-lt)", cursor: "pointer", fontSize: 16 }}>×</button>}
    </div>
  );
}

export function LoadingOverlay({ message = "Running optimization..." }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "80px 20px" }}>
      <Spinner size={36} />
      <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{message}</div>
    </div>
  );
}