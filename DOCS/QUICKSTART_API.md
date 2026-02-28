# Quick Start & API Reference Guide

## Table of Contents
1. [Quick Start](#quickstart)
2. [Socket.io Events API](#socketio-api)
3. [REST API Endpoints](#rest-api)
4. [Client-Side Integration](#client)
5. [Common Patterns](#patterns)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Server Setup (5 minutes)

```bash
# Clone and install
git clone <repo>
cd game-server
npm install

# Create environment file
cp .env.example .env

# Start Redis (required)
docker run -d -p 6379:6379 redis:7-alpine

# Start development server
npm run dev
```

### 2. Connect Client

```javascript
// client/game.js

import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10
});

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

### 3. Create & Join Room

```javascript
// Create room
socket.emit('CREATE_ROOM', {
  playerId: 'player_123',
  playerName: 'Alice',
  roomName: 'Friendly Game'
}, (response) => {
  if (response.success) {
    const roomId = response.roomId;
    console.log(`Room created: ${roomId}`);
  }
});

// Join room
socket.emit('JOIN_ROOM', {
  playerId: 'player_456',
  playerName: 'Bob',
  roomId: 'room_abc123'
}, (response) => {
  if (response.success) {
    console.log('Joined room');
  }
});
```

### 4. Start Game

```javascript
socket.emit('START_GAME', {
  roomId: 'room_abc123'
}, (response) => {
  if (response.success) {
    console.log('Game started!');
  }
});

// Listen for game start
socket.on('GAME_STARTED', (data) => {
  console.log('Players:', data.players);
  console.log('Your pieces:', data.pieces);
  console.log('First player:', data.firstPlayerId);
});
```

### 5. Play Game

```javascript
// Roll dice
socket.emit('ROLL_DICE', {
  roomId: 'room_abc123'
}, (response) => {
  console.log('Dice value:', response.diceValue);
  console.log('Available moves:', response.availableMoves);
});

// Listen for other players' rolls
socket.on('DICE_ROLLED', (data) => {
  console.log(`${data.playerId} rolled ${data.diceValue}`);
});

// Move piece
socket.emit('MOVE_PIECE', {
  roomId: 'room_abc123',
  pieceId: 'piece_123',
  targetPos: 25
}, (response) => {
  if (response.success) {
    console.log('Move accepted');
  } else {
    console.log('Invalid move:', response.error);
  }
});

// Listen for piece moves
socket.on('PIECE_MOVED', (data) => {
  console.log(`${data.playerId}'s piece moved to ${data.position}`);
  if (data.captured) {
    console.log('Piece captured:', data.captured);
  }
});
```

---

## Socket.io Events API

### Room Events

#### CREATE_ROOM
**Client → Server**

```javascript
socket.emit('CREATE_ROOM', {
  playerId: string,      // Unique player ID
  playerName: string,    // Player's display name
  roomName: string,      // Room name
  settings: {            // Optional
    visibility: 'PUBLIC' | 'PRIVATE',
    autoStartOnFull: boolean,
    autoFillBots: boolean
  }
})

// Response
socket.on('ROOM_CREATED', (data) => {
  data.roomId       // string
  data.room         // Full room object
})

socket.on('ERROR', (data) => {
  data.message      // Error description
})
```

#### JOIN_ROOM
**Client → Server**

```javascript
socket.emit('JOIN_ROOM', {
  playerId: string,
  playerName: string,
  roomId: string
})

// Response
socket.on('ROOM_STATE', (data) => {
  data.roomId       // string
  data.room         // Full room object with all players
})

// Other players notified
socket.on('PLAYER_JOINED', (data) => {
  data.playerId          // string
  data.playerName        // string
  data.totalPlayers      // number (1-4)
  data.players           // Array of all players
})
```

#### LEAVE_ROOM
**Client → Server**

```javascript
socket.emit('LEAVE_ROOM', {
  roomId: string
})

// Response
socket.on('ROOM_LEFT', (data) => {
  data.roomId       // string
})

// Others notified
socket.on('PLAYER_LEFT', (data) => {
  data.playerId          // string
  data.remainingPlayers  // number
})
```

### Game Events

#### START_GAME
**Client → Server (Host Only)**

```javascript
socket.emit('START_GAME', {
  roomId: string
})

// Response - Broadcast to all players
socket.on('GAME_STARTED', (data) => {
  data.gameId       // string
  data.players      // Array of Player objects
  data.firstPlayerId // string
  data.pieces       // Array of all Piece objects
})
```

#### ROLL_DICE
**Client → Server**

```javascript
socket.emit('ROLL_DICE', {
  roomId: string
})

// Response
socket.on('DICE_ROLLED', (data) => {
  data.playerId          // string
  data.diceValue         // number (1-6)
  data.availableMoves    // Array of Move objects
  data.sequenceNumber    // number (for anti-cheat)
})

// Example Move object:
// {
//   pieceId: 'piece_p1_0',
//   from: 5,
//   to: 8
// }
```

#### MOVE_PIECE
**Client → Server**

```javascript
socket.emit('MOVE_PIECE', {
  roomId: string,
  pieceId: string,
  targetPos: number
})

// Success response
socket.on('PIECE_MOVED', (data) => {
  data.playerId     // string
  data.pieceId      // string
  data.position     // number (new position)
  data.captured     // string | null (captured piece ID)
})

// Error response
socket.on('MOVE_REJECTED', (data) => {
  data.error             // string (error code)
  data.message           // string (human readable)
  data.availableMoves    // Array of valid moves
})
```

### Status Events

#### TURN_CHANGED
**Server → Client (Broadcast)**

```javascript
socket.on('TURN_CHANGED', (data) => {
  data.newPlayerId   // string
})
```

#### EXTRA_TURN
**Server → Client (Broadcast)**

```javascript
socket.on('EXTRA_TURN', (data) => {
  data.playerId      // string
  data.message       // string ('Player X rolled a 6!')
})
```

#### GAME_FINISHED
**Server → Client (Broadcast)**

```javascript
socket.on('GAME_FINISHED', (data) => {
  data.winner        // string (winning player ID)
  data.standings     // Array of rankings
  data.duration      // number (milliseconds)
})

// Example standings:
// [
//   { rank: 1, playerId: 'p1', finishTime: 1234567890 },
//   { rank: 2, playerId: 'p2', finishTime: 1234567900 },
//   ...
// ]
```

#### PLAYER_DISCONNECTED
**Server → Client (Broadcast)**

```javascript
socket.on('PLAYER_DISCONNECTED', (data) => {
  data.playerId         // string
  data.gracePeriod      // number (milliseconds to reconnect)
})
```

#### PLAYER_RECONNECTED
**Server → Client (Broadcast)**

```javascript
socket.on('PLAYER_RECONNECTED', (data) => {
  data.playerId      // string
  data.message       // string
})
```

---

## REST API Endpoints

### Health Check

```
GET /health

Response (200):
{
  "status": "healthy",
  "timestamp": "2024-02-25T10:30:00Z",
  "redis": { "connected": true },
  "system": { "ok": true, "heapUsedPercent": "45.23" },
  "uptime": 3600,
  "memory": { "heapUsed": 52428800, "heapTotal": 104857600 }
}
```

### Get Active Rooms

```
GET /api/rooms

Response (200):
{
  "rooms": [
    {
      "roomId": "room_abc123",
      "roomName": "Alice's Game",
      "status": "PLAYING",
      "playerCount": 4,
      "createdAt": "2024-02-25T10:00:00Z"
    }
  ],
  "total": 150
}
```

### Get Room Details

```
GET /api/rooms/:roomId

Response (200):
{
  "roomId": "room_abc123",
  "roomName": "Alice's Game",
  "ownerId": "player_1",
  "status": "PLAYING",
  "createdAt": "2024-02-25T10:00:00Z",
  "players": [
    {
      "id": "player_1",
      "name": "Alice",
      "status": "CONNECTED",
      "isBot": false
    }
  ],
  "gameState": { /* full game state */ }
}

Response (404):
{
  "error": "ROOM_NOT_FOUND"
}
```

### Get Game Statistics

```
GET /api/stats

Response (200):
{
  "activeGames": 1250,
  "connectedPlayers": 4500,
  "averageTurnTime": 8.5,  // seconds
  "totalGamesCompleted": 45000,
  "totalCaptures": 180000
}
```

---

## Client-Side Integration

### React Component Example

```javascript
// components/GameBoard.jsx

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const GameBoard = ({ roomId, playerId, playerName }) => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [isCurrentTurn, setIsCurrentTurn] = useState(false);
  const [availableMoves, setAvailableMoves] = useState([]);
  const [diceValue, setDiceValue] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');

    // Join room
    newSocket.emit('JOIN_ROOM', {
      playerId,
      playerName,
      roomId
    });

    // Receive full game state
    newSocket.on('ROOM_STATE', (data) => {
      setGameState(data.room.gameState);
    });

    newSocket.on('GAME_STARTED', (data) => {
      setGameState(data);
      setIsCurrentTurn(data.firstPlayerId === playerId);
    });

    newSocket.on('DICE_ROLLED', (data) => {
      if (data.playerId === playerId) {
        setDiceValue(data.diceValue);
        setAvailableMoves(data.availableMoves);
      }
    });

    newSocket.on('TURN_CHANGED', (data) => {
      setIsCurrentTurn(data.newPlayerId === playerId);
      setDiceValue(null);
      setAvailableMoves([]);
    });

    newSocket.on('PIECE_MOVED', (data) => {
      // Update piece positions in UI
      updatePiecePosition(data.pieceId, data.position);
    });

    newSocket.on('GAME_FINISHED', (data) => {
      alert(`Game finished! Winner: ${data.winner}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, playerId, playerName]);

  const handleRollDice = () => {
    socket.emit('ROLL_DICE', { roomId });
  };

  const handleMovePiece = (pieceId, targetPos) => {
    socket.emit('MOVE_PIECE', {
      roomId,
      pieceId,
      targetPos
    });
  };

  if (!gameState) {
    return <div>Loading game...</div>;
  }

  return (
    <div className="game-board">
      <div className="board">
        {/* Render board with pieces */}
        {gameState.pieces.map(piece => (
          <Piece
            key={piece.id}
            piece={piece}
            onClick={() => {
              const move = availableMoves.find(m => m.pieceId === piece.id);
              if (move) handleMovePiece(piece.id, move.to);
            }}
          />
        ))}
      </div>

      <div className="info">
        <div>Dice: {diceValue || '-'}</div>
        <div>Your turn: {isCurrentTurn ? 'YES' : 'NO'}</div>
        <button
          onClick={handleRollDice}
          disabled={!isCurrentTurn || diceValue !== null}
        >
          Roll Dice
        </button>
      </div>
    </div>
  );
};

export default GameBoard;
```

### Vue Component Example

```vue
<!-- components/GameBoard.vue -->

<template>
  <div class="game-board">
    <div class="board">
      <div
        v-for="piece in gameState?.pieces"
        :key="piece.id"
        class="piece"
        :class="{ 'can-move': canMovePiece(piece) }"
        @click="movePiece(piece)"
      >
        {{ piece.id }}
      </div>
    </div>

    <div class="controls">
      <div>Dice: {{ diceValue || '-' }}</div>
      <div>Your turn: {{ isCurrentTurn ? 'YES' : 'NO' }}</div>
      <button
        @click="rollDice"
        :disabled="!isCurrentTurn || diceValue !== null"
      >
        Roll Dice
      </button>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client';

export default {
  props: ['roomId', 'playerId', 'playerName'],

  data() {
    return {
      socket: null,
      gameState: null,
      isCurrentTurn: false,
      availableMoves: [],
      diceValue: null
    };
  },

  mounted() {
    this.socket = io('http://localhost:3000');

    this.socket.emit('JOIN_ROOM', {
      playerId: this.playerId,
      playerName: this.playerName,
      roomId: this.roomId
    });

    this.socket.on('ROOM_STATE', (data) => {
      this.gameState = data.room.gameState;
    });

    this.socket.on('GAME_STARTED', (data) => {
      this.gameState = data;
      this.isCurrentTurn = data.firstPlayerId === this.playerId;
    });

    this.socket.on('DICE_ROLLED', (data) => {
      if (data.playerId === this.playerId) {
        this.diceValue = data.diceValue;
        this.availableMoves = data.availableMoves;
      }
    });

    this.socket.on('TURN_CHANGED', (data) => {
      this.isCurrentTurn = data.newPlayerId === this.playerId;
      this.diceValue = null;
      this.availableMoves = [];
    });
  },

  beforeUnmount() {
    this.socket.disconnect();
  },

  methods: {
    rollDice() {
      this.socket.emit('ROLL_DICE', { roomId: this.roomId });
    },

    canMovePiece(piece) {
      return this.availableMoves.some(m => m.pieceId === piece.id);
    },

    movePiece(piece) {
      const move = this.availableMoves.find(m => m.pieceId === piece.id);
      if (!move) return;

      this.socket.emit('MOVE_PIECE', {
        roomId: this.roomId,
        pieceId: piece.id,
        targetPos: move.to
      });
    }
  }
};
</script>
```

---

## Common Patterns

### Pattern 1: Error Handling

```javascript
socket.emit('ROLL_DICE', { roomId }, (response) => {
  if (response.error) {
    switch (response.error) {
      case 'NOT_YOUR_TURN':
        alert('It\'s not your turn yet');
        break;
      case 'ALREADY_ROLLED':
        alert('You already rolled this turn');
        break;
      case 'GAME_NOT_ACTIVE':
        alert('Game is not active');
        break;
      default:
        alert(`Error: ${response.error}`);
    }
  } else {
    console.log('Dice value:', response.diceValue);
  }
});
```

### Pattern 2: Handling Disconnections

```javascript
let socket = io();

socket.on('disconnect', () => {
  console.log('Disconnected, attempting to reconnect...');
  // UI should show "Connection lost" message
});

socket.on('reconnect', () => {
  console.log('Reconnected!');
  // Re-sync game state from server
  socket.emit('REQUEST_STATE', { roomId });
});

socket.on('reconnect_failed', () => {
  console.log('Reconnection failed');
  // Show "Cannot reconnect" message
  // Prompt user to refresh page
});
```

### Pattern 3: Optimistic Updates

```javascript
// Local state update immediately
const oldPosition = piece.position;
piece.position = targetPos;

// Send to server
socket.emit('MOVE_PIECE', { roomId, pieceId, targetPos }, (response) => {
  if (!response.success) {
    // Rollback
    piece.position = oldPosition;
    console.error('Move failed:', response.error);
  }
  // If success, piece stays at new position
});
```

### Pattern 4: Turn Timer Display

```javascript
let turnTimer = null;

socket.on('TURN_CHANGED', (data) => {
  const TURN_TIME = 60; // seconds
  let remaining = TURN_TIME;

  if (turnTimer) clearInterval(turnTimer);

  turnTimer = setInterval(() => {
    remaining--;
    updateUI({ remainingTime: remaining });

    if (remaining <= 0) {
      console.log('Turn time expired');
      clearInterval(turnTimer);
    }
  }, 1000);
});
```

### Pattern 5: Reconnection to Game

```javascript
async function reconnectToGame(playerId, roomId) {
  return new Promise((resolve, reject) => {
    const newSocket = io();

    newSocket.on('connect', () => {
      newSocket.emit('RECONNECT_TO_GAME', {
        playerId,
        roomId
      }, (response) => {
        if (response.success) {
          resolve({ socket: newSocket, gameState: response.gameState });
        } else {
          reject(new Error(response.error));
        }
      });
    });
  });
}

// Usage
try {
  const { socket, gameState } = await reconnectToGame(playerId, roomId);
  console.log('Reconnected, current turn:', gameState.currentTurn.playerId);
} catch (error) {
  console.error('Reconnection failed:', error.message);
}
```

---

## Troubleshooting

### Problem: "Socket connection refused"

**Causes:**
- Server not running
- Wrong hostname/port
- Firewall blocking connection

**Solution:**
```bash
# Check server is running
curl http://localhost:3000/health

# Check port is open
lsof -i :3000

# Update connection URL
socket = io('http://your-server.com:3000', {
  reconnection: true,
  transports: ['websocket', 'polling']
})
```

### Problem: "Can't move pieces / Roll dice rejected"

**Causes:**
- Not your turn
- Already rolled this turn
- Invalid piece selection
- Move distance doesn't match dice

**Debug:**
```javascript
socket.on('MOVE_REJECTED', (data) => {
  console.log('Error:', data.error);
  console.log('Message:', data.message);
  console.log('Available moves:', data.availableMoves);
});
```

### Problem: "Game state desync"

**Causes:**
- Network lag
- Duplicate events
- Client-side errors

**Solution:**
```javascript
// Request full state sync
socket.emit('REQUEST_STATE', { roomId }, (response) => {
  gameState = response.gameState;
  console.log('State synced');
});
```

### Problem: "Bot not playing"

**Causes:**
- Bot difficulty not set properly
- Bot ID is incorrect
- Game not in PLAYING status

**Debug:**
```javascript
socket.on('GAME_STARTED', (data) => {
  data.players.forEach(player => {
    console.log(`${player.name}: isBot=${player.isBot}, difficulty=${player.botDifficulty}`);
  });
});
```

### Problem: "High latency / Lag"

**Solutions:**
```javascript
// 1. Use binary protocol for smaller payloads
const socket = io({
  serializationMiddleware: (packets, next) => {
    // Custom serialization
    next();
  }
});

// 2. Reduce update frequency
socket.off('PIECE_MOVED');
const updateQueue = [];
let isProcessing = false;

socket.on('PIECE_MOVED', (data) => {
  updateQueue.push(data);
  if (!isProcessing) {
    processBatch();
  }
});

function processBatch() {
  isProcessing = true;
  const batch = updateQueue.splice(0, 10); // Process 10 at a time
  batch.forEach(applyUpdate);
  isProcessing = false;
  if (updateQueue.length > 0) {
    setTimeout(processBatch, 50);
  }
}

// 3. Monitor latency
socket.on('GAME_STARTED', () => {
  setInterval(() => {
    const start = Date.now();
    socket.emit('PING', {}, () => {
      const latency = Date.now() - start;
      console.log(`Latency: ${latency}ms`);
    });
  }, 5000);
});
```

---

## Performance Tips

1. **Disable console logging in production**
   ```javascript
   if (process.env.NODE_ENV === 'production') {
     console.log = () => {};
   }
   ```

2. **Use event batching**
   ```javascript
   // Instead of emitting one by one
   socket.emit('MOVES', {
     moves: [
       { pieceId, targetPos },
       { pieceId, targetPos },
       { pieceId, targetPos }
     ]
   });
   ```

3. **Cache available moves**
   ```javascript
   let cachedAvailableMoves = null;
   
   socket.on('DICE_ROLLED', (data) => {
     cachedAvailableMoves = data.availableMoves;
   });
   
   socket.on('PIECE_MOVED', () => {
     cachedAvailableMoves = null; // Invalidate
   });
   ```

4. **Preload assets before game starts**
   ```javascript
   socket.on('ROOM_STATE', async (data) => {
     // Preload images, sounds, etc.
     await preloadAssets(data.room.players);
   });
   ```

---

**This guide provides everything needed to integrate the server with any frontend framework.**

