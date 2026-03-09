import { GameRoom, User, ChatMessage, DirectMessage, Friendship } from "../models/index.js";
import { authTokens } from "../middleware/auth.js";
import { checkAndUnlockAchievements, markUserOnline, markUserOffline } from "../utils/helpers.js";
import { GRACE_PERIOD } from "../config.js";

export const initializeSocketHandlers = (io, gameRooms, playerSockets, onlineUsers) => {
  io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    const ensurePresenceOnline = (email) => {
      if (!email) return;
      if (!socket.data.userEmail) {
        socket.data.userEmail = email;
      }
      if (!socket.data.presenceMarked) {
        markUserOnline(onlineUsers, email);
        socket.data.presenceMarked = true;
      }
    };

    const joinUserPrivateRoom = (email) => {
      if (!email) return;
      socket.join(`user:${email}`);
    };

    const handshakeToken = socket.handshake?.auth?.token;
    if (handshakeToken && authTokens.has(handshakeToken)) {
      const auth = authTokens.get(handshakeToken);
      ensurePresenceOnline(auth.email);
      joinUserPrivateRoom(auth.email);
    }

    socket.on("join-room", (data) => {
      const { email, gameType, token } = data;
      const resolvedEmail = email || (authTokens.has(token) ? authTokens.get(token)?.email : socket.data.userEmail);
      
      // Log for debugging
      console.log(`[join-room] email: ${resolvedEmail}, gameType: ${gameType}, token valid: ${authTokens.has(token)}`);
      
      // Store email in socket data for chat functionality
      if (resolvedEmail) {
        ensurePresenceOnline(resolvedEmail);
        console.log(`[join-room] Set socket.data.userEmail to: ${resolvedEmail}`);
        joinUserPrivateRoom(resolvedEmail);
      }
      
      // If token not in memory store, we'll still allow connection but will rely on email validation
      // In production, validate token against database/JWT
      if (!authTokens.has(token) && !resolvedEmail) {
        console.log("[Socket] Missing both token and email");
        socket.emit("room-error", { message: "Missing authentication" });
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
      const userId = authTokens.has(token) ? authTokens.get(token).userId : `temp_${Date.now()}`;
      room.players.push({ email: resolvedEmail, socketId: socket.id, userId, color: playerColor });
      playerSockets.set(socket.id, { email: resolvedEmail, roomId: room.id });

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
      const requestedIdentity = email || (authTokens.has(token) ? authTokens.get(token)?.email : socket.data.userEmail);

      if (!requestedIdentity || !roomCode) {
        socket.emit("room-error", { message: "Missing email or room code" });
        return;
      }

      try {
        let canonicalEmail = null;
        const normalizedInput = requestedIdentity.trim().toLowerCase();
        const canonicalUser = await User.findOne({
          $or: [
            { email: requestedIdentity },
            { email: normalizedInput },
            { nickname: requestedIdentity },
            { nickname: normalizedInput }
          ]
        }).select("email nickname");

        if (canonicalUser?.email) {
          canonicalEmail = canonicalUser.email;
        }

        const room = await GameRoom.findOne({ roomCode });
        if (!room) {
          socket.emit("room-error", { message: "Room not found" });
          return;
        }

        const identityCandidates = [requestedIdentity, normalizedInput, canonicalEmail]
          .filter(Boolean)
          .map((value) => String(value).trim().toLowerCase());

        const matchedRoomPlayer = room.players.find((player) => {
          const playerEmail = (player.email || "").trim().toLowerCase();
          const playerNickname = (player.nickname || "").trim().toLowerCase();
          return identityCandidates.includes(playerEmail) || identityCandidates.includes(playerNickname);
        });

        if (!matchedRoomPlayer) {
          console.log("[join-room-code] Membership mismatch", {
            roomCode,
            requestedIdentity,
            canonicalEmail,
            roomPlayers: room.players.map((p) => ({ email: p.email, nickname: p.nickname }))
          });
          socket.emit("room-error", { message: "You are not a member of this room" });
          return;
        }

        const roomMemberEmail = matchedRoomPlayer.email;
        const presenceUser = await User.findOne({
          $or: [
            { email: roomMemberEmail },
            { nickname: roomMemberEmail },
            ...(canonicalEmail ? [{ email: canonicalEmail }, { nickname: canonicalEmail }] : [])
          ]
        }).select("email nickname profileImageUrl");

        const presenceEmail = presenceUser?.email || canonicalEmail || roomMemberEmail;
        if (presenceEmail) {
          ensurePresenceOnline(presenceEmail);
          console.log(`[join-room-code] Set socket.data.userEmail to: ${presenceEmail}`);
          joinUserPrivateRoom(presenceEmail);
        }

        console.log(`[join-room-code] roomCode: ${roomCode}, requested: ${requestedIdentity}, memberEmail: ${roomMemberEmail}, token valid: ${authTokens.has(token)}`);

        if (room.players.length > room.maxPlayers) {
          socket.emit("room-error", { message: "Room is full" });
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

        const user = presenceUser || await User.findOne({ email: roomMemberEmail });
        const playerIndex = internalRoom.players.findIndex((player) => player.email === roomMemberEmail);
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
          email: roomMemberEmail,
          socketId: socket.id,
          nickname: user?.nickname || roomMemberEmail,
          profileImageUrl: user?.profileImageUrl || "",
          userId: authTokens.has(token) ? authTokens.get(token).userId : user?._id || `temp_${Date.now()}`,
          color: playerColor
        };

        playerSockets.set(socket.id, { email: roomMemberEmail, roomId: roomCode });
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
      const defaultPions = {
        red: [-1, -1, -1, -1],
        green: [-1, -1, -1, -1],
        blue: [-1, -1, -1, -1],
        yellow: [-1, -1, -1, -1]
      };

      const normalizePions = (candidate) => {
        const source = candidate && typeof candidate === "object" ? candidate : {};
        return {
          red: Array.isArray(source.red) && source.red.length === 4 ? source.red : [...defaultPions.red],
          green: Array.isArray(source.green) && source.green.length === 4 ? source.green : [...defaultPions.green],
          blue: Array.isArray(source.blue) && source.blue.length === 4 ? source.blue : [...defaultPions.blue],
          yellow: Array.isArray(source.yellow) && source.yellow.length === 4 ? source.yellow : [...defaultPions.yellow]
        };
      };
      
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
        pions: normalizePions(room.gameState?.pions),
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
      if (!playerInfo) {
        console.log("[player-move] No player info for socket:", socket.id);
        return;
      }
      
      const room = gameRooms.get(playerInfo.roomId);
      if (!room) {
        console.log("[player-move] No room found for:", playerInfo.roomId);
        return;
      }
      
      if (room.status !== "playing") {
        console.log("[player-move] Room not in playing state:", room.status);
        return;
      }
      
      const currentPlayer = room.players.find((p) => p.email === playerInfo.email);
      if (!currentPlayer) {
        console.log("[player-move] Player not found in room:", playerInfo.email);
        return;
      }
      
      // Log but don't block if it's not their turn - allow the move for better sync
      if (room.turnOrder && room.turnOrder[room.turnIndex] !== currentPlayer.color) {
        console.log("[player-move] Not player's turn but allowing move. Expected:", room.turnOrder[room.turnIndex], "Got:", currentPlayer.color);
      }
      
      room.gameState = room.gameState || {};
      room.gameState.pions = data?.pions;
      room.gameState.lastMoveEmail = playerInfo.email;
      room.gameState.lastMoveTime = Date.now();
      
      room.moveSeq = (room.moveSeq || 0) + 1;
      
      console.log("[player-move] Broadcasting to room:", room.id, "moveSeq:", room.moveSeq);
      
      io.to(room.id).emit("move-update", {
        email: playerInfo.email,
        playerColor: currentPlayer.color,
        pions: data?.pions,
        moveSeq: room.moveSeq,
        serverTs: Date.now()
      });
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
      console.log("[chat-join] roomId:", roomId, "token valid:", authTokens.has(token));
      
      if (!roomId) {
        console.log("[chat-join] Missing roomId");
        return;
      }
      
      // More lenient - allow join even if token not in authTokens
      if (token && authTokens.has(token)) {
        const auth = authTokens.get(token);
        if (auth?.email && !socket.data.userEmail) {
          ensurePresenceOnline(auth.email);
        }
      }

      if (socket.data.userEmail) {
        ensurePresenceOnline(socket.data.userEmail);
      }
      
      socket.join(roomId);
      console.log("[chat-join] Socket joined room:", roomId);
      
      try {
        const history = await ChatMessage.find({ roomId })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        console.log("[chat-join] Sending history, count:", history.length);
        socket.emit("chat-history", history.reverse());
      } catch (err) {
        console.error("Chat history error:", err.message);
        socket.emit("chat-history", []);
      }
    });

    socket.on("chat-message", async ({ roomId, token, content }) => {
      console.log("[chat-message] roomId:", roomId, "token valid:", authTokens.has(token), "content:", content?.substring(0, 20));
      
      if (!roomId || !content || !content.trim()) {
        console.log("[chat-message] Missing required fields");
        return;
      }

      try {
        let user;
        
        // Try to get user from token
        if (token && authTokens.has(token)) {
          const auth = authTokens.get(token);
          user = await User.findOne({ email: auth.email });
        }
        
        // Fallback to socket data
        if (!user && socket.data.userEmail) {
          user = await User.findOne({ email: socket.data.userEmail });
        }
        
        if (!user) {
          console.log("[chat-message] No user found, socket.data.userEmail:", socket.data.userEmail);
          return;
        }

        console.log("[chat-message] Found user:", user.email, user.nickname);

        const msg = await ChatMessage.create({
          roomId,
          senderEmail: user.email,
          senderNickname: user.nickname,
          senderAvatar: user.profileImageUrl,
          content: content.trim()
        });

        console.log("[chat-message] Message saved to DB with ID:", msg._id);
        console.log("[chat-message] Broadcasting to room:", roomId);
        io.to(roomId).emit("chat-message", msg);
      } catch (err) {
        console.error("Chat message error:", err.message);
      }
    });

    socket.on("dm-message", async ({ token, fromEmail, toEmail, content }) => {
      if (!toEmail || !content || !content.trim()) return;

      try {
        let senderEmail = null;

        if (token && authTokens.has(token)) {
          senderEmail = authTokens.get(token).email;
        }

        if (!senderEmail && socket.data.userEmail) {
          senderEmail = socket.data.userEmail;
        }

        if (!senderEmail && fromEmail) {
          senderEmail = fromEmail;
        }

        if (!senderEmail) return;

        const sender = await User.findOne({ email: senderEmail });
        const receiver = await User.findOne({ email: toEmail });
        if (!sender || !receiver) return;

        const friendship = await Friendship.findOne({
          status: "accepted",
          $or: [
            { requesterEmail: sender.email, receiverEmail: receiver.email },
            { requesterEmail: receiver.email, receiverEmail: sender.email }
          ]
        }).lean();

        if (!friendship) return;

        const dm = await DirectMessage.create({
          senderEmail: sender.email,
          receiverEmail: receiver.email,
          content: content.trim()
        });

        const payload = {
          _id: dm._id,
          senderEmail: sender.email,
          receiverEmail: receiver.email,
          senderNickname: sender.nickname,
          senderAvatar: sender.profileImageUrl,
          content: dm.content,
          createdAt: dm.createdAt
        };

        io.to(`user:${sender.email}`).emit("dm-message", payload);
        io.to(`user:${receiver.email}`).emit("dm-message", payload);
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
      if (socket.data?.userEmail && socket.data?.presenceMarked) {
        markUserOffline(onlineUsers, socket.data.userEmail);
        socket.data.presenceMarked = false;
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
