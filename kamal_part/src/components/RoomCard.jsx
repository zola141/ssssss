import { useNavigate } from 'react-router-dom';

export default function RoomCard({ room }) {
  const navigate = useNavigate();
  const isFull = room.status === "full";
  const progressPct = (room.players / room.max) * 100;
  const progressColor = isFull ? "var(--red)" : room.status === "waiting" ? "var(--yellow)" : "var(--green)";

  return (
    <div className={`card ${!isFull ? "card-hover" : ""}`} style={{ padding: 24, opacity: isFull ? 0.7 : 1 }} onClick={!isFull ? () => navigate('/play') : undefined}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span className={`status-${room.status}`}>
          {room.status === "open" ? "● OPEN" : room.status === "waiting" ? "⏳ WAITING" : "🔴 FULL"}
        </span>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text)" }}>{room.id}</span>
      </div>
      <div className="brand" style={{ fontSize: "1.2rem", marginBottom: 4 }}>{room.name}</div>
      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>{room.mode}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ display: "flex" }}>
          {room.colors.map((c, i) => (
            <div key={i} className={`token token-${c}`} style={{ width: 28, height: 28, marginLeft: i > 0 ? -8 : 0, border: "2px solid var(--navy2)" }} />
          ))}
          {Array(room.max - room.colors.length).fill(null).map((_, i) => (
            <div key={`e-${i}`} style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--navy3)", border: "2px solid var(--navy2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "var(--text)", fontWeight: 900, marginLeft: -8 }}>+</div>
          ))}
        </div>
        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text)" }}>{room.players}/{room.max} players</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: 16 }}>
        <div className="progress-fill" style={{ width: `${progressPct}%`, background: progressColor }} />
      </div>
      {isFull
        ? <button className="btn-sm" style={{ width: "100%", background: "rgba(255,255,255,0.07)", color: "var(--text)", cursor: "not-allowed" }}>Full — Watch 👁</button>
        : <button className="btn-sm btn-join" style={{ width: "100%", textAlign: "center" }}>Join Room →</button>
      }
    </div>
  );
}