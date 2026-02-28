import { Link } from 'react-router-dom';

const features = [
  { icon: "⚡", color: "var(--blue)",   bg: "rgba(46,134,255,0.15)",  title: "Real-Time Multiplayer", desc: "Play live with up to 4 players instantly. Zero lag, smooth dice rolls and token movement." },
  { icon: "🏆", color: "var(--yellow)", bg: "rgba(255,211,42,0.15)",  title: "Ranked Tournaments",    desc: "Climb from Bronze to Diamond league. Daily and weekly tournaments with real prize pools." },
  { icon: "🎯", color: "var(--green)",  bg: "rgba(46,213,115,0.15)",  title: "Private Rooms",         desc: "Create a room, set your own rules, and invite friends with a simple link. Your game, your way." },
  { icon: "💰", color: "var(--red)",    bg: "rgba(255,71,87,0.15)",   title: "Cash Prizes",           desc: "Win real money in tournament mode. Instant payouts. Verified, secure, and fair play always." },
  { icon: "🎲", color: "var(--yellow)", bg: "rgba(255,211,42,0.15)",  title: "Certified Fair Dice",   desc: "Our RNG is independently audited. Every roll is provably random — no cheating, ever." },
  { icon: "📱", color: "var(--blue)",   bg: "rgba(46,134,255,0.15)",  title: "Play Anywhere",         desc: "Browser, mobile, desktop. Your game syncs everywhere so you never miss a turn." },
];

const stats = [
  { value: "1.2M+", label: "Active Players" },
  { value: "48K",   label: "Games Today"    },
  { value: "₦50M+", label: "Prize Pool Won" },
  { value: "4v4",   label: "Multiplayer"    },
];

export default function HomePage() {
  return (
    <div style={{ paddingTop: 80 }}>
      {/* Hero */}
      <section className="dots-bg" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 24px 64px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", fontSize: "3rem", opacity: 0.08, top: "15%", left: "8%" }} className="anim-bob">⚄</div>
        <div style={{ position: "absolute", fontSize: "2.5rem", opacity: 0.08, top: "25%", right: "10%", animationDelay: "1s" }} className="anim-bob">⚂</div>
        <div style={{ position: "absolute", fontSize: "2rem", opacity: 0.08, bottom: "20%", left: "12%", animationDelay: "0.5s" }} className="anim-bob">⚅</div>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div className="anim-spin" style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", border: "2px dashed var(--blue)", opacity: 0.05 }} />
          <div className="anim-spin-r" style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", border: "2px dashed var(--yellow)", opacity: 0.05 }} />
        </div>

        <div className="anim-up" style={{ display: "flex", gap: 12, marginBottom: 32 }}>
          {["red","blue","green","yellow"].map(c => (
            <div key={c} className={`token token-${c}`} style={{ width: 32, height: 32, borderRadius: 10 }} />
          ))}
        </div>

        <div className="anim-up hero-badge" style={{ marginBottom: 24 }}>🎮 The #1 Online Ludo Platform</div>

        <h1 className="anim-up" style={{ fontSize: "clamp(3rem,8vw,5.5rem)", lineHeight: 1.05, marginBottom: 24 }}>
          Roll the Dice.<br />
          <span className="text-shimmer">Rule the Board.</span>
        </h1>

        <p className="anim-up" style={{ color: "var(--text)", fontSize: "1.1rem", maxWidth: 480, lineHeight: 1.7, marginBottom: 40 }}>
          Play classic Ludo with players worldwide. Real-time multiplayer, tournaments, private rooms, and cash prizes — all for free.
        </p>

        <div className="anim-up" style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginBottom: 80 }}>
          <a href='/login'><button className="btn-play">🎲 Start Playing for Free</button></a>
        </div>

        <div className="anim-up" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, maxWidth: 600, width: "100%" }}>
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "white", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text)", fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "0 24px 96px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="hero-badge" style={{ marginBottom: 16 }}>Why LudoX?</div>
          <h2 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>More Than a Board Game.<br /><span style={{ color: "var(--yellow)" }}>It's a Battleground.</span></h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {features.map(f => (
            <div key={f.title} className="card card-hover" style={{ padding: 28 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: "1.15rem", marginBottom: 8, color: f.color, fontFamily: "'Fredoka One', cursive" }}>{f.title}</h3>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "0 24px 112px", display: "flex", justifyContent: "center" }}>
        <div style={{ maxWidth: 600, width: "100%", borderRadius: 28, textAlign: "center", padding: "64px 40px", position: "relative", overflow: "hidden", background: "linear-gradient(135deg,var(--navy3),var(--navy2))", border: "2px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
          <div style={{ position: "absolute", top: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "var(--blue)", opacity: 0.15, filter: "blur(40px)" }} />
          <div style={{ position: "absolute", bottom: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "var(--red)", opacity: 0.15, filter: "blur(40px)" }} />
          <div style={{ fontSize: "3rem", marginBottom: 16, position: "relative" }}>🎲</div>
          <h2 style={{ fontSize: "2.2rem", marginBottom: 16, position: "relative" }}>Your Next Win Is<br /><span style={{ color: "var(--yellow)" }}>One Roll Away</span></h2>
          <p style={{ color: "var(--text)", marginBottom: 32, position: "relative" }}>Join 1.2 million players already on the board. Always free.</p>
          <a href='/login'><button className="btn-play" style={{ position: "relative" }}>🎮 Start Playing for Free</button></a>
        </div>
      </section>
    </div>
  );
}