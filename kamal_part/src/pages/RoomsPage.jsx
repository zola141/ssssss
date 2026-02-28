import { useNavigate } from 'react-router-dom';
import { ROOM_DATA } from '../constants';
import RoomCard from '../components/RoomCard';

export default function RoomsPage() {
  const navigate = useNavigate();
  return (
    <div style={{ paddingTop: 88, paddingBottom: 64, padding: "88px 24px 64px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: "2.2rem", fontFamily: "'Fredoka One', cursive" }}>Game Rooms 🎮</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text)", fontWeight: 700, marginTop: 4 }}>Jump into a room or create your own</p>
        </div>
        <button className="btn-play">+ Create Room</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
        {["All Rooms","Classic","Speed Blitz","Tournament","Private"].map((f, i) => (
          <button key={f} className="btn-sm" style={{ background: i === 0 ? "var(--blue)" : "rgba(255,255,255,0.07)", color: i === 0 ? "#fff" : "var(--text)", border: i === 0 ? "none" : "1px solid rgba(255,255,255,0.1)", boxShadow: i === 0 ? "0 4px 15px rgba(46,134,255,0.4)" : "none" }}>{f}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {ROOM_DATA.map(room => <RoomCard key={room.id} room={room} />)}
        <div className="card-hover" onClick={() => navigate('/play')} style={{ borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", border: "2px dashed rgba(255,255,255,0.15)", minHeight: 240, cursor: "pointer" }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>➕</div>
          <div className="brand" style={{ fontSize: "1.2rem", color: "var(--yellow)", marginBottom: 8 }}>Create Your Room</div>
          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text)" }}>Set your own rules and invite friends</div>
        </div>
      </div>
    </div>
  );
}