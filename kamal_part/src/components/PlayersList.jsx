import { PLAYER_ICONS } from '../constants';

export default function PlayersList({ players, currentPlayerIndex }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="brand" style={{ fontSize: "1.1rem", marginBottom: 16 }}>Players</div>
      {players.map((p, i) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 10, marginBottom: 10, borderBottom: i < players.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.1rem" }}>{PLAYER_ICONS[p.color]}</span>
            <span style={{ fontSize: "0.875rem", fontWeight: 900, color: i === 2 ? "white" : "var(--text)" }}>
              {p.name} {i === 2 && <span style={{ color: "var(--blue)", fontSize: "0.7rem" }}>(You)</span>}
            </span>
            {i === currentPlayerIndex && (
              <span style={{ fontSize: "0.7rem", fontWeight: 900, padding: "2px 8px", borderRadius: 50, background: "rgba(46,213,115,0.15)", color: "var(--green)", border: "1px solid rgba(46,213,115,0.3)" }}>● Turn</span>
            )}
          </div>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text)" }}>{p.home}/4 home</span>
        </div>
      ))}
    </div>
  );
}