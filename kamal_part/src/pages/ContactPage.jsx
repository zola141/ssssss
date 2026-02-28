export default function ContactPage() {

  return (
    <div style={{ paddingTop: 100, paddingBottom: 80, padding: "100px 24px 80px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 48 }}>
        <div className="hero-badge" style={{ marginBottom: 16 }}>Get In Touch</div>
        <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "2.8rem", marginBottom: 12 }}>Contact Us</h1>
        <p style={{ color: "var(--text)", fontSize: "1rem", lineHeight: 1.7 }}>
          Have a question, found a bug, or want to report unfair play? We're here to help. Fill out the form below or reach us directly.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, maxWidth: 900 }}>
        {[
          { icon: "📧", title: "General Support",   value: "support@ludox.app",  desc: "Questions, feedback, and general inquiries" },
          { icon: "⚖️", title: "Legal & Privacy",   value: "legal@ludox.app",    desc: "Privacy, terms, and legal matters" },
          { icon: "🏆", title: "Tournament Issues", value: "prizes@ludox.app",   desc: "Tournament problems and prize payouts" },
          { icon: "📍", title: "Office Location",   value: "1337, Boujad, Morocco", desc: "Our headquarters" },
        ].map(item => (
          <div key={item.title} className="card" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: "2.5rem" }}>{item.icon}</div>
            <div style={{ fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text)" }}>{item.title}</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "white" }}>{item.value}</div>
            <p style={{ fontSize: "0.875rem", color: "var(--text)", margin: 0 }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}