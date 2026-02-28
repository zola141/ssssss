import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { io as createSocket } from "socket.io-client";

const BASE_URL = "http://localhost:3000";
const DB_URI = "mongodb+srv://zinecompany41_db_user:rYUKAmyF5hF4NcbB@cluster0.kri2lqk.mongodb.net/?appName=Cluster0";
const ROOM_CODE = "SMOKE1";
const PASSWORD = "smokePass123";

const userSchema = new mongoose.Schema({}, { strict: false, collection: "users" });
const counterSchema = new mongoose.Schema({}, { strict: false, collection: "counters" });
const gameRoomSchema = new mongoose.Schema({}, { strict: false, collection: "gamerooms" });

const User = mongoose.model("SmokeUser", userSchema);
const Counter = mongoose.model("SmokeCounter", counterSchema);
const GameRoom = mongoose.model("SmokeGameRoom", gameRoomSchema);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function onceWithTimeout(socket, event, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeoutMs);

    const onEvent = (payload) => {
      clearTimeout(timer);
      socket.off(event, onEvent);
      resolve(payload);
    };

    socket.on(event, onEvent);
  });
}

async function ensureUsersAndRoom() {
  await mongoose.connect(DB_URI);

  await Counter.findOneAndUpdate(
    { name: "user" },
    { $setOnInsert: { name: "user", seq: 1000 } },
    { upsert: true, new: true }
  );

  const users = [
    {
      email: "smoke1@example.com",
      nickname: "smoke_p1",
      name: "Smoke One",
      country: "Test",
      gender: "other",
      age: 20,
      color: "red"
    },
    {
      email: "smoke2@example.com",
      nickname: "smoke_p2",
      name: "Smoke Two",
      country: "Test",
      gender: "other",
      age: 21,
      color: "yellow"
    }
  ];

  for (const data of users) {
    const existing = await User.findOne({ email: data.email });
    if (!existing) {
      const counter = await Counter.findOneAndUpdate(
        { name: "user" },
        { $inc: { seq: 1 } },
        { new: true }
      );
      const hashedPassword = await bcrypt.hash(PASSWORD, 10);
      await User.create({
        id: counter.seq,
        email: data.email,
        nickname: data.nickname,
        name: data.name,
        password: hashedPassword,
        profileImageUrl: "",
        wins: 0,
        losses: 0,
        draws: 0,
        matches: 0,
        country: data.country,
        gender: data.gender,
        age: data.age
      });
    }
  }

  await GameRoom.findOneAndUpdate(
    { roomCode: ROOM_CODE },
    {
      $set: {
        roomCode: ROOM_CODE,
        maxPlayers: 2,
        createdBy: "smoke1@example.com",
        players: [
          { email: "smoke1@example.com", nickname: "smoke_p1", color: "red", socketId: null },
          { email: "smoke2@example.com", nickname: "smoke_p2", color: "yellow", socketId: null }
        ]
      }
    },
    { upsert: true, new: true }
  );

  await mongoose.disconnect();
}

async function loginAndGetToken(nickname) {
  const body = new URLSearchParams({ nickname, password: PASSWORD });
  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    redirect: "manual"
  });

  const location = response.headers.get("location");
  if (!location || !location.includes("token=")) {
    throw new Error(`Login failed for ${nickname}: missing redirect token`);
  }

  const redirectUrl = new URL(location, BASE_URL);
  const token = redirectUrl.searchParams.get("token");
  const email = redirectUrl.searchParams.get("email");

  if (!token || !email) {
    throw new Error(`Login failed for ${nickname}: invalid redirect params`);
  }

  return { token, email };
}

function connectClient(name) {
  const socket = createSocket(BASE_URL, {
    transports: ["websocket"],
    timeout: 5000
  });

  socket.on("connect_error", (err) => {
    console.error(`[${name}] connect_error:`, err.message);
  });

  socket.on("error", (err) => {
    console.error(`[${name}] server error:`, err);
  });

  return socket;
}

async function run() {
  await ensureUsersAndRoom();

  const p1Auth = await loginAndGetToken("smoke_p1");
  const p2Auth = await loginAndGetToken("smoke_p2");

  const p1 = connectClient("P1");
  const p2 = connectClient("P2");

  await Promise.all([
    onceWithTimeout(p1, "connect"),
    onceWithTimeout(p2, "connect")
  ]);

  const p1RoomJoinedPromise = onceWithTimeout(p1, "room-joined");
  p1.emit("join-room-code", { roomCode: ROOM_CODE, email: p1Auth.email, token: p1Auth.token });
  const p1RoomJoined = await p1RoomJoinedPromise;

  const p2RoomJoinedPromise = onceWithTimeout(p2, "room-joined");
  p2.emit("join-room-code", { roomCode: ROOM_CODE, email: p2Auth.email, token: p2Auth.token });
  const p2RoomJoined = await p2RoomJoinedPromise;

  const gameStart = await onceWithTimeout(p1, "game-start");
  const turnStart = await onceWithTimeout(p1, "turn-update");

  p1.emit("dice-roll", { value: 4 });
  const diceRolled = await onceWithTimeout(p2, "dice-rolled");

  p1.emit("turn-next");
  const turnAfterNext = await onceWithTimeout(p1, "turn-update");

  p2.disconnect();
  const turnAfterDisconnect = await onceWithTimeout(p1, "turn-update");

  const p2Re = connectClient("P2-RE");
  await onceWithTimeout(p2Re, "connect");
  const p2ReJoinPromise = onceWithTimeout(p2Re, "room-joined");
  p2Re.emit("join-room-code", { roomCode: ROOM_CODE, email: p2Auth.email, token: p2Auth.token });
  const p2ReJoined = await p2ReJoinPromise;
  const p2ReTurn = await onceWithTimeout(p2Re, "turn-update");

  const assertions = [
    { ok: p1RoomJoined?.roomId === ROOM_CODE, message: "P1 joined expected room" },
    { ok: p2RoomJoined?.roomId === ROOM_CODE, message: "P2 joined expected room" },
    { ok: Array.isArray(gameStart?.players) && gameStart.players.length === 2, message: "Game started with 2 players" },
    { ok: turnStart?.turnIndex === 0, message: "Initial turn is index 0" },
    { ok: diceRolled?.value === 4, message: "Dice roll broadcasted" },
    { ok: turnAfterNext?.turnIndex === 1, message: "Turn advanced to index 1" },
    { ok: turnAfterDisconnect?.turnIndex === 0, message: "Turn recovered after active player disconnect" },
    { ok: p2ReJoined?.roomId === ROOM_CODE, message: "P2 rejoined same room" },
    { ok: typeof p2ReTurn?.turnIndex === "number", message: "Rejoined player received turn state" }
  ];

  const failed = assertions.filter((a) => !a.ok);

  console.log("\n--- Multiplayer Smoke Test Results ---");
  for (const a of assertions) {
    console.log(`${a.ok ? "✅" : "❌"} ${a.message}`);
  }

  p1.disconnect();
  p2Re.disconnect();
  await wait(300);

  if (failed.length > 0) {
    process.exitCode = 1;
    throw new Error(`Smoke test failed: ${failed.map((f) => f.message).join(", ")}`);
  }

  console.log("\nSmoke test passed.");
}

run().catch((err) => {
  console.error("Smoke test error:", err.message);
  process.exit(1);
});
