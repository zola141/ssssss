# 🎮 Parchisi Multiplayer Game - Project Structure

## Team Organization

| Member | Role | Responsibility |
|--------|------|-----------------|
| **Anas** | Full-Stack Chat | Real-time chat, frontend integration, WebSocket linking |
| **Kamal** | Frontend Developer | Landing page, UI/UX (kamal_part), responsive design |
| **me** | Backend Developer | Database, server logic, multiplayer sync, authentication |
| **Soumya** | Game Developer | Game engine, bot AI, game rules, pion movement |

---

## 📁 Project Directory Structure

```
final_project/
├── DOCS/                      # Team Documentation
│   ├── PROJECT_STRUCTURE.md   # This file
│   ├── ANAS_CHAT_REALTIME.md
│   ├── KAMAL_FRONTEND.md
│   ├── BACKEND_DATABASE.md
│   └── SOUMYA_GAME_BOTS.md
│
├── app.js                     # Main server entry point
├── package.json               # Root dependencies
│
├── public/                    # Static HTML pages
│   ├── login.html             # Login page (Anas/Kamal)
│   ├── register.html          # Register page (Anas/Kamal)
│   └── profile.html           # User profile (Anas/Kamal)
│
├── kamal_part/                # 🎨 KAMAL'S FRONTEND
│   ├── src/
│   │   ├── pages/             # Landing page, home
│   │   ├── components/        # UI components
│   │   └── styles/            # CSS styles
│   ├── dist/                  # Built frontend
│   ├── package.json
│   └── vite.config.js
│
├── thegame/                   # 🎯 SOUMYA'S GAME ENGINE
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Game.jsx       # Main game component (Soumya)
│   │   │   ├── Mode.jsx       # Game mode selection
│   │   │   └── Home.jsx
│   │   ├── components/        # UI components
│   │   │   ├── ChatBot.jsx    # Chat (Anas)
│   │   │   ├── ChatPanel.jsx  # Chat (Anas)
│   │   │   ├── DicePanel.jsx  # Dice (Soumya)
│   │   │   ├── LudoBoard.jsx  # Board (Soumya)
│   │   │   ├── PlayersList.jsx# Players list
│   │   │   └── ...
│   │   ├── assets/
│   │   │   └── sounds/        # Game audio
│   │   └── styles/
│   │       └── Game.css
│   ├── dist/                  # Built game
│   ├── package.json
│   └── vite.config.js
│
├── uploads/                   # User uploads (avatars, etc)
└── node_modules/              # Dependencies

```

---

## 🔗 Key Connection Points

### Frontend Routes
- `/` → Homepage (Kamal - kamal_part)
- `/game` → Game page (Soumya - thegame)
- `/login`, `/register`, `/profile` → Auth pages (Anas/Kamal)

### Backend Routes (app.js)
- `/api/auth/*` → Authentication (Your responsibility)
- `/api/rooms/*` → Game room management (Your responsibility)
- `/api/users/*` → User management (Your responsibility)
- WebSocket handlers → Game events, chat messages (Anas + Soumya)

### WebSocket Events
- `join-room` → Room joining (Backend + Soumya)
- `dice-roll` → Dice roll (Soumya)
- `player-move` → Pion movement (Soumya)
- `turn-next` → Turn management (Soumya)
- `chat-message` → Chat messages (Anas)

---

## 📦 Dependencies Overview

| Package | Used By | Purpose |
|---------|---------|---------|
| express | Backend (You) | HTTP server |
| socket.io | Backend + Anas | Real-time communication |
| mongoose | Backend (You) | MongoDB ODM |
| bcrypt | Backend (You) | Password hashing |
| jsonwebtoken | Backend (You) | Authentication tokens |
| react | Kamal + Soumya + Anas | Frontend framework |
| vite | Kamal + Soumya | Build tool |
| react-router | Kamal | Page routing |

---

## 🚀 Running the Project

```bash
# Start the server (runs everything)
node app.js

# Server starts on http://localhost:3000
# - Frontend (Kamal's landing page): /
# - Game (Soumya's game): /game
# - Chat (Anas integration): integrated in game
```

---

## 📝 Important Files to Know

| File | Owner | Purpose |
|------|-------|---------|
| app.js | You (Backend) | Main server, socket handlers, routes |
| Game.jsx | Soumya (Game) | Main game engine, game logic |
| ChatPanel.jsx | Anas (Chat) | Real-time chat UI |
| kamal_part/src | Kamal (Frontend) | Landing page and main UI |

---

## 🔐 Database Collections

Your responsibility to maintain:
- `users` - User accounts
- `gamerooms` - Active game rooms
- `gamestats` - Game results and statistics

---

## 📞 Communication Protocol

- **Real-time updates**: Socket.io events (Anas coordinates)
- **Game events**: Server sends to all players
- **Chat messages**: Broadcast to room players (Anas)
- **Turn management**: Server controls (You)

---

See individual member documentation files for detailed information.
