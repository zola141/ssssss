import { GameRoom, User, ChatMessage, DirectMessage } from "../models/index.js";
import { authTokens } from "../middleware/auth.js";
import { checkAndUnlockAchievements, markUserOnline, markUserOffline } from "../utils/helpers.js";
import { GRACE_PERIOD } from "../config.js";

export const initializeSocketHandlers = (io, gameRooms, playerSockets, onlineUsers) => {
  io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    const handshakeToken = socket.handshake?.auth?.token;
    if (handshakeToken && authTokens.has(handshakeToken)) {
      const auth = authTokens.get(handshakeToken);
      socket.data.userEmail = auth.email;
      markUserOnline(onlineUsers, auth.email);
    }

    socket.on("join-room", (data) => {
      const { email, gameType, token } = data;
      
      if (!authTokens.has(token)) {
        socket.emit("error", "Invalid token");
        return;
      }

      let room = Array.from(gameRooms.values()).find(
        (r) => r.gameType === "1v1" && r.players.length < 2 && r.status === "waiting"
      );

      if (!room) {
        const roomId = Math.random().toString(36).substring(7);
        room = {
          id: roomId,
          gameType: "1v1",
          players: [],
          status: "waiting",
          gameState: {}
        };
        gameRooms.set(roomId, room);
      }

      const turnOrder = ["red", "yellow"];
      const playerIndex = room.players.length;
      const playerColor = turnOrder[playerIndex];
      room.players.push({ email, socketId: socket.id, userId: authTokens.get(token).userId, color: playerColor });
      playerSockets.set(socket.id, { email, roomId: room.id });

      socket.join(room.id);
      socket.emit("room-joined", { roomId: room.id, players: room.players, playerIndex, playerCount: room.players.length, gameType: "1v1", gameInProgress: room.status === "playing" });

      const cleanPlayersQuick = room.players.map(p => ({
        email: p.email,
        socketId: p.socketId,
        nickname: p.nickname,
        color: p.color,
        profileImageUrl: p.profileImageUrl,
        userId: p.userId
      }));

      io.to(room.id).emit("players-updated", { players: cleanPlayersQuick, playerCount: cleanPlayersQuick.length, gameType: "1v1" });

      if (room.players.length === 2) {
        room.status = "playing";
        room.turnOrder = turnOrder;
        room.turnIndex = 0;
        io.to(room.id).emit("game-start", { players: room.players });
        io.to(room.id).emit("turn-update", { activeColor: room.turnOrder[room.turnIndex], turnIndex: room.turnIndex, turnOrder: room.turnOrder });
      }
    });

    socket.on("join-room-code", async (data) => {
      const { roomCode, email, token } = data;

      if (!authTokens.has(token)) {
        socket.emit("error", "Invalid token");
        return;
      }

      try {
        const room = await GameRoom.findOne({ roomCode });
        if (!room) {
          socket.emit("error", "Room not found");
          return;
        }

        const isRoomMember = room.players.some((player) => player.email === email);
        if (!isRoomMember) {
          socket.emit("error", "You are not a member of this room");
          return;
        }

        if (room.players.length > room.maxPlayers) {
          socket.emit("error", "Room is full");
          return;
        }

        const colors = ["red", "yellow"];

        let internalRoom = Array.from(gameRooms.values()).find((r) => r.roomCode === roomCode);
        if (!internalRoom) {
          internalRoom = {
            id: roomCode,
            roomCode,
            gameType: "1v1",
            players: room.players.map((player, index) => ({
              email: player.email,
              socketId: null,
              nickname: player.nickname || player.email,
              profileImageUrl: "",
              userId: null,
              color: player.color || colors[index] || colors[0]
            })),
            status: "waiting",
            gameState: {},
            maxPlayers: 2
          };
          gameRooms.set(roomCode, internalRoom);
        }

        const user = await User.findOne({ email });
        const playerIndex = internalRoom.players.findIndex((player) => player.email === email);
        const playerColor = (playerIndex >= 0 ? internalRoom.players[playerIndex]?.color : null) || colors[playerIndex] || colors[0] || "red";

        if (playerIndex < 0) {
          socket.emit("error", "Player not found in room");
          return;
        }

        if (internalRoom.players[playerIndex]?.gracePeriodTimer) {
          clearTimeout(internalRoom.players[playerIndex].gracePeriodTimer);
          delete internalRoom.players[playerIndex].gracePeriodTimer;
          delete internalRoom.players[playerIndex].disconnectedAt;
        }

        internalRoom.players[playerIndex] = {
          ...internalRoom.players[playerIndex],
          email,
          socketId: socket.id,
          nickname: user?.nickname || email,
          profileImageUrl: user?.profileImageUrl || "",
          userId: authTokens.get(token).userId,
          color: playerColor
        };

        playerSockets.set(socket.id, { email, roomId: roomCode });
        socket.join(roomCode);

        socket.emit("room-joined", {
          roomId: roomCode,
          players: internalRoom.players,
          playerIndex,
          playerCount: internalRoom.players.length,
          gameType: internalRoom.gameType,
          gameInProgress: internalRoom.status === "playing"
        });

        const cleanPlayersEmit = internalRoom.players.map(p => ({
          email: p.email,
          socketId: p.socketId,
          nickname: p.nickname,
          color: p.color,
          profileImageUrl: p.profileImageUrl,
          userId: p.userId
        }));

        io.to(roomCode).emit("players-updated", {
          players: cleanPlayersEmit,
          playerCount: cleanPlayersEmit.length,
          gameType: internalRoom.gameType
        });

        const connectedPlayers = internalRoom.players.filter((player) => !!player.socketId).length;
        if (connectedPlayers === 2 && internalRoom.status !== "playing") {
          internalRoom.status = "playing";
          internalRoom.turnOrder = ["red", "yellow"];
          internalRoom.turnIndex = 0;
          io.to(roomCode).emit("game-start", {
            players: internalRoom.players,
            gameType: internalRoom.gameType
          });
          io.to(roomCode).emit("turn-update", {
            activeColor: internalRoom.turnOrder[internalRoom.turnIndex],
            turnIndex: internalRoom.turnIndex,
            turnOrder: internalRoom.turnOrder
          });
        } else if (internalRoom.status === "playing" && internalRoom.turnOrder) {
          socket.emit("turn-update", {
            activeColor: internalRoom.turnOrder[internalRoom.turnIndex],
            turnIndex: internalRoom.turnIndex,
            turnOrder: internalRoom.turnOrder
          });
        }
      } catch (err) {
        console.error("Error joining room by code:", err);
        socket.emit("error", "Failed to join room");
      }
    });

    socket.on("request-game-state", (data) => {
      const { email, roomId } = data;
      const room = gameRooms.get(roomId);
      
      if (!room) {
        console.log("[request-game-state] Room not found:", roomId);
        return;
      }

      const playerInfo = room.players.find((p) => p.email === email);
      if (!playerInfo) {
        console.log("[request-game-state] Player not found in room:", email, roomId);
        return;
      }

      const gameState = {
        pions: room.gameState?.pions || {},
        remotePions: room.gameState?.remotePions || {},
        activeColor: room.turnOrder?.[room.turnIndex] || null,
        turnIndex: room.turnIndex ?? 0,
        dice: room.gameState?.dice || null,
        bonus: room.gameState?.bonus || 0
      };

      console.log("[request-game-state] Sending game state to", email, "in room", roomId, gameState);
      socket.emit("game-state-recovery", gameState);
    });

    socket.on("player-move", (data) => {
      const playerInfo = playerSockets.get(socket.id);
      if (playerInfo) {
        const room = gameRooms.get(playerInfo.roomId);
        if (room) {
          if (room.status !== "playing") return;
          const currentPlayer = room.players.find((p) => p.email === playerInfo.email);
          if (!currentPlayer) return;
          if (room.turnOrder && room.turnOrder[room.turnIndex] !== currentPlayer.color) return;
          
          room.gameState = room.gameState || {};
          room.gameState.pions = data?.pions;
          room.gameState.lastMoveEmail = playerInfo.email;
          room.gameState.lastMoveTime = Date.now();
          
          room.moveSeq = (room.moveSeq || 0) + 1;
          io.to(room.id).emit("move-update", {
            email: playerInfo.email,
            playerColor: currentPlayer.color,
            pions: data?.pions,
            moveSeq: room.moveSeq,
            serverTs: Date.now()
          });
        }
      }
    });

    socket.on("dice-roll", (data) => {
      const playerInfo = playerSockets.get(socket.id);
      if (playerInfo) {
        const room = gameRooms.get(playerInfo.roomId);
        if (room) {
          if (room.status !== "playing") return;
          const currentPlayer = room.players.find((p) => p.email === playerInfo.email);
          if (!currentPlayer) return;
          if (room.turnOrder && room.turnOrder[room.turnIndex] !== currentPlayer.color) return;
          io.to(room.id).emit("dice-rolled", { email: playerInfo.email, color: currentPlayer.color, value: data.value });
        }
      }
    });

    socket.on("chat-join", async ({ roomId, token }) => {
      if (!roomId || !token || !authTokens.has(token)) return;
      const auth = authTokens.get(token);
      if (auth?.email && !socket.data.userEmail) {
        socket.data.userEmail = auth.email;
        markUserOnline(onlineUsers, auth.email);
      }
      socket.join(roomId);
      try {
        const history = await ChatMessage.find({ roomId })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        socket.emit("chat-history", history.reverse());
      } catch (err) {
        console.error("Chat history error:", err.message);
        socket.emit("chat-history", []);
      }
    });

    socket.on("chat-message", async ({ roomId, token, content }) => {
      if (!roomId || !token || !authTokens.has(token)) return;
      if (!content || !content.trim()) return;

      try {
        const auth = authTokens.get(token);
        const user = await User.findOne({ email: auth.email });
        if (!user) return;

        const msg = await ChatMessage.create({
          roomId,
          senderEmail: user.email,
          senderNickname: user.nickname,
          senderAvatar: user.profileImageUrl,
          content: content.trim()
        });

        io.to(roomId).emit("chat-message", msg);
      } catch (err) {
        console.error("Chat message error:", err.message);
      }
    });

    socket.on("dm-message", async ({ token, toEmail, content }) => {
      if (!token || !authTokens.has(token)) return;
      if (!toEmail || !content || !content.trim()) return;

      try {
        const auth = authTokens.get(token);
        const sender = await User.findOne({ email: auth.email });
        const receiver = await User.findOne({ email: toEmail });
        if (!sender || !receiver) return;

        const dm = await DirectMessage.create({
          senderEmail: sender.email,
          receiverEmail: receiver.email,
          content: content.trim()
        });

        io.emit("dm-message", {
          _id: dm._id,
          senderEmail: sender.email,
          receiverEmail: receiver.email,
          senderNickname: sender.nickname,
          senderAvatar: sender.profileImageUrl,
          content: dm.content,
          createdAt: dm.createdAt
        });
      } catch (err) {
        console.error("DM error:", err.message);
      }
    });

    socket.on("turn-next", () => {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) return;
      const room = gameRooms.get(playerInfo.roomId);
      if (!room || !room.turnOrder) return;

      const activeColor = room.turnOrder[room.turnIndex];
      const currentPlayer = room.players.find((p) => p.email === playerInfo.email);
      if (!currentPlayer || currentPlayer.color !== activeColor) return;

      room.turnIndex = (room.turnIndex + 1) % room.turnOrder.length;
      io.to(room.id).emit("turn-update", { activeColor: room.turnOrder[room.turnIndex], turnIndex: room.turnIndex, turnOrder: room.turnOrder });
    });

    socket.on("game-end", async (data) => {
      const playerInfo = playerSockets.get(socket.id);
      if (playerInfo) {
        const room = gameRooms.get(playerInfo.roomId);
        if (room) {
          room.status = "finished";
          
          if (data.winner) {
            try {
              const matchDuration = data.duration || 0;
              const winner = await User.findOne({ email: data.winner });
              
              if (winner) {
                winner.wins += 1;
                winner.matches += 1;
                
                if (data.losers && Array.isArray(data.losers) && data.losers.length > 0) {
                  const firstLoser = data.losers[0];
                  const loserUser = await User.findOne({ email: firstLoser });
                  
                  winner.matchHistory.push({
                    matchId: `match_${Date.now()}_${Math.random()}`,
                    opponent: firstLoser,
                    opponentNickname: loserUser?.nickname || 'Unknown',
                    result: 'win',
                    duration: matchDuration,
                    scores: { playerScore: data.winnerScore || 4, opponentScore: data.loserScore || 0 },
                    date: new Date()
                  });
                }
                
                checkAndUnlockAchievements(winner, 'win');
                if (winner.matchHistory.length > 100) winner.matchHistory = winner.matchHistory.slice(-100);
                
                await winner.save();
                console.log(`✅ Winner ${winner.nickname} stats updated: ${winner.wins} wins`);
              }
              
              if (data.losers && Array.isArray(data.losers)) {
                for (const loserEmail of data.losers) {
                  const loser = await User.findOne({ email: loserEmail });
                  
                  if (loser) {
                    loser.losses += 1;
                    loser.matches += 1;
                    
                    loser.matchHistory.push({
                      matchId: `match_${Date.now()}_${Math.random()}`,
                      opponent: data.winner,
                      opponentNickname: winner?.nickname || 'Unknown',
                      result: 'loss',
                      duration: matchDuration,
                      scores: { playerScore: data.loserScore || 0, opponentScore: data.winnerScore || 4 },
                      date: new Date()
                    });
                    
                    checkAndUnlockAchievements(loser, 'loss');
                    if (loser.matchHistory.length > 100) loser.matchHistory = loser.matchHistory.slice(-100);
                    
                    await loser.save();
                    console.log(`✅ Loser ${loser.nickname} stats updated: ${loser.losses} losses`);
                  }
                }
              }
            } catch (err) {
              console.error("❌ Error updating game results:", err);
            }
          }
          
          io.to(room.id).emit("game-finished", data);
        }
      }
    });

    socket.on("disconnect", () => {
      if (socket.data?.userEmail) {
        markUserOffline(onlineUsers, socket.data.userEmail);
      }
      const playerInfo = playerSockets.get(socket.id);
      if (playerInfo) {
        const room = gameRooms.get(playerInfo.roomId);
        if (room) {
          const disconnectedIndex = room.players.findIndex((p) => p.socketId === socket.id);
          if (disconnectedIndex >= 0) {
            if (room.roomCode) {
              const disconnectedPlayer = room.players[disconnectedIndex];
              room.players[disconnectedIndex] = {
                ...disconnectedPlayer,
                socketId: null,
                disconnectedAt: Date.now()
              };

              const gracePeriodTimer = setTimeout(() => {
                const stillDisconnected = room.players[disconnectedIndex]?.socketId === null;
                if (stillDisconnected && room.status === "playing" && room.turnOrder) {
                  console.log(`[Grace Period] Player ${disconnectedPlayer.email} still disconnected after 30s - auto-skipping turn`);
                  const currentColor = room.turnOrder[room.turnIndex];
                  if (disconnectedPlayer.color === currentColor) {
                    let nextTurnIndex = -1;
                    for (let step = 1; step <= room.turnOrder.length; step++) {
                      const candidateIndex = (room.turnIndex + step) % room.turnOrder.length;
                      const candidateColor = room.turnOrder[candidateIndex];
                      const hasConnectedPlayer = room.players.some((p) => p.color === candidateColor && !!p.socketId);
                      if (hasConnectedPlayer) {
                        nextTurnIndex = candidateIndex;
                        break;
                      }
                    }
                    if (nextTurnIndex >= 0) {
                      room.turnIndex = nextTurnIndex;
                      io.to(room.id).emit("turn-update", {
                        activeColor: room.turnOrder[room.turnIndex],
                        turnIndex: room.turnIndex,
                        turnOrder: room.turnOrder
                      });
                    }
                  }
                }
              }, GRACE_PERIOD);

              room.players[disconnectedIndex].gracePeriodTimer = gracePeriodTimer;
            } else {
              room.players = room.players.filter((p) => p.socketId !== socket.id);
            }
          }

          if (room.turnOrder && room.status === "playing") {
            const currentColor = room.turnOrder[room.turnIndex];
            const activeConnected = room.players.some((p) => p.color === currentColor && !!p.socketId);

            if (!activeConnected && !room.roomCode) {
              let nextTurnIndex = -1;
              for (let step = 1; step <= room.turnOrder.length; step++) {
                const candidateIndex = (room.turnIndex + step) % room.turnOrder.length;
                const candidateColor = room.turnOrder[candidateIndex];
                const hasConnectedPlayer = room.players.some((p) => p.color === candidateColor && !!p.socketId);
                if (hasConnectedPlayer) {
                  nextTurnIndex = candidateIndex;
                  break;
                }
              }

              if (nextTurnIndex >= 0) {
                room.turnIndex = nextTurnIndex;
                io.to(room.id).emit("turn-update", {
                  activeColor: room.turnOrder[room.turnIndex],
                  turnIndex: room.turnIndex,
                  turnOrder: room.turnOrder
                });
              }
            }
          }

          const cleanPlayers = room.players.map(p => ({
            email: p.email,
            socketId: p.socketId,
            nickname: p.nickname,
            color: p.color,
            profileImageUrl: p.profileImageUrl,
            userId: p.userId
          }));

          io.to(room.id).emit("player-left", { email: playerInfo.email, playersLeft: cleanPlayers });
          io.to(room.id).emit("players-updated", {
            players: cleanPlayers,
            playerCount: cleanPlayers.filter((p) => !!p.socketId).length,
            gameType: room.gameType
          });
          
          if (!room.roomCode && room.players.length === 0) {
            gameRooms.delete(playerInfo.roomId);
          }
        }
        playerSockets.delete(socket.id);
      }
      console.log("Player disconnected:", socket.id);
    });
  });
};
