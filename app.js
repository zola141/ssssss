import express from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import { parse } from "url";
import { fileURLToPath } from "url";
import http from "http";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
server.on("request", (req, res) => {
  if (req.url && req.url.startsWith("/socket.io/") && req.url.includes("transport=polling")) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Polling transport disabled");
    return;
  }
});
const io = socketIo(server, {
  cors: { origin: "*" },
  transports: ["websocket"]
});

// Socket.io auth middleware - validate token on connection
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  console.log(`[socket.io auth] Checking token:`, token ? "present" : "missing");
  
  if (!token || !authTokens.has(token)) {
    console.log(`[socket.io auth] Invalid token - allowing connection anyway for backward compatibility`);
    // Allow connection anyway - events will check token
  }
  next();
});

const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple in-memory token storage
const authTokens = new Map();

// Game rooms and players
const gameRooms = new Map();
const playerSockets = new Map();
const onlineUsers = new Map();

const DEFAULT_AVATAR_URL = "/default-avatar.svg";

const markUserOnline = (email) => {
  if (!email) return;
  onlineUsers.set(email, (onlineUsers.get(email) || 0) + 1);
};

const markUserOffline = (email) => {
  if (!email) return;
  const current = onlineUsers.get(email) || 0;
  if (current <= 1) {
    onlineUsers.delete(email);
  } else {
    onlineUsers.set(email, current - 1);
  }
};

const isUserOnline = (email) => (onlineUsers.get(email) || 0) > 0;

/* ========================
   MIDDLEWARE
======================== */

// CORS headers
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.host;
  res.header("Access-Control-Allow-Origin", origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// For form data
app.use(express.urlencoded({ extended: true }));

// Optional if you still want JSON support
app.use(express.json());

// Authentication middleware - check token from query or header
function requireAuth(req, res, next) {
  const token = req.query.token || req.headers.authorization?.replace("Bearer ", "");
  if (token && authTokens.has(token)) {
    req.user = authTokens.get(token);
    next();
  } else {
    res.redirect("/");
  }
}

// Serve static files (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve built React game - static files first (protected route)
const gamePath = path.join(__dirname, "thegame/dist");
app.use("/game/assets", express.static(path.join(gamePath, "assets")));
app.get("/game", (req, res) => {
  res.sendFile(path.join(gamePath, "index.html"));
});
app.use("/game", express.static(gamePath));
// Catch-all for React routing in game
app.use("/game", (req, res) => {
  res.sendFile(path.join(gamePath, "index.html"));
});

// Serve built React homepage (kamal_part)
const homepagePath = path.join(__dirname, "kamal_part/dist");
app.use("/assets", express.static(path.join(homepagePath, "assets")));
app.use(express.static(homepagePath));

// Serve Hamza frontend (merged in same backend at /leaderboard) when build exists
const hamzaBuildPath = path.join(__dirname, "hamza_part/frontend/build");
const hamzaBuildIndexPath = path.join(hamzaBuildPath, "index.html");
const hasHamzaBuild = fs.existsSync(hamzaBuildIndexPath);

if (hasHamzaBuild) {
  // CRA build uses absolute /static/* paths by default
  app.use("/static", express.static(path.join(hamzaBuildPath, "static")));

  // Common CRA root assets
  app.get("/asset-manifest.json", (req, res) => {
    res.sendFile(path.join(hamzaBuildPath, "asset-manifest.json"));
  });

  app.get("/manifest.json", (req, res) => {
    res.sendFile(path.join(hamzaBuildPath, "manifest.json"));
  });

  app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(hamzaBuildPath, "favicon.ico"));
  });

  app.use("/leaderboard/static", express.static(path.join(hamzaBuildPath, "static")));
  app.use("/leaderboard", express.static(hamzaBuildPath));
}

/* ========================
   PAGE ROUTES
======================== */

// Landing page - React HomePage
app.get("/", (req, res) => {
  res.sendFile(path.join(homepagePath, "index.html"));
});

// Debug endpoint to verify active backend instance/version
app.get("/__leaderboard-debug", (req, res) => {
  res.json({
    ok: true,
    hasHamzaBuild,
    hamzaBuildPath,
    ts: new Date().toISOString()
  });
});

// Login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Register page
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

// Profile page (protected)
app.get("/profile", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile.html"));
});

// Offline XO page (protected)
app.get("/xo", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "xo.html"));
});

// Statistics page (protected)
app.get("/stats", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "stats.html"));
});

// Legacy home route - redirect to profile
app.get("/home", requireAuth, (req, res) => {
  res.redirect("/profile" + (req.originalUrl.includes('?') ? req.originalUrl.substring(req.originalUrl.indexOf('?')) : ''));
});

app.get("/leaderboard", (req, res) => {
  if (hasHamzaBuild) {
    return res.sendFile(hamzaBuildIndexPath);
  }
  return res.sendFile(path.join(homepagePath, "index.html"));
});

app.get(/^\/leaderboard\/.*/, (req, res) => {
  if (hasHamzaBuild) {
    return res.sendFile(hamzaBuildIndexPath);
  }
  return res.sendFile(path.join(homepagePath, "index.html"));
});

// SPA catch-all for merged main frontend routes (e.g. /leaderboard, /rooms, /play)
app.get(/^\/(?!api\/|game\/|uploads\/|socket\.io\/|login$|register$|profile$|home$|xo$).*/, (req, res) => {
  res.sendFile(path.join(homepagePath, "index.html"));
});

/* ========================
   API ROUTES
======================== */

app.get("/api/users/me", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email }).select("email profileImageUrl wins losses draws matches id nickname name age gender country level xp totalXpNeeded matchHistory achievements");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const payload = user.toObject();
    payload.profileImageUrl = payload.profileImageUrl || DEFAULT_AVATAR_URL;
    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Analytics adapter: Hamza-compatible stats shape from MongoDB users
app.get("/api/analytics/stats", async (req, res) => {
  try {
    const { userId } = req.query;

    const query = {};
    if (userId) {
      query.id = Number(userId);
    }

    const users = await User.find(query)
      .select("id nickname wins losses matches")
      .sort({ wins: -1, matches: -1, nickname: 1 })
      .lean();

    const rows = users.map((u) => {
      const safeWins = Number(u.wins || 0);
      const safeLosses = Number(u.losses || 0);
      const xp = Math.max(0, safeWins * 100 - safeLosses * 25);
      const level = Math.max(1, Math.floor(xp / 500) + 1);

      return {
        user_id: String(u.id),
        username: u.nickname,
        total_wins: safeWins,
        total_losses: safeLosses,
        level,
        xp
      };
    });

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Export analytics as JSON file with Hamza-compatible structure
app.get("/api/analytics/export", async (req, res) => {
  try {
    const users = await User.find({})
      .select("id nickname wins losses matches")
      .sort({ wins: -1, matches: -1, nickname: 1 })
      .lean();

    const stats = users.map((u) => {
      const safeWins = Number(u.wins || 0);
      const safeLosses = Number(u.losses || 0);
      const xp = Math.max(0, safeWins * 100 - safeLosses * 25);
      const level = Math.max(1, Math.floor(xp / 500) + 1);

      return {
        user_id: String(u.id),
        username: u.nickname,
        total_wins: safeWins,
        total_losses: safeLosses,
        level,
        xp
      };
    });

    const payload = {
      generatedAt: new Date().toISOString(),
      source: "mongodb-users",
      stats
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=analytics-stats.json");
    res.send(JSON.stringify(payload, null, 2));
  } catch (err) {
    res.status(500).json({ error: "Failed to export analytics" });
  }
});

// Create a game room with a code
app.post("/api/rooms/create", async (req, res) => {
  try {
    const { email, maxPlayers } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 6-digit room code
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room = new GameRoom({
      roomCode,
      maxPlayers: parseInt(maxPlayers),
      createdBy: email,
      players: [{
        email,
        nickname: user.nickname,
        color: maxPlayers === 2 ? "red" : "red",
        socketId: null
      }]
    });

    await room.save();
    res.json({ roomCode, room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Join a game room
app.post("/api/rooms/join", async (req, res) => {
  try {
    const { roomCode, email } = req.body;
    
    const room = await GameRoom.findOne({ roomCode });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({ message: "Room is full" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Assign color based on player count (only 1v1 supported)
    const colors = ["red", "yellow"];
    const playerColor = colors[room.players.length];

    room.players.push({
      email,
      nickname: user.nickname,
      color: playerColor,
      socketId: null
    });

    await room.save();
    res.json({ room, playerColor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update game results (wins/losses/draws)
app.post("/api/games/result", async (req, res) => {
  try {
    const { winnersEmails, losersEmails } = req.body;

    // Update winners
    for (const email of winnersEmails) {
      await User.findOneAndUpdate(
        { email },
        { 
          $inc: { wins: 1, matches: 1 }
        }
      );
    }

    // Update losers
    for (const email of losersEmails) {
      await User.findOneAndUpdate(
        { email },
        { 
          $inc: { losses: 1, matches: 1 }
        }
      );
    }

    res.json({ message: "Game results updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Chat: list rooms
app.get("/api/chat/rooms", requireAuth, async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ isPrivate: false }).sort({ createdAt: 1 }).lean();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Chat: room messages
app.get("/api/chat/rooms/:id/messages", requireAuth, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ roomId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Chat: list users for DM/friends
app.get("/api/chat/users", requireAuth, async (req, res) => {
  try {
    const me = req.user?.email;
    const users = await User.find({ email: { $ne: me } })
      .select("email nickname profileImageUrl")
      .lean();
    res.json(users.map((user) => ({
      ...user,
      profileImageUrl: user.profileImageUrl || DEFAULT_AVATAR_URL,
      isOnline: isUserOnline(user.email)
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Chat: friends list
app.get("/api/chat/friends", requireAuth, async (req, res) => {
  try {
    const me = req.user?.email;
    const friends = await Friendship.find({
      status: "accepted",
      $or: [{ requesterEmail: me }, { receiverEmail: me }]
    }).lean();

    const friendEmails = friends.map((f) => (f.requesterEmail === me ? f.receiverEmail : f.requesterEmail));
    const friendUsers = await User.find({ email: { $in: friendEmails } })
      .select("email nickname profileImageUrl")
      .lean();
    res.json(friendUsers.map((user) => ({
      ...user,
      profileImageUrl: user.profileImageUrl || DEFAULT_AVATAR_URL,
      isOnline: isUserOnline(user.email)
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Chat: pending friend requests
app.get("/api/chat/friends/pending", requireAuth, async (req, res) => {
  try {
    const me = req.user?.email;
    const pending = await Friendship.find({ receiverEmail: me, status: "pending" }).lean();
    const users = await User.find({ email: { $in: pending.map((p) => p.requesterEmail) } })
      .select("email nickname profileImageUrl")
      .lean();
    res.json(users.map((user) => ({
      ...user,
      profileImageUrl: user.profileImageUrl || DEFAULT_AVATAR_URL,
      isOnline: isUserOnline(user.email)
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Chat: send friend request
app.post("/api/chat/friends/request/:email", requireAuth, async (req, res) => {
  try {
    const me = req.user?.email;
    const target = req.params.email;
    if (!target || target === me) return res.status(400).json({ message: "Invalid user" });

    await Friendship.updateOne(
      { requesterEmail: me, receiverEmail: target },
      { $setOnInsert: { requesterEmail: me, receiverEmail: target, status: "pending" } },
      { upsert: true }
    );
    res.json({ sent: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Chat: accept friend request
app.post("/api/chat/friends/accept/:email", requireAuth, async (req, res) => {
  try {
    const me = req.user?.email;
    const requester = req.params.email;
    await Friendship.updateOne(
      { requesterEmail: requester, receiverEmail: me },
      { $set: { status: "accepted" } }
    );
    res.json({ accepted: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Chat: remove friend
app.delete("/api/chat/friends/:email", requireAuth, async (req, res) => {
  try {
    const me = req.user?.email;
    const other = req.params.email;
    await Friendship.deleteOne({
      $or: [
        { requesterEmail: me, receiverEmail: other },
        { requesterEmail: other, receiverEmail: me }
      ]
    });
    res.json({ removed: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Chat: DM history
app.get("/api/chat/dm/:email", requireAuth, async (req, res) => {
  try {
    const me = req.user?.email;
    const other = req.params.email;
    const messages = await DirectMessage.find({
      $or: [
        { senderEmail: me, receiverEmail: other },
        { senderEmail: other, receiverEmail: me }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    await DirectMessage.updateMany(
      { senderEmail: other, receiverEmail: me, read: false },
      { $set: { read: true } }
    );

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ========================
   CONNECT TO MONGODB
======================== */

mongoose.connect("mongodb+srv://zinecompany41_db_user:rYUKAmyF5hF4NcbB@cluster0.kri2lqk.mongodb.net/?appName=Cluster0")
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

/* ========================
   USER SCHEMA
======================== */

const userSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profileImageUrl: {
    type: String,
    default: DEFAULT_AVATAR_URL
  },
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  draws: {
    type: Number,
    default: 0
  },
  matches: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  totalXpNeeded: {
    type: Number,
    default: 100
  },
  country: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  matchHistory: [
    {
      matchId: String,
      opponent: String,
      opponentNickname: String,
      result: { type: String, enum: ['win', 'loss', 'draw'] },
      date: { type: Date, default: Date.now },
      duration: Number,
      scores: { playerScore: Number, opponentScore: Number }
    }
  ],
  achievements: [
    {
      id: String,
      name: String,
      description: String,
      unlockedAt: Date,
      icon: String
    }
  ]
});

const User = mongoose.model("User", userSchema);

const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  seq: {
    type: Number,
    required: true
  }
});

const Counter = mongoose.model("Counter", counterSchema);

const gameRoomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true
  },
  maxPlayers: {
    type: Number,
    required: true,
    enum: [2],
    default: 2
  },
  createdBy: {
    type: String,
    required: true
  },
  players: [
    {
      email: String,
      nickname: String,
      color: String,
      socketId: String
    }
  ],
  status: {
    type: String,
    enum: ["waiting", "playing", "finished"],
    default: "waiting"
  },
  winner: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Auto delete after 1 hour
  }
});

const GameRoom = mongoose.model("GameRoom", gameRoomSchema);

const chatMessageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  senderEmail: {
    type: String,
    required: true
  },
  senderNickname: {
    type: String,
    required: true
  },
  senderAvatar: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

const chatRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

const directMessageSchema = new mongoose.Schema({
  senderEmail: { type: String, required: true },
  receiverEmail: { type: String, required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const DirectMessage = mongoose.model("DirectMessage", directMessageSchema);

const friendshipSchema = new mongoose.Schema({
  requesterEmail: { type: String, required: true },
  receiverEmail: { type: String, required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

friendshipSchema.index({ requesterEmail: 1, receiverEmail: 1 }, { unique: true });

const Friendship = mongoose.model("Friendship", friendshipSchema);

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

app.put("/api/users/me", requireAuth, upload.single("profile"), async (req, res) => {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updates = {};
    const allowedFields = ["name", "nickname", "country", "gender", "age"];

    allowedFields.forEach((field) => {
      if (typeof req.body[field] !== "undefined" && req.body[field] !== "") {
        updates[field] = req.body[field];
      }
    });

    if (typeof updates.age !== "undefined") {
      const parsedAge = parseInt(updates.age, 10);
      if (Number.isNaN(parsedAge) || parsedAge <= 0) {
        return res.status(400).json({ message: "Invalid age" });
      }
      updates.age = parsedAge;
    }

    if (req.file) {
      updates.profileImageUrl = `/uploads/${req.file.filename}`;
    }

    const updated = await User.findOneAndUpdate(
      { email },
      { $set: updates },
      { new: true }
    ).select("email profileImageUrl wins losses draws matches id nickname name age gender country level xp totalXpNeeded");

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    const payload = updated.toObject();
    payload.profileImageUrl = payload.profileImageUrl || DEFAULT_AVATAR_URL;
    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* ========================
   MATCH HISTORY & STATISTICS
======================== */

// Get user's match history
app.get("/api/matches/history", requireAuth, async (req, res) => {
  try {
    const email = req.user?.email;
    const limit = parseInt(req.query.limit || 20);
    
    const user = await User.findOne({ email }).select("matchHistory");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const history = user.matchHistory.slice(-limit).reverse();
    return res.json(history);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Record a match result
app.post("/api/matches/record", requireAuth, async (req, res) => {
  try {
    const email = req.user?.email;
    const { opponentEmail, opponentNickname, result, duration, playerScore, opponentScore } = req.body;

    if (!opponentEmail || !result || !['win', 'loss', 'draw'].includes(result)) {
      return res.status(400).json({ message: "Invalid match data" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user stats
    if (result === 'win') {
      user.wins += 1;
      user.xp += 50;
    } else if (result === 'loss') {
      user.losses += 1;
      user.xp += 10;
    } else {
      user.draws += 1;
      user.xp += 25;
    }
    user.matches += 1;

    // Check for level up
    while (user.xp >= user.totalXpNeeded) {
      user.xp -= user.totalXpNeeded;
      user.level += 1;
      user.totalXpNeeded = Math.floor(user.totalXpNeeded * 1.2);
      checkAndUnlockAchievements(user, 'level-up');
    }

    // Add to match history
    user.matchHistory.push({
      matchId: `match_${Date.now()}`,
      opponent: opponentEmail,
      opponentNickname: opponentNickname || 'Unknown',
      result,
      duration: duration || 0,
      scores: { playerScore: playerScore || 0, opponentScore: opponentScore || 0 }
    });

    // Keep only last 100 matches
    if (user.matchHistory.length > 100) {
      user.matchHistory = user.matchHistory.slice(-100);
    }

    // Check for achievements
    checkAndUnlockAchievements(user, result);

    await user.save();

    return res.json({
      stats: {
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        matches: user.matches,
        level: user.level,
        xp: user.xp,
        totalXpNeeded: user.totalXpNeeded
      },
      newAchievements: user.achievements.filter(a => !a.unlockedAt || (Date.now() - a.unlockedAt) < 5000)
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get user achievements
app.get("/api/achievements", requireAuth, async (req, res) => {
  try {
    const email = req.user?.email;
    
    const user = await User.findOne({ email }).select("achievements");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user.achievements || []);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get user progression stats
app.get("/api/progression", requireAuth, async (req, res) => {
  try {
    const email = req.user?.email;
    
    const user = await User.findOne({ email }).select("level xp totalXpNeeded wins losses draws matches");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const winRate = user.matches > 0 ? ((user.wins / user.matches) * 100).toFixed(1) : 0;
    const elo = Math.max(100, 1000 + (user.wins * 30) - (user.losses * 15));

    return res.json({
      level: user.level,
      xp: user.xp,
      totalXpNeeded: user.totalXpNeeded,
      xpPercentage: user.totalXpNeeded > 0 ? ((user.xp / user.totalXpNeeded) * 100).toFixed(1) : 0,
      wins: user.wins,
      losses: user.losses,
      draws: user.draws,
      matches: user.matches,
      winRate: parseFloat(winRate),
      elo
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// TEST ENDPOINT - Simulate game result without playing
app.post("/api/test/simulate-game", requireAuth, async (req, res) => {
  try {
    const email = req.user?.email;
    const { opponentEmail, result } = req.body; // result: 'win' or 'loss'
    
    if (!opponentEmail) {
      return res.status(400).json({ message: "opponentEmail is required" });
    }
    
    if (!result || !['win', 'loss'].includes(result)) {
      return res.status(400).json({ message: "result must be 'win' or 'loss'" });
    }

    const user = await User.findOne({ email });
    const opponent = await User.findOne({ email: opponentEmail });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!opponent) {
      return res.status(404).json({ message: "Opponent not found" });
    }

    const duration = Math.floor(Math.random() * 15) + 5; // Random 5-20 minutes
    
    // Update current user
    if (result === 'win') {
      user.wins += 1;
      user.xp += 50;
    } else {
      user.losses += 1;
      user.xp += 10;
    }
    user.matches += 1;
    
    // Level up logic
    while (user.xp >= user.totalXpNeeded) {
      user.xp -= user.totalXpNeeded;
      user.level += 1;
      user.totalXpNeeded = Math.floor(user.totalXpNeeded * 1.2);
    }
    
    // Add to match history
    user.matchHistory.push({
      matchId: `test_match_${Date.now()}`,
      opponent: opponent.email,
      opponentNickname: opponent.nickname,
      result: result,
      duration: duration,
      scores: { 
        playerScore: result === 'win' ? 4 : Math.floor(Math.random() * 3), 
        opponentScore: result === 'win' ? Math.floor(Math.random() * 3) : 4 
      },
      date: new Date()
    });
    
    checkAndUnlockAchievements(user, result);
    if (user.matchHistory.length > 100) user.matchHistory = user.matchHistory.slice(-100);
    
    await user.save();
    
    // Update opponent (opposite result)
    const opponentResult = result === 'win' ? 'loss' : 'win';
    if (opponentResult === 'win') {
      opponent.wins += 1;
      opponent.xp += 50;
    } else {
      opponent.losses += 1;
      opponent.xp += 10;
    }
    opponent.matches += 1;
    
    // Level up logic for opponent
    while (opponent.xp >= opponent.totalXpNeeded) {
      opponent.xp -= opponent.totalXpNeeded;
      opponent.level += 1;
      opponent.totalXpNeeded = Math.floor(opponent.totalXpNeeded * 1.2);
    }
    
    // Add to opponent's match history
    opponent.matchHistory.push({
      matchId: `test_match_${Date.now()}`,
      opponent: user.email,
      opponentNickname: user.nickname,
      result: opponentResult,
      duration: duration,
      scores: { 
        playerScore: opponentResult === 'win' ? 4 : Math.floor(Math.random() * 3), 
        opponentScore: opponentResult === 'win' ? Math.floor(Math.random() * 3) : 4 
      },
      date: new Date()
    });
    
    checkAndUnlockAchievements(opponent, opponentResult);
    if (opponent.matchHistory.length > 100) opponent.matchHistory = opponent.matchHistory.slice(-100);
    
    await opponent.save();
    
    // Calculate new ELO
    const newElo = Math.max(100, 1000 + (user.wins * 30) - (user.losses * 15));
    
    return res.json({
      message: `✅ Simulated game: You ${result}!`,
      yourStats: {
        wins: user.wins,
        losses: user.losses,
        matches: user.matches,
        level: user.level,
        xp: user.xp,
        totalXpNeeded: user.totalXpNeeded,
        elo: newElo,
        newAchievements: user.achievements.filter(a => (Date.now() - new Date(a.unlockedAt).getTime()) < 5000).map(a => a.name)
      },
      opponentStats: {
        nickname: opponent.nickname,
        wins: opponent.wins,
        losses: opponent.losses,
        matches: opponent.matches
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Helper function to check and unlock achievements
function checkAndUnlockAchievements(user, trigger) {
  const achievementsList = [
    { id: 'first-win', name: 'First Win!', icon: '🎉', condition: () => trigger === 'win' && user.wins === 1 },
    { id: 'ten-wins', name: 'Victorious', icon: '⚔️', condition: () => user.wins >= 10 },
    { id: 'hundred-wins', name: 'Champion', icon: '👑', condition: () => user.wins >= 100 },
    { id: 'level-5', name: 'Rising Star', icon: '⭐', condition: () => user.level >= 5 },
    { id: 'level-10', name: 'Master', icon: '🔥', condition: () => user.level >= 10 },
    { id: 'draw-king', name: 'Balanced', icon: '⚖️', condition: () => user.draws >= 5 },
    { id: 'matches-10', name: 'Veteran', icon: '🛡️', condition: () => user.matches >= 10 },
    { id: 'matches-50', name: 'Legend', icon: '🏆', condition: () => user.matches >= 50 },
    { id: 'win-rate-80', name: 'Dominator', icon: '🚀', condition: () => user.matches >= 10 && (user.wins / user.matches) >= 0.8 }
  ];

  achievementsList.forEach(ach => {
    const hasAchievement = user.achievements.some(a => a.id === ach.id);
    if (!hasAchievement && ach.condition()) {
      user.achievements.push({
        id: ach.id,
        name: ach.name,
        description: `Unlocked: ${ach.name}`,
        icon: ach.icon,
        unlockedAt: new Date()
      });
    }
  });
}


/* ========================
   REGISTER
======================== */

app.post("/register", upload.single("profile"), async (req, res) => {
  try {
    const { email, password, name, nickname, country, gender, age } = req.body;

    if (!email || !password || !name || !nickname || !country || !gender || !age) {
      return res.status(400).send("All fields are required!");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exists!");
    }

    const counter = await Counter.findOneAndUpdate(
      { name: "user" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const hashedPassword = await bcrypt.hash(password, 10);

    const profileImageUrl = req.file ? `/uploads/${req.file.filename}` : DEFAULT_AVATAR_URL;

    const newUser = new User({
      id: counter.seq,
      name,
      nickname,
      email,
      password: hashedPassword,
      profileImageUrl,
      wins: 0,
      losses: 0,
      draws: 0,
      matches: 0,
      country,
      gender,
      age: parseInt(age)
    });

    await newUser.save();

    // Redirect to login page after successful registration
    res.redirect("/");

  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* ========================
   LOGIN
======================== */

app.post("/login", async (req, res) => {
  try {
    const { nickname, password } = req.body;

    const user = await User.findOne({ nickname });
    if (!user) {
      return res.status(400).send("Wrong nickname or password!");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).send("Wrong nickname or password!");
    }

    // Generate random token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    authTokens.set(token, { userId: user._id, email: user.email });

    // Redirect to profile page with token
    res.redirect(`/profile?email=${encodeURIComponent(user.email)}&token=${token}`);

  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* ========================
   START SERVER
======================== */

// WebSocket multiplayer handlers
io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // Player joins a game room (1v1 only)
  socket.on("join-room", (data) => {
    const { email, gameType, token } = data;
    
    if (!authTokens.has(token)) {
      socket.emit("error", "Invalid token");
      return;
    }

    // Find or create a 1v1 room
    let room = Array.from(gameRooms.values()).find(
      (r) => r.gameType === "1v1" && r.players.length < 2 && r.status === "waiting"
    );

    if (!room) {
      const roomId = Math.random().toString(36).substring(7);
      room = {
        id: roomId,
        gameType: "1v1",
        players: [],
        status: "waiting",
        gameState: {}
      };
      gameRooms.set(roomId, room);
    }

    // Add player to room
    const turnOrder = ["red", "yellow"];
    const playerIndex = room.players.length;
    const playerColor = turnOrder[playerIndex];
    room.players.push({ email, socketId: socket.id, userId: authTokens.get(token).userId, color: playerColor });
    playerSockets.set(socket.id, { email, roomId: room.id });

    socket.join(room.id);
    socket.emit("room-joined", { roomId: room.id, players: room.players, playerIndex, playerCount: room.players.length, gameType: "1v1" });

    // Notify others in room
    io.to(room.id).emit("players-updated", { players: room.players, playerCount: room.players.length, gameType: "1v1" });

    // Start game if room is full (2 players)
    if (room.players.length === 2) {
      room.status = "playing";
      room.turnOrder = turnOrder;
      room.turnIndex = 0;
      io.to(room.id).emit("game-start", { players: room.players });
      io.to(room.id).emit("turn-update", { activeColor: room.turnOrder[room.turnIndex], turnIndex: room.turnIndex, turnOrder: room.turnOrder });
    }
  });

  // Join room by code (from home page UI)
  socket.on("join-room-code", async (data) => {
    console.log(`\n========== JOIN-ROOM-CODE EVENT ==========`);
    console.log(`Data received:`, JSON.stringify(data, null, 2));
    const { roomCode, email, token } = data;
    
    if (!authTokens.has(token)) {
      console.log(`[join-room-code] Invalid token for ${email}`);
      socket.emit("error", "Invalid token");
      return;
    }

    try {
      const room = await GameRoom.findOne({ roomCode });
      if (!room) {
        console.log(`[join-room-code] Room ${roomCode} not found in database`);
        socket.emit("error", "Room not found");
        return;
      }
      console.log(`[join-room-code] Found room ${roomCode} with ${room.players.length} players, maxPlayers: ${room.maxPlayers}`);

      const isRoomMember = room.players.some((player) => player.email === email);
      if (!isRoomMember) {
        console.log(`[join-room-code] ${email} is not a member of room ${roomCode}`);
        socket.emit("error", "You are not a member of this room");
        return;
      }
      console.log(`[join-room-code] ${email} verified as room member`);

      // Create internal room in gameRooms if not exists
      let internalRoom = Array.from(gameRooms.values()).find(r => r.roomCode === roomCode);
      if (!internalRoom) {
        console.log(`[join-room-code] Creating internal room for ${roomCode}, maxPlayers=2`);
        const colors = ["red", "yellow"];
        internalRoom = {
          id: roomCode,
          roomCode,
          gameType: "1v1",
          players: room.players.map((player, index) => ({
            email: player.email,
            socketId: null,
            nickname: player.nickname || player.email,
            profileImageUrl: "",
            userId: null,
            color: player.color || colors[index] || colors[0]
          })),
          status: "waiting",
          gameState: {},
          maxPlayers: 2
        };
        console.log(`[join-room-code] Internal room gameType set to: ${internalRoom.gameType}`);
        gameRooms.set(roomCode, internalRoom);
      } else {
        console.log(`[join-room-code] Using existing internal room: gameType=${internalRoom.gameType}, maxPlayers=${internalRoom.maxPlayers}`);
        
        // UPDATE: Sync internal room with database room players
        const colors = ["red", "yellow"];
        
        // Add any new players from database that aren't in internal room yet
        room.players.forEach((dbPlayer, index) => {
          const existsInInternal = internalRoom.players.some(p => p.email === dbPlayer.email);
          if (!existsInInternal) {
            console.log(`[join-room-code] Adding new player ${dbPlayer.email} to internal room`);
            internalRoom.players.push({
              email: dbPlayer.email,
              socketId: null,
              nickname: dbPlayer.nickname || dbPlayer.email,
              profileImageUrl: "",
              userId: null,
              color: dbPlayer.color || colors[index] || colors[0]
            });
          }
        });
      }

      // Get player info
      const user = await User.findOne({ email });
      const colors = ["red", "yellow"];

      const existingIndex = internalRoom.players.findIndex((p) => p.email === email);
      if (existingIndex < 0) {
        socket.emit("error", "Player not found in room");
        return;
      }
      const playerIndex = existingIndex;
      const playerColor = internalRoom.players[playerIndex]?.color || colors[playerIndex] || colors[0] || "red";

      console.log(`\n[JOIN-ROOM-CODE] ${email} joining room ${roomCode}`);
      console.log(`  existingIndex: ${existingIndex}, playerIndex: ${playerIndex}, playerColor: ${playerColor}`);
      console.log(`  room.maxPlayers: ${room.maxPlayers}, internalRoom.players.length BEFORE: ${internalRoom.players.length}`);
      console.log(`  gameType: ${internalRoom.gameType}\n`);

      const playerData = {
        email,
        socketId: socket.id,
        nickname: user?.nickname || email,
        profileImageUrl: user?.profileImageUrl || "",
        userId: authTokens.get(token).userId,
        color: playerColor
      };

      internalRoom.players[existingIndex] = { ...internalRoom.players[existingIndex], ...playerData };
      playerSockets.set(socket.id, { email, roomId: roomCode });

      socket.join(roomCode);
      console.log(`[join-room-code] Emitting room-joined with gameType=${internalRoom.gameType}, playerIndex=${playerIndex}, playerCount=${internalRoom.players.length}`);
      socket.emit("room-joined", { 
        roomId: roomCode, 
        players: internalRoom.players, 
        playerIndex,
        playerCount: internalRoom.players.length,
        gameType: internalRoom.gameType
      });

      // Notify others in room
      io.to(roomCode).emit("players-updated", { players: internalRoom.players, playerCount: internalRoom.players.length, gameType: internalRoom.gameType });

      console.log(`Player ${email} joined room ${roomCode} (${internalRoom.players.length}/2)`);

      // Start game when all players required by maxPlayers are connected
      const connectedPlayers = internalRoom.players.filter((player) => !!player.socketId).length;
      const totalPlayers = internalRoom.players.length;
      console.log(`[join-room-code] Connected: ${connectedPlayers}/${totalPlayers}, maxPlayers: 2, status: ${internalRoom.status}`);
      
      // Only support 1v1: require exactly 2 players
      if (connectedPlayers === 2) {
        if (internalRoom.status !== "playing") {
          internalRoom.status = "playing";
          internalRoom.turnOrder = ["red", "yellow"];
          internalRoom.turnIndex = 0;
          console.log(`✅ [GAME-START] Room ${roomCode} is FULL! Starting game with ${connectedPlayers} players, gameType: ${internalRoom.gameType}`);
          console.log(`✅ [GAME-START] Emitting game-start event to room ${roomCode}`);
          io.to(roomCode).emit("game-start", { 
            players: internalRoom.players,
            gameType: internalRoom.gameType
          });
          console.log(`✅ [GAME-START] Emitting turn-update event`);
          io.to(roomCode).emit("turn-update", { activeColor: internalRoom.turnOrder[internalRoom.turnIndex], turnIndex: internalRoom.turnIndex, turnOrder: internalRoom.turnOrder });
        } else {
          console.log(`[join-room-code] Game already playing, not starting again`);
        }
      } else {
        console.log(`[join-room-code] Waiting for more players: ${connectedPlayers}/${room.maxPlayers}`);
      }
      
      if (internalRoom.status === "playing" && internalRoom.turnOrder) {
        socket.emit("turn-update", {
          activeColor: internalRoom.turnOrder[internalRoom.turnIndex],
          turnIndex: internalRoom.turnIndex,
          turnOrder: internalRoom.turnOrder
        });
      }
    } catch (err) {
      console.error("Error joining room:", err);
      socket.emit("error", "Failed to join room");
    }
  });

  // Handle game moves
  socket.on("player-move", (data) => {
    const playerInfo = playerSockets.get(socket.id);
    if (playerInfo) {
      const room = gameRooms.get(playerInfo.roomId);
      if (room) {
        if (room.status !== "playing") return;
        const currentPlayer = room.players.find((p) => p.email === playerInfo.email);
        if (!currentPlayer) return;
        if (room.turnOrder && room.turnOrder[room.turnIndex] !== currentPlayer.color) return;
        room.moveSeq = (room.moveSeq || 0) + 1;
        io.to(room.id).emit("move-update", {
          email: playerInfo.email,
          playerColor: currentPlayer.color,
          pions: data?.pions,
          moveSeq: room.moveSeq,
          serverTs: Date.now()
        });
      }
    }
  });

  // Handle dice rolls
  socket.on("dice-roll", (data) => {
    const playerInfo = playerSockets.get(socket.id);
    if (playerInfo) {
      const room = gameRooms.get(playerInfo.roomId);
      if (room) {
        if (room.status !== "playing") return;
        const currentPlayer = room.players.find((p) => p.email === playerInfo.email);
        if (!currentPlayer) return;
        if (room.turnOrder && room.turnOrder[room.turnIndex] !== currentPlayer.color) return;
        io.to(room.id).emit("dice-rolled", { email: playerInfo.email, color: currentPlayer.color, value: data.value });
      }
    }
  });

  // Chat: join room and load history
  socket.on("chat-join", async ({ roomId, token }) => {
    if (!roomId || !token || !authTokens.has(token)) return;
    socket.join(roomId);
    try {
      const history = await ChatMessage.find({ roomId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      socket.emit("chat-history", history.reverse());
    } catch (err) {
      console.error("Chat history error:", err.message);
      socket.emit("chat-history", []);
    }
  });

  // Chat: send message
  socket.on("chat-message", async ({ roomId, token, content }) => {
    if (!roomId || !token || !authTokens.has(token)) return;
    if (!content || !content.trim()) return;

    try {
      const auth = authTokens.get(token);
      const user = await User.findOne({ email: auth.email });
      if (!user) return;

      const msg = await ChatMessage.create({
        roomId,
        senderEmail: user.email,
        senderNickname: user.nickname,
        senderAvatar: user.profileImageUrl,
        content: content.trim()
      });

      io.to(roomId).emit("chat-message", msg);
    } catch (err) {
      console.error("Chat message error:", err.message);
    }
  });

  // Chat: direct message
  socket.on("dm-message", async ({ token, toEmail, content }) => {
    if (!token || !authTokens.has(token)) return;
    if (!toEmail || !content || !content.trim()) return;

    try {
      const auth = authTokens.get(token);
      const sender = await User.findOne({ email: auth.email });
      const receiver = await User.findOne({ email: toEmail });
      if (!sender || !receiver) return;

      const dm = await DirectMessage.create({
        senderEmail: sender.email,
        receiverEmail: receiver.email,
        content: content.trim()
      });

      io.emit("dm-message", {
        _id: dm._id,
        senderEmail: sender.email,
        receiverEmail: receiver.email,
        senderNickname: sender.nickname,
        senderAvatar: sender.profileImageUrl,
        content: dm.content,
        createdAt: dm.createdAt
      });
    } catch (err) {
      console.error("DM error:", err.message);
    }
  });

  // Handle turn changes
  socket.on("turn-next", () => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;
    const room = gameRooms.get(playerInfo.roomId);
    if (!room || !room.turnOrder) return;

    const activeColor = room.turnOrder[room.turnIndex];
    const currentPlayer = room.players.find((p) => p.email === playerInfo.email);
    if (!currentPlayer || currentPlayer.color !== activeColor) return;

    room.turnIndex = (room.turnIndex + 1) % room.turnOrder.length;
    io.to(room.id).emit("turn-update", { activeColor: room.turnOrder[room.turnIndex], turnIndex: room.turnIndex, turnOrder: room.turnOrder });
  });

  // Handle game end
  socket.on("game-end", async (data) => {
    const playerInfo = playerSockets.get(socket.id);
    if (playerInfo) {
      const room = gameRooms.get(playerInfo.roomId);
      if (room) {
        room.status = "finished";
        
        // Update wins/losses in database
        if (data.winner) {
          try {
            const User = mongoose.model('User');
            const matchDuration = data.duration || 0;
            
            // Get winner and loser details
            const winner = await User.findOne({ email: data.winner });
            
            // Increment winner wins and record match
            if (winner) {
              winner.wins += 1;
              winner.xp += 50;
              winner.matches += 1;
              
              // Level up logic
              while (winner.xp >= winner.totalXpNeeded) {
                winner.xp -= winner.totalXpNeeded;
                winner.level += 1;
                winner.totalXpNeeded = Math.floor(winner.totalXpNeeded * 1.2);
              }
              
              // Record match history for winner
              if (data.losers && Array.isArray(data.losers) && data.losers.length > 0) {
                const firstLoser = data.losers[0];
                const loserUser = await User.findOne({ email: firstLoser });
                
                winner.matchHistory.push({
                  matchId: `match_${Date.now()}_${Math.random()}`,
                  opponent: firstLoser,
                  opponentNickname: loserUser?.nickname || 'Unknown',
                  result: 'win',
                  duration: matchDuration,
                  scores: { playerScore: data.winnerScore || 0, opponentScore: data.loserScore || 0 },
                  date: new Date()
                });
              }
              
              // Check achievements
              checkAndUnlockAchievements(winner, 'win');
              if (winner.matchHistory.length > 100) winner.matchHistory = winner.matchHistory.slice(-100);
              
              await winner.save();
            }
            
            // Increment losers' losses and record match
            if (data.losers && Array.isArray(data.losers)) {
              for (const loserEmail of data.losers) {
                const loser = await User.findOne({ email: loserEmail });
                
                if (loser) {
                  loser.losses += 1;
                  loser.xp += 10;
                  loser.matches += 1;
                  
                  // Level up logic
                  while (loser.xp >= loser.totalXpNeeded) {
                    loser.xp -= loser.totalXpNeeded;
                    loser.level += 1;
                    loser.totalXpNeeded = Math.floor(loser.totalXpNeeded * 1.2);
                  }
                  
                  // Record match history for loser
                  loser.matchHistory.push({
                    matchId: `match_${Date.now()}_${Math.random()}`,
                    opponent: data.winner,
                    opponentNickname: winner?.nickname || 'Unknown',
                    result: 'loss',
                    duration: matchDuration,
                    scores: { playerScore: data.loserScore || 0, opponentScore: data.winnerScore || 0 },
                    date: new Date()
                  });
                  
                  // Check achievements
                  checkAndUnlockAchievements(loser, 'loss');
                  if (loser.matchHistory.length > 100) loser.matchHistory = loser.matchHistory.slice(-100);
                  
                  await loser.save();
                }
              }
            }
          } catch (err) {
            console.error("Error updating game results:", err);
          }
        }
        
        io.to(room.id).emit("game-finished", data);
      }
    }
  });

  socket.on("disconnect", () => {
    const playerInfo = playerSockets.get(socket.id);
    if (playerInfo) {
      const room = gameRooms.get(playerInfo.roomId);
      if (room) {
        const disconnectedIndex = room.players.findIndex((p) => p.socketId === socket.id);
        if (disconnectedIndex >= 0) {
          if (room.roomCode) {
            room.players[disconnectedIndex] = {
              ...room.players[disconnectedIndex],
              socketId: null
            };
          } else {
            room.players = room.players.filter((p) => p.socketId !== socket.id);
          }
        }

        if (room.turnOrder && room.status === "playing") {
          const currentColor = room.turnOrder[room.turnIndex];
          const activeConnected = room.players.some((p) => p.color === currentColor && !!p.socketId);

          if (!activeConnected) {
            let nextTurnIndex = -1;
            for (let step = 1; step <= room.turnOrder.length; step++) {
              const candidateIndex = (room.turnIndex + step) % room.turnOrder.length;
              const candidateColor = room.turnOrder[candidateIndex];
              const hasConnectedPlayer = room.players.some((p) => p.color === candidateColor && !!p.socketId);
              if (hasConnectedPlayer) {
                nextTurnIndex = candidateIndex;
                break;
              }
            }

            if (nextTurnIndex >= 0) {
              room.turnIndex = nextTurnIndex;
              io.to(room.id).emit("turn-update", {
                activeColor: room.turnOrder[room.turnIndex],
                turnIndex: room.turnIndex,
                turnOrder: room.turnOrder
              });
            }
          }
        }

        io.to(room.id).emit("player-left", { email: playerInfo.email, playersLeft: room.players });
        io.to(room.id).emit("players-updated", {
          players: room.players,
          playerCount: room.players.filter((p) => !!p.socketId).length,
          gameType: room.gameType
        });
        
        // Clean up empty rooms
        if (!room.roomCode && room.players.length === 0) {
          gameRooms.delete(playerInfo.roomId);
        }
      }
      playerSockets.delete(socket.id);
    }
    console.log("Player disconnected:", socket.id);
  });
});

function startServer(attemptPort = port) {
  const currentServer = http.createServer(app);
  const currentIo = socketIo(currentServer, {
    cors: { origin: "*" }
  });
  
  // Re-attach socket.io handlers
  currentIo.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    const handshakeToken = socket.handshake?.auth?.token;
    if (handshakeToken && authTokens.has(handshakeToken)) {
      const auth = authTokens.get(handshakeToken);
      socket.data.userEmail = auth.email;
      markUserOnline(auth.email);
    }

    socket.on("join-room", (data) => {
      const { email, gameType, token } = data;
      
      if (!authTokens.has(token)) {
        socket.emit("error", "Invalid token");
        return;
      }

      // Only support 1v1 games
      let room = Array.from(gameRooms.values()).find(
        (r) => r.gameType === "1v1" && r.players.length < 2 && r.status === "waiting"
      );

      if (!room) {
        const roomId = Math.random().toString(36).substring(7);
        room = {
          id: roomId,
          gameType: "1v1",
          players: [],
          status: "waiting",
          gameState: {}
        };
        gameRooms.set(roomId, room);
      }

      // Hardcoded turn order for 1v1
      const turnOrder = ["red", "yellow"];
      const playerIndex = room.players.length;
      const playerColor = turnOrder[playerIndex];
      room.players.push({ email, socketId: socket.id, userId: authTokens.get(token).userId, color: playerColor });
      playerSockets.set(socket.id, { email, roomId: room.id });

      socket.join(room.id);
      socket.emit("room-joined", { roomId: room.id, players: room.players, playerIndex, playerCount: room.players.length, gameType: "1v1", gameInProgress: room.status === "playing" });

      // Clean players array (remove non-serializable properties) before emitting
      const cleanPlayersQuick = room.players.map(p => ({
        email: p.email,
        socketId: p.socketId,
        nickname: p.nickname,
        color: p.color,
        profileImageUrl: p.profileImageUrl,
        userId: p.userId
      }));

      currentIo.to(room.id).emit("players-updated", { players: cleanPlayersQuick, playerCount: cleanPlayersQuick.length, gameType: "1v1" });

      // Start game when room is full (2 players)
      if (room.players.length === 2) {
        room.status = "playing";
        room.turnOrder = turnOrder;
        room.turnIndex = 0;
        currentIo.to(room.id).emit("game-start", { players: room.players });
        currentIo.to(room.id).emit("turn-update", { activeColor: room.turnOrder[room.turnIndex], turnIndex: room.turnIndex, turnOrder: room.turnOrder });
      }
    });

    socket.on("join-room-code", async (data) => {
      const { roomCode, email, token } = data;

      if (!authTokens.has(token)) {
        socket.emit("error", "Invalid token");
        return;
      }

      try {
        const room = await GameRoom.findOne({ roomCode });
        if (!room) {
          socket.emit("error", "Room not found");
          return;
        }

        const isRoomMember = room.players.some((player) => player.email === email);
        if (!isRoomMember) {
          socket.emit("error", "You are not a member of this room");
          return;
        }

        if (room.players.length > room.maxPlayers) {
          socket.emit("error", "Room is full");
          return;
        }

        // Only support 1v1 games (maxPlayers = 2)
        const colors = ["red", "yellow"];

        let internalRoom = Array.from(gameRooms.values()).find((r) => r.roomCode === roomCode);
        if (!internalRoom) {
          internalRoom = {
            id: roomCode,
            roomCode,
            gameType: "1v1",
            players: room.players.map((player, index) => ({
              email: player.email,
              socketId: null,
              nickname: player.nickname || player.email,
              profileImageUrl: "",
              userId: null,
              color: player.color || colors[index] || colors[0]
            })),
            status: "waiting",
            gameState: {},
            maxPlayers: 2
          };
          gameRooms.set(roomCode, internalRoom);
        }

        const user = await User.findOne({ email });
        const playerIndex = internalRoom.players.findIndex((player) => player.email === email);
        const playerColor = (playerIndex >= 0 ? internalRoom.players[playerIndex]?.color : null) || colors[playerIndex] || colors[0] || "red";

        if (playerIndex < 0) {
          socket.emit("error", "Player not found in room");
          return;
        }

        // Clear grace period timer if player reconnects
        if (internalRoom.players[playerIndex]?.gracePeriodTimer) {
          clearTimeout(internalRoom.players[playerIndex].gracePeriodTimer);
          delete internalRoom.players[playerIndex].gracePeriodTimer;
          delete internalRoom.players[playerIndex].disconnectedAt;
          console.log(`[Reconnection] Player ${email} reconnected - grace period timer cleared`);
        }

        internalRoom.players[playerIndex] = {
          ...internalRoom.players[playerIndex],
          email,
          socketId: socket.id,
          nickname: user?.nickname || email,
          profileImageUrl: user?.profileImageUrl || "",
          userId: authTokens.get(token).userId,
          color: playerColor
        };

        playerSockets.set(socket.id, { email, roomId: roomCode });
        socket.join(roomCode);

        socket.emit("room-joined", {
          roomId: roomCode,
          players: internalRoom.players,
          playerIndex,
          playerCount: internalRoom.players.length,
          gameType: internalRoom.gameType,
          gameInProgress: internalRoom.status === "playing"
        });

        // Clean players array (remove non-serializable properties) before emitting
        const cleanPlayersEmit = internalRoom.players.map(p => ({
          email: p.email,
          socketId: p.socketId,
          nickname: p.nickname,
          color: p.color,
          profileImageUrl: p.profileImageUrl,
          userId: p.userId
        }));

        currentIo.to(roomCode).emit("players-updated", {
          players: cleanPlayersEmit,
          playerCount: cleanPlayersEmit.length,
          gameType: internalRoom.gameType
        });

        const connectedPlayers = internalRoom.players.filter((player) => !!player.socketId).length;
        if (connectedPlayers === 2 && internalRoom.status !== "playing") {
          internalRoom.status = "playing";
          internalRoom.turnOrder = ["red", "yellow"];
          internalRoom.turnIndex = 0;
          currentIo.to(roomCode).emit("game-start", {
            players: internalRoom.players,
            gameType: internalRoom.gameType
          });
          currentIo.to(roomCode).emit("turn-update", {
            activeColor: internalRoom.turnOrder[internalRoom.turnIndex],
            turnIndex: internalRoom.turnIndex,
            turnOrder: internalRoom.turnOrder
          });
        } else if (internalRoom.status === "playing" && internalRoom.turnOrder) {
          socket.emit("turn-update", {
            activeColor: internalRoom.turnOrder[internalRoom.turnIndex],
            turnIndex: internalRoom.turnIndex,
            turnOrder: internalRoom.turnOrder
          });
        }
      } catch (err) {
        console.error("Error joining room by code:", err);
        socket.emit("error", "Failed to join room");
      }
    });

    socket.on("request-game-state", (data) => {
      const { email, roomId } = data;
      const room = gameRooms.get(roomId);
      
      if (!room) {
        console.log("[request-game-state] Room not found:", roomId);
        return;
      }

      const playerInfo = room.players.find((p) => p.email === email);
      if (!playerInfo) {
        console.log("[request-game-state] Player not found in room:", email, roomId);
        return;
      }

      // Build game state snapshot
      const gameState = {
        pions: room.gameState?.pions || {},
        remotePions: room.gameState?.remotePions || {},
        activeColor: room.turnOrder?.[room.turnIndex] || null,
        turnIndex: room.turnIndex ?? 0,
        dice: room.gameState?.dice || null,
        bonus: room.gameState?.bonus || 0
      };

      console.log("[request-game-state] Sending game state to", email, "in room", roomId, gameState);
      socket.emit("game-state-recovery", gameState);
    });

    socket.on("player-move", (data) => {
      const playerInfo = playerSockets.get(socket.id);
      if (playerInfo) {
        const room = gameRooms.get(playerInfo.roomId);
        if (room) {
          if (room.status !== "playing") return;
          const currentPlayer = room.players.find((p) => p.email === playerInfo.email);
          if (!currentPlayer) return;
          if (room.turnOrder && room.turnOrder[room.turnIndex] !== currentPlayer.color) return;
          
          // Persist game state for recovery on reconnect
          room.gameState = room.gameState || {};
          room.gameState.pions = data?.pions;
          room.gameState.lastMoveEmail = playerInfo.email;
          room.gameState.lastMoveTime = Date.now();
          
          room.moveSeq = (room.moveSeq || 0) + 1;
          currentIo.to(room.id).emit("move-update", {
            email: playerInfo.email,
            playerColor: currentPlayer.color,
            pions: data?.pions,
            moveSeq: room.moveSeq,
            serverTs: Date.now()
          });
        }
      }
    });

    socket.on("dice-roll", (data) => {
      const playerInfo = playerSockets.get(socket.id);
      if (playerInfo) {
        const room = gameRooms.get(playerInfo.roomId);
        if (room) {
          if (room.status !== "playing") return;
          const currentPlayer = room.players.find((p) => p.email === playerInfo.email);
          if (!currentPlayer) return;
          if (room.turnOrder && room.turnOrder[room.turnIndex] !== currentPlayer.color) return;
          currentIo.to(room.id).emit("dice-rolled", { email: playerInfo.email, color: currentPlayer.color, value: data.value });
        }
      }
    });

    socket.on("chat-join", async ({ roomId, token }) => {
      if (!roomId || !token || !authTokens.has(token)) return;
      const auth = authTokens.get(token);
      if (auth?.email && !socket.data.userEmail) {
        socket.data.userEmail = auth.email;
        markUserOnline(auth.email);
      }
      socket.join(roomId);
      try {
        const history = await ChatMessage.find({ roomId })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        socket.emit("chat-history", history.reverse());
      } catch (err) {
        console.error("Chat history error:", err.message);
        socket.emit("chat-history", []);
      }
    });

    socket.on("chat-message", async ({ roomId, token, content }) => {
      if (!roomId || !token || !authTokens.has(token)) return;
      if (!content || !content.trim()) return;

      try {
        const auth = authTokens.get(token);
        const user = await User.findOne({ email: auth.email });
        if (!user) return;

        const msg = await ChatMessage.create({
          roomId,
          senderEmail: user.email,
          senderNickname: user.nickname,
          senderAvatar: user.profileImageUrl,
          content: content.trim()
        });

        currentIo.to(roomId).emit("chat-message", msg);
      } catch (err) {
        console.error("Chat message error:", err.message);
      }
    });

    socket.on("dm-message", async ({ token, toEmail, content }) => {
      if (!token || !authTokens.has(token)) return;
      if (!toEmail || !content || !content.trim()) return;

      try {
        const auth = authTokens.get(token);
        const sender = await User.findOne({ email: auth.email });
        const receiver = await User.findOne({ email: toEmail });
        if (!sender || !receiver) return;

        const dm = await DirectMessage.create({
          senderEmail: sender.email,
          receiverEmail: receiver.email,
          content: content.trim()
        });

        currentIo.emit("dm-message", {
          _id: dm._id,
          senderEmail: sender.email,
          receiverEmail: receiver.email,
          senderNickname: sender.nickname,
          senderAvatar: sender.profileImageUrl,
          content: dm.content,
          createdAt: dm.createdAt
        });
      } catch (err) {
        console.error("DM error:", err.message);
      }
    });

    socket.on("turn-next", () => {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) return;
      const room = gameRooms.get(playerInfo.roomId);
      if (!room || !room.turnOrder) return;

      const activeColor = room.turnOrder[room.turnIndex];
      const currentPlayer = room.players.find((p) => p.email === playerInfo.email);
      if (!currentPlayer || currentPlayer.color !== activeColor) return;

      room.turnIndex = (room.turnIndex + 1) % room.turnOrder.length;
      currentIo.to(room.id).emit("turn-update", { activeColor: room.turnOrder[room.turnIndex], turnIndex: room.turnIndex, turnOrder: room.turnOrder });
    });

    socket.on("game-end", async (data) => {
      const playerInfo = playerSockets.get(socket.id);
      if (playerInfo) {
        const room = gameRooms.get(playerInfo.roomId);
        if (room) {
          room.status = "finished";
          
          // Update wins/losses in database
          if (data.winner) {
            try {
              const matchDuration = data.duration || 0;
              
              // Get winner and loser details
              const winner = await User.findOne({ email: data.winner });
              
              // Increment winner wins and record match
              if (winner) {
                winner.wins += 1;
                winner.xp += 50;
                winner.matches += 1;
                
                // Level up logic
                while (winner.xp >= winner.totalXpNeeded) {
                  winner.xp -= winner.totalXpNeeded;
                  winner.level += 1;
                  winner.totalXpNeeded = Math.floor(winner.totalXpNeeded * 1.2);
                }
                
                // Record match history for winner
                if (data.losers && Array.isArray(data.losers) && data.losers.length > 0) {
                  const firstLoser = data.losers[0];
                  const loserUser = await User.findOne({ email: firstLoser });
                  
                  winner.matchHistory.push({
                    matchId: `match_${Date.now()}_${Math.random()}`,
                    opponent: firstLoser,
                    opponentNickname: loserUser?.nickname || 'Unknown',
                    result: 'win',
                    duration: matchDuration,
                    scores: { playerScore: data.winnerScore || 4, opponentScore: data.loserScore || 0 },
                    date: new Date()
                  });
                }
                
                // Check achievements
                checkAndUnlockAchievements(winner, 'win');
                if (winner.matchHistory.length > 100) winner.matchHistory = winner.matchHistory.slice(-100);
                
                await winner.save();
                console.log(`✅ Winner ${winner.nickname} stats updated: ${winner.wins} wins, Level ${winner.level}, ${winner.xp}/${winner.totalXpNeeded} XP`);
              }
              
              // Increment losers' losses and record match
              if (data.losers && Array.isArray(data.losers)) {
                for (const loserEmail of data.losers) {
                  const loser = await User.findOne({ email: loserEmail });
                  
                  if (loser) {
                    loser.losses += 1;
                    loser.xp += 10;
                    loser.matches += 1;
                    
                    // Level up logic
                    while (loser.xp >= loser.totalXpNeeded) {
                      loser.xp -= loser.totalXpNeeded;
                      loser.level += 1;
                      loser.totalXpNeeded = Math.floor(loser.totalXpNeeded * 1.2);
                    }
                    
                    // Record match history for loser
                    loser.matchHistory.push({
                      matchId: `match_${Date.now()}_${Math.random()}`,
                      opponent: data.winner,
                      opponentNickname: winner?.nickname || 'Unknown',
                      result: 'loss',
                      duration: matchDuration,
                      scores: { playerScore: data.loserScore || 0, opponentScore: data.winnerScore || 4 },
                      date: new Date()
                    });
                    
                    // Check achievements
                    checkAndUnlockAchievements(loser, 'loss');
                    if (loser.matchHistory.length > 100) loser.matchHistory = loser.matchHistory.slice(-100);
                    
                    await loser.save();
                    console.log(`✅ Loser ${loser.nickname} stats updated: ${loser.losses} losses, Level ${loser.level}, ${loser.xp}/${loser.totalXpNeeded} XP`);
                  }
                }
              }
            } catch (err) {
              console.error("❌ Error updating game results:", err);
            }
          }
          
          currentIo.to(room.id).emit("game-finished", data);
        }
      }
    });

    socket.on("disconnect", () => {
      if (socket.data?.userEmail) {
        markUserOffline(socket.data.userEmail);
      }
      const playerInfo = playerSockets.get(socket.id);
      if (playerInfo) {
        const room = gameRooms.get(playerInfo.roomId);
        if (room) {
          const disconnectedIndex = room.players.findIndex((p) => p.socketId === socket.id);
          if (disconnectedIndex >= 0) {
            if (room.roomCode) {
              // Persistent room: set socketId to null but keep player for reconnection
              // Set reconnection grace period timeout (30 seconds to reconnect)
              const disconnectedPlayer = room.players[disconnectedIndex];
              room.players[disconnectedIndex] = {
                ...disconnectedPlayer,
                socketId: null,
                disconnectedAt: Date.now()
              };

              // Set grace period timer: if player doesn't reconnect in 30s, auto-skip their turn
              const gracePeriodTimer = setTimeout(() => {
                const stillDisconnected = room.players[disconnectedIndex]?.socketId === null;
                if (stillDisconnected && room.status === "playing" && room.turnOrder) {
                  console.log(`[Grace Period] Player ${disconnectedPlayer.email} still disconnected after 30s - auto-skipping turn`);
                  const currentColor = room.turnOrder[room.turnIndex];
                  if (disconnectedPlayer.color === currentColor) {
                    // Skip to next connected player
                    let nextTurnIndex = -1;
                    for (let step = 1; step <= room.turnOrder.length; step++) {
                      const candidateIndex = (room.turnIndex + step) % room.turnOrder.length;
                      const candidateColor = room.turnOrder[candidateIndex];
                      const hasConnectedPlayer = room.players.some((p) => p.color === candidateColor && !!p.socketId);
                      if (hasConnectedPlayer) {
                        nextTurnIndex = candidateIndex;
                        break;
                      }
                    }
                    if (nextTurnIndex >= 0) {
                      room.turnIndex = nextTurnIndex;
                      currentIo.to(room.id).emit("turn-update", {
                        activeColor: room.turnOrder[room.turnIndex],
                        turnIndex: room.turnIndex,
                        turnOrder: room.turnOrder
                      });
                    }
                  }
                }
              }, 30000);

              room.players[disconnectedIndex].gracePeriodTimer = gracePeriodTimer;
            } else {
              // Temporary room: remove player immediately
              room.players = room.players.filter((p) => p.socketId !== socket.id);
            }
          }

          if (room.turnOrder && room.status === "playing") {
            const currentColor = room.turnOrder[room.turnIndex];
            const activeConnected = room.players.some((p) => p.color === currentColor && !!p.socketId);

            // For temporary rooms (no roomCode), immediately skip if active player disconnected
            if (!activeConnected && !room.roomCode) {
              let nextTurnIndex = -1;
              for (let step = 1; step <= room.turnOrder.length; step++) {
                const candidateIndex = (room.turnIndex + step) % room.turnOrder.length;
                const candidateColor = room.turnOrder[candidateIndex];
                const hasConnectedPlayer = room.players.some((p) => p.color === candidateColor && !!p.socketId);
                if (hasConnectedPlayer) {
                  nextTurnIndex = candidateIndex;
                  break;
                }
              }

              if (nextTurnIndex >= 0) {
                room.turnIndex = nextTurnIndex;
                currentIo.to(room.id).emit("turn-update", {
                  activeColor: room.turnOrder[room.turnIndex],
                  turnIndex: room.turnIndex,
                  turnOrder: room.turnOrder
                });
              }
            }
          }

          // Clean players array (remove non-serializable properties like timers) before emitting
          const cleanPlayers = room.players.map(p => ({
            email: p.email,
            socketId: p.socketId,
            nickname: p.nickname,
            color: p.color,
            profileImageUrl: p.profileImageUrl,
            userId: p.userId
          }));

          currentIo.to(room.id).emit("player-left", { email: playerInfo.email, playersLeft: cleanPlayers });
          currentIo.to(room.id).emit("players-updated", {
            players: cleanPlayers,
            playerCount: cleanPlayers.filter((p) => !!p.socketId).length,
            gameType: room.gameType
          });
          
          if (!room.roomCode && room.players.length === 0) {
            gameRooms.delete(playerInfo.roomId);
          }
        }
        playerSockets.delete(socket.id);
      }
      console.log("Player disconnected:", socket.id);
    });
  });

  currentServer.listen(attemptPort, () => {
    console.log(`Server started on http://localhost:${attemptPort}`);
  });

  currentServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${attemptPort} is already in use. Stop the existing process and restart this server.`);
      process.exit(1);
    } else {
      throw err;
    }
  });
}

startServer();
