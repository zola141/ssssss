import React, { useState } from 'react';

export function DiceControl({
  multiplayer,
  playerColor,
  activePlayer,
  PLAYERS,
  BOT_PLAYERS,
  dice,
  bonus,
  rollCount,
  rollDiceForPlayer,
  diceSound
}) {
  const [rollingPlayer, setRollingPlayer] = useState(null);

  const handleDiceClick = () => {
    const currentColor = multiplayer ? playerColor : PLAYERS[activePlayer];
    if (!currentColor) {
      console.log("[Dice Button] No current color, returning");
      return;
    }
    setRollingPlayer(currentColor);
    rollDiceForPlayer(currentColor);
    setTimeout(() => setRollingPlayer(null), 600);
  };

  const isDisabled = 
    rollCount >= 2 ||
    bonus > 0 ||
    dice !== null ||
    (multiplayer && (!playerColor || activePlayer < 0)) ||
    (!multiplayer && (activePlayer < 0 || BOT_PLAYERS.includes(PLAYERS[activePlayer])));

  return (
    <div className="dice-control">
      <div className="current-player-info">
        {multiplayer ? (
          playerColor && PLAYERS[activePlayer] === playerColor ? (
            <div className="your-turn">Your Turn - {playerColor?.toUpperCase()}</div>
          ) : (
            <div className="waiting-turn">Waiting for {PLAYERS[activePlayer]?.toUpperCase()}</div>
          )
        ) : (
          <div className="current-turn">Current Turn: {PLAYERS[activePlayer]?.toUpperCase()}</div>
        )}
        {/* Debug Info */}
        <div style={{fontSize: '10px', color: '#888', marginTop: '4px'}}>
          activePlayer={activePlayer} | PLAYERS={JSON.stringify(PLAYERS)} | dice={dice}
        </div>
      </div>
      
      <button
        className={`dice-button ${
          multiplayer ? (playerColor ? "active" : "inactive") : (activePlayer >= 0 ? "active" : "inactive")
        }`}
        disabled={isDisabled}
        onClick={handleDiceClick}
      >
        <span className={`dice ${rollingPlayer ? "rolling" : ""}`}>
          {dice ? `🎲 ${dice}` : "🎲"}
        </span>
      </button>
      
      <div className="dice-info">
        {dice && <div className="dice-value">Rolled: {dice}</div>}
        {bonus > 0 && <div className="bonus-value">Bonus: +{bonus}</div>}
        <div className="roll-count">Rolls: {rollCount}/2</div>
      </div>
    </div>
  );
}
