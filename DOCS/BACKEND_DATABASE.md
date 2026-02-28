# 🔧 BACKEND & DATABASE - my Responsibility

## 📍 my Responsibility
- Server setup and management
- Database design and maintenance
- User authentication & authorization
- Game room management
- Multiplayer synchronization
- API routes and endpoints

---

## 📁 my Code Locations

### Main Server File
```
app.js                        # Main server file (1207 lines)
                              # Contains:
                              # - Express setup
                              # - Socket.io handlers
                              # - All API routes
                              # - Authentication middleware
```

### Static Files You Manage
```
public/
├── login.html              # HTML form (style maintained)
├── register.html           # HTML form (style maintained)
└── profile.html            # HTML form (style maintained)
```

### Database Collections
```
MongoDB (localhost or connection string):
├── users                   # User accounts
├── gamerooms              # Active game rooms
├── gamestats              # Game results
├── messages               # Chat messages
└── gamehistory            # Game history/replays
```

---

## 🔌 Packages You Use

```json
{
  "express": "^4.22.1",              // HTTP server
  "socket.io": "^4.8.3",             // Real-time communication
  "mongoose": "^7.x",                // MongoDB driver
  "bcryptjs": "^2.4.3",              // Password hashing
  "jsonwebtoken": "^9.0.3",          // Auth tokens
  "dotenv": "^16.6.1",               // Environment variables
  "cors": "^2.8.6",                  // CORS handling
  "multer": "^1.x"                   // File uploads
}
```

---

## 📡 my Main Server Routes

### Authentication Routes (app.js)
```javascript
POST   /api/auth/register      // User registration
POST   /api/auth/login         // User login
POST   /api/auth/logout        // User logout
GET    /api/auth/verify        // Verify token
```

### Game Room Routes (app.js)
```javascript
POST   /api/rooms/create       // Create game room
POST   /api/rooms/join         // Join existing room
GET    /api/rooms/list         // List available rooms
DELETE /api/rooms/:roomId      // Delete room
```

### User Routes (app.js)
```javascript
GET    /api/users/me           // Get current user
GET    /api/users/:email       // Get user by email
PUT    /api/users/:email       // Update user profile
GET    /api/users/leaderboard  // Get rankings
```

### Game Results Routes (app.js)
```javascript
POST   /api/games/result       // Save game result
GET    /api/games/history      // Get game history
```

---

## 🔐 Socket.io Game Handlers (app.js)

### Join Room Events
```javascript
socket.on('join-room', ({ email, gameType, token }) => {
  // Find or create room
  // Add player to room
  // Emit room-joined event
});

socket.on('join-room-code', ({ email, roomCode, token }) => {
  // Find room by code
  // Add player to room
  // Emit room-joined event
});
```

### Game Events
```javascript
socket.on('dice-roll', ({ value }) => {
  // Broadcast dice roll to room
  io.to(roomId).emit('dice-rolled', { value });
});

socket.on('player-move', ({ pions }) => {
  // Update player pions
  // Broadcast to room
  io.to(roomId).emit('move-update', { pions });
});

socket.on('turn-next', () => {
  // Advance turn
  // Emit new turn to room
  io.to(roomId).emit('turn-update', { activeColor });
});

socket.on('game-end', (data) => {
  // Save game result to database
  // Emit game-finished event
  io.to(roomId).emit('game-finished', data);
});
```

### Chat Events (Coordinate with Anas)
```javascript
socket.on('chat-message', ({ email, message, roomId }) => {
  // Broadcast message to room
  io.to(roomId).emit('chat-message', {
    email,
    message,
    timestamp: Date.now()
  });
});
```

---

## 💾 Database Schema Design

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  username: String,
  nickname: String,
  avatar_color: String,
  avatar_url: String,
  wins: Number,
  losses: Number,
  draws: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### GameRooms Collection
```javascript
{
  _id: ObjectId,
  roomCode: String (unique),
  gameType: String, // "1v1" or "4-player"
  maxPlayers: Number,
  currentPlayers: Number,
  players: [
    {
      email: String,
      nickname: String,
      color: String,
      socketId: String,
      isBot: Boolean
    }
  ],
  status: String, // "waiting", "playing", "finished"
  createdBy: String,
  createdAt: Date,
  startedAt: Date,
  endedAt: Date
}
```

### GameStats Collection
```javascript
{
  _id: ObjectId,
  roomId: String,
  gameType: String,
  players: [
    {
      email: String,
      color: String,
      position: Number, // 1st, 2nd, etc
      moves: Number
    }
  ],
  winner: String,
  duration: Number, // seconds
  finishedAt: Date
}
```

---

## 🔐 Authentication Flow

### Registration
1. Client POST to `/api/auth/register`
2. Hash password with bcrypt
3. Save user to database
4. Return success message

### Login
1. Client POST to `/api/auth/login`
2. Find user by email
3. Compare password with bcrypt.compare()
4. Generate JWT token
5. Return token to client
6. Client stores token in localStorage

### Verify Token
1. Client sends token in header/query
2. Use `requireAuth` middleware
3. Verify JWT with jsonwebtoken
4. Check if token valid
5. Allow/deny access

---

## 🎮 Multiplayer Sync Logic

### Room Creation Flow
```
1. Player clicks "Create Room"
2. Backend creates room with roomCode
3. Player joins room as Player 1
4. Room waits for more players
5. When full → Game starts
```

### Player Turn Management
```
1. Player rolls dice
2. Backend broadcasts to room
3. Player moves pion
4. Backend validates move
5. Backend checks if player can move again
6. If not → Next player's turn
7. Broadcast turn change to all
```

### Game Completion
```
1. Player moves all pions to center
2. Backend detects win
3. Save game result
4. Emit game-finished event
5. Update leaderboard
```

---

## 📝 Critical Files to Maintain

| File | Lines | What to Check |
|------|-------|---------------|
| app.js | 1-100 | Server setup, middleware |
| app.js | 100-200 | API routes |
| app.js | 400-800 | Socket.io handlers |
| app.js | 800+ | Game logic |

---

## ✅ Maintenance Checklist

- [ ] Authentication works (login/register)
- [ ] Rooms create and players can join
- [ ] Multiplayer sync is working
- [ ] Dice rolls broadcast to all
- [ ] Pion movements sync correctly
- [ ] Turn management works
- [ ] Game results save to database
- [ ] Leaderboard updates
- [ ] Chat messages broadcast
- [ ] Socket disconnection handled
- [ ] Error handling works
- [ ] Database connections stable

---

## 🚨 Common Issues & Fixes

**Problem**: Players can't join room
- Check roomCode generation
- Verify socket authentication
- Ensure room listeners set up

**Problem**: Dice roll not broadcast
- Check socket.to(roomId).emit()
- Verify player is in correct room
- Check WebSocket connection

**Problem**: Database not saving
- Check MongoDB connection string
- Verify schema matches
- Check for validation errors

**Problem**: Authentication fails
- Verify token generation
- Check JWT secret
- Ensure middleware applied

---

## 📚 Important Files to Read

1. **app.js** (entire file)
   - Main server logic
   - All handlers

2. **Line 56-66** (requireAuth middleware)
   - Token verification

3. **Line 423-500** (join-room handler)
   - Room joining logic

4. **Line 500-800** (Socket.io handlers)
   - Game event handlers

5. **package.json**
   - All dependencies
   - Start script

---

## 🌍 Environment Variables

Create `.env` file:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/parchisi
JWT_SECRET my_secret_key_here
NODE_ENV=production
```

---

## 🚀 Running the Server

```bash
# Install dependencies (first time)
npm install

# Start server
node app.js

# Server runs on http://localhost:3000
```

---

## 🔄 Coordination with Others

- **Soumya**: Game events (dice-roll, player-move, turn-next)
- **Anas**: Chat events (chat-message, chat-history)
- **Kamal**: API calls for leaderboard/rooms

---

## 🎯 Current Status

✅ Server running on port 3000
✅ MongoDB connected
✅ Authentication working
✅ Rooms can be created
✅ Game events broadcasting
⚠️ Needs: Error handling refinement
⚠️ Needs: Database backup strategy

---

**Last Updated**: Feb 24, 2026
**Main File**: app.js (1207 lines)
**Database**: MongoDB (local or connection string)
