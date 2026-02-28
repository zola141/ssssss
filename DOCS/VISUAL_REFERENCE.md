# Visual Architecture & Quick Reference

## System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                              │
│  (React/Vue/Flutter) - Shows UI, sends player actions          │
└──────────────────────────────┬─────────────────────────────────┘
                               │
                       Socket.io + HTTP
                    (WebSocket + Polling)
                               │
┌──────────────────────────────┴─────────────────────────────────┐
│                   LOAD BALANCER (NGINX)                        │
│  Distributes connections across game servers                   │
└──────────────────────────────┬─────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
    ┌────────────┐         ┌────────────┐      ┌────────────┐
    │ Game Server│         │ Game Server│      │ Game Server│
    │ Instance 1 │         │ Instance 2 │ ...  │ Instance N │
    │            │         │            │      │            │
    │ - Room Mgmt│         │ - Room Mgmt│      │ - Room Mgmt│
    │ - Game Logic          │ - Game Logic      │ - Game Logic
    │ - Turn Mgmt│         │ - Turn Mgmt│      │ - Turn Mgmt│
    │ - Bot AI   │         │ - Bot AI   │      │ - Bot AI   │
    └────────────┘         └────────────┘      └────────────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
    │   Redis     │    │  MongoDB     │    │  Analytics   │
    │ (Live State)│    │  (History)   │    │  (Optional)  │
    │             │    │              │    │              │
    │ - Rooms     │    │ - Game logs  │    │ - Stats      │
    │ - Sessions  │    │ - Players    │    │ - Metrics    │
    │ - Locks     │    │ - Results    │    │ - Heatmaps   │
    └─────────────┘    └──────────────┘    └──────────────┘
```

---

## Data Flow: A Complete Game Turn

```
PLAYER A'S TURN
───────────────

1. GAME STATE (Server knows)
   ┌─────────────────────────────────┐
   │ currentTurn: {                  │
   │   playerId: "player_A",         │
   │   diceRolled: false,            │
   │   diceValue: 0,                 │
   │   movesMade: 0                  │
   │ }                               │
   └─────────────────────────────────┘

2. PLAYER ROLLS DICE
   Client ──► socket.emit('ROLL_DICE') ──► Server
   
   Server:
   ├─ Validate: Is it Player A's turn? ✓
   ├─ Validate: Already rolled? ✗
   ├─ Generate: diceValue = crypto.random(1-6) = 4
   ├─ Update: currentTurn.diceRolled = true
   ├─ Update: currentTurn.diceValue = 4
   ├─ Log: { type: "DICE_ROLLED", playerId: "A", diceValue: 4 }
   ├─ Calculate: availableMoves = [
   │    { pieceId: "p1", from: 5, to: 9 },
   │    { pieceId: "p2", from: 20, to: 24 }
   │  ]
   └─ Broadcast: io.to(roomId).emit('DICE_ROLLED', {
        playerId: "A",
        diceValue: 4,
        availableMoves: [...]
      })

3. ALL PLAYERS SEE
   ┌─────────────────────────────┐
   │ "Player A rolled a 4!"      │
   │ Available moves shown        │
   │ (Other players: watch mode) │
   │ (Player A: can click piece) │
   └─────────────────────────────┘

4. PLAYER A MOVES A PIECE
   Client ──► socket.emit('MOVE_PIECE', {
                pieceId: "p1",
                targetPos: 9
              }) ──► Server

   Server:
   ├─ Validate: Is it Player A's turn? ✓
   ├─ Validate: Piece owned by A? ✓
   ├─ Validate: Distance = 4? ✓ (5+4=9)
   ├─ Validate: Landing not on A's piece? ✓
   ├─ Check: Is landing square occupied?
   │  → Yes! Player B's piece at 9
   │  → Not safe tile → CAPTURE!
   ├─ Apply Move:
   │  ├─ A's piece: position = 9
   │  └─ B's piece: position = -1 (home)
   ├─ Log: {
   │  type: "PIECE_MOVED",
   │  playerId: "A",
   │  pieceId: "p1",
   │  from: 5,
   │  to: 9,
   │  captured: "piece_b_0"
   │ }
   └─ Broadcast: io.to(roomId).emit('PIECE_MOVED', {
        playerId: "A",
        pieceId: "p1",
        position: 9,
        captured: "piece_b_0"
      })

5. ALL PLAYERS SEE
   ┌─────────────────────────────┐
   │ "A moved piece to 9"        │
   │ "A captured B's piece!"     │
   └─────────────────────────────┘

6. CHECK: MORE MOVES POSSIBLE?
   availableMoves = calculateMoves(A, diceValue=4)
   
   If YES:
   ├─ Wait for next move
   └─ Repeat from step 4
   
   If NO:
   ├─ Check: Did A roll 6?
   │  → YES: Extra turn, go to step 2
   │  → NO: End turn, go to step 7

7. END TURN
   ├─ Next player = B
   ├─ currentTurn = {
   │    playerId: "B",
   │    diceRolled: false,
   │    diceValue: 0,
   │    movesMade: 0
   │  }
   ├─ turnHistory.push({
   │    playerId: "A",
   │    diceValue: 4,
   │    movesMade: 1,
   │    duration: 12000
   │  })
   └─ Broadcast: io.to(roomId).emit('TURN_CHANGED', {
        newPlayerId: "B"
      })

8. PLAYER B'S TURN BEGINS
   Start turn timer (60 seconds)
   If B is bot: auto-roll after 500ms delay
```

---

## Game State at Key Points

### INITIAL STATE (Game just started)
```javascript
{
  status: "PLAYING",
  players: [
    { id: "A", name: "Alice", isBot: false },
    { id: "B", name: "Bob", isBot: false },
    { id: "C", name: "Charlie", isBot: true, botDifficulty: "HARD" },
    { id: "D", name: "Bot 4", isBot: true, botDifficulty: "MEDIUM" }
  ],
  pieces: [
    // A's pieces
    { id: "pA0", ownerId: "A", position: -1 },  // home
    { id: "pA1", ownerId: "A", position: -1 },  // home
    { id: "pA2", ownerId: "A", position: -1 },  // home
    { id: "pA3", ownerId: "A", position: -1 },  // home
    // B's pieces
    { id: "pB0", ownerId: "B", position: -1 },
    { id: "pB1", ownerId: "B", position: -1 },
    { id: "pB2", ownerId: "B", position: -1 },
    { id: "pB3", ownerId: "B", position: -1 },
    // ... C and D pieces
  ],
  currentTurn: {
    playerId: "A",
    diceRolled: false,
    diceValue: 0,
    movesMade: 0,
    startedAt: 1645000060000
  },
  eventLog: [
    { type: "GAME_STARTED", timestamp: 1645000060000 }
  ]
}
```

### MID-GAME STATE (After some moves)
```javascript
{
  status: "PLAYING",
  pieces: [
    // A's pieces
    { id: "pA0", ownerId: "A", position: 0 },    // started
    { id: "pA1", ownerId: "A", position: 5 },    // advancing
    { id: "pA2", ownerId: "A", position: 10 },   // advancing
    { id: "pA3", ownerId: "A", position: -1 },   // home
    // B's pieces
    { id: "pB0", ownerId: "B", position: -1 },   // captured by A!
    { id: "pB1", ownerId: "B", position: 15 },
    { id: "pB2", ownerId: "B", position: 20 },
    { id: "pB3", ownerId: "B", position: -1 },
    // ... more
  ],
  currentTurn: {
    playerId: "B",
    diceRolled: false,
    diceValue: 0,
    movesMade: 0,
    startedAt: 1645000120000
  },
  turnHistory: [
    {
      playerId: "A",
      diceValue: 6,
      movesMade: 1,
      hadExtraTurn: true,
      duration: 8000
    },
    {
      playerId: "A",
      diceValue: 3,
      movesMade: 2,
      hadExtraTurn: false,
      duration: 12000
    }
  ],
  eventLog: [
    { type: "GAME_STARTED", sequenceNumber: 0 },
    { type: "DICE_ROLLED", playerId: "A", diceValue: 6, sequenceNumber: 1 },
    { type: "PIECE_MOVED", playerId: "A", pieceId: "pA0", from: -1, to: 0, sequenceNumber: 2 },
    { type: "EXTRA_TURN_EARNED", playerId: "A", sequenceNumber: 3 },
    { type: "DICE_ROLLED", playerId: "A", diceValue: 3, sequenceNumber: 4 },
    { type: "PIECE_MOVED", playerId: "A", pieceId: "pA1", from: 2, to: 5, sequenceNumber: 5 },
    { type: "PIECE_CAPTURED", capturerId: "A", capturedPieceId: "pB0", sequenceNumber: 6 },
    { type: "TURN_CHANGED", fromPlayerId: "A", toPlayerId: "B", sequenceNumber: 7 }
  ]
}
```

### END GAME STATE
```javascript
{
  status: "FINISHED",
  winner: "A",
  finishedAt: 1645000900000,
  standings: [
    { rank: 1, playerId: "A", piecesAtHome: 4, finishTime: 1645000900000 },
    { rank: 2, playerId: "C", piecesAtHome: 3, finishTime: 1645000920000 },
    { rank: 3, playerId: "B", piecesAtHome: 2, finishTime: 1645000940000 },
    { rank: 4, playerId: "D", piecesAtHome: 1, finishTime: 1645001000000 }
  ],
  totalTurns: 67,
  totalDuration: 840000 // 14 minutes
}
```

---

## Real-Time Communication Sequence

```
TIME │ PLAYER A              │ PLAYER B              │ SERVER
─────┼───────────────────────┼───────────────────────┼─────────────────
 0ms │                       │                       │ Turn starts: A
     │                       │ [Waiting...]          │
     │                       │                       │
 10ms│ Clicks ROLL DICE      │                       │
 50ms│ emit('ROLL_DICE')────────────────────────────►│
     │                       │                       │ Generate: 4
 60ms│                       │                       │ Update state
     │                       │                       │ Log event
 70ms│                       │                       │
     │◄────────── DICE_ROLLED ◄─────────────────────┤
     │ 'Dice: 4'             │                       │
     │ [Show moves]          │ 'A rolled 4'          │
     │                       │ [Watch mode]          │
100ms│                       │                       │
     │ Clicks PIECE 1        │                       │
140ms│ emit('MOVE_PIECE')───────────────────────────►│
     │                       │                       │ Validate
     │                       │                       │ Check capture
     │                       │                       │ Update state
180ms│                       │                       │ Log event
     │◄────────── PIECE_MOVED ◄─────────────────────┤
     │ Piece at 9            │                       │
     │ [Captured!]           │ 'A captured you!'     │
     │                       │                       │
220ms│                       │ [B's piece → home]    │
     │                       │                       │
250ms│ [No more moves]       │                       │
300ms│ [Turn ends]           │                       │
     │                       │                       │
     │                       │                       │ Check extra turn
     │                       │                       │ No 6 rolled
     │                       │                       │
350ms│                       │                       │ New turn: B
     │◄────────── TURN_CHANGED ◄────────────────────┤
     │ 'B\'s turn'           │ 'Your turn'           │
     │ [Disable buttons]     │ [Enable ROLL button]  │
     │                       │ [Start 60s timer]     │
```

---

## Bot AI Decision Tree

```
BOT GETS TURN
    │
    ├─ Roll Dice
    │   (Server generates)
    │
    ├─ Calculate Available Moves
    │
    ├─ Score Each Move
    │   │
    │   ├─ Factor 1: Can capture opponent?
    │   │  └─ Prioritize capturing player closest to winning
    │   │
    │   ├─ Factor 2: Can finish (move to home)?
    │   │  └─ Highest priority: 10,000 points
    │   │
    │   ├─ Factor 3: Safe tile?
    │   │  └─ Protect piece from capture
    │   │
    │   ├─ Factor 4: Get piece into play?
    │   │  └─ Score = 100
    │   │
    │   ├─ Factor 5: Block dangerous opponent?
    │   │  └─ Score based on opponent's progress
    │   │
    │   └─ Factor 6: Difficulty modifier
    │      ├─ EASY: Add randomness ±20%
    │      ├─ MEDIUM: Add light randomness ±5%
    │      └─ HARD: No randomness, pure scoring
    │
    ├─ Select Move
    │   ├─ EASY: Random from top 3 scored moves
    │   ├─ MEDIUM: Weighted random (higher score = higher probability)
    │   └─ HARD: Highest scored move (deterministic)
    │
    ├─ Wait (Human-like delay)
    │   ├─ EASY: 2-4 seconds
    │   ├─ MEDIUM: 0.8-2 seconds
    │   └─ HARD: 0.3-1 second
    │
    └─ Execute Move
        └─ Server validates & broadcasts
```

---

## Performance Timeline

```
Action                          Typical Duration    Acceptable Range
─────────────────────────────────────────────────────────────────────
Client → Server (network)       50-100ms            <200ms
Server validation               10-20ms             <50ms
Server → Redis (get state)      5-10ms              <20ms
Server → Redis (set state)      5-10ms              <20ms
Server → All Clients (broadcast) 30-50ms            <200ms
Total round-trip time           100-200ms           <500ms
──────────────────────────────────────────────────────────────────────

User perception:
  <100ms  = Feels instant
  100-300ms = Feels responsive
  300-1000ms = Feels slightly delayed
  >1000ms = Feels laggy
```

---

## Scaling Progression

```
Players     Rooms     Servers     Redis      MongoDB
────────────────────────────────────────────────────
1,000       250       1          512MB      -
10,000      2,500     1          2GB        -
50,000      12,500    3          4GB        10GB
100,000     25,000    5          8GB        25GB
500,000     125,000   25         16GB       100GB
1,000,000   250,000   50         32GB       200GB

Recommendation:
- Start with 1 server + Redis + MongoDB
- Scale horizontally (add servers) when CPU > 70%
- Use Redis Cluster when memory > 100GB
- Use MongoDB Sharding when disk > 500GB
```

---

## Deployment Environments

### Development
```
┌──────────┐
│  Laptop  │
├──────────┤
│ Node.js  │
│ Redis    │
│ MongoDB  │
└──────────┘
```

### Staging
```
┌─────────────────────────────┐
│    AWS / Azure / GCP        │
├─────────────────────────────┤
│  1 Game Server              │
│  1 Redis (t3.medium)        │
│  1 MongoDB (m5.large)       │
│  HTTPS, CDN, Monitoring     │
└─────────────────────────────┘
```

### Production
```
┌──────────────────────────────────────────┐
│        AWS / Azure / GCP                 │
├──────────────────────────────────────────┤
│  Load Balancer (NGINX)                   │
│  ├─ Game Server 1 (c5.2xlarge)          │
│  ├─ Game Server 2 (c5.2xlarge)          │
│  ├─ Game Server 3 (c5.2xlarge)          │
│  ├─ ... N servers (auto-scale)          │
│                                          │
│  Redis Cluster (3 nodes, 32GB each)      │
│  MongoDB Replica Set (3 nodes)           │
│  ELK Stack (Logs)                        │
│  Prometheus + Grafana (Metrics)          │
│  PagerDuty (Alerting)                    │
└──────────────────────────────────────────┘
```

---

## Key Concepts Quick Reference

| Concept | Definition | Why Important |
|---------|-----------|--------------|
| **Server-Authoritative** | Server is sole source of truth | Prevents cheating |
| **Event Sourcing** | Every action = immutable event | Audit trail, replay, resync |
| **State Reconciliation** | Verify client/server states match | Detect and fix desync |
| **Sequence Numbers** | Counter for action ordering | Prevent replay attacks |
| **Checksums** | Hash of game state | Detect tampering |
| **Stateless Server** | No in-memory game data | Enables horizontal scaling |
| **Redis** | Fast in-memory cache | <10ms latency for live rooms |
| **MongoDB** | Persistent storage | Audit trail, analytics |
| **Socket.io** | WebSocket with fallback | Real-time + mobile reliability |
| **Load Balancing** | Distribute across servers | Scale to 100,000+ players |

---

**Use this visual guide as a quick reference when implementing or debugging.**

