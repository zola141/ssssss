# Reconnection Testing Guide

## Quick Start: Manual Testing Reconnection

### Test 1: Network Disconnect Detection (Quick Test - 2 mins)

**Setup:**
- Start the server: `npm start` (from /home/szine-/Desktop/ssssss)
- Start the frontend: `npm run dev` (from /home/szine-/Desktop/ssssss/thegame)
- Open game with 2 browsers/players
- Play a few moves to get into the game

**Steps:**
1. In one browser, open DevTools (F12)
2. Go to **Network tab**
3. Click the **three-dot menu** → "Offline" checkbox
4. **Observe:** 
   - Game UI should show: "🔄 Reconnecting... (Attempt 1 of 10)"
   - Yellow banner appears
   - Network traffic stops
5. Uncheck "Offline"
6. **Observe:**
   - Reconnect attempt completes
   - Game state restores
   - Turn indicator updates
   - Yellow banner disappears
   - Status returns to "connected"

**Expected Result:** ✅ Player sees smooth reconnection feedback and game resumes

---

### Test 2: Game State Recovery (Medium Test - 5 mins)

**Setup:**
- Same as Test 1, but this time go **fully offline DURING a move**

**Steps:**
1. Player 1: Click a piece to move
2. While animating, go **Offline** (as in Test 1)
3. Player 2: Should see "Player is offline" or grayed out indicator
4. Wait ~2-3 seconds
5. Go **Online** again
6. **Observe:**
   - Player 1's pions state should match what was committed
   - No duplicate moves or lost state
   - Board shows correct positions for both players
   - Turn continues correctly

**Expected Result:** ✅ Game state is consistent after reconnect, no corruption

---

### Test 3: Grace Period Behavior (Intermediate Test - 40 secs)

**Setup:**
- Create a persistent room with **roomCode** (not quick-play)
- Both players connected and in-game
- Player 1 should be the active turn

**Steps:**
1. Go offline for **20 seconds** (still within grace period)
2. **Observe (server logs):**
   - Log: `[Grace Period] Player X disconnected`
   - Turn should NOT skip yet (Player 1 still active)
3. Go **Online** before 30s expires
4. Reconnect completes
5. **Observe:**
   - Game state restored
   - No missed moves
   - Player 1 can continue their turn
6. Log should show: `[Reconnection] Player X reconnected - grace period timer cleared`

**Expected Result:** ✅ Player can reconnect within 30s and resume seamlessly

---

### Test 4: Auto-Skip After Grace Period (Advanced Test - 45 secs)

**Setup:**
- Persistent room with roomCode
- Player 1 is active turn (red piece)
- Both players in game

**Steps:**
1. Go **Offline**
2. Wait **31+ seconds** (past grace period)
3. **Observe (server logs):**
   - Log: `[Grace Period] Player X still disconnected after 30s - auto-skipping turn`
   - Turn should automatically skip to Player 2 (yellow)
4. **Observe (Game UI - Player 2):**
   - Turn indicator changes to yellow/Player 2
   - Player 2 can roll dice and move
5. Go **Online** and reconnect
6. **Observe:**
   - Game state shows Player 2's pieces moved
   - Turn is now Player 2's turn (or next in sequence)
   - History is preserved

**Expected Result:** ✅ Turn auto-skips after 30s, game continues fairly

---

### Test 5: Timeout After 60 Seconds (Full Disconnect Test - 70 secs)

**Setup:**
- Start fresh game
- Any setup works

**Steps:**
1. Go **Offline**
2. Wait **60+ seconds**
3. **Observe:**
   - After ~30s: banner shows "Reconnecting... (Attempt 8 of 10) - Please check your connection"
   - After ~60s: Banner changes to red ❌ "Connection error - Please refresh or check your network"
   - All game interactions are blocked/disabled
4. Go **Online**
5. **Observe:**
   - Reconnection does NOT happen automatically (hard timeout already triggered)
   - **Must refresh page to rejoin** with current game state

**Expected Result:** ✅ Hard timeout prevents infinite reconnection attempts

---

## Checklist for Developer Testing

After implementing, verify:

- [ ] Connection status state defined in useState
- [ ] Connection banner renders conditionally
- [ ] socket.on("connect") handler fires
- [ ] socket.on("disconnect") handler fires
- [ ] socket.on("reconnect_attempt") handler fires
- [ ] Game state recovery listener added (game-state-recovery)
- [ ] request-game-state emitted on reconnect detection
- [ ] Server request-game-state handler implemented
- [ ] Disconnect handler sets socketId=null for persistent rooms
- [ ] Grace period timer (30s) set on disconnect
- [ ] Grace period cleared on reconnect
- [ ] Auto-skip logic works after 30s timeout
- [ ] Move state persisted in room.gameState
- [ ] gameInProgress flag sent in room-joined response
- [ ] No console errors during disconnect/reconnect cycle

---

## Troubleshooting

**Issue:** Banner doesn't appear
- Check: Is `connectionStatus !== "connected"`?
- Check: Socket listeners registered before connection?
- Check: DevTools > Network > Offline checkbox working?

**Issue:** Game state not restored after reconnect
- Check: Server `request-game-state` handler returning data?
- Check: Client `game-state-recovery` listener updating state?
- Check: room.gameState populated after moves?

**Issue:** Turn doesn't skip after 30s
- Check: Is this a persistent room (roomCode)?
- Check: Server logs for grace period timeout message?
- Check: gracePeriodTimer cleared on reconnect (not double-clearing)?

**Issue:** Player can move after gracePeriodTimer expires
- Check: Turn validation in player-move handler?
- Check: Server emitting turn-update after auto-skip?

---

## Key Log Messages to Look For

**Client (Browser Console):**
```
[Socket] Disconnected: transport close
[Socket] Reconnection attempt: 1
[room-joined] Game in progress - requesting state recovery
[game-state-recovery] Received: {...}
[game-state-recovery] Game state restored
```

**Server (Terminal):**
```
Player disconnected: socket_id
[Grace Period] Player email still disconnected after 30s - auto-skipping turn
[Reconnection] Player email reconnected - grace period timer cleared
```

---

## Performance Notes

- Connection status banner is lightweight (no re-renders unless status changes)
- Grace period timers are per-player (minimal memory impact)
- Game state snapshot is shallow copy (no deep serialization needed)
- Socket.io handles reconnection internally (exponential backoff ~30s total)

---

## Status: Ready for Testing ✅

All reconnection logic is implemented and ready for manual testing using the steps above.
