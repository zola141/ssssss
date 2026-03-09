import express from "express";
import { ChatRoom, ChatMessage, DirectMessage, Friendship, User } from "../models/index.js";
import { requireAuth, authTokens } from "../middleware/auth.js";
import { DEFAULT_AVATAR_URL } from "../config.js";
import { isUserOnline as checkOnline } from "../utils/helpers.js";

const router = express.Router();
const routeOnlineUsersFallback = new Map();

const getOnlineUsersMap = (req) => req.app?.locals?.onlineUsers || routeOnlineUsersFallback;

const resolveAuthEmail = (req) => {
  if (req.user?.email) return req.user.email;

  const token = req.query.token;
  if (token && authTokens.has(token)) {
    return authTokens.get(token).email;
  }

  const fallbackEmail = req.query.email || req.query.me;
  if (typeof fallbackEmail === "string" && fallbackEmail.trim()) {
    return fallbackEmail.trim();
  }

  return null;
};

// List chat rooms
router.get("/rooms", async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ isPrivate: false }).sort({ createdAt: 1 }).lean();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get room messages
router.get("/rooms/:id/messages", requireAuth, async (req, res) => {
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

// List users
router.get("/users", async (req, res) => {
  try {
    const me = resolveAuthEmail(req);
    const onlineUsers = getOnlineUsersMap(req);
    
    const users = await User.find(me ? { email: { $ne: me } } : {})
      .select("email nickname profileImageUrl")
      .lean();
    res.json(users.map((user) => ({
      ...user,
      profileImageUrl: user.profileImageUrl || DEFAULT_AVATAR_URL,
      isOnline: checkOnline(onlineUsers, user.email)
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get friends list
router.get("/friends", async (req, res) => {
  try {
    const me = resolveAuthEmail(req);
    const onlineUsers = getOnlineUsersMap(req);
    
    if (!me) {
      return res.json([]);
    }
    
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
      isOnline: checkOnline(onlineUsers, user.email)
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get pending friend requests
router.get("/friends/pending", async (req, res) => {
  try {
    const me = resolveAuthEmail(req);
    const onlineUsers = getOnlineUsersMap(req);
    
    if (!me) {
      return res.json([]);
    }
    
    const pending = await Friendship.find({ receiverEmail: me, status: "pending" }).lean();
    const users = await User.find({ email: { $in: pending.map((p) => p.requesterEmail) } })
      .select("email nickname profileImageUrl")
      .lean();
    res.json(users.map((user) => ({
      ...user,
      profileImageUrl: user.profileImageUrl || DEFAULT_AVATAR_URL,
      isOnline: checkOnline(onlineUsers, user.email)
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send friend request
router.post("/friends/request/:email", async (req, res) => {
  try {
    const me = resolveAuthEmail(req);
    const target = req.params.email;
    if (!me) return res.status(401).json({ message: "Unauthorized" });
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

// Accept friend request
router.post("/friends/accept/:email", async (req, res) => {
  try {
    const me = resolveAuthEmail(req);
    const requester = req.params.email;
    if (!me) return res.status(401).json({ message: "Unauthorized" });
    await Friendship.updateOne(
      { requesterEmail: requester, receiverEmail: me },
      { $set: { status: "accepted" } }
    );
    res.json({ accepted: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove friend
router.delete("/friends/:email", async (req, res) => {
  try {
    const me = resolveAuthEmail(req);
    const other = req.params.email;
    if (!me) return res.status(401).json({ message: "Unauthorized" });
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

// Get DM history
router.get("/dm/:email", async (req, res) => {
  try {
    const me = resolveAuthEmail(req);
    
    if (!me) {
      return res.json([]);
    }
    
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

export default router;
