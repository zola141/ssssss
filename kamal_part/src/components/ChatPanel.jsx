import { useState, useEffect, useRef } from 'react';

export default function ChatPanel({ messages, onSend }) {
  const [input, setInput] = useState("");
  const chatBoxRef = useRef(null);
  const quickMessages = ["😂", "🔥", "💀", "👑", "🎲", "GG! 🤝"];

  useEffect(() => {
    if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="brand" style={{ fontSize: "1.1rem", marginBottom: 12 }}>Room Chat</div>

      <div ref={chatBoxRef} style={{ maxHeight: 130, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {messages.map((c, i) => (
          <div key={i} style={{ fontSize: "0.875rem" }}>
            <span style={{ fontWeight: 900, color: c.color }}>{c.player}: </span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{c.msg}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input className="chat-input" type="text" placeholder="Say something..." value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()} />
        <button className="btn-sm btn-blue" onClick={handleSend} style={{ padding: "8px 20px" }}>Send</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {quickMessages.map(msg => (
          <button key={msg} className="card card-hover" onClick={() => onSend(msg)}
            style={{ padding: "6px 12px", fontSize: msg.length > 2 ? "0.7rem" : "0.9rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "var(--text)", cursor: "pointer" }}>
            {msg}
          </button>
        ))}
      </div>
    </div>
  );
}