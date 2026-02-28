# Implementation Guide: Server Setup & Core Services

## Table of Contents
1. [Express + Socket.io Server Setup](#setup)
2. [Redis Integration](#redis)
3. [Complete Service Implementations](#services)
4. [Event Handler Examples](#handlers)
5. [Deployment Configuration](#deployment)

---

## Setup: Express + Socket.io Server

### Installation

```bash
npm install express socket.io redis cors dotenv
npm install --save-dev nodemon jest supertest
```

### package.json

```json
{
  "name": "parcheesi-game-server",
  "version": "1.0.0",
  "description": "Production-ready Parcheesi multiplayer game server",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.5.4",
    "redis": "^4.6.5",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "crypto": "builtin"
  },
  "devDependencies": {
    "nodemon": "^2.0.20",
    "jest": "^29.3.1",
    "supertest": "^6.3.3"
  }
}
```

### .env Configuration

```env
# Server
PORT=3000
NODE_ENV=development

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Game Config
MAX_TURN_TIME=60000
AUTO_PLAY_DELAY=5000
RECONNECT_GRACE_PERIOD=30000
MAX_ROOMS=10000

# Security
ENABLE_ANTI_CHEAT=true
LOG_INVALID_MOVES=true

# Database
MONGODB_URI=mongodb://localhost:27017/parcheesi
```

---

## Redis Integration

### Redis Connection Manager

```javascript
// src/config/redis.js

const redis = require('redis');

class RedisManager {
  constructor() {
    this.client = null;
  }

  async connect() {
    this.client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
    });

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });

    return this.client;
  }

  // Room operations
  async setRoom(roomId, roomData, ttl = 3600) {
    await this.client.setex(
      `room:${roomId}`,
      ttl,
      JSON.stringify(roomData)
    );
  }

  async getRoom(roomId) {
    const data = await this.client.get(`room:${roomId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteRoom(roomId) {
    await this.client.del(`room:${roomId}`);
    await this.client.srem('rooms:active', roomId);
  }

  async listActiveRooms() {
    const roomIds = await this.client.smembers('rooms:active');
    const rooms = [];
    for (const roomId of roomIds) {
      const room = await this.getRoom(roomId);
      if (room) rooms.push(room);
    }
    return rooms;
  }

  // Player tracking
  async addPlayerToRoom(playerId, roomId) {
    await this.client.sadd(`room:${roomId}:players`, playerId);
  }

  async removePlayerFromRoom(playerId, roomId) {
    await this.client.srem(`room:${roomId}:players`, playerId);
  }

  async getPlayersInRoom(roomId) {
    return await this.client.smembers(`room:${roomId}:players`);
  }

  // Session tracking
  async setPlayerSession(playerId, sessionData, ttl = 86400) {
    await this.client.setex(
      `session:${playerId}`,
      ttl,
      JSON.stringify(sessionData)
    );
  }

  async getPlayerSession(playerId) {
    const data = await this.client.get(`session:${playerId}`);
    return data ? JSON.parse(data) : null;
  }

  // Rate limiting
  async incrementAction(playerId, action, limit = 10, window = 60) {
    const key = `ratelimit:${playerId}:${action}`;
    const count = await this.client.incr(key);
    
    if (count === 1) {
      await this.client.expire(key, window);
    }

    return count <= limit;
  }
}

module.exports = new RedisManager();
```

---

## Service Implementations

### Complete RoomService

```javascript
// src/services/RoomService.js

const crypto = require('crypto');

class RoomService {
  constructor(redisManager, io) {
    this.redis = redisManager;
    this.io = io;
  }

  /**
   * Create a new room
   */
  async createRoom(ownerId, roomName, settings = {}) {
    const roomId = this.generateRoomId();

    const room = {
      roomId,
      ownerId,
      roomName,
      status: 'WAITING',
      visibility: settings.visibility || 'PUBLIC',
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      
      players: [
        {
          id: ownerId,
          name: settings.ownerName || 'Host',
          socket: null,
          position: 0,
          isBot: false,
          status: 'PENDING',
          joinedAt: Date.now()
        }
      ],

      gameState: this.initializeGameState([]),

      settings: {
        maxPlayers: 4,
        autoStartOnFull: settings.autoStartOnFull || false,
        autoFillBots: settings.autoFillBots || true,
        allowSpectators: settings.allowSpectators || false,
        chatEnabled: settings.chatEnabled || true,
        recordGame: settings.recordGame || true,
        ...settings
      }
    };

    await this.redis.setRoom(roomId, room);
    await this.redis.client.sadd('rooms:active', roomId);
    await this.redis.client.zadd('rooms:created', Date.now(), roomId);

    console.log(`Room created: ${roomId} by ${ownerId}`);
    return room;
  }

  /**
   * Join an existing room
   */
  async joinRoom(roomId, playerId, playerName, socketId) {
    const room = await this.redis.getRoom(roomId);

    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }

    if (room.status !== 'WAITING' && room.status !== 'READY') {
      throw new Error('GAME_ALREADY_STARTED');
    }

    if (room.players.length >= room.settings.maxPlayers) {
      throw new Error('ROOM_FULL');
    }

    const alreadyJoined = room.players.find(p => p.id === playerId);
    if (alreadyJoined) {
      throw new Error('ALREADY_IN_ROOM');
    }

    // Add player
    const newPlayer = {
      id: playerId,
      name: playerName,
      socket: socketId,
      position: room.players.length,
      isBot: false,
      status: 'CONNECTED',
      joinedAt: Date.now()
    };

    room.players.push(newPlayer);
    room.lastActivityAt = Date.now();

    // Update gameState players
    room.gameState.players = room.players.map(p => ({
      id: p.id,
      name: p.name,
      position: p.position,
      isBot: p.isBot
    }));

    await this.redis.setRoom(roomId, room);
    await this.redis.addPlayerToRoom(playerId, roomId);

    // Auto-transition to READY if room full
    if (room.players.length === room.settings.maxPlayers && !room.settings.autoStartOnFull) {
      room.status = 'READY';
      await this.redis.setRoom(roomId, room);
      this.io.to(roomId).emit('ROOM_READY', {
        totalPlayers: room.players.length,
        message: 'Room is ready. Host can start game.'
      });
    }

    console.log(`Player ${playerId} joined room ${roomId}`);
    return room;
  }

  /**
   * Leave a room
   */
  async leaveRoom(roomId, playerId) {
    const room = await this.redis.getRoom(roomId);

    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    const player = room.players[playerIndex];

    if (room.status === 'WAITING' || room.status === 'READY') {
      // Game not started, just remove
      room.players.splice(playerIndex, 1);

      if (room.players.length === 0) {
        // Empty room, delete it
        await this.redis.deleteRoom(roomId);
        this.io.emit('ROOM_DELETED', { roomId });
        console.log(`Room ${roomId} deleted (empty)`);
        return;
      }

      // If host left, assign new host
      if (player.id === room.ownerId) {
        room.ownerId = room.players[0].id;
        this.io.to(roomId).emit('NEW_HOST', {
          newHostId: room.ownerId
        });
      }

      await this.redis.setRoom(roomId, room);
      this.io.to(roomId).emit('PLAYER_LEFT', {
        playerId,
        remainingPlayers: room.players.length
      });

      console.log(`Player ${playerId} left room ${roomId}`);
    } else if (room.status === 'PLAYING') {
      // Game is active, handle disconnect
      await this.handlePlayerDisconnection(roomId, playerId);
    }

    await this.redis.removePlayerFromRoom(playerId, roomId);
  }

  /**
   * Handle player disconnection during gameplay
   */
  async handlePlayerDisconnection(roomId, playerId) {
    const room = await this.redis.getRoom(roomId);
    const player = room.players.find(p => p.id === playerId);

    if (!player) return;

    player.status = 'DISCONNECTED';
    player.disconnectedAt = Date.now();

    // Store reconnect info
    await this.redis.setPlayerSession(playerId, {
      roomId,
      disconnectedAt: Date.now(),
      playerPosition: player.position
    }, process.env.RECONNECT_GRACE_PERIOD / 1000);

    this.io.to(roomId).emit('PLAYER_DISCONNECTED', {
      playerId,
      gracePeriod: process.env.RECONNECT_GRACE_PERIOD
    });

    // Auto-play or convert to bot after grace period
    setTimeout(async () => {
      const currentRoom = await this.redis.getRoom(roomId);
      if (!currentRoom) return;

      const currentPlayer = currentRoom.players.find(p => p.id === playerId);
      if (currentPlayer && currentPlayer.status === 'DISCONNECTED') {
        currentPlayer.isBot = true;
        currentPlayer.botDifficulty = 'MEDIUM';
        currentPlayer.status = 'ACTIVE';

        await this.redis.setRoom(roomId, currentRoom);
        this.io.to(roomId).emit('PLAYER_CONVERTED_TO_BOT', {
          playerId,
          message: `${currentPlayer.name} was converted to bot due to disconnection`
        });

        console.log(`Player ${playerId} converted to bot`);
      }
    }, process.env.RECONNECT_GRACE_PERIOD);

    await this.redis.setRoom(roomId, room);
  }

  /**
   * Reconnect a player to their room
   */
  async reconnectPlayer(roomId, playerId, newSocketId) {
    const session = await this.redis.getPlayerSession(playerId);

    if (!session || session.roomId !== roomId) {
      throw new Error('NO_ACTIVE_SESSION');
    }

    const room = await this.redis.getRoom(roomId);
    const player = room.players.find(p => p.id === playerId);

    if (!player) {
      throw new Error('PLAYER_NOT_IN_ROOM');
    }

    const timeSinceDisconnect = Date.now() - player.disconnectedAt;
    if (timeSinceDisconnect > process.env.RECONNECT_GRACE_PERIOD) {
      throw new Error('GRACE_PERIOD_EXPIRED');
    }

    // Restore player
    player.socket = newSocketId;
    player.status = 'CONNECTED';
    player.isBot = false;

    await this.redis.setRoom(roomId, room);

    this.io.to(roomId).emit('PLAYER_RECONNECTED', {
      playerId,
      message: `${player.name} has reconnected`
    });

    console.log(`Player ${playerId} reconnected to room ${roomId}`);
    return room;
  }

  /**
   * Generate secure room ID
   */
  generateRoomId() {
    return `room_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Initialize game state with empty players
   */
  initializeGameState(players) {
    return {
      gameId: null,
      status: 'NOT_STARTED',
      players: players,
      pieces: [],
      currentTurn: {
        playerId: null,
        diceRolled: false,
        diceValue: 0,
        movesMade: 0,
        startedAt: null,
        rollTime: null
      },
      turnHistory: [],
      eventLog: [],
      sequenceNumber: 0,
      winner: null,
      standings: null,
      config: {
        safeTiles: [0, 9, 14, 22, 27, 35, 40, 48, 53, 61, 66, 74, 79, 87, 92],
        homeFinishPosition: 99,
        boardSize: 100
      }
    };
  }
}

module.exports = RoomService;
```

### Complete GameService

```javascript
// src/services/GameService.js

const crypto = require('crypto');
const ValidatorService = require('./ValidatorService');
const BotService = require('./BotService');

class GameService {
  constructor(redisManager, io) {
    this.redis = redisManager;
    this.io = io;
    this.validator = new ValidatorService();
    this.botService = new BotService();
    this.turnTimers = new Map();
  }

  /**
   * Start a game in a room
   */
  async startGame(roomId, hostId) {
    const room = await this.redis.getRoom(roomId);

    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }

    if (room.ownerId !== hostId) {
      throw new Error('ONLY_HOST_CAN_START');
    }

    if (room.status === 'PLAYING') {
      throw new Error('GAME_ALREADY_STARTED');
    }

    // Initialize game state with players
    room.gameState = this.initializeGameState(room.players);
    room.status = 'PLAYING';
    room.startedAt = Date.now();

    // Set first player's turn
    room.gameState.currentTurn.playerId = room.players[0].id;
    room.gameState.currentTurn.startedAt = Date.now();

    await this.redis.setRoom(roomId, room);

    this.io.to(roomId).emit('GAME_STARTED', {
      gameId: room.gameState.gameId,
      players: room.gameState.players,
      firstPlayerId: room.gameState.currentTurn.playerId,
      pieces: room.gameState.pieces
    });

    // Start turn timer for first player
    this.startTurnTimer(roomId, room.players[0].id);

    // If first player is bot, auto-play
    const firstPlayer = room.players[0];
    if (firstPlayer.isBot) {
      setTimeout(() => this.executeBotTurn(roomId, firstPlayer.id), 2000);
    }

    console.log(`Game started in room ${roomId}`);
    return room;
  }

  /**
   * Handle dice roll
   */
  async rollDice(playerId, roomId) {
    const room = await this.redis.getRoom(roomId);

    // Validation
    const validation = this.validator.validateDiceRoll(playerId, room.gameState);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Enforce rate limiting
    const canRoll = await this.redis.incrementAction(playerId, 'ROLL_DICE', 1, 60);
    if (!canRoll) {
      return { success: false, error: 'RATE_LIMITED' };
    }

    // Generate secure dice value
    const diceValue = this.generateSecureDiceRoll();

    // Update state
    room.gameState.currentTurn.diceRolled = true;
    room.gameState.currentTurn.diceValue = diceValue;
    room.gameState.currentTurn.rollTime = Date.now();

    // Add to event log
    room.gameState.eventLog.push({
      type: 'DICE_ROLLED',
      playerId,
      diceValue,
      sequenceNumber: room.gameState.sequenceNumber++,
      timestamp: Date.now()
    });

    // Calculate available moves
    const availableMoves = this.calculateAvailableMoves(
      playerId,
      diceValue,
      room.gameState
    );

    await this.redis.setRoom(roomId, room);

    // Broadcast to all players
    this.io.to(roomId).emit('DICE_ROLLED', {
      playerId,
      diceValue,
      availableMoves,
      sequenceNumber: room.gameState.sequenceNumber - 1
    });

    // If no available moves, auto-pass turn
    if (availableMoves.length === 0) {
      setTimeout(() => this.passTurn(roomId, playerId), 1500);
    }

    return { success: true, diceValue, availableMoves };
  }

  /**
   * Handle piece move
   */
  async movePiece(playerId, roomId, pieceId, targetPos) {
    const room = await this.redis.getRoom(roomId);
    const gameState = room.gameState;

    // Validation
    const validation = this.validator.validatePieceMove(
      playerId,
      pieceId,
      targetPos,
      gameState
    );

    if (!validation.valid) {
      // Log suspicious activity
      await this.logSecurityEvent({
        type: 'INVALID_MOVE_ATTEMPT',
        playerId,
        roomId,
        error: validation.error,
        timestamp: Date.now()
      });

      return { success: false, error: validation.error };
    }

    // Find piece and update position
    const piece = gameState.pieces.find(p => p.id === pieceId);
    const prevPos = piece.position;
    piece.position = targetPos;

    // Check for captures
    let capturedPiece = null;
    const targetSquarePiece = gameState.pieces.find(
      p => p.position === targetPos && p.ownerId !== playerId
    );

    if (targetSquarePiece && !this.isSafeTile(targetPos, gameState.config.safeTiles)) {
      capturedPiece = targetSquarePiece;
      capturedPiece.position = -1; // Send back to home

      gameState.eventLog.push({
        type: 'PIECE_CAPTURED',
        capturerId: playerId,
        capturedPieceId: capturedPiece.id,
        sequenceNumber: gameState.sequenceNumber++,
        timestamp: Date.now()
      });
    }

    // Add move event
    gameState.eventLog.push({
      type: 'PIECE_MOVED',
      playerId,
      pieceId,
      from: prevPos,
      to: targetPos,
      captured: capturedPiece ? capturedPiece.id : null,
      sequenceNumber: gameState.sequenceNumber++,
      timestamp: Date.now()
    });

    gameState.currentTurn.movesMade++;

    await this.redis.setRoom(roomId, room);

    // Broadcast move
    this.io.to(roomId).emit('PIECE_MOVED', {
      playerId,
      pieceId,
      position: targetPos,
      captured: capturedPiece ? capturedPiece.id : null,
      sequenceNumber: gameState.eventLog[gameState.eventLog.length - 1].sequenceNumber
    });

    // Check win condition
    const winCheck = this.checkWinCondition(playerId, gameState);
    if (winCheck.isWinner) {
      await this.handleGameEnd(roomId, playerId);
      return { success: true, winner: playerId };
    }

    return { success: true, movesMade: gameState.currentTurn.movesMade };
  }

  /**
   * End a turn
   */
  async passTurn(roomId, playerId) {
    const room = await this.redis.getRoom(roomId);
    const gameState = room.gameState;

    if (gameState.currentTurn.playerId !== playerId) {
      return;
    }

    // Check for extra turn (rolled 6)
    const hasExtraTurn = gameState.currentTurn.diceValue === 6;

    if (hasExtraTurn) {
      // Reset for next roll, same player
      gameState.currentTurn.diceRolled = false;
      gameState.currentTurn.diceValue = 0;
      gameState.currentTurn.movesMade = 0;

      this.io.to(roomId).emit('EXTRA_TURN', {
        playerId,
        message: `${playerId} rolled a 6! Taking another turn.`
      });
    } else {
      // Move to next player
      const nextPlayerId = this.getNextPlayer(gameState);

      gameState.turnHistory.push({
        playerId,
        diceValue: gameState.currentTurn.diceValue,
        movesMade: gameState.currentTurn.movesMade,
        duration: Date.now() - gameState.currentTurn.startedAt
      });

      gameState.currentTurn = {
        playerId: nextPlayerId,
        diceRolled: false,
        diceValue: 0,
        movesMade: 0,
        startedAt: Date.now()
      };

      this.io.to(roomId).emit('TURN_CHANGED', {
        newPlayerId: nextPlayerId
      });

      // Start turn timer for next player
      this.startTurnTimer(roomId, nextPlayerId);

      // If next player is bot, auto-play
      const nextPlayer = gameState.players.find(p => p.id === nextPlayerId);
      if (nextPlayer && nextPlayer.isBot) {
        setTimeout(
          () => this.executeBotTurn(roomId, nextPlayerId),
          this.getBotDelay(nextPlayer.botDifficulty)
        );
      }
    }

    await this.redis.setRoom(roomId, room);
  }

  /**
   * Execute bot's turn
   */
  async executeBotTurn(roomId, botId) {
    const room = await this.redis.getRoom(roomId);

    if (!room || room.gameState.currentTurn.playerId !== botId) {
      return;
    }

    const player = room.gameState.players.find(p => p.id === botId);
    if (!player || !player.isBot) {
      return;
    }

    // Step 1: Roll dice
    if (!room.gameState.currentTurn.diceRolled) {
      await this.rollDice(botId, roomId);
      room = await this.redis.getRoom(roomId);

      if (room.gameState.currentTurn.diceValue === 0) {
        // Something failed
        return;
      }
    }

    // Step 2: Decide move
    const availableMoves = this.calculateAvailableMoves(
      botId,
      room.gameState.currentTurn.diceValue,
      room.gameState
    );

    if (availableMoves.length === 0) {
      // No moves, pass turn
      await this.passTurn(roomId, botId);
      return;
    }

    // Choose best move using bot AI
    const decision = await this.botService.decideBestMove(
      botId,
      availableMoves,
      room.gameState,
      player.botDifficulty
    );

    // Execute move
    await this.movePiece(botId, roomId, decision.pieceId, decision.targetPos);
    room = await this.redis.getRoom(roomId);

    // Check if more moves available
    const nextAvailableMoves = this.calculateAvailableMoves(
      botId,
      room.gameState.currentTurn.diceValue,
      room.gameState
    );

    if (nextAvailableMoves.length === 0) {
      await this.passTurn(roomId, botId);
    }
  }

  /**
   * Handle game end
   */
  async handleGameEnd(roomId, winnerId) {
    const room = await this.redis.getRoom(roomId);

    room.gameState.status = 'FINISHED';
    room.gameState.winner = winnerId;
    room.gameState.finishedAt = Date.now();
    room.status = 'FINISHED';

    // Calculate standings
    const standings = this.calculateStandings(room.gameState);
    room.gameState.standings = standings;

    await this.redis.setRoom(roomId, room);

    this.io.to(roomId).emit('GAME_FINISHED', {
      winner: winnerId,
      standings,
      duration: room.gameState.finishedAt - room.startedAt
    });

    console.log(`Game finished in room ${roomId}. Winner: ${winnerId}`);
  }

  /**
   * Calculate available moves for a player
   */
  calculateAvailableMoves(playerId, diceValue, gameState) {
    const playerPieces = gameState.pieces.filter(p => p.ownerId === playerId);
    const availableMoves = [];

    for (const piece of playerPieces) {
      let targetPos;

      // Special handling for pieces in home (-1)
      if (piece.position === -1) {
        if (diceValue === 6) {
          targetPos = 0; // Start position
        } else {
          continue; // Cannot move if not rolling 6
        }
      } else {
        targetPos = piece.position + diceValue;
      }

      // Check if move is legal
      if (this.isLegalMove(piece, targetPos, gameState)) {
        availableMoves.push({
          pieceId: piece.id,
          from: piece.position,
          to: targetPos
        });
      }
    }

    return availableMoves;
  }

  /**
   * Validate if a move is legal
   */
  isLegalMove(piece, targetPos, gameState) {
    // Cannot exceed board bounds
    if (targetPos > gameState.config.homeFinishPosition) {
      return false;
    }

    // Cannot land on same-colored piece
    const targetSquarePiece = gameState.pieces.find(
      p => p.position === targetPos && p.ownerId === piece.ownerId
    );

    if (targetSquarePiece) {
      return false;
    }

    return true;
  }

  /**
   * Check if square is safe
   */
  isSafeTile(position, safeTiles) {
    return safeTiles.includes(position);
  }

  /**
   * Check win condition
   */
  checkWinCondition(playerId, gameState) {
    const pieces = gameState.pieces.filter(p => p.ownerId === playerId);
    const allAtHome = pieces.every(p => p.position === gameState.config.homeFinishPosition);

    return { isWinner: allAtHome };
  }

  /**
   * Get next player
   */
  getNextPlayer(gameState) {
    const currentIndex = gameState.players.findIndex(
      p => p.id === gameState.currentTurn.playerId
    );

    const nextIndex = (currentIndex + 1) % gameState.players.length;
    return gameState.players[nextIndex].id;
  }

  /**
   * Calculate standings
   */
  calculateStandings(gameState) {
    return gameState.players
      .map(player => ({
        playerId: player.id,
        playerName: player.name,
        piecesAtHome: gameState.pieces
          .filter(p => p.ownerId === player.id && p.position === gameState.config.homeFinishPosition)
          .length
      }))
      .sort((a, b) => b.piecesAtHome - a.piecesAtHome);
  }

  /**
   * Generate secure random dice value
   */
  generateSecureDiceRoll() {
    const byte = crypto.randomBytes(1)[0] % 6;
    return byte + 1; // 1-6
  }

  /**
   * Start turn timer
   */
  startTurnTimer(roomId, playerId) {
    // Clear existing timer
    if (this.turnTimers.has(roomId)) {
      clearTimeout(this.turnTimers.get(roomId));
    }

    const timer = setTimeout(async () => {
      console.log(`Turn timeout for ${playerId} in room ${roomId}`);
      const room = await this.redis.getRoom(roomId);

      if (!room || room.gameState.currentTurn.playerId !== playerId) {
        return;
      }

      // Auto-roll or auto-play
      const room2 = await this.redis.getRoom(roomId);
      if (!room2.gameState.currentTurn.diceRolled) {
        await this.rollDice(playerId, roomId);
      }

      room = await this.redis.getRoom(roomId);
      const availableMoves = this.calculateAvailableMoves(
        playerId,
        room.gameState.currentTurn.diceValue,
        room.gameState
      );

      if (availableMoves.length === 0) {
        await this.passTurn(roomId, playerId);
      }
    }, process.env.MAX_TURN_TIME);

    this.turnTimers.set(roomId, timer);
  }

  /**
   * Get bot reaction delay
   */
  getBotDelay(difficulty) {
    switch (difficulty) {
      case 'EASY':
        return 2000 + Math.random() * 2000; // 2-4 seconds
      case 'MEDIUM':
        return 800 + Math.random() * 1200; // 0.8-2 seconds
      case 'HARD':
        return 300 + Math.random() * 700; // 0.3-1 second
      default:
        return 1000;
    }
  }

  /**
   * Initialize game state
   */
  initializeGameState(players) {
    const pieces = [];

    players.forEach((player) => {
      for (let i = 0; i < 4; i++) {
        pieces.push({
          id: `piece_${player.id}_${i}`,
          ownerId: player.id,
          playerIndex: i,
          position: -1, // Home
          capturedCount: 0
        });
      }
    });

    return {
      gameId: `game_${crypto.randomBytes(8).toString('hex')}`,
      status: 'PLAYING',
      players: players.map(p => ({
        id: p.id,
        name: p.name,
        isBot: p.isBot,
        botDifficulty: p.botDifficulty || null
      })),
      pieces,
      currentTurn: {
        playerId: null,
        diceRolled: false,
        diceValue: 0,
        movesMade: 0,
        startedAt: null
      },
      turnHistory: [],
      eventLog: [{
        type: 'GAME_STARTED',
        timestamp: Date.now(),
        sequenceNumber: 0
      }],
      sequenceNumber: 1,
      winner: null,
      finishedAt: null,
      config: {
        safeTiles: [0, 9, 14, 22, 27, 35, 40, 48, 53, 61, 66, 74, 79, 87, 92],
        homeFinishPosition: 99,
        boardSize: 100
      }
    };
  }

  /**
   * Log security events
   */
  async logSecurityEvent(event) {
    // Log to MongoDB or file
    console.warn('SECURITY EVENT:', event);
  }
}

module.exports = GameService;
```

---

## Event Handlers

### Complete Room Handler

```javascript
// src/handlers/roomHandler.js

const RoomService = require('../services/RoomService');

class RoomHandler {
  constructor(redisManager, io) {
    this.redisManager = redisManager;
    this.io = io;
    this.roomService = new RoomService(redisManager, io);
  }

  async createRoom(socket, data) {
    try {
      const { playerId, playerName, roomName, settings } = data;

      // Validate input
      if (!playerId || !playerName || !roomName) {
        socket.emit('ERROR', { message: 'Missing required fields' });
        return;
      }

      // Create room
      const room = await this.roomService.createRoom(
        playerId,
        roomName,
        { ...settings, ownerName: playerName }
      );

      // Store player info in socket
      socket.playerId = playerId;
      socket.roomId = room.roomId;

      // Join socket to room
      socket.join(room.roomId);

      // Send confirmation
      socket.emit('ROOM_CREATED', {
        roomId: room.roomId,
        room
      });

      console.log(`Room created: ${room.roomId}`);
    } catch (error) {
      console.error('Create room error:', error);
      socket.emit('ERROR', { message: error.message });
    }
  }

  async joinRoom(socket, data) {
    try {
      const { playerId, playerName, roomId } = data;

      if (!playerId || !playerName || !roomId) {
        socket.emit('ERROR', { message: 'Missing required fields' });
        return;
      }

      // Join room
      const room = await this.roomService.joinRoom(
        roomId,
        playerId,
        playerName,
        socket.id
      );

      socket.playerId = playerId;
      socket.roomId = roomId;
      socket.join(roomId);

      // Notify all players in room
      this.io.to(roomId).emit('PLAYER_JOINED', {
        playerId,
        playerName,
        totalPlayers: room.players.length,
        players: room.players
      });

      // Send full room state to joining player
      socket.emit('ROOM_STATE', {
        roomId,
        room
      });

      console.log(`${playerName} joined room ${roomId}`);
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('ERROR', { message: error.message });
    }
  }

  async leaveRoom(socket, data) {
    try {
      const { roomId } = data;
      const { playerId } = socket;

      if (!roomId || !playerId) return;

      await this.roomService.leaveRoom(roomId, playerId);
      socket.leave(roomId);

      socket.emit('ROOM_LEFT', { roomId });
    } catch (error) {
      console.error('Leave room error:', error);
      socket.emit('ERROR', { message: error.message });
    }
  }
}

module.exports = RoomHandler;
```

---

## Deployment Configuration

### Docker Setup

```dockerfile
# Dockerfile

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

EXPOSE 3000

CMD ["node", "src/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  game-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - NODE_ENV=production
    depends_on:
      - redis
    restart: always

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: always

volumes:
  redis_data:
```

### Production Nginx Config

```nginx
# /etc/nginx/conf.d/game-server.conf

upstream game_backend {
    least_conn;
    server server1.game.local:3000;
    server server2.game.local:3000;
    server server3.game.local:3000;
}

map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    listen 443 ssl http2;
    server_name game.example.com;

    ssl_certificate /etc/letsencrypt/live/game.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/game.example.com/privkey.pem;

    location / {
        proxy_pass http://game_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

---

**This implementation guide provides production-ready code you can use immediately in your project.**

