# 🎯 SOUMYA - Game Engine & Bot AI

## 📍 Your Responsibility
- Game engine and logic
- Pion movement and rules
- Bot AI implementation
- Dice rolling
- Turn management (visual)
- Game board rendering

---

## 📁 Your Code Locations

### Main Game Component
```
thegame/src/pages/
├── Game.jsx               # Main game component (1872 lines)
│                          # Contains:
│                          # - Game state management
│                          # - Board rendering
│                          # - Pion movement logic
│                          # - Bot AI
│                          # - Game rules
│                          # - Socket event handlers
├── Mode.jsx              # Game mode selection (1v1 vs 4-player)
└── Home.jsx              # Main menu
```

### Game UI Components
```
thegame/src/components/
├── LudoBoard.jsx         # Board rendering
├── DicePanel.jsx         # Dice UI
├── PlayersList.jsx       # Players list
├── MoveLog.jsx           # Move history
├── RoomCard.jsx          # Room display
└── Footer.jsx            # Footer
```

### Game Assets
```
thegame/src/assets/
└── sounds/
    └── dice.mp3          # Dice roll sound
```

### Game Styles
```
thegame/src/styles/
├── Game.css              # Main game styling
└── menu.css              # Menu styling
```

---

## 🔌 Packages You Use

```json
{
  "react": "^18.x",                  // UI framework
  "socket.io-client": "^4.8.3",      // Game events
  "vite": "^4.x"                     // Build tool
}
```

---

## 🎮 Game Rules You Implement

### Parchisi Rules
1. **Movement**: 
   - Roll dice to move pions
   - 6 = extra roll
   - Two 6s in a row = no extra roll

2. **Pawns (Pions)**:
   - 4 pawns per color
   - Start in home area
   - Must roll a 6 to move out
   - Complete 52 steps to reach center

3. **Capturing**:
   - Can capture opponent's pion on safe spots
   - 10-step paths are safe from capture
   - Captured pion returns to home

4. **Blocking**:
   - Can block with 2+ pawns
   - Blocked pion cannot pass

5. **Bonus Movement**:
   - Exact roll = 10 extra steps
   - Must manage pion blocking

---

## 🎲 Game Component (Game.jsx)

### Key State Variables
```javascript
const [activePlayer, setActivePlayer] = useState(-1);  // Current player
const [dice, setDice] = useState(null);                // Current roll
const [bonus, setBonus] = useState(0);                 // Extra steps (10 or 0)
const [rollCount, setRollCount] = useState(0);         // Rolls this turn (max 2)
const [pions, setPions] = useState({ red: [], green: [], blue: [], yellow: [] });
const [remotePions, setRemotePions] = useState({});    // Other players' pions
```

### Key Functions You Implement
```javascript
// Dice rolling
rollDiceForPlayer(color)        // Roll dice

// Movement logic
getLegalMoves(color, diceValue) // Get valid pion moves
movePawn(color, pawnIdx)        // Move specific pion
isPathBlocked(color, path)      // Check blocking
isPathClear(x, y)               // Check if cell occupied

// Bot AI
playBot(color)                  // Bot plays turn
decideBotMove()                 // Choose best move
calculateBotPriority(pion)      // Score move priority

// Game flow
nextPlayer()                    // Switch turns
checkGameEnd()                  // Check win condition
```

---

## 🤖 Bot AI Implementation

### Bot Difficulty Levels

**Current**: Medium difficulty

### Bot Decision Priority (in order)
1. **Win Move** - Move pion to center if possible
2. **Capture** - Capture opponent pion
3. **Advance** - Move forward
4. **Unblock** - Free blocked pions
5. **Random** - Move any available pion

### Bot Code Example
```javascript
const playBot = (color) => {
  const legal = getLegalMoves(color, dice);
  
  // Priority 1: Win move
  for (let move of legal) {
    if (move.willWin) return movePawn(color, move.pawnIdx);
  }
  
  // Priority 2: Capture
  for (let move of legal) {
    if (move.capturesEnemy) return movePawn(color, move.pawnIdx);
  }
  
  // Priority 3: Advance
  for (let move of legal) {
    if (move.advancesMost) return movePawn(color, move.pawnIdx);
  }
  
  // Default: move first available
  return movePawn(color, legal[0].pawnIdx);
};
```

---

## 🎯 Board Layout

### Board Grid
- 15x15 grid
- Board cells store pion information
- Safe spots marked (cannot capture)
- Center is goal

### Pion Paths (52 steps + center)
```
RED:    [6,3] → [6,0] → [0,0] → [7,0] → CENTER
GREEN:  [12,6] → [14,0] → [14,14] → [7,14] → CENTER
BLUE:   [2,8] → [0,14] → [0,0] → [7,0] → CENTER
YELLOW: [8,11] → [14,14] → [14,0] → [7,0] → CENTER
```

---

## 📡 Socket Events You Handle

### Receiving Events
```javascript
socket.on('dice-rolled', ({ value }) => {
  // Update dice display
  setDice(value);
});

socket.on('turn-update', ({ currentTurn }) => {
  // Update whose turn it is
  setActivePlayer(currentTurn);
});

socket.on('move-update', ({ email, pions }) => {
  // Update other players' pions
  setRemotePions(prev => ({
    ...prev,
    [email]: pions
  }));
});

socket.on('game-start', (data) => {
  // Initialize game
  startGame(data);
});

socket.on('game-finished', (data) => {
  // Show winner
  showGameResult(data);
});
```

### Sending Events
```javascript
socket.emit('dice-roll', { value: diceRoll });
socket.emit('player-move', { pions: myPions });
socket.emit('turn-next', {});
socket.emit('update-pions', { pions: currentPions });
```

---

## 🎨 UI Components You Create

| Component | Purpose |
|-----------|---------|
| LudoBoard | Render 15x15 board with pions |
| DicePanel | Show dice, roll button |
| PlayersList | Show all players, colors |
| MoveLog | Show move history |

---

## ✅ Checklist for Maintenance

- [ ] Dice rolls (1-6) randomly
- [ ] Pions move correct number of steps
- [ ] 6 gives extra roll
- [ ] Two 6s don't give extra roll
- [ ] Capturing works correctly
- [ ] Blocking prevents movement
- [ ] 10-step paths grant bonus
- [ ] Bot AI makes reasonable moves
- [ ] Game ends when player reaches center
- [ ] Turn switches correctly
- [ ] Board displays all pions
- [ ] No pions disappear
- [ ] Socket events received/sent
- [ ] Multiplayer pions sync

---

## 🚨 Common Issues & Fixes

**Problem**: Pions not moving
- Check: dice value set?
- Check: legal moves calculated?
- Check: pion exists at index?

**Problem**: Bot doesn't play
- Check: bot color in BOT_PLAYERS array?
- Check: playBot() called on bot turn?
- Check: bot AI logic correct?

**Problem**: Blocking doesn't work
- Check: isPathBlocked() logic
- Check: pion count on cell

**Problem**: Board doesn't render
- Check: LudoBoard receives pions prop?
- Check: CSS styles applied?
- Check: Grid coordinates correct?

---

## 📚 Files to Read & Understand

1. **Game.jsx** (entire file - 1872 lines)
   - Main game logic
   - All functions

2. **Line 70-400** - Game helper functions
   - getLegalMoves()
   - isPathBlocked()
   - etc.

3. **Line 700-1000** - Bot AI implementation
   - playBot()
   - Bot decision logic

4. **Line 1300-1500** - Pion rendering
   - Pion click handlers
   - Movement animation

5. **Game.css** - Styling
   - Board layout
   - Pion appearance

---

## 🎮 Game Modes You Handle

### 1v1 Mode
- 2 players: Red vs Yellow
- Each moves 4 pions
- First to get all 4 to center wins

### 4-Player Mode
- 4 players: Red, Green, Blue, Yellow
- Each moves 4 pions
- First to get all 4 to center wins

### Single-Player (Bot)
- Player vs AI bots
- Human is Red
- Play against computer

---

## 🔄 Bot Players Array
```javascript
const BOT_PLAYERS = ["yellow", "green", "blue"]; // or ["yellow"] for 1v1
```

When activePlayer matches BOT_PLAYERS, run bot AI automatically.

---

## 📊 Performance Optimization

- Use `useMemo` for expensive calculations
- Avoid re-rendering whole board every frame
- Only re-render changed pions
- Cache legal moves calculation

---

## 🎯 Current Status

✅ Board renders correctly
✅ Pions can be clicked
✅ Dice rolls 1-6
✅ Basic movement works
✅ Bot AI plays turns
⚠️ Needs: Smooth animations
⚠️ Needs: Better blocking logic
⚠️ Needs: Performance optimization

---

## 📝 Code Quality Notes

- Keep functions pure when possible
- Use constants for magic numbers
- Comment complex logic
- Test edge cases (exact rolls, blocking, etc)
- Handle errors gracefully

---

**Last Updated**: Feb 24, 2026
**Main File**: thegame/src/pages/Game.jsx (1872 lines)
**Status**: Functional, needs optimization
