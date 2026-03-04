# Project Resume — Team Partitions (All Things)

This file summarizes the project by partition, with:
- what each part does,
- code snippets from each part,
- technologies used,
- key software concepts.

---

## 🔴 Soumya Partition — `thegame/` (Core Game Logic)

### Resume
Soumya owns the main game engine in `thegame`, including board rules, dice turns, movement validation, bot behavior, and multiplayer state updates in the game UI.

### Code sample
File: `thegame/src/pages/Game.jsx`
```jsx
import { useState, useEffect, useRef, useMemo } from "react";
import diceSound from "../assets/sounds/dice.mp3";
import io from "socket.io-client";
import "./../styles/Game.css";

const SIZE = 15;
const CELL_SIZE = 40;

function getCellType(x, y) {
  if (x >= 6 && x <= 8 && y >= 6 && y <= 8) {
    return { type: "center", color: "#9ca3af" };
  }
}
```

### Technologies
- React 19 (`react`, `react-dom`)
- Vite 7
- `socket.io-client`
- CSS animations (`Game.css`)

### Concepts
- Turn-based game state machine
- Path/board coordinate modeling
- Rule engine (legal moves, block/safe cells, capture)
- Bot decision logic
- Client real-time sync with sockets

---

## 🟡 Salah Partition — Root Backend Framework (`server.js`, `src/routes/*`)

### Resume
Salah’s area is backend framework and user/game room management: REST APIs, authentication integration, room creation/join flow, and multiplayer backend infrastructure.

### Code sample
File: `src/routes/rooms.js`
```js
router.post("/create", async (req, res) => {
  const { email, maxPlayers } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const room = new GameRoom({ roomCode, maxPlayers: parseInt(maxPlayers), createdBy: email });
  await room.save();
  res.json({ roomCode, room });
});
```

### Technologies
- Node.js
- Express (`express`)
- MongoDB + Mongoose (`mongodb`, `mongoose`)
- Multer (`multer`) for uploads
- Socket.IO server (`socket.io`)

### Concepts
- REST API route design
- Input validation and HTTP error handling
- Persistent room/user models
- Auth-protected endpoints/middleware
- Backend orchestration of multiplayer sessions

---

## 🟢 Anas Partition — Real-time Features + Online Status (`src/socket`, `src/routes/chat.js`)

### Resume
Anas owns real-time communication: chat flow, live room events, online status behavior, socket handshake/auth usage, and synchronization events between players.

### Code sample
File: `src/socket/handlers.js`
```js
io.on("connection", (socket) => {
  const handshakeToken = socket.handshake?.auth?.token;

  socket.on("join-room", (data) => {
    const { email, token } = data;
    if (!authTokens.has(token)) {
      socket.emit("error", "Invalid token");
      return;
    }
    socket.emit("room-joined", { roomId: "..." });
  });
});
```

File: `src/routes/chat.js`
```js
router.get("/friends", requireAuth, async (req, res) => {
  const me = req.user?.email;
  const friends = await Friendship.find({ status: "accepted", $or: [{ requesterEmail: me }, { receiverEmail: me }] }).lean();
  res.json(friends);
});
```

### Technologies
- Socket.IO (server-side events)
- Express chat routes
- MongoDB collections (`ChatMessage`, `DirectMessage`, `Friendship`)

### Concepts
- Event-driven real-time architecture
- Room broadcast and player presence
- Online/offline status tracking
- Message history + direct messaging
- Grace period/reconnect handling

---

## 🟣 Hamza Partition — Analytics Dashboard + Export/Import (`hamza_part/`)

### Resume
Hamza owns analytics services and compliance features: analytics APIs, exports (CSV/JSON/XML), and dashboard backend/frontend integration.

### Code sample
File: `hamza_part/backend/src/server.ts`
```ts
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' }
});

app.use('/api/analytics', analyticsRoutes);
app.use('/api/data-export', dataExportRoutes);
app.use('/api/gdpr', gdprRoutes);
```

### Technologies
- TypeScript + Express
- PostgreSQL (`pg`)
- Socket.IO
- `helmet`, `cors`, `joi`, `jsonwebtoken`, `json2csv`, `xml2js`

### Concepts
- Analytics pipeline and statistics aggregation
- API modularization by domain
- Security middleware pipeline
- Data export format transformation
- Compliance endpoints (GDPR)

---

## 🟠 Kamal Partition — Frontend Framework (minor) (`kamal_part/`)

### Resume
Kamal owns the main UI shell and multi-page frontend experience: routing, page layout, responsive UI components, and presentation layer.

### Code sample
File: `kamal_part/src/App.jsx`
```jsx
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<MainLayout />}>
      <Route index element={<HomePage />} />
    </Route>
  )
);

export default function App() {
  return <RouterProvider router={router} />;
}
```

### Technologies
- React 19
- React Router DOM 7
- Vite 7
- Tailwind CSS 4

### Concepts
- SPA routing and route composition
- Component-driven UI architecture
- Layout/presentation separation
- Responsive UX and reusable components

---

## Full Stack Snapshot

### Root backend (`package.json`)
```json
{
  "dependencies": {
    "bcrypt": "^6.0.0",
    "express": "^5.2.1",
    "mongodb": "^7.1.0",
    "mongoose": "^9.2.1",
    "multer": "^1.4.5-lts.2",
    "socket.io": "^4.8.3"
  }
}
```

### Main partition paths
- Soumya: `thegame/`
- Salah: `server.js`, `src/routes/`, `src/models/`
- Anas: `src/socket/handlers.js`, `src/routes/chat.js`
- Hamza: `hamza_part/backend/` + `hamza_part/frontend/`
- Kamal: `kamal_part/`

---

## Note
If you want, I can generate the same content in a plain `.txt` file named `allthinks.txt` too.