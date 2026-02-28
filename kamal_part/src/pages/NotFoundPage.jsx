import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "24px" }}>
      
      {/* Dice */}
      <div style={{ fontSize: "6rem", marginBottom: 24, animation: "bob 4s ease-in-out infinite" }}>🎲</div>

      {/* 404 */}
      <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "8rem", lineHeight: 1, marginBottom: 8, background: "linear-gradient(135deg, var(--yellow), #FF9500)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        404
      </h1>

      <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "2rem", marginBottom: 16, color: "white" }}>
        You Rolled Off the Board!
      </h2>

      <p style={{ color: "var(--text)", fontSize: "1rem", maxWidth: 400, lineHeight: 1.7, marginBottom: 40 }}>
        The page you're looking for doesn't exist. Looks like someone moved your token to an unknown square.
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <Link to="/">
          <button className="btn-play">🏠 Back to Home</button>
        </Link>
        <Link to="/play">
          <button className="btn-outline">🎲 Play Instead</button>
        </Link>
      </div>
    </div>
  );
}