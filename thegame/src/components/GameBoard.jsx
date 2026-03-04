import React, { useState } from 'react';

export function GameBoard({
  PATHS,
  SIZE,
  pions,
  animatingPiece,
  multiplayer,
  playerColor,
  activePlayer,
  PLAYERS,
  playerIndex,
  dice,
  bonus,
  rollCount,
  canControlColor,
  movePawn,
  nextPlayer,
  allPionsForRendering,
  allPlayers,
  getCellType,
  getPionEmoji,
  centerPawns,
  isBlocked
}) {
  return (
    <div className="board">
      {multiplayer && (
        <div className="player-avatars">
          {["red", "green", "blue", "yellow"].map((color) => {
            const playerInfo = allPlayers[color];
            if (!playerInfo) return null;
            const isActive = PLAYERS[activePlayer] === color;
            const isYou = playerColor === color;
            return (
              <div
                key={color}
                className={`player-avatar ${color} ${isActive ? "active-turn" : ""} ${isYou ? "your-piece" : ""}`}
              >
                {isActive && (
                  <div className={`turn-badge ${color}`}>
                    ⭐ TURN
                  </div>
                )}
                <img
                  src={playerInfo.profileImageUrl || "https://via.placeholder.com/48x48?text=Avatar"}
                  alt={playerInfo.nickname || "Player"}
                />
                <div className="player-name">
                  {playerInfo.nickname || "Player"}
                  {isYou && <span className="you-label"> (You)</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {Array.from({ length: SIZE * SIZE }).map((_, index) => {
        const x = index % SIZE;
        const y = Math.floor(index / SIZE);
        const cell = getCellType(x, y);

        const pionsHere = [];
        const renderPions = multiplayer ? allPionsForRendering : pions;
        
        Object.keys(renderPions).forEach(color => {
          renderPions[color].forEach((pos, i) => {
            if (pos >= 0 && pos < PATHS[color].length) {
              const pionPos = PATHS[color][pos];
              if (pionPos.x === x && pionPos.y === y) {
                const isRemote = multiplayer && color !== playerColor;
                pionsHere.push({ color, index: i, isRemote });
              }
            }
          });
        });

        const isDouble = pionsHere.length >= 2;
        const isCenter = cell.type === "center";

        return (
          <div
            key={index}
            className={`cell ${cell.type}`}
            style={{
              backgroundColor: cell.color,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              padding: "2px",
              position: "relative",
            }}
          >
            {pionsHere.map((p, i) => {
              const size = isCenter ? "0.6em" : pionsHere.length >= 2 ? "0.7em" : "1.2em";

              const centerPosition = isCenter
                ? {
                    width: "50%",
                    textAlign: "center",
                  }
                : {};

              const isAnimating = animatingPiece && 
                                 animatingPiece.color === p.color && 
                                 animatingPiece.index === p.index;

              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <span
                    className={`pion ${isAnimating ? 'animating' : ''}`}
                    style={{
                      fontSize: size,
                      lineHeight: 1,
                      opacity: p.isRemote ? 0.6 : 1,
                      ...centerPosition,
                      cursor: p.isRemote ? "default" : "pointer",
                    }}
                    onClick={() => {
                      if (p.isRemote) return;

                      if (multiplayer) {
                        if (!playerColor) return;
                        if (p.color !== playerColor) return;
                        if (playerIndex !== activePlayer) return;
                      } else {
                        if (activePlayer < 0) return;
                        if (p.color !== PLAYERS[activePlayer]) return;
                      }

                      if (!dice && bonus === 0) return;

                      if (bonus > 0) {
                        movePawn(p.color, p.index, bonus);
                        // setBonus(0);
                        setTimeout(() => nextPlayer(), 800);
                        return;
                      }

                      if (dice !== null) {
                        movePawn(p.color, p.index, dice);
                        // setDice(null);

                        if (rollCount >= 2) {
                          setTimeout(() => nextPlayer(), 800);
                        }
                      }
                    }}
                  >
                    {getPionEmoji(p.color)}
                  </span>
                  {cell.type === "secure" && i === pionsHere.length - 1 && (
                    <span style={{
                      color: "gold",
                      fontSize: "14px",
                      fontWeight: "bold",
                      textShadow: "0 0 2px black",
                      pointerEvents: "none",
                      lineHeight: 1,
                    }}>★</span>
                  )}
                </div>
              );
            })}
            {cell.type === "secure" && pionsHere.length === 0 && (
              <span style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "gold",
                fontSize: "28px",
                fontWeight: "bold",
                textShadow: "0 0 3px black",
                pointerEvents: "none",
              }}>★</span>
            )}
          </div>
        );
      })}

      {/* Home sections for each color */}
      <HomeSections
        allPionsForRendering={allPionsForRendering}
        canControlColor={canControlColor}
        multiplayer={multiplayer}
        playerIndex={playerIndex}
        activePlayer={activePlayer}
        dice={dice}
        rollCount={rollCount}
        movePawn={movePawn}
        nextPlayer={nextPlayer}
      />

      {/* Center cell with finish slots */}
      <CenterCell
        centerPawns={centerPawns}
      />
    </div>
  );
}

function HomeSections({
  allPionsForRendering,
  canControlColor,
  multiplayer,
  playerIndex,
  activePlayer,
  dice,
  rollCount,
  movePawn,
  nextPlayer
}) {
  const colors = ['green', 'red', 'blue', 'yellow'];
  const colorClasses = {
    green: 'vert',
    red: 'rouge',
    blue: 'bleu',
    yellow: 'jaune'
  };

  return (
    <>
      {colors.map(color => (
        <div key={`${color}_home`} className={`${color}_home`}>
          <div className="posi_first">
            <span
              className={`item ${
                allPionsForRendering[color][0] === -1 ? colorClasses[color] : "beige"
              }`}
              onClick={() => handleHomeClick(color, 0, { allPionsForRendering, canControlColor, multiplayer, playerIndex, activePlayer, dice, rollCount, movePawn, nextPlayer })}
            />
            <span
              className={`item ${
                allPionsForRendering[color][1] === -1 ? colorClasses[color] : "beige"
              }`}
              onClick={() => handleHomeClick(color, 1, { allPionsForRendering, canControlColor, multiplayer, playerIndex, activePlayer, dice, rollCount, movePawn, nextPlayer })}
            />
          </div>
          <div className="posi_second">
            <span
              className={`item ${
                allPionsForRendering[color][2] === -1 ? colorClasses[color] : "beige"
              }`}
              onClick={() => handleHomeClick(color, 2, { allPionsForRendering, canControlColor, multiplayer, playerIndex, activePlayer, dice, rollCount, movePawn, nextPlayer })}
            />
            <span
              className={`item ${
                allPionsForRendering[color][3] === -1 ? colorClasses[color] : "beige"
              }`}
              onClick={() => handleHomeClick(color, 3, { allPionsForRendering, canControlColor, multiplayer, playerIndex, activePlayer, dice, rollCount, movePawn, nextPlayer })}
            />
          </div>
        </div>
      ))}
    </>
  );
}

function handleHomeClick(color, pawnIndex, props) {
  const { allPionsForRendering, canControlColor, multiplayer, playerIndex, activePlayer, dice, rollCount, movePawn, nextPlayer } = props;
  
  if (!canControlColor(color)) return;
  if (multiplayer && playerIndex !== activePlayer) return;
  if (dice === 5 && allPionsForRendering[color][pawnIndex] === -1) {
    movePawn(color, pawnIndex, dice);
    // setDice(null);
    if (rollCount >= 2) {
      setTimeout(() => nextPlayer(), 800);
    }
  }
}

function CenterCell({ centerPawns }) {
  const redPawns = centerPawns("red");
  const bluePawns = centerPawns("blue");
  const greenPawns = centerPawns("green");
  const yellowPawns = centerPawns("yellow");

  return (
    <div className="center-cell">
      <div className="tri red"></div>
      <div className="tri blue"></div>
      <div className="tri green"></div>
      <div className="tri yellow"></div>

      <div className="center-slot slot-red">
        {redPawns.map((_, i) => (
          <div key={i} className="pawn red" />
        ))}
      </div>

      <div className="center-slot slot-blue">
        {bluePawns.map((_, i) => (
          <div key={i} className="pawn blue" />
        ))}
      </div>

      <div className="center-slot slot-green">
        {greenPawns.map((_, i) => (
          <div key={i} className="pawn green" />
        ))}
      </div>

      <div className="center-slot slot-yellow">
        {yellowPawns.map((_, i) => (
          <div key={i} className="pawn yellow" />
        ))}
      </div>
    </div>
  );
}
