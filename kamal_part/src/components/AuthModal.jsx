import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthModal({ mode, onClose, onSwitch }) {
  const isLogin = mode === "login";
  const [form, setForm] = useState({ name: "", email: "", username: "", password: "", gender: "" });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const inputStyle = {
    width: "100%", padding: "11px 16px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12, color: "#fff",
    fontFamily: "'Nunito', sans-serif", fontSize: "0.9rem",
    outline: "none", transition: "border-color 0.2s",
  };
  const labelStyle = {
    fontSize: "0.75rem", fontWeight: 900, color: "var(--text)",
    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6, display: "block",
  };

  const input_exemples = [
{ label: "Full Name", eg: "e.g. John Doe", type: "text", field: "name",     show: "signup" },
{ label: "Username",  eg: "e.g. KingSlayer99", type: "text", field: "username", show: "signup" },
{ label: "Email",     eg: "you@example.com", type: "email",  field: "email",    show: "both"   },
{ label: "Password",  eg: "••••••••", type: "password",      field: "password", show: "both"   },
  ]

  // send the login information to the backend

  const navigate = useNavigate();

  const submitForm = (e) => {
    e.preventDefault();
    console.log(form);
    return navigate('/profile');
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <form onSubmit= {submitForm} onClick={e => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: 440, padding: 36, position: "relative", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }}>

        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, width: 32, height: 32, color: "var(--text)", cursor: "pointer", fontSize: "1rem" }}>✕</button>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🎲</div>
          <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "1.8rem", color: "white", marginBottom: 6 }}>
            {isLogin ? "Welcome Back!" : "Join LudoX"}
          </h2>
          <p style={{ color: "var(--text)", fontSize: "0.875rem" }}>
            {isLogin ? "Log in to your account" : "Create your free account"}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {input_exemples.map((element) => {
            if (element.show === "signup" && isLogin) return null;
            return (
              <div key={element.field}>
                <label style={labelStyle}> {element.label} </label>
                <input style={inputStyle} type={element.type} placeholder={element.eg} value={form[element.field]} onChange={set(element.field)}
                  onFocus={e => e.target.style.borderColor = "var(--blue)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                  required
                  />
              </div>)
          })}

          {!isLogin && (
            <div>
              <label style={labelStyle}>Gender</label>
              <div style={{ display: "flex", gap: 10 }}>
                {["Male", "Female", "Other"].map(g => (
                  <button type="button" key={g} onClick={() => setForm(prev => ({ ...prev, gender: g }))}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 12, cursor: "pointer",
                      fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "0.85rem",
                      transition: "all 0.2s",
                      background: form.gender === g ? "rgba(46,134,255,0.25)" : "rgba(255,255,255,0.07)",
                      border: form.gender === g ? "1px solid var(--blue)" : "1px solid rgba(255,255,255,0.12)",
                      color: form.gender === g ? "var(--blue)" : "var(--text)",
                    }}>
                    {g === "Male" ? "♂ Male" : g === "Female" ? "♀ Female" : "⚧ Other"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLogin && (
            <div style={{ textAlign: "right", marginTop: -8 }}>
              <a href="#" style={{ fontSize: "0.8rem", color: "var(--blue)", fontWeight: 700 }}>Forgot password?</a>
            </div>
          )}

          <button className="btn-play" style={{ width: "100%", marginTop: 4, fontSize: "1rem", padding: "14px" }}>
            {isLogin ? "🎮 Log In" : "🎲 Create Account"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--text)", fontWeight: 700 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </div>

        <button type="button" style={{ width: "100%", padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}>
          <span>G</span> Continue with Google
        </button>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: "var(--text)" }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={onSwitch} style={{ background: "none", border: "none", color: "var(--yellow)", fontWeight: 900, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem" }}>
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </p>
      </form>
    </div>
  );
}