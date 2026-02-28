export default function MoveLog({ logs }) {
  return (
    <div className="card" style={{ padding: 20, maxHeight: 190, overflowY: "auto" }}>
      <div className="brand" style={{ fontSize: "1.1rem", marginBottom: 12 }}>Move Log</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {logs.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 8, fontSize: "0.75rem", color: "var(--text)" }}>
            <span style={{ flexShrink: 0, color: "rgba(200,214,240,0.4)" }}>{l.time}</span>
            <span>{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}