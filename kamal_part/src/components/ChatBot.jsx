import { useState, useRef, useEffect } from 'react';

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    text: "Hey! I'm LudoX AI 🎲 I can help you with game rules, tournaments, prizes, and anything about the platform. What do you need?",
  },
];

const QUICK_QUESTIONS = [
  "How do I play Ludo?",
  "How do tournaments work?",
  "How do I get my prize?",
  "What is a safe square?",
];

export default function ChatBot() {
  const [isOpen, setIsOpen]     = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const messagesEndRef          = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // ── Replace this function with your real API call when backend is ready ──
  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setLoading(true);

    // TODO: replace this block with your real fetch() call to your backend
    await new Promise(resolve => setTimeout(resolve, 1000)); // fake delay
    setMessages(prev => [...prev, {
      role: "assistant",
      text: " Backend under development🎲",
    }]);
    setLoading(false);
  };

  return (
    <>
      {/* ── Chat Window ── */}
      {isOpen && (
        <div style={{
          position: "fixed", bottom: 90, right: 24, zIndex: 150,
          width: 360, borderRadius: 24,
          background: "rgba(13,27,62,0.97)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          backdropFilter: "blur(20px)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          animation: "float-up 0.3s ease forwards",
        }}>

          {/* Header */}
          <div style={{
            padding: "16px 20px",
            background: "linear-gradient(135deg, #1a2f5a, #112247)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12,
                background: "linear-gradient(135deg, var(--yellow), #FF9500)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.2rem",
              }}>🎲</div>
              <div>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "1rem", color: "white" }}>LudoX AI</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
                  <span style={{ fontSize: "0.7rem", color: "var(--green)", fontWeight: 700 }}>Online</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, width: 30, height: 30, color: "var(--text)", cursor: "pointer", fontSize: "0.9rem" }}
            >✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12, maxHeight: 340 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "assistant" && (
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,var(--yellow),#FF9500)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0, marginRight: 8, alignSelf: "flex-end" }}>🎲</div>
                )}
                <div style={{
                  maxWidth: "75%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, var(--blue), #1a6fd4)"
                    : "rgba(255,255,255,0.07)",
                  border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
                  fontSize: "0.85rem",
                  color: "white",
                  lineHeight: 1.5,
                  fontWeight: 600,
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,var(--yellow),#FF9500)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}>🎲</div>
                <div style={{ padding: "10px 14px", borderRadius: "18px 18px 18px 4px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text)", animation: `pulse-ring 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions — only show at the start */}
          {messages.length === 1 && (
            <div style={{ padding: "0 16px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {QUICK_QUESTIONS.map(q => (
                <button
                  type="button"
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    padding: "6px 12px", borderRadius: 50, fontSize: "0.75rem", fontWeight: 700,
                    background: "rgba(46,134,255,0.12)", border: "1px solid rgba(46,134,255,0.3)",
                    color: "var(--blue)", cursor: "pointer", fontFamily: "'Nunito', sans-serif",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(46,134,255,0.25)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(46,134,255,0.12)"}
                >{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && sendMessage()}
              style={{
                flex: 1, padding: "10px 14px",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12, color: "#fff",
                fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem",
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: 40, height: 40, borderRadius: 12, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, var(--yellow), #FF9500)",
                fontSize: "1rem", flexShrink: 0,
                opacity: loading || !input.trim() ? 0.5 : 1,
                transition: "opacity 0.2s",
              }}
            >➤</button>
          </div>
        </div>
      )}

      {/* ── Floating Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 150,
          width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "linear-gradient(135deg, var(--yellow), #FF9500)",
          boxShadow: "0 8px 30px rgba(255,211,42,0.5)",
          fontSize: "1.5rem",
          transition: "transform 0.2s, box-shadow 0.2s",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(255,211,42,0.6)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(255,211,42,0.5)"; }}
      >
        {isOpen ? "✕" : "🎲"}
      </button>
    </>
  );
}