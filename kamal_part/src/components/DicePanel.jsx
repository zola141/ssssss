import { DICE_FACES } from '../constants';

export default function DicePanel({ diceValue, isPlayerTurn, rolled, onRoll, turnMessage, turnType }) {
  const face = diceValue ? DICE_FACES[diceValue] : "🎲";
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: "3rem", cursor: "pointer", userSelect: "none" }}>{face}</div>
          <div>
            <div style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", color: "var(--text)" }}>Your Roll</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--yellow)" }}>
              {diceValue ? `${diceValue}${diceValue === 6 ? " ⚡" : ""}` : "—"}
            </div>
          </div>
        </div>
        <button className="btn-play" onClick={onRoll} disabled={!isPlayerTurn || rolled} style={{ opacity: (!isPlayerTurn || rolled) ? 0.5 : 1 }}>
          🎲 Roll!
        </button>
      </div>
      <div className={turnType === "yours" ? "turn-yours" : "turn-waiting"} style={{ marginTop: 16 }}>
        {turnMessage}
      </div>
    </div>
  );
}