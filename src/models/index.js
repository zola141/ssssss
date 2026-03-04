import mongoose from "mongoose";
import { DEFAULT_AVATAR_URL } from "../config.js";

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

export const User = mongoose.model("User", userSchema);

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

export const Counter = mongoose.model("Counter", counterSchema);

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
    expires: 3600
  }
});

export const GameRoom = mongoose.model("GameRoom", gameRoomSchema);

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

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

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

export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

const directMessageSchema = new mongoose.Schema({
  senderEmail: { type: String, required: true },
  receiverEmail: { type: String, required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const DirectMessage = mongoose.model("DirectMessage", directMessageSchema);

const friendshipSchema = new mongoose.Schema({
  requesterEmail: { type: String, required: true },
  receiverEmail: { type: String, required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

friendshipSchema.index({ requesterEmail: 1, receiverEmail: 1 }, { unique: true });

export const Friendship = mongoose.model("Friendship", friendshipSchema);
