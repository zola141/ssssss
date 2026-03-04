import { io } from 'socket.io-client';

/**
 * Initialize and manage game socket connection for multiplayer
 */
export function initializeGameSocket(
  multiplayer,
  gameType,
  onRoomJoined,
  onPlayersUpdated,
  onGameStart,
  onTurnUpdate,
  onMoveUpdate,
  onDiceRolled,
  onPlayerLeft,
  onGameFinished,
  onGameStateRecovery,
  setConnectionStatus,
  setReconnectAttempt,
  setReconnectTimeout,
  reconnectTimeoutRef,
  disconnectTimeRef
) {
  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get("roomCode");
  const token = sessionStorage.getItem("authToken") || params.get("token");
  const email = params.get("email");
  
  if (!multiplayer && !roomCode) return null;

  const newSocket = io('http://localhost:3000', {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10
  });

  // Register ALL event listeners BEFORE socket connects
  newSocket.on("connect", () => {
    console.log("[Socket] Connected! roomCode:", roomCode, "email:", email);
    setConnectionStatus("connected");
    setReconnectAttempt(0);
    setReconnectTimeout(false);
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (roomCode) {
      console.log("[Socket] Emitting join-room-code");
      newSocket.emit("join-room-code", { email, roomCode, token });
    } else {
      console.log("[Socket] Emitting join-room");
      newSocket.emit("join-room", { email, gameType, token });
    }
  });

  newSocket.on("connect_error", (error) => {
    console.error("[Socket] Connection error:", error);
    setConnectionStatus("connecting");
    setReconnectAttempt(prev => prev + 1);
  });

  newSocket.on("reconnect_attempt", (attempt) => {
    console.log("[Socket] Reconnection attempt:", attempt);
    setConnectionStatus("reconnecting");
    setReconnectAttempt(attempt);
    
    if (attempt >= 8) {
      setReconnectTimeout(true);
    }
  });

  newSocket.on("reconnect_error", (error) => {
    console.error("[Socket] Reconnection error:", error);
    setReconnectAttempt(prev => prev + 1);
  });

  newSocket.on("error", (err) => {
    console.error("[Socket] Error:", err);
    setConnectionStatus("error");
  });

  newSocket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
    disconnectTimeRef.current = Date.now();
    setConnectionStatus("disconnected");
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log("[Socket] Hard reconnection timeout");
      setReconnectTimeout(true);
    }, 60000);
  });

  newSocket.on("room-joined", onRoomJoined);
  newSocket.on("players-updated", onPlayersUpdated);
  newSocket.on("game-start", onGameStart);
  newSocket.on("turn-update", onTurnUpdate);
  newSocket.on("move-update", onMoveUpdate);
  newSocket.on("dice-rolled", onDiceRolled);
  newSocket.on("player-left", onPlayerLeft);
  newSocket.on("game-finished", onGameFinished);
  newSocket.on("game-state-recovery", onGameStateRecovery);

  return newSocket;
}

/**
 * Initialize chat socket for multiplayer
 */
export function initializeChatSocket(token, multiplayer, gameSocket) {
  if (multiplayer && gameSocket) {
    return gameSocket;
  }

  const newChatSocket = io('http://localhost:3000', {
    auth: { token },
    transports: ["websocket"]
  });

  return newChatSocket;
}

/**
 * Emit player move to other players
 */
export function emitPlayerMove(socket, multiplayer, playerColor, pionsState, moveSeq) {
  if (!socket || !multiplayer || !pionsState) return;
  
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");
  
  socket.emit("player-move", {
    pions: pionsState,
    email,
    playerColor,
    moveSeq,
    clientTs: Date.now()
  });
}

/**
 * Emit dice roll to other players
 */
export function emitDiceRoll(socket, multiplayer, diceValue) {
  if (!socket || !multiplayer) return;
  socket.emit("dice-roll", { value: diceValue });
}

/**
 * Emit turn pass to other players
 */
export function emitTurnNext(socket, multiplayer, playerColor) {
  if (!socket || !multiplayer) return;
  socket.emit("turn-next");
}

/**
 * Emit game end when player wins
 */
export function emitGameEnd(socket, multiplayer, gameData) {
  if (!socket || !multiplayer) return;
  socket.emit("game-end", gameData);
}

/**
 * Request game state recovery on reconnection
 */
export function requestGameStateRecovery(socket, email, roomId) {
  if (!socket) return;
  socket.emit("request-game-state", { email, roomId });
}
