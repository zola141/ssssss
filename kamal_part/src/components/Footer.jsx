import { NavLink } from 'react-router-dom';

const footerLinks = [
  { path: '/privacy', label: 'Privacy Policy' },
  { path: '/terms',   label: 'Terms of Service' },
  { path: '/contact', label: 'Contact' },
];

export default function Footer() {
  return (
    <footer style={{ padding: "40px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.07)", flexWrap: "wrap", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,var(--yellow),#FF9500)", display: "flex", alignItems: "center", justifyContent: "center" }}>🎲</div>
        <span className="brand" style={{ fontSize: "1.2rem", color: "white" }}>LudoX</span>
        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text)" }}>© 2026 All rights reserved</span>
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        {footerLinks.map(l => (
          <NavLink key={l.path} to={l.path} style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text)", textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text)"}>
            {l.label}
          </NavLink>
        ))}
      </div>
    </footer>
  );
}