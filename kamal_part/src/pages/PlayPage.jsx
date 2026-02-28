import { useState } from 'react';
import { INITIAL_PLAYERS, INITIAL_CHAT } from '../constants';
import LudoBoard from '../components/LudoBoard';
import DicePanel from '../components/DicePanel';
import PlayersList from '../components/PlayersList';
import MoveLog from '../components/MoveLog';
import ChatPanel from '../components/ChatPanel';

const YOU_INDEX = 2;

export default function PlayPage() {
  const [players]                           = useState(INITIAL_PLAYERS);
  const [currentPlayerIndex, setCurrentIdx] = useState(0);
  const [diceValue, setDiceValue]           = useState(null);
  const [rolled, setRolled]                 = useState(false);
  const [turnMsg, setTurnMsg]               = useState("🟢 Your Turn — Roll the dice!");
  const [turnType, setTurnType]             = useState("yours");
  const [moveLog, setMoveLog]               = useState([]);
  const [chatMessages, setChatMessages]     = useState(INITIAL_CHAT);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
    setMoveLog(prev => [{ msg, time }, ...prev].slice(0, 20));
  };

  const nextTurn = () => {
    setRolled(false);
    setDiceValue(null);
    setCurrentIdx(prev => {
      const next = (prev + 1) % 4;
      if (next === YOU_INDEX) {
        setTurnMsg("🟢 Your Turn — Roll the dice!");
        setTurnType("yours");
      } else {
        const bot = INITIAL_PLAYERS[next];
        setTurnMsg(`${bot.name}'s turn...`);
        setTurnType("waiting");
        setTimeout(() => {
          const val = Math.floor(Math.random() * 6) + 1;
          const icons = { red: "🔴", blue: "🔵", yellow: "🟡" };
          addLog(`${icons[bot.color] || "⚪"} ${bot.name} rolled ${val}`);
          setTimeout(() => setCurrentIdx(n => { nextTurn(); return n; }), 600);
        }, 1000 + Math.random() * 800);
      }
      return next;
    });
  };

  const handleRoll = () => {
    if (currentPlayerIndex !== YOU_INDEX || rolled) return;
    setRolled(true);
    let flashes = 0;
    const iv = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      if (++flashes > 8) {
        clearInterval(iv);
        const val = Math.floor(Math.random() * 6) + 1;
        setDiceValue(val);
        addLog(`🟢 AceJoker rolled a ${val}!`);
        setTurnMsg(`You rolled ${val}${val === 6 ? " — Roll again!" : " — Click a token"}`);
        setTurnType("yours");
        if (val !== 6) setTimeout(nextTurn, 900);
      }
    }, 80);
  };

  const handleChatSend = (msg) => {
    setChatMessages(prev => [...prev, { player: "AceJoker", color: "#2ED573", msg }]);
  };

  return (
    <div style={{ paddingTop: 88, paddingBottom: 64, padding: "88px 16px 64px" }}>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ flexShrink: 0 }}>
          <div className="card" style={{ padding: 20, width: "fit-content" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div className="brand" style={{ fontSize: "1.2rem", color: "white" }}>Room #4821</div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text)" }}>Classic Mode • 4 Players</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 50, background: "rgba(46,213,115,0.15)", border: "1px solid rgba(46,213,115,0.3)" }}>
                <div className="anim-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--green)" }}>LIVE</span>
              </div>
            </div>
            <LudoBoard players={players} />
            <DicePanel diceValue={diceValue} isPlayerTurn={currentPlayerIndex === YOU_INDEX} rolled={rolled} onRoll={handleRoll} turnMessage={turnMsg} turnType={turnType} />
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <PlayersList players={players} currentPlayerIndex={currentPlayerIndex} />
          <MoveLog logs={moveLog} />
          <ChatPanel messages={chatMessages} onSend={handleChatSend} />
        </div>
      </div>
    </div>
  );
}