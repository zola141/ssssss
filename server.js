import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import http from "http";
import { createRequire } from "module";
import { fileURLToPath } from "url";

// Import configuration
import { port, mongoUri, DEFAULT_AVATAR_URL } from "./src/config.js";

// Import models
import { ChatRoom } from "./src/models/index.js";

// Import middleware
import { corsMiddleware, requireAuth } from "./src/middleware/auth.js";

// Import routes
import usersRouter from "./src/routes/users.js";
import analyticsRouter from "./src/routes/analytics.js";
import roomsRouter from "./src/routes/rooms.js";
import gamesRouter from "./src/routes/games.js";
import chatRouter from "./src/routes/chat.js";
import matchesRouter from "./src/routes/matches.js";
import progressionRouter from "./src/routes/progression.js";
import { setupAuthRoutes } from "./src/routes/auth.js";

// Import socket handlers
import { initializeSocketHandlers } from "./src/socket/handlers.js";

const require = createRequire(import.meta.url);
const socketIo = require("socket.io");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express app setup
const app = express();
const server = http.createServer(app);

// Disable polling transport
server.on("request", (req, res) => {
  if (req.url && req.url.startsWith("/socket.io/") && req.url.includes("transport=polling")) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Polling transport disabled");
    return;
  }
});

// Socket.io setup
const io = socketIo(server, {
  cors: { origin: "*" },
  transports: ["websocket"]
});

// Socket.io auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  console.log(`[socket.io auth] Checking token:`, token ? "present" : "missing");
  next();
});

// Middleware
app.use(corsMiddleware);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, callback) => {
    const ext = path.extname(file.originalname);
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, "_");
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${ext}`;
    callback(null, uniqueName);
  }
});

const upload = multer({ storage });

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const gamePath = path.join(__dirname, "thegame", "dist");
app.use("/game/assets", express.static(path.join(gamePath, "assets")));
app.get("/game", (req, res) => {
  res.sendFile(path.join(gamePath, "index.html"));
});
app.use("/game", express.static(gamePath));
app.use("/game", (req, res) => {
  res.sendFile(path.join(gamePath, "index.html"));
});

const homepagePath = path.join(__dirname, "kamal_part", "dist");
app.use("/assets", express.static(path.join(homepagePath, "assets")));
app.use(express.static(homepagePath));

const leaderboardPath = path.join(__dirname, "hamza_part", "frontend", "build");
app.use("/static", express.static(path.join(leaderboardPath, "static")));

// Page routes
app.get("/", (req, res) => {
  res.sendFile(path.join(homepagePath, "index.html"));
});

app.get("/__leaderboard-debug", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  const html = `<h1>Leaderboard Debug</h1><p>Check MongoDB or metrics endpoint.</p>`;
  res.send(html);
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile.html"));
});

app.get("/stats", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "stats.html"));
});

app.get("/leaderboard", (req, res) => {
  res.sendFile(path.join(leaderboardPath, "index.html"));
});

app.get(/^\/leaderboard\/.*/, (req, res) => {
  res.sendFile(path.join(leaderboardPath, "index.html"));
});

app.get(/^\/(?!api\/|game\/|uploads\/|socket\.io\/|login$|register$|profile$|xo$).*/, (req, res) => {
  res.sendFile(path.join(homepagePath, "index.html"));
});

// API Routes
app.use("/api/users", usersRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/games", gamesRouter);
app.use("/api/chat", chatRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/achievements", progressionRouter);
app.use("/api/progression", progressionRouter);

// Setup auth routes
setupAuthRoutes(app, upload);

// Global state
const gameRooms = new Map();
const playerSockets = new Map();
const onlineUsers = new Map();

// Connect to MongoDB
mongoose.connect(mongoUri)
  .then(async () => {
    console.log("MongoDB Connected");
    try {
      const collection = mongoose.connection.collection("users");
      const indexes = await collection.indexes();
      const hasNameIndex = indexes.some((index) => index.name === "name_1");
      if (hasNameIndex) {
        await collection.dropIndex("name_1");
        console.log("Dropped legacy index name_1");
      }
      await collection.createIndex({ email: 1 }, { unique: true });
    } catch (err) {
      console.log("Index check error:", err.message);
    }

    try {
      await ChatRoom.updateOne(
        { name: "general" },
        { $setOnInsert: { name: "general", isPrivate: false } },
        { upsert: true }
      );
    } catch (err) {
      console.log("Chat room seed error:", err.message);
    }
  })
  .catch((err) => console.log(err));

// Initialize Socket.io handlers
initializeSocketHandlers(io, gameRooms, playerSockets, onlineUsers);

// Start server
function startServer(attemptPort = port) {
  server.listen(attemptPort, () => {
    console.log(`Server started on http://localhost:${attemptPort}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${attemptPort} is already in use. Stop the existing process and restart this server.`);
      process.exit(1);
    } else {
      throw err;
    }
  });
}

startServer();

export { app, server, io };
