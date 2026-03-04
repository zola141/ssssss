import express from "express";
import { GameRoom, User } from "../models/index.js";

const router = express.Router();

// Create a game room with a code
router.post("/create", async (req, res) => {
  try {
    const { email, maxPlayers } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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
router.post("/join", async (req, res) => {
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

export default router;
