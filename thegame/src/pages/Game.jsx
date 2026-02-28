import { useState, useEffect, useRef, useMemo } from "react";
import diceSound from "../assets/sounds/dice.mp3";
import io from "socket.io-client";
import "./../styles/Game.css";

const SIZE = 15;
const CELL_SIZE = 40;

/* ===============================
   CELL TYPE
   =============================== */
function getCellType(x, y) {
  if (x >= 6 && x <= 8 && y >= 6 && y <= 8)
  {
      let radius = "";

      if (x === 6 && y === 6) radius = "top-left";
      if (x === 8 && y === 6) radius = "top-right";
      if (x === 6 && y === 8) radius = "bottom-left";
      if (x === 8 && y === 8) radius = "bottom-right";

      return { type: "center", color: "#9ca3af", radius };
  }  
  

  if ((y === 0 && x < 6) || (y >= 1 && y <= 5 && x === 0) || (x >= 1 && x <= 5 && y === 5) || (x === 5 && y >= 0 && y <= 5))
  {
      let radius = "";
      if (x === 0 && y === 0) radius = "top-left";
      if (x === 5 && y === 0) radius = "top-right";
      if (x === 0 && y === 5) radius = "bottom-left";
      if (x === 5 && y === 5) radius = "bottom-right";

      return { type: "home", color: "red", radius };
  } 
  
  if (x >= 1 && x <= 4 && y >= 1 && y <= 4)
    return { type: "home", color: "white" };

  if ((x >= 9 && y === 0) || (x === 9 && y >= 1 && y <= 5) || (y === 5 && x >= 10) || (x === 14 && y <= 4))
  {
      let radius = "";
      
     if (x === 9 && y === 0) radius = "top-left";
      if (x === 14 && y === 0) radius = "top-right";
      if (x === 9 && y === 5) radius = "bottom-left";
      if (x === 14 && y === 5) radius = "bottom-right";

      return { type: "home", color: "green", radius };
  }
  
  if (x > 8 && y < 6)
    return { type: "home", color: "white" };

  if ((y === 9 && x < 6) || (y >= 9 && x === 0) || (x >= 1 && x <= 5 && y === 14) || (x === 5 && y >= 9 && y <= 14))
   {
      let radius = "";
      if (x === 0 && y === 9) radius = "top-left";
      if (x === 5 && y === 9) radius = "top-right";
      if (x === 0 && y === 14) radius = "bottom-left";
      if (x === 5 && y === 14) radius = "bottom-right";

      return { type: "home", color: "blue", radius };
  }
    
  if (x < 6 && y > 8)
    return { type: "home", color: "white" };

  if ((x >= 9 && y === 9) || (x === 9 && y >= 10 && y <= 14) || (y === 14 && x >= 10) || (x === 14 && y >= 9 && y <= 13))
    {
      let radius = "";
      if (x === 9 && y === 9) radius = "top-left";
      if (x === 14 && y === 9) radius = "top-right";
      if (x === 9 && y === 14) radius = "bottom-left";
      if (x === 14 && y === 14) radius = "bottom-right";

      return { type: "home", color: "yellow", radius };
  }
  if (x > 8 && y > 8)
    return { type: "home", color: "white" };


  if ((x === 7 && y === 0) || (y === 7 && x === 0) || (x === 7 && y === 14) || (x === 14 && y === 7))
    return { type: "secure", color: "#cac7c3ff" };

  if ((x === 8 && y === 3) || (x === 12 && y === 8) || (x === 2 && y === 6) || (x === 6 && y === 11))
    return { type: "secure", color: "#cac7c3ff"};
  if (x === 12 && y === 6)
    return {type : "front_of_home", color: "green"};
  if (x >= 9 && x <= 13 && y === 7)
    return { type: "path_hor_green", color: "green" };
  if (x === 8 && y === 11)
      return {type: "front_of_home", color: "yellow"};
  if (y >= 9 && y <= 13 && x === 7)
    return { type: "path_vert_yellow", color: "yellow" };

  if (x === 6 && y === 3)
    return { type: "front_of_home", color: "red"};
  if (y >= 1 && y <= 5 && x === 7)
    return { type: "path_vert_red", color: "red" };
  if (x === 2 && y === 8)
    return{ type: "front_of_home", color: "blue"};
  if (x >= 1 && x <= 5 && y === 7)
    return { type: "path_hor_blue", color: "blue" };

  if (x >= 6 && x <= 8)
  {
     let radius = "";
    if (x === 6 && y === 0) radius = "top-left";
      if (x === 8 && y === 0) radius = "top-right";
      if (x === 6 && y === 14) radius = "bottom-left";
      if (x === 8 && y === 14) radius = "bottom-right";

      return { type: "path_vert", color: "white", radius };
  }
    
  if (y >= 6 && y <= 8)
  {
      let radius = "";
      if (x === 0 && y === 6) radius = "top-left";
      if (x === 14 && y === 6) radius = "top-right";
      if (x === 0 && y === 8) radius = "bottom-left";
      if (x === 14 && y === 8) radius = "bottom-right";

      return { type: "path_hor", color: "white", radius };
  }

  return { type: "empty", color: "#e6c28b" };
}

/* ===============================
   PATHS DES PIONS
   =============================== */
const PATHS = {
  red: [
    { x: 6, y: 3 }, { x: 6, y: 4 }, { x: 6, y: 5 }, { x: 5, y: 6 }, { x: 4, y: 6 },
    { x: 3, y: 6 }, { x: 2, y: 6 }, { x: 1, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 },
    { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 }, { x: 6, y: 9 },
    { x: 6, y: 10 }, { x: 6, y: 11 }, { x: 6, y: 12 }, { x: 6, y: 13 }, { x: 6, y: 14 },
    { x: 7, y: 14 }, { x: 8, y: 14 }, { x: 8, y: 13 }, { x: 8, y: 12 }, { x: 8, y: 11 },
    { x: 8, y: 10 }, { x: 8, y: 9 }, { x: 9, y: 8 }, { x: 10, y: 8 }, { x: 11, y: 8 },
    { x: 12, y: 8 }, { x: 13, y: 8 }, { x: 14, y: 8 }, { x: 14, y: 7 }, { x: 14, y: 6 },
    { x: 13, y: 6 }, { x: 12, y: 6 }, { x: 11, y: 6 }, { x: 10, y: 6 }, { x: 9, y: 6 },
    { x: 8, y: 5 }, { x: 8, y: 4 }, { x: 8, y: 3 }, { x: 8, y: 2 }, { x: 8, y: 1 },
    { x: 8, y: 0 }, { x: 7, y: 0 }, { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 },
    { x: 7, y: 4 }, { x: 7, y: 5 }, { x: 7, y: 6 },
  ],
  green: [
    { x: 12, y: 6},{ x: 11, y: 6 }, { x: 10, y: 6 }, { x: 9, y: 6}, { x: 8, y: 5}, { x: 8, y: 4}, { x: 8, y: 3},
    { x: 8, y: 2}, { x: 8, y: 1}, { x: 8, y: 0}, { x: 7, y: 0}, { x: 6, y: 0},
    { x: 6, y: 1 }, { x: 6, y: 2},
     { x: 6, y: 3}, { x: 6, y: 4}, { x: 6, y: 5}, { x: 5, y: 6}, { x: 4, y: 6}, { x: 3, y: 6},
    { x: 2, y: 6 }, { x: 1, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 7}, { x: 0, y: 8},
    { x: 1, y: 8}, { x: 2, y: 8 },{ x: 3, y: 8 },{ x: 4, y: 8 },{ x: 5, y: 8 },{ x: 6, y: 9},
    { x: 6, y: 10},{ x: 6, y: 11},{ x: 6, y: 12},{ x: 6, y: 13},{ x: 6, y: 14},{ x: 7, y: 14},
    { x: 8, y: 14},{ x: 8, y: 13},{ x: 8, y: 12},{ x: 8, y: 11},{ x: 8, y: 10},{ x: 8, y: 9},
    { x: 9, y: 8},{ x: 10, y: 8},{ x: 11, y: 8},{ x: 12, y: 8},{ x: 13, y: 8},{ x: 14, y: 8},
    { x: 14, y: 7},{ x: 13, y: 7},{ x: 12, y: 7},{ x: 11, y: 7},{ x: 10, y: 7},{ x: 9, y: 7},{ x: 8, y: 7},
  ],
  yellow: [
    { x: 8, y: 11},{ x: 8, y: 10}, { x: 8, y: 9 }, { x: 9, y: 8}, { x: 10, y: 8}, { x: 11, y: 8}, { x: 12, y: 8},
    { x: 13, y: 8},{ x: 14, y: 8},{ x: 14, y: 7},{ x: 14, y: 6},{ x: 13, y: 6},{ x: 12, y: 6},{ x: 11, y: 6},{ x: 10, y: 6},{ x: 9, y: 6},
    { x: 8, y: 5}, { x: 8, y: 4 }, { x: 8, y: 3 }, { x: 8, y: 2},{ x: 8, y: 1},{ x: 8, y: 0},{ x: 7, y: 0},{ x: 6, y: 0},{ x: 6, y: 1},{ x: 6, y: 2},
    { x: 6, y: 3 }, { x: 6, y: 4 }, { x: 6, y: 5 }, { x: 5, y: 6 }, { x: 4, y: 6 },
    { x: 3, y: 6 }, { x: 2, y: 6 }, { x: 1, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 },
    { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 }, { x: 6, y: 9 },
    { x: 6, y: 10 }, { x: 6, y: 11 }, { x: 6, y: 12 }, { x: 6, y: 13 }, { x: 6, y: 14 },{ x: 7, y: 14 },{ x: 7, y: 13 },
    { x: 7, y: 12},{ x: 7, y: 11},{ x: 7, y: 10},{ x: 7, y: 9},{ x: 7, y: 8},
  ],
  blue: [
    { x: 2, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 }, { x: 6, y: 9 },
    { x: 6, y: 10 }, { x: 6, y: 11 }, { x: 6, y: 12 }, { x: 6, y: 13 }, { x: 6, y: 14 },{ x: 7, y: 14 }, { x: 8, y: 14 }, { x: 8, y: 13 }, { x: 8, y: 12 }, { x: 8, y: 11 },
    { x: 8, y: 10 }, { x: 8, y: 9 }, { x: 9, y: 8 }, { x: 10, y: 8 }, { x: 11, y: 8 },
    { x: 12, y: 8 }, { x: 13, y: 8 }, { x: 14, y: 8 }, { x: 14, y: 7 }, { x: 14, y: 6 },
    { x: 13, y: 6 }, { x: 12, y: 6 }, { x: 11, y: 6 }, { x: 10, y: 6 }, { x: 9, y: 6 }, { x: 8, y: 5}, { x: 8, y: 4}, { x: 8, y: 3},
    { x: 8, y: 2}, { x: 8, y: 1}, { x: 8, y: 0}, { x: 7, y: 0}, { x: 6, y: 0},
    { x: 6, y: 1 }, { x: 6, y: 2},
     { x: 6, y: 3}, { x: 6, y: 4}, { x: 6, y: 5}, { x: 5, y: 6}, { x: 4, y: 6}, { x: 3, y: 6},
    { x: 2, y: 6 }, { x: 1, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 7}, { x: 1, y: 7}, { x: 2, y: 7}, { x: 3, y: 7}, { x: 4, y: 7}, { x: 5, y: 7}, { x: 6, y: 7}
  ]
};

/* ===============================
   EMOJI PAR COULEUR
   =============================== */
function getPionEmoji(color) {
  switch (color) {
    case "red": return "🔴";
    case "green": return "🟢";
    case "blue": return "🔵";
    case "yellow": return "🟡";
    default: return "⚪";
  }
}

/* ===============================
   PURE GAME LOGIC HELPERS
   =============================== */

/**
 * Check if a cell is safe (cannot capture)
 */
function isSafeCell(x, y) {
  const cellType = getCellType(x, y);
  return cellType.type === "secure" || cellType.type === "center";
}

/**
 * Check if path is blocked by 2+ pawns of same color
 */
function isPathBlocked(color, fromPos, toPos, state) {
  const path = PATHS[color];
  

  for (let i = fromPos + 1; i <= toPos && i < path.length; i++) {
    const cell = path[i];
    const cellType = getCellType(cell.x, cell.y);
    

    if (cellType.type === "center") continue;
    

    let count = 0;
    let blockingColor = null;
    
    Object.keys(state).forEach(c => {
      state[c].forEach(p => {
        if (p >= 0 && p < PATHS[c].length) {
          const pos = PATHS[c][p];
          if (pos && pos.x === cell.x && pos.y === cell.y) {
            count++;
            if (count >= 2 && !blockingColor) blockingColor = c;
          }
        }
      });
    });
    

    if (count >= 2) {
      return true;
    }
  }
  

  const targetCell = path[toPos];
  const targetType = getCellType(targetCell.x, targetCell.y);
  

  if (targetType.type === "secure") {
    let occupantColor = null;
    Object.keys(state).forEach(c => {
      state[c].forEach(p => {
        if (p >= 0 && p < PATHS[c].length) {
          const pos = PATHS[c][p];
          if (pos && pos.x === targetCell.x && pos.y === targetCell.y) {
            occupantColor = c;
          }
        }
      });
    });
    
    if (occupantColor && occupantColor !== color) {
      return true;
    }
  }
  

  if (targetType.type === "front_of_home") {
    let occupantColor = null;
    Object.keys(state).forEach(c => {
      state[c].forEach(p => {
        if (p >= 0 && p < PATHS[c].length) {
          const pos = PATHS[c][p];
          if (pos && pos.x === targetCell.x && pos.y === targetCell.y) {
            occupantColor = c;
          }
        }
      });
    });
    
    if (occupantColor && occupantColor === targetType.color) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get all legal moves for a color with given dice value
 * Returns array of {pawnIndex, fromPos, toPos, canCapture, entersCenter}
 */
function getLegalMoves(color, state, diceValue) {
  const moves = [];
  const lastIndex = PATHS[color].length - 1;
  
  state[color].forEach((pos, pawnIndex) => {

    if (pos === -1) {
      if (diceValue === 5) {
        const startCell = PATHS[color][0];
        

        let countAtStart = 0;
        state[color].forEach(p => {
          if (p >= 0 && p < PATHS[color].length) {
            const c = PATHS[color][p];
            if (c.x === startCell.x && c.y === startCell.y) {
              countAtStart++;
            }
          }
        });
        
        if (countAtStart < 2) {

          let canCapture = false;
          Object.keys(state).forEach(enemy => {
            if (enemy === color) return;
            state[enemy].forEach(p => {
              if (p >= 0 && p < PATHS[enemy].length) {
                const c = PATHS[enemy][p];
                if (c.x === startCell.x && c.y === startCell.y) {
                  canCapture = true;
                }
              }
            });
          });
          
          moves.push({
            pawnIndex,
            fromPos: -1,
            toPos: 0,
            canCapture,
            entersCenter: false
          });
        }
      }
      return;
    }
    

    const targetPos = pos + diceValue;
    

    if (targetPos > lastIndex) return;
    

    if (isPathBlocked(color, pos, targetPos, state)) return;
    

    const targetCell = PATHS[color][targetPos];
    const cellType = getCellType(targetCell.x, targetCell.y);
    let canCapture = false;
    
    if (!isSafeCell(targetCell.x, targetCell.y)) {
      Object.keys(state).forEach(enemy => {
        if (enemy === color) return;
        state[enemy].forEach(p => {
          if (p >= 0 && p < PATHS[enemy].length) {
            const c = PATHS[enemy][p];
            if (c.x === targetCell.x && c.y === targetCell.y) {
              canCapture = true;
            }
          }
        });
      });
    }
    
    moves.push({
      pawnIndex,
      fromPos: pos,
      toPos: targetPos,
      canCapture,
      entersCenter: targetPos === lastIndex
    });
  });
  
  return moves;
}

/**
 * Choose best move for bot (Medium difficulty)
 * Priority: 1. Capture, 2. Enter center, 3. Closest to finish, 4. Leave home
 */
function chooseBotMove(legalMoves, color, state) {
  if (legalMoves.length === 0) return null;
  

  const captureMoves = legalMoves.filter(m => m.canCapture);
  if (captureMoves.length > 0) {
    return captureMoves[0];
  }
  

  const centerMoves = legalMoves.filter(m => m.entersCenter);
  if (centerMoves.length > 0) {
    return centerMoves[0];
  }
  

  const boardMoves = legalMoves.filter(m => m.fromPos >= 0);
  if (boardMoves.length > 0) {
    boardMoves.sort((a, b) => b.fromPos - a.fromPos);
    return boardMoves[0];
  }
  

  const homeMoves = legalMoves.filter(m => m.fromPos === -1);
  if (homeMoves.length > 0) {
    return homeMoves[0];
  }
  
  return legalMoves[0];
}

/**
 * Check if turn should automatically pass
 */
function shouldPassTurn(rollCount, hasBonus, hasDice) {
  return rollCount >= 2 && !hasBonus && !hasDice;
}

/* ===============================
   GAME
   =============================== */
export default function Game({ players, bots, gameType, multiplayer }) {
  const [dice, setDice] = useState(null);
  const [bonus, setBonus] = useState(0);
  const [pions, setPions] = useState({
    red: [-1, -1, -1, -1],
    green: [-1, -1, -1, -1],
    blue: [-1, -1, -1, -1],
    yellow: [-1, -1, -1, -1],
  });
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [playerIndex, setPlayerIndex] = useState(null);
  const [remotePions, setRemotePions] = useState({});
  const [gameFinished, setGameFinished] = useState(false);
  const [gameWinner, setGameWinner] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [allPlayers, setAllPlayers] = useState({});
  const [resolvedGameType, setResolvedGameType] = useState(gameType);
  const [chatSocket, setChatSocket] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatView, setChatView] = useState("general");
  const [chatUsers, setChatUsers] = useState([]);
  const [chatFriends, setChatFriends] = useState([]);
  const [chatPending, setChatPending] = useState([]);
  const [dmTarget, setDmTarget] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [dmInput, setDmInput] = useState("");
  const [animatingPiece, setAnimatingPiece] = useState(null);

  const diceAudioRef = useRef(null);

  useEffect(() => {
    // Always run socket setup if roomCode exists (means multiplayer)
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get("roomCode");
    const token = params.get("token");
    const email = params.get("email");
    
    if (!multiplayer && !roomCode) return;

    const newSocket = io('http://localhost:3000', {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    // Register ALL event listeners BEFORE socket connects
    newSocket.on("connect", () => {
      console.log("[Socket] Connected! roomCode:", roomCode, "email:", email, "token:", token);

      if (roomCode) {
        console.log("[Socket] Emitting join-room-code with data:", { email, roomCode, token });
        newSocket.emit("join-room-code", { email, roomCode, token });
      } else {
        console.log("[Socket] Emitting join-room with data:", { email, gameType, token });
        newSocket.emit("join-room", { email, gameType, token });
      }
    });

    newSocket.on("error", (err) => {
      console.error("[Socket] Error:", err);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    newSocket.on("room-joined", (data) => {
      console.log("[room-joined] Received data:", data);
      setRoomId(data.roomId);
      setPlayerIndex(data.playerIndex);
      

      const gameTypeToUse = data.gameType || gameType;
      const finalGameType = gameTypeToUse === "1v1" ? "1v1" : "4-player";
      
      console.log("[room-joined] playerCount:", data.playerCount, "gameTypeFromServer:", data.gameType, "gameTypeFromURL:", gameType, "finalGameType:", finalGameType);
      console.log("[room-joined] Setting resolvedGameType to:", finalGameType);
      setResolvedGameType(finalGameType);
      

      const isOneVOne = finalGameType === "1v1" || data.playerCount === 2;
      const colorMap = { 
        2: ["red", "yellow"], 
        4: ["red", "green", "blue", "yellow"] 
      };
      const colors = colorMap[isOneVOne ? 2 : 4] || colorMap[4];
      

      const playerIdx = data.playerIndex ?? 0;
      const assignedColor = colors[playerIdx] || colors[0] || "red";
      console.log("[room-joined] Assigning color:", assignedColor, "for playerIdx:", playerIdx);
      
      setPlayerColor(assignedColor);
      

      if (isOneVOne) {
        console.log("[room-joined] Setting activePlayer to 0 (1v1 mode)");
        setActivePlayer(0);
      }
      

      if (data.players) {
        const playersMap = {};
        data.players.forEach((p, idx) => {
          playersMap[colors[idx] || colors[0]] = p;
        });
        setAllPlayers(playersMap);
        console.log("[room-joined] Set allPlayers:", playersMap);
      }
      
    });


    newSocket.on("players-updated", (data) => {
      const gameTypeToUse = data.gameType || resolvedGameType || gameType;
      if (data.gameType) {
        setResolvedGameType(data.gameType);
      }
      const colorMap = { 2: ["red", "yellow"], 4: ["red", "green", "blue", "yellow"] };
      const colors = colorMap[gameTypeToUse === "1v1" ? 2 : 4] || colorMap[4];
      if (data.players) {
        const playersMap = {};
        data.players.forEach((p, idx) => {
          playersMap[colors[idx] || colors[0]] = p;
        });
        setAllPlayers(playersMap);
      }
    });

    newSocket.on("game-start", (data) => {
      console.log("[game-start] Game started!", data);
      // Track game start time for duration calculation
      window.gameStartTime = Date.now();
      
      // Ensure resolvedGameType is set before activePlayer so PLAYERS array is computed correctly
      if (data.gameType) {
        console.log("[game-start] Setting resolvedGameType to:", data.gameType);
        setResolvedGameType(data.gameType);
      }
      console.log("[game-start] Setting activePlayer to 0");
      setActivePlayer(0);
      setDice(null);
      setBonus(0);
      setRollCount(0);
    });

    newSocket.on("turn-update", (data) => {
      console.log("[turn-update] Received:", data, "Setting activePlayer to:", data.turnIndex ?? 0);
      setActivePlayer(data.turnIndex ?? 0);
      setDice(null);
      setBonus(0);
      setRollCount(0);
      setConsecutiveSixes(0);
      setTurnLocked(false);
      console.log("Turn updated:", data);
    });

    newSocket.on("move-update", (data) => {
      console.log("[move-update received] email:", data.email, "pions:", data.pions);
      if (data.email !== email) {
        // Only update if it's from the opponent, not ourselves
        setRemotePions((prev) => ({
          ...prev,
          [data.email]: data.pions
        }));
      }
    });

    newSocket.on("dice-rolled", (data) => {
      if (typeof data?.value !== "number") return;
      setDice(data.value);
      if (data.color) {
        setDiceValues((prev) => ({ ...prev, [data.color]: data.value }));
      }
    });

    newSocket.on("player-left", (data) => {
      if (!data?.email) return;
      setRemotePions((prev) => {
        if (!prev[data.email]) return prev;
        const next = { ...prev };
        delete next[data.email];
        return next;
      });

      setAllPlayers((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((color) => {
          if (next[color]?.email === data.email) {
            delete next[color];
          }
        });
        return next;
      });
    });

    newSocket.on("game-finished", (data) => {
      setGameFinished(true);
      setGameWinner(data.winner);
    });

    newSocket.on("error", (msg) => {});

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [multiplayer, gameType]);


  useEffect(() => {
    if (!chatSocket) return;
    const handleHistory = (messages) => {
      if (Array.isArray(messages)) {
        setChatMessages(messages);
      }
    };
    const handleMessage = (message) => {
      setChatMessages((prev) => [...prev, message]);
    };

    chatSocket.on("chat-history", handleHistory);
    chatSocket.on("chat-message", handleMessage);

    return () => {
      chatSocket.off("chat-history", handleHistory);
      chatSocket.off("chat-message", handleMessage);
    };
  }, [chatSocket]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;

    if (multiplayer) {
      if (socket) {
        setChatSocket(socket);
      }
      return;
    }

    const newChatSocket = io('http://localhost:3000', {
      auth: { token },
      transports: ["websocket"]
    });

    setChatSocket(newChatSocket);

    return () => {
      newChatSocket.disconnect();
    };
  }, [socket, multiplayer]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;

    fetch(`/api/chat/rooms?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((rooms) => {
        if (!Array.isArray(rooms)) return;
        const general = rooms.find((r) => r.name === "general") || rooms[0];
        if (general?._id) setChatRoomId(general._id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!chatSocket || !chatRoomId) return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    chatSocket.emit("chat-join", { roomId: chatRoomId, token });
  }, [chatSocket, chatRoomId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;

    fetch(`/api/chat/users?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setChatUsers(data))
      .catch(() => {});

    fetch(`/api/chat/friends?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setChatFriends(data))
      .catch(() => {});

    fetch(`/api/chat/friends/pending?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setChatPending(data))
      .catch(() => {});
  }, [multiplayer]);

  useEffect(() => {
    if (!chatSocket) return;
    const handleDm = (dm) => {
      if (!dmTarget) return;
      if (dm.senderEmail === dmTarget.email || dm.receiverEmail === dmTarget.email) {
        setDmMessages((prev) => [...prev, dm]);
      }
    };
    chatSocket.on("dm-message", handleDm);
    return () => chatSocket.off("dm-message", handleDm);
  }, [chatSocket, dmTarget]);

  const loadDmHistory = (user) => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;
    setDmTarget(user);
    setDmMessages([]);
    fetch(`/api/chat/dm/${encodeURIComponent(user.email)}?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setDmMessages(data))
      .catch(() => {});
  };

  const sendFriendRequest = (email) => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;
    fetch(`/api/chat/friends/request/${encodeURIComponent(email)}?token=${encodeURIComponent(token)}`, { method: "POST" })
      .then(() => {
        // Refresh pending requests
        fetch(`/api/chat/friends/pending?token=${encodeURIComponent(token)}`)
          .then((r) => r.json())
          .then((data) => Array.isArray(data) && setChatPending(data));
        // Remove from available users list
        setChatUsers(prev => prev.filter(u => u.email !== email));
      })
      .catch(() => {});
  };

  const acceptFriendRequest = (email) => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;
    fetch(`/api/chat/friends/accept/${encodeURIComponent(email)}?token=${encodeURIComponent(token)}`, { method: "POST" })
      .then(() => {
        // Refresh friends list
        fetch(`/api/chat/friends?token=${encodeURIComponent(token)}`)
          .then((r) => r.json())
          .then((data) => Array.isArray(data) && setChatFriends(data));
        // Refresh pending requests
        fetch(`/api/chat/friends/pending?token=${encodeURIComponent(token)}`)
          .then((r) => r.json())
          .then((data) => Array.isArray(data) && setChatPending(data));
        // Remove from available users list
        setChatUsers(prev => prev.filter(u => u.email !== email));
      })
      .catch(() => {});
  };
  

  useEffect(() => {
    if (socket && multiplayer && pions && playerColor) {
      const params = new URLSearchParams(window.location.search);
      const email = params.get("email");
      socket.emit("player-move", { pions, email, playerColor });
    }
  }, [pions, socket, multiplayer, playerColor]);
  

  const allPionsForRendering = useMemo(() => {
    if (!multiplayer) return pions;
    

    const merged = {
      red: [-1, -1, -1, -1],
      green: [-1, -1, -1, -1],
      blue: [-1, -1, -1, -1],
      yellow: [-1, -1, -1, -1],
    };
    

    if (playerColor && pions[playerColor]) {
      merged[playerColor] = [...pions[playerColor]];
    }
    

    Object.entries(allPlayers).forEach(([color, player]) => {
      if (color !== playerColor && player && remotePions[player.email]) {
        const remotePionsForPlayer = remotePions[player.email];
        if (remotePionsForPlayer && remotePionsForPlayer[color]) {
          merged[color] = [...remotePionsForPlayer[color]];
        }
      }
    });
    
    return merged;
  }, [multiplayer, pions, remotePions, playerColor, allPlayers]);
  
  useEffect(() => {
    diceAudioRef.current = new Audio(diceSound);
  }, []);

  const [rollingPlayer, setRollingPlayer] = useState(null);

const effectiveGameType = multiplayer ? (resolvedGameType || gameType) : gameType;
const PLAYERS = useMemo(() => {
  const currentGameType = multiplayer ? (resolvedGameType || gameType) : gameType;
  console.log("[PLAYERS useMemo] multiplayer:", multiplayer, "resolvedGameType:", resolvedGameType, "gameType:", gameType, "currentGameType:", currentGameType);
  
  if (multiplayer) {
    const result = currentGameType === "1v1" ? ["red", "yellow"] : ["red", "green", "blue", "yellow"];
    console.log("[PLAYERS useMemo] Returning for multiplayer:", result);
    return result;
  }

  const humanPlayers = players && players.length > 0 ? players : ["red"];
  let botPlayers = bots && bots.length > 0 ? bots : [];
  
  // For 1v1 games without bots, automatically create yellow bot
  if (gameType === "1v1" && botPlayers.length === 0 && humanPlayers.includes("red")) {
    botPlayers = ["yellow"];
  }
  
  const allPlayers = [...humanPlayers, ...botPlayers];
  

  if (currentGameType === "1v1") {
    return allPlayers.includes("red") && allPlayers.includes("yellow") 
      ? ["red", "yellow"] 
      : allPlayers;
  }
  return allPlayers.length > 0 ? allPlayers : ["red", "green", "blue", "yellow"];
}, [multiplayer, resolvedGameType, gameType, players, bots]);

const BOT_PLAYERS = useMemo(() => {
  if (multiplayer) return [];
  
  // For 1v1 single player games without explicit bots, yellow is a bot
  if (gameType === "1v1" && (!bots || bots.length === 0)) {
    return ["yellow"];
  }
  
  return bots && bots.length > 0 ? bots : [];
}, [multiplayer, bots, gameType]);

const canControlColor = (color) => {
  if (multiplayer) {

    return playerColor === color;
  }

  return activePlayer >= 0 && PLAYERS[activePlayer] === color && !BOT_PLAYERS.includes(color);
};

  const [activePlayer, setActivePlayer] = useState(0);
  const [rollCount, setRollCount] = useState(0);
  const [diceValues, setDiceValues] = useState({
    red: null,
    green: null,
    blue: null,
    yellow: null,
  });
  const [consecutiveSixes, setConsecutiveSixes] = useState(0);
  const [turnLocked, setTurnLocked] = useState(false);


  useEffect(() => {
    setRollCount(0);
    setDice(null);
    setBonus(0);
    setConsecutiveSixes(0);
    setTurnLocked(false);
  }, [activePlayer]);


  useEffect(() => {
    if (multiplayer) return;
    if (activePlayer < 0) return;
    
    const color = PLAYERS[activePlayer];
    console.log("[Bot useEffect] Triggered - activePlayer:", activePlayer, "color:", color, "rollCount:", rollCount, "dice:", dice, "bonus:", bonus);
    
    if (!BOT_PLAYERS.includes(color)) {
      console.log("[Bot useEffect] Not a bot, returning");
      return;
    }

    const timer = setTimeout(() => {
      console.log("[Bot timeout] About to call botPlay for color:", color);
      botPlay(color);
    }, 800);

    return () => clearTimeout(timer);
  }, [activePlayer, dice, bonus, rollCount, PLAYERS, BOT_PLAYERS, multiplayer]);

  const [flag, setFlag] = useState(0);
  const COLORS = ["red", "green", "blue", "yellow"];
  const pionColor = COLORS[Math.floor(flag / 2) % 4];

  const isCenter = (cell) => cell.type === "center";

const countCenter = (color) =>
  pions[color].filter(pos => {
    if (pos === -1) return false;
    const cell = PATHS[color][pos];
    return isCenter(cell);
  }).length;

const centerPawns = (color) => {
  return pions[color].filter((pos) => {
    if (pos === -1) return false;
    const cell = PATHS[color][pos];
    return cell && getCellType(cell.x, cell.y).type === "center";
  });
};

  const rollDiceForPlayer = (color) => {
    console.log("[rollDiceForPlayer] Called with color:", color, "current PLAYERS[activePlayer]:", PLAYERS[activePlayer], "multiplayer:", multiplayer);

    // Prevent simultaneous rolls
    if (turnLocked) {
      console.log("[rollDiceForPlayer] Turn locked, returning");
      return;
    }

    if (multiplayer) {
      if (!playerColor) {
        console.log("[rollDiceForPlayer] No playerColor set, returning");
        return;
      }
      if (color !== playerColor) {
        console.log("[rollDiceForPlayer] Color mismatch, color:", color, "playerColor:", playerColor, "returning");
        return;
      }

    } else {
      if (activePlayer < 0) {
        console.log("[rollDiceForPlayer] activePlayer < 0, returning");
        return;
      }
      if (PLAYERS[activePlayer] !== color) {
        console.log("[rollDiceForPlayer] Color mismatch (single player), PLAYERS[activePlayer]:", PLAYERS[activePlayer], "color:", color, "returning");
        return;
      }
    }
    
    if (bonus > 0) {
      console.log("[rollDiceForPlayer] bonus > 0, returning");
      return;
    }
    if (rollCount >= 2) {
      console.log("[rollDiceForPlayer] rollCount >= 2, returning");
      return;
    }
    if (dice !== null) {
      console.log("[rollDiceForPlayer] dice !== null, returning");
      return;
    }

    console.log("[rollDiceForPlayer] All checks passed, rolling dice");
    setTurnLocked(true);
    const value = Math.floor(Math.random() * 6) + 1;

    if (diceAudioRef.current) {
      diceAudioRef.current.currentTime = 0;
      diceAudioRef.current.play();
    }

    setDice(value);
    setDiceValues(prev => ({ ...prev, [color]: value }));
    setRollCount(prev => prev + 1);
    
    // Handle consecutive sixes
    if (value === 6) {
      setConsecutiveSixes(prev => prev + 1);
    } else {
      setConsecutiveSixes(0);
    }
    
    if (socket && multiplayer) {
      socket.emit("dice-roll", { value });
    }

    setTimeout(() => {
      setTurnLocked(false);
    }, 300);


    const legalMoves = getLegalMoves(color, pions, value);
    const currentRollCount = rollCount + 1; // This is the count AFTER this roll
    
    if (legalMoves.length === 0) {
      // No legal moves available - clear dice after short delay to show roll result
      if (value === 6) {
        // Rolling 6 with no moves: reset roll count, allow rolling again
        setTimeout(() => {
          setDice(null);
          setRollCount(0);
        }, 800);
      } else {
        // Other values with no moves: clear dice
        if (currentRollCount >= 2) {
          // This was the 2nd roll, pass turn
          setTimeout(() => {
            setDice(null);
            nextPlayer();
          }, 800);
        } else {
          // This was the 1st roll, clear dice and allow another roll
          setTimeout(() => {
            setDice(null);
          }, 800);
        }
      }
    }
  };

const nextPlayer = () => {
  if (multiplayer) {

    if (socket && playerColor) {
      socket.emit("turn-next");
    }
    return;
  }


  setDice(null);
  setBonus(0);
  setRollCount(0);
  setConsecutiveSixes(0);
  setTurnLocked(false);

  setActivePlayer((prev) => (prev + 1) % PLAYERS.length);
};

const redPawns = centerPawns("red");
const bluePawns = centerPawns("blue");
const greenPawns = centerPawns("green");
const yellowPawns = centerPawns("yellow");

const isBlocked = (fromPos, toPos, color, state) => {
  const path = PATHS[color];

  for (let i = fromPos + 1; i <= toPos && i < path.length; i++) {
    const cell = path[i];
    const cellType = getCellType(cell.x, cell.y);

    if (cellType.type === "center") continue;

    let count = 0;
 
    Object.keys(state).forEach(c => {
      state[c].forEach(p => {
        if (p >= 0) {
          const pos = PATHS[c][p];
          if (pos && pos.x === cell.x && pos.y === cell.y) {
            count++;
          }
        }
      });
    });

    if (count >= 2) 
    {
        return true; 
    }
  }


  //const targetCell = path[toPos];
  const targetCell = PATHS[color][toPos];
  const targetType = getCellType(targetCell.x, targetCell.y);

  //if (targetType.type === "secure") {
    let occupantColor = null;

    Object.keys(state).forEach(c => {
      state[c].forEach(p => {
        if (p >= 0) {
          const pos = PATHS[c][p];
          if (pos && pos.x === targetCell.x && pos.y === targetCell.y) {
            occupantColor = c;
          }
        }
      });
    });
    if (targetType.type === "secure") {

    if (occupantColor && occupantColor !== color) {
      return true;
    }
    }
    if (targetType.type === "front_of_home")
    {
      if (occupantColor && occupantColor === targetType.color)
      {
        return true;
      }
    }
  return false;
};

  const findBlockIndex = (pionsState) => {
    let blockPos = -1;
    Object.keys(pionsState).forEach(color => {
      const counts = {};
      pionsState[color].forEach(pos => {
        if (pos >= 0) counts[pos] = (counts[pos] || 0) + 1;
      });
      Object.keys(counts).forEach(posStr => {
        const pos = Number(posStr);
        if (counts[pos] >= 2) {
          if (pos > blockPos) blockPos = pos;
        }
      });
    });
    return blockPos;
  };

  const movePawn = (color, index, move) => {
  if (multiplayer && playerColor && color !== playerColor) return;
  

  const animateStepByStep = async (startPos, steps, color, index, newState) => {
    setAnimatingPiece({ color, index });
    
    for (let step = 1; step <= steps; step++) {
      await new Promise(resolve => setTimeout(resolve, 250));
      
      setPions(prev => {
        const newPions = [...prev[color]];
        newPions[index] = startPos + step;
        return { ...prev, [color]: newPions };
      });
    }
    

    setPions(newState);
    setAnimatingPiece(null);
  };
  
  setPions(prev => {
    const newPions = [...prev[color]];
    let pos = newPions[index];
    let shouldAnimate = false;
    let animationStartPos = pos;

    if (pos === -1) {
  if (move !== 5) return prev;

  const newState = { ...prev };
  const startCell = PATHS[color][0];

  Object.keys(prev).forEach(enemy => {
    if (enemy === color) return;

    prev[enemy].forEach((p, i) => {
      if (p >= 0) {
        const c = PATHS[enemy][p];
        if (c.x === startCell.x && c.y === startCell.y) {
          newState[enemy][i] = -1;
          setBonus(10);
        }
      }
    });
  });

  const countAtStart = newState[color].filter(p => {
    if (p < 0) return false;
    const c = PATHS[color][p];
    return c.x === startCell.x && c.y === startCell.y;
  }).length;

  if (countAtStart >= 2) return prev;

  pos = 0;

}
  else {
  const lastIndex = PATHS[color].length - 1;
  let targetPos = pos + move;


  if (targetPos === lastIndex) {
    if (isBlocked(pos, targetPos, color, prev)) 
    {
        return prev;
    }
    pos = lastIndex;
    shouldAnimate = move > 1;
    animationStartPos = newPions[index];
  }
  
  else if (targetPos > lastIndex) {
    return prev;
  }
  
  else {
    if (isBlocked(pos, targetPos, color, prev)) 
    {
        return prev;
    }
    pos = targetPos;
    shouldAnimate = move > 1;
    animationStartPos = newPions[index];
  }
} 
const targetCell = PATHS[color][pos];
const cellType = getCellType(targetCell.x, targetCell.y);

const newState = { ...prev };


    if (cellType.type !== "secure" && cellType.type !== "front_of_home") {
      Object.keys(prev).forEach(enemy => {
        if (enemy === color) return;
        prev[enemy].forEach((p, i) => {
          if (p >= 0 && PATHS[enemy][p].x === targetCell.x && PATHS[enemy][p].y === targetCell.y) {
            newState[enemy][i] = -1;
            setBonus(10); 
          }
        });
      });
    }

    newPions[index] = pos;
    const finalState = { ...newState, [color]: newPions };
    

    setTimeout(() => {
      const won = finalState[color].every(p => p === PATHS[color].length - 1);
      if (won && multiplayer && socket) {
        // Get player emails from allPlayers
        const winnerEmail = allPlayers[color]?.email;
        const loserEmails = PLAYERS.filter(c => c !== color).map(c => allPlayers[c]?.email).filter(Boolean);
        
        console.log('[game-end] Winner color:', color, 'Winner email:', winnerEmail);
        console.log('[game-end] Loser emails:', loserEmails);
        
        if (winnerEmail) {
          socket.emit("game-end", {
            winner: winnerEmail,
            losers: loserEmails,
            winnerColor: color,
            finalPions: finalState,
            duration: Math.floor((Date.now() - (window.gameStartTime || Date.now())) / 60000) || 1, // duration in minutes
            winnerScore: 4, // All 4 pieces reached home
            loserScore: finalState[loserEmails[0]] ? finalState[PLAYERS.find(c => allPlayers[c]?.email === loserEmails[0])].filter(p => p === PATHS[PLAYERS.find(c => allPlayers[c]?.email === loserEmails[0])].length - 1).length : 0
          });
        }
      }
    }, 100);
    

    if (shouldAnimate) {
      setTimeout(() => {
        animateStepByStep(animationStartPos, move, color, index, finalState);
      }, 50);

      return prev;
    }
    
    return finalState;
  });
};

const botPlay = (color) => {
  console.log("[botPlay] Called for color:", color, "rollCount:", rollCount, "bonus:", bonus, "dice:", dice, "consecutiveSixes:", consecutiveSixes);

  // Check if three consecutive sixes - skip turn
  if (consecutiveSixes >= 3) {
    console.log("[botPlay] Three consecutive sixes! Skipping turn.");
    setConsecutiveSixes(0);
    nextPlayer();
    return;
  }

  // If we have a bonus move, try to make one
  if (bonus > 0) {
    const pawnIndex = findPlayablePawn(color, bonus);
    if (pawnIndex !== -1) {
      console.log("[botPlay] Making bonus move with value:", bonus);
      movePawn(color, pawnIndex, bonus);
      setBonus(0);
      return;
    } else {
      console.log("[botPlay] No valid bonus move available, clearing bonus");
      setBonus(0);
      return;
    }
  }

  // If we already rolled dice, try to move
  if (dice !== null) {
    const pawnIndex = findPlayablePawn(color, dice);
    if (pawnIndex !== -1) {
      console.log("[botPlay] Found playable pawn, moving with dice:", dice);
      movePawn(color, pawnIndex, dice);
      setDice(null);
      return;
    } else {
      console.log("[botPlay] No playable pawn with dice:", dice, "rollCount:", rollCount);
      // No move available with current dice
      if (rollCount >= 2) {
        // Already rolled twice, must pass turn
        console.log("[botPlay] No moves available and already rolled twice, passing turn");
        setDice(null);
        nextPlayer();
        return;
      } else {
        // Can roll again
        console.log("[botPlay] No moves available but can roll again");
        setDice(null);
        return;
      }
    }
  }

  // Try to roll if we haven't rolled twice yet and dice is null
  if (rollCount < 2 && dice === null && bonus === 0) {
    console.log("[botPlay] Rolling dice - rollCount:", rollCount);
    rollDiceForPlayer(color);
    return;
  }

  // If we've rolled twice and no dice/bonus, pass turn
  if (rollCount >= 2 && dice === null && bonus === 0) {
    console.log("[botPlay] Passed turn - already rolled twice with no moves");
    nextPlayer();
  }
};

const findPlayablePawn = (color, move) => {
  for (let i = 0; i < pions[color].length; i++) {
    const pos = pions[color][i];


    if (pos === -1) {
      if (move === 5) return i;
      continue;
    }

    const target = pos + move;
    const lastIndex = PATHS[color].length - 1;

    if (target > lastIndex) continue;

    if (isBlocked(pos, target, color, pions)) continue;


    return i;
  }

  return -1;
};

  const checkWin = color => {
    const hasWon = pions[color].every(pos => pos === PATHS[color].length - 1);
    

    if (hasWon && multiplayer && socket) {
      const losers = PLAYERS.filter(c => c !== color);
      
      // Get player emails from allPlayers
      const winnerEmail = allPlayers[color]?.email;
      const loserEmails = losers.map(c => allPlayers[c]?.email).filter(Boolean);
      
      console.log('[checkWin] Winner color:', color, 'Winner email:', winnerEmail);
      console.log('[checkWin] Loser emails:', loserEmails);
      
      if (winnerEmail) {
        socket.emit("game-end", {
          winner: winnerEmail,
          losers: loserEmails,
          winnerColor: color,
          finalPions: pions,
          duration: Math.floor((Date.now() - (window.gameStartTime || Date.now())) / 60000) || 1,
          winnerScore: 4,
          loserScore: 0
        });
      }
    }
    
    return hasWon;
  };

  const sendChatMessage = () => {
    if (!chatSocket || !chatRoomId) return;
    const message = chatInput.trim();
    if (!message) return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    chatSocket.emit("chat-message", { roomId: chatRoomId, token, content: message });
    setChatInput("");
  };

  const sendDmMessage = () => {
    if (!chatSocket || !dmTarget) return;
    const message = dmInput.trim();
    if (!message) return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    chatSocket.emit("dm-message", { token, toEmail: dmTarget.email, content: message });
    setDmInput("");
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <a href="/" className="logo">
            <div className="logo-icon">🎲</div>
            <span className="brand">Ludo</span>
          </a>
          <div className="nav-links">
            <a href="/">Home</a>
            <a href="/rooms">Rooms</a>
            <a href="/leaderboard">Leaderboard</a>
          </div>
        </div>
        <div className="navbar-right">
          <a href="/profile" className="btn-outline">Profile</a>
        </div>
      </nav>

      <div className="game-page">
        <h1>Parchisi 🎲</h1>
        {multiplayer && (
          <div className="turn-indicator">
            {activePlayer >= 0 && PLAYERS[activePlayer] ? (playerColor && PLAYERS[activePlayer] === playerColor
              ? `Your turn (${playerColor.toUpperCase()})`
              : `Waiting for ${PLAYERS[activePlayer]?.toUpperCase() || "..."}`): "Loading..."}
          </div>
        )}

      {/* Player Avatars Section */}
      {multiplayer && (
        <div style={{ 
          display: "flex", 
          gap: "15px", 
          marginBottom: "20px", 
          justifyContent: "center",
          flexWrap: "wrap"
        }}>
          {Object.entries(allPlayers).map(([color, playerInfo]) => (
            <div 
              key={color}
              style={{
                padding: "10px 15px",
                backgroundColor: color === playerColor ? "rgba(76, 175, 80, 0.3)" : "rgba(200, 200, 200, 0.2)",
                borderRadius: "8px",
                border: `2px solid ${color === playerColor ? "green" : color}`,
                textAlign: "center",
                minWidth: "120px"
              }}
            >
              {playerInfo.profileImageUrl ? (
                <img 
                  src={playerInfo.profileImageUrl} 
                  alt={playerInfo.nickname}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    marginBottom: "8px",
                    border: `2px solid ${color}`,
                    objectFit: "cover"
                  }}
                />
              ) : (
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  marginBottom: "8px",
                  backgroundColor: color,
                  display: "inline-block"
                }} />
              )}
              <div style={{ fontSize: "12px", fontWeight: "600" }}>
                {playerInfo.nickname || "Player"}
              </div>
              <div style={{ fontSize: "10px", color: color }}>
                {color.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="game-with-chat">
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
                <span
                key={i}
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
                    if (!playerColor) {
                      return;
                    }
                    if (p.color !== playerColor) {
                      return;
                    }
                    if (playerIndex !== activePlayer) {
                      return;
                    }
                  } else {

                    if (activePlayer < 0) {
                      return;
                    }

                    if (p.color !== PLAYERS[activePlayer]) {
                      return;
                    }
                  }
                  

                  if (!dice && bonus === 0) {
                    return;
                  }
                  

                  if (bonus > 0) {
                    movePawn(p.color, p.index, bonus);
                    setBonus(0);
                    setTimeout(() => nextPlayer(), 800);
                    return;
                  }


                  if (dice !== null) {
                    movePawn(p.color, p.index, dice);
                    setDice(null);

                    if (rollCount >= 2) {
                      setTimeout(() => nextPlayer(), 800);
                    }
                  }
                }}
                >
                {getPionEmoji(p.color)}
                </span>
            );
            })}
              {cell.type === "secure" && (
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
         <div className="green_home">
          <div className="posi_first">
              <span className={`item ${
                pions["green"][0] === -1 ? "vert" : "beige"
              }`} onClick={() => {
                if (!canControlColor("green")) return;
                if (multiplayer && playerIndex !== activePlayer) return;
                if (dice === 5 && pions["green"][0] === -1) {
                  movePawn("green", 0, dice);
                  setDice(null);
                  if (rollCount >= 2) {
                    setTimeout(() => nextPlayer(), 800);
                  }
                }
              }}> {/*getPionEmoji("green")*/}</span>
              <span className={`item ${
                pions["green"][1] === -1 ? "vert" : "beige"
              }`} onClick={() => {
                if (!canControlColor("green")) return;
                if (multiplayer && playerIndex !== activePlayer) return;
                if (dice === 5 && pions["green"][1] === -1) {
                  movePawn("green", 1, dice);
                  setDice(null);
                  if (rollCount >= 2) {
                    setTimeout(() => nextPlayer(), 800);
                  }
                }
              }}></span>
          </div>
            <div className="posi_second"> 
              <span className={`item ${
                pions["green"][2] === -1 ? "vert" : "beige"
              }`} onClick={() => {
                if (!canControlColor("green")) return;
                if (multiplayer && playerIndex !== activePlayer) return;
                if (dice === 5 && pions["green"][2] === -1) {
                  movePawn("green", 2, dice);
                  setDice(null);
                  if (rollCount >= 2) {
                    setTimeout(() => nextPlayer(), 800);
                  }
                }
              }}></span>
              <span className={`item ${
                pions["green"][3] === -1 ? "vert" : "beige"
              }`} onClick={() => {
                if (!canControlColor("green")) return;
                if (multiplayer && playerIndex !== activePlayer) return;
                if (dice === 5 && pions["green"][3] === -1) {
                  movePawn("green", 3, dice);
                  setDice(null);
                  if (rollCount >= 2) {
                    setTimeout(() => nextPlayer(), 800);
                  }
                }
              }}></span>
          </div>
        </div>

        <div className="red_home">
          <div className="posi_first">
              <span className={`item ${
                pions["red"][0] === -1 ? "rouge" : "beige"
              }`} onClick={() => {
                if (!canControlColor("red")) return;
                if (multiplayer && playerIndex !== activePlayer) return;
                if (dice === 5 && pions["red"][0] === -1) {
                  movePawn("red", 0, dice);
                  setDice(null);
                  if (rollCount >= 2) {
                    setTimeout(() => nextPlayer(), 800);
                  }
                }
              }}></span>
              <span className={`item ${
                pions["red"][1] === -1 ? "rouge" : "beige"
              }`} onClick={() => {
                if (!canControlColor("red")) return;
                if (multiplayer && playerIndex !== activePlayer) return;
                if (dice === 5 && pions["red"][1] === -1) {
                  movePawn("red", 1, dice);
                  setDice(null);
                  if (rollCount >= 2) {
                    setTimeout(() => nextPlayer(), 800);
                  }
                }
              }}></span>
          </div>
            <div className="posi_second"> 
              <span className={`item ${
                pions["red"][2] === -1 ? "rouge" : "beige"
              }`} onClick={() => {
                if (!canControlColor("red")) return;
                if (multiplayer && playerIndex !== activePlayer) return;
                if (dice === 5 && pions["red"][2] === -1) {
                  movePawn("red", 2, dice);
                  setDice(null);
                  if (rollCount >= 2) {
                    setTimeout(() => nextPlayer(), 800);
                  }
                }
              }}></span>
              <span className={`item ${
                pions["red"][3] === -1 ? "rouge" : "beige"
              }`} onClick={() => {
                if (!canControlColor("red")) return;
                if (multiplayer && playerIndex !== activePlayer) return;
                if (dice === 5 && pions["red"][3] === -1) {
                  movePawn("red", 3, dice);
                  setDice(null);
                  if (rollCount >= 2) {
                    setTimeout(() => nextPlayer(), 800);
                  }
                }
              }}></span>
          </div>
        </div>

        <div className="blue_home">
          <div className="posi_first">
              <span className={`item ${
                pions["blue"][0] === -1 ? "bleu" : "beige"
              }`} onClick={() => {
                if (!canControlColor("blue")) return;
                if (multiplayer && playerIndex !== activePlayer) return;
                if (dice === 5 && pions["blue"][0] === -1) {
                  movePawn("blue", 0, dice);
                  setDice(null);
                  if (rollCount >= 2) {
                    setTimeout(() => nextPlayer(), 800);
                  }
                }
              }}></span>
              <span className={`item ${
                pions["blue"][1] === -1 ? "bleu" : "beige"
              }`} onClick={() => {
                if (!canControlColor("blue")) return;
                if (multiplayer && playerIndex !== activePlayer) return;
                if (dice === 5 && pions["blue"][1] === -1) {
                  movePawn("blue", 1, dice);
                  setDice(null);
                  if (rollCount >= 2) {
                    setTimeout(() => nextPlayer(), 800);
                  }
                }
              }}></span>
          </div>
            <div className="posi_second"> 
              <span className={`item ${
                pions["blue"][2] === -1 ? "bleu" : "beige"
              }`} onClick={() => {
                if (!canControlColor("blue")) return;
                if (multiplayer && playerIndex !== activePlayer) return;
                if (dice === 5 && pions["blue"][2] === -1) {
                  movePawn("blue", 2, dice);
                  setDice(null);
                  if (rollCount >= 2) {
                    setTimeout(() => nextPlayer(), 800);
                  }
                }
              }}></span>
              <span className={`item ${
                pions["blue"][3] === -1 ? "bleu" : "beige"
              }`} onClick={() => {
                if (!canControlColor("blue")) return;
                if (multiplayer && playerIndex !== activePlayer) return;
                if (dice === 5 && pions["blue"][3] === -1) {
                  movePawn("blue", 3, dice);
                  setDice(null);
                  if (rollCount >= 2) {
                    setTimeout(() => nextPlayer(), 800);
                  }
                }
              }}></span>
          </div>
        </div>

        <div className="yellow_home">
          <div className="posi_first">
              <span className={`item ${
                pions["yellow"][0] === -1 ? "jaune" : "beige"
              }`} onClick={() => {
                if (!canControlColor("yellow")) return;
                if (multiplayer && playerIndex !== activePlayer) return;
                if (dice === 5 && pions["yellow"][0] === -1) {
                  movePawn("yellow", 0, dice);
                  setDice(null);
                  if (rollCount >= 2) {
                    setTimeout(() => nextPlayer(), 800);
                  }
                }
              }}></span>
              <span className={`item ${
                pions["yellow"][1] === -1 ? "jaune" : "beige"
              }`}  onClick={() => {
                if (!canControlColor("yellow")) return;
                if (multiplayer && playerIndex !== activePlayer) return;
                if (dice === 5 && pions["yellow"][1] === -1) {
                  movePawn("yellow", 1, dice);
                  setDice(null);
                  if (rollCount >= 2) {
                    setTimeout(() => nextPlayer(), 800);
                  }
                }
              }}></span>
          </div>
            <div className="posi_second"> 
              <span className={`item ${
                pions["yellow"][2] === -1 ? "jaune" : "beige"
              }`}  onClick={() => {
                if (!canControlColor("yellow")) return;
                if (multiplayer && playerIndex !== activePlayer) return;
                if (dice === 5 && pions["yellow"][2] === -1) {
                  movePawn("yellow", 2, dice);
                  setDice(null);
                  if (rollCount >= 2) {
                    setTimeout(() => nextPlayer(), 800);
                  }
                }
              }}></span>
              <span className={`item ${
                pions["yellow"][3] === -1 ? "jaune" : "beige"
              }`}  onClick={() => {
                if (!canControlColor("yellow")) return;
                if (multiplayer && playerIndex !== activePlayer) return;
                if (dice === 5 && pions["yellow"][3] === -1) {
                  movePawn("yellow", 3, dice);
                  setDice(null);
                  if (rollCount >= 2) {
                    setTimeout(() => nextPlayer(), 800);
                  }
                }
              }}></span>
          </div>
        </div>
    
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



</div>

        {/* Single Dice Control */}
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
              activePlayer={activePlayer} | playerIndex={playerIndex} | playerColor={playerColor} | PLAYERS={JSON.stringify(PLAYERS)}
            </div>
          </div>
          
          <button
            className={`dice-button ${
              multiplayer ? (playerColor ? "active" : "inactive") : (activePlayer >= 0 ? "active" : "inactive")
            }`}
            disabled={
              rollCount >= 2 ||
              bonus > 0 ||
              dice !== null ||
              (multiplayer && (!playerColor || playerIndex !== activePlayer)) ||
              (!multiplayer && (activePlayer < 0 || BOT_PLAYERS.includes(PLAYERS[activePlayer])))
            }
            onClick={() => {
              console.log("[Dice Button Click] rollCount:", rollCount, "bonus:", bonus, "dice:", dice, "playerColor:", playerColor, "activePlayer:", activePlayer, "PLAYERS[activePlayer]:", PLAYERS[activePlayer]);
              const currentColor = multiplayer ? playerColor : PLAYERS[activePlayer];
              if (!currentColor) {
                console.log("[Dice Button] No current color, returning");
                return;
              }
              setRollingPlayer(currentColor);
              rollDiceForPlayer(currentColor);
              setTimeout(() => setRollingPlayer(null), 600);
            }}
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

        <div className="chat-panel">
          <div className="chat-header">Room Chat</div>
          <div className="chat-tabs">
            <button className={chatView === "general" ? "active" : ""} onClick={() => setChatView("general")}>General</button>
            <button className={chatView === "friends" ? "active" : ""} onClick={() => setChatView("friends")}>Friends</button>
            <button className={chatView === "dm" ? "active" : ""} onClick={() => setChatView("dm")}>DM</button>
          </div>

          {chatView === "general" && (
            <>
              <div className="chat-messages">
                {chatMessages.length === 0 && (
                  <div className="chat-empty">No messages yet</div>
                )}
                {chatMessages.map((msg) => (
                  <div key={msg._id || `${msg.senderEmail}-${msg.createdAt}`} className="chat-message">
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderNickname}
                    />
                    <div>
                      <div className="chat-name">{msg.senderNickname}</div>
                      <div className="chat-text">{msg.content}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                />
                <button onClick={sendChatMessage}>Send</button>
              </div>
            </>
          )}

          {chatView === "friends" && (
            <div className="chat-friends">
              {chatPending.length > 0 && (
                <div className="chat-section">
                  <div className="chat-section-title">Friend Requests</div>
                  {chatPending.map((u) => (
                    <div key={u.email} className="chat-user">
                      <img src={u.profileImageUrl || "/default-avatar.svg"} alt={u.nickname} />
                      <span>{u.nickname}</span>
                      <button onClick={() => acceptFriendRequest(u.email)}>Accept</button>
                    </div>
                  ))}
                </div>
              )}
              {chatFriends.length > 0 && (
                <div className="chat-section">
                  <div className="chat-section-title">Friends</div>
                  {chatFriends.map((u) => (
                    <div key={u.email} className="chat-user">
                      <img src={u.profileImageUrl || "/default-avatar.svg"} alt={u.nickname} />
                      <span>{u.nickname}</span>
                      <span className={`friend-status ${u.isOnline ? "online" : "offline"}`}>
                        {u.isOnline ? "● Online" : "○ Offline"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="chat-section">
                <div className="chat-section-title">All Users</div>
                {chatUsers.map((u) => {
                  const isFriend = chatFriends.some(f => f.email === u.email);
                  const hasPendingRequest = chatPending.some(p => p.email === u.email);
                  if (isFriend) return null; // Don't show friends in all users
                  return (
                    <div key={u.email} className="chat-user">
                      <img src={u.profileImageUrl || "/default-avatar.svg"} alt={u.nickname} />
                      <span>{u.nickname}</span>
                      <button 
                        onClick={() => sendFriendRequest(u.email)}
                        disabled={hasPendingRequest}
                      >
                        {hasPendingRequest ? "Pending" : "Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {chatView === "dm" && (
            <div className="chat-dm">
              <div className="chat-dm-users">
                {chatFriends.map((u) => (
                  <button key={u.email} className={dmTarget?.email === u.email ? "active" : ""} onClick={() => loadDmHistory(u)}>
                    {u.nickname}
                  </button>
                ))}
              </div>
              <div className="chat-messages">
                {dmMessages.length === 0 && (
                  <div className="chat-empty">Select a friend to chat</div>
                )}
                {dmMessages.map((msg) => (
                  <div key={msg._id || `${msg.senderEmail}-${msg.createdAt}`} className="chat-message">
                    <img
                      src={msg.senderAvatar || "https://via.placeholder.com/28"}
                      alt={msg.senderNickname || msg.senderEmail}
                    />
                    <div>
                      <div className="chat-name">{msg.senderNickname || msg.senderEmail}</div>
                      <div className="chat-text">{msg.content}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  value={dmInput}
                  onChange={(e) => setDmInput(e.target.value)}
                  placeholder="Message..."
                  onKeyDown={(e) => e.key === "Enter" && sendDmMessage()}
                  disabled={!dmTarget}
                />
                <button onClick={sendDmMessage} disabled={!dmTarget}>Send</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {(checkWin(pionColor) || gameFinished) && (
        <h2>🎉 {(gameWinner || pionColor).toUpperCase()} a gagné !</h2>
      )}
      {gameFinished && (
        <button onClick={() => window.location.href = '/home'} style={{ marginTop: '20px', padding: '10px 20px' }}>
          Retour à la maison
        </button>
      )}
        {bonus > 0 && <p>💥 Bonus 10 pas disponible !</p>}
      </div>

      {/* Footer */}
      <footer>
        <div className="footer-left">
          <span className="nav-logo">🎲 Ludo</span>
          <span style={{opacity: 0.7}}>© 2024 All rights reserved</span>
        </div>
        <div className="footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/contact">Contact</a>
        </div>
      </footer>
    </>
  );
}