# Reconnection Logic - Quick Reference Card

## What Was Implemented

**✅ Automatic Reconnection**
- 10 retry attempts over ~30 seconds
- Exponential backoff (socket.io default)
- Hard timeout at 60 seconds

**✅ Connection Status UI**
- Real-time banner with status (connecting, reconnecting, error)
- Attempt counter and timeout warnings
- Color-coded feedback (yellow=reconnecting, red=error)

**✅ Game State Recovery**
- Server snapshots current pions, turn, dice when player reconnects
- Client requests snapshot via `request-game-state` event
- State restored automatically after reconnection

**✅ Grace Period (Persistent Rooms)**
- 30-second window to reconnect before turn auto-skips
- Turn held for disconnected player during this window
- After 30s: turn auto-skips to next connected player

**✅ Move Sequencing**
- Server stamps authoritative sequence number on each move
- Prevents out-of-order state updates
- Guards against network reordering

---

## Key Files & Changes

### Game.jsx (Client)
```javascript
// NEW: Connection status state
const [connectionStatus, setConnectionStatus] = useState("connected");
const [reconnectAttempt, setReconnectAttempt] = useState(0);

// ENHANCED: Socket event handlers
socket.on("connect", () => { ... })           // Clear state, rejoin
socket.on("disconnect", (reason) => { ... })  // Start grace period
socket.on("reconnect_attempt", () => { ... }) // Track attempts
socket.on("game-state-recovery", (data) => { ... }) // Restore state

// NEW: Connection status banner
{connectionStatus !== "connected" && (
  <div>🔄 Reconnecting... (Attempt X of 10)</div>
)}
```

### app.js (Server)
```javascript
// ENHANCED: Disconnect handler
socket.on("disconnect", () => {
  if (room.roomCode) {  // Persistent room
    // Set socketId=null, start 30-second timer
    // After 30s: auto-skip turn if player was active
  } else {
    // Quick-play: remove immediately, skip turn
  }
});

// NEW: Game state recovery request
socket.on("request-game-state", (data) => {
  socket.emit("game-state-recovery", {
    pions, remotePions, activeColor, turnIndex, dice, bonus
  });
});

// ENHANCED: Player move handler
socket.on("player-move", (data) => {
  room.gameState.pions = data.pions;  // Persist for recovery
  room.moveSeq++;                      // Sequence guard
});
```

---

## Testing Reconnection (5 Scenarios)

### Test 1: Visual Feedback (2 mins)
1. Go offline (F12 → Network → Offline)
2. See "🔄 Reconnecting..." banner
3. Go online
4. Banner disappears, game resumes

### Test 2: State Recovery (5 mins)
1. Move a piece
2. Go offline mid-move
3. Go online
4. See correct piece positions

### Test 3: Grace Period OK (30 secs)
1. Go offline for 20 seconds
2. Go online
3. Game resumes (no turn skip)

### Test 4: Auto-Skip (45 secs)
1. Go offline for 31+ seconds
2. See turn skip to opponent in logs
3. Go online
4. Game shows new turn state

### Test 5: Hard Timeout (70 secs)
1. Go offline for 65+ seconds
2. See "❌ Connection error" banner (red)
3. Must refresh to rejoin

---

## Connection Status Flow

```
CONNECTED (normal state)
    ↓ [Network loss]
DISCONNECTING → RECONNECTING (auto-retry)
    ↓ [Network restored]
CONNECTED (game resumes)
    ↓ [No recovery in 60s]
ERROR (show error, require refresh)
```

---

## Grace Period Behavior

### Quick-Play Rooms (No roomCode)
- ❌ NO grace period
- Player removed immediately
- Turn skipped immediately

### Persistent Rooms (With roomCode)
- ✅ YES grace period (30 seconds)
- Player kept in room with `socketId = null`
- Turn skipped ONLY after 30 seconds
- Cleared if player reconnects

---

## Socket Events (Chronological)

```
CLIENT SIDE (Browser)                 SERVER SIDE (Node.js)
=====================================================

[Sends]                              [Receives]
io.connect() ────────────────→ connection event
                          ↓
              socket.on("connect")
                          ↓
emit("join-room-code") ───→ [Receives join-room-code]
                          ↓
              roomId, gameInProgress
                          ↓
[Detects gameInProgress] 
                          ↓
emit("request-game-state") → [Receives request-game-state]
                          ↓
              game-state-recovery event
                          ↓
[Receives game-state-recovery]
socket.emit("game-state-recovery")
                          ↓
setPions() ← ← ← ← ← ← ← Game state restored ✓
```

---

## Server Logs to Look For

```
[Server]
=========
Player connected: socket_id_xyz
[Grace Period] Player email still disconnected after 30s - auto-skipping turn
[Reconnection] Player email reconnected - grace period timer cleared

[Client (Browser Console)]
==========================
[Socket] Disconnected: transport close
[Socket] Reconnection attempt: 1
[room-joined] Game in progress - requesting state recovery
[game-state-recovery] Game state restored
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Banner won't appear | Socket not initialized | Check `multiplayer` or `roomCode` props |
| State not restored | Missing `game-state-recovery` listener | Add listener in useEffect |
| Turn won't skip at 30s | Timer not set correctly | Verify `gracePeriodTimer` assignment |
| Hard reconnect attempt never ends | Timeout ref not cleared | Check `reconnectTimeoutRef.current = null` |
| Move lost on disconnect | State not persisted | Verify `room.gameState.pions = data.pions` in player-move |

---

## Configuration (Tunable)

```javascript
// Client (Game.jsx)
reconnectionDelay: 1000,      // Can change (ms)
reconnectionAttempts: 10,     // Can change (max retries)
// Hard timeout: 60000ms      // Can change (ms)

// Server (app.js)
gracePeriodDuration: 30000,   // Can change (ms)
```

---

## Files to Review

📄 **Technical Details:**
- `RECONNECTION_IMPLEMENTATION.md` - Full architecture
- `RECONNECTION_TESTING.md` - Step-by-step tests
- `RECONNECTION_FINAL_REPORT.md` - Complete summary

📄 **Code:**
- `thegame/src/pages/Game.jsx` - Lines ~455-1600 (connection logic)
- `app.js` - Lines ~1948-2010, 2198-2290 (reconnection handlers)

📄 **Tracking:**
- `zzzzz_bugs` - Bug #8 marked as "IMPLEMENTED"

---

## At-a-Glance

| What | How Long | Behavior |
|------|----------|----------|
| Network blip < 30s | Auto-reconnect | Game resumes (no turn skip) |
| Network down 30-60s | Grace period expires | Turn auto-skipped, game continues |
| Network down > 60s | Hard timeout | Error shown, must refresh |
| Reconnection succeeds | < 1s | Banner dismissed, game resumes |

---

## Status: ✅ COMPLETE

All reconnection logic implemented.
Both frontend and backend build/check pass.
Ready for testing!

See RECONNECTION_TESTING.md for how to test.
