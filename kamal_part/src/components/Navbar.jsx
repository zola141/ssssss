import { NavLink } from 'react-router-dom';

const navLinks = [
  { path: '/',            label: 'Home',        end: true },
];

export default function Navbar() {
  const handleLogin = () => {
    window.location.href = '/login';
  };

  const handleSignUp = () => {
    window.location.href = '/register';
  };

  return (
    <>
      <nav className="navbar">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <NavLink to='/' style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,var(--yellow),#FF9500)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎲</div>
            <span className="brand" style={{ fontSize: "1.5rem", color: "white" }}>LudoX</span>
          </NavLink>

          {/* Links */}
          <div style={{ display: "flex", gap: 24 }}>
            {navLinks.map(link => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                style={({ isActive }) => ({
                  textDecoration: "none",
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: isActive ? 900 : 700,
                  fontSize: "0.9rem",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                  transition: "color 0.2s",
                })}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Auth buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="btn-outline" onClick={handleLogin} style={{ padding: "9px 22px", fontSize: "0.875rem" }}>
            Log In
          </button>
          <button className="btn-play" onClick={handleSignUp} style={{ padding: "9px 22px", fontSize: "0.875rem" }}>
            Sign Up
          </button>
        </div>
      </nav>
    </>
  );
}