import express from "express";
import { ChatRoom, ChatMessage, DirectMessage, Friendship, User } from "../models/index.js";
import { requireAuth } from "../middleware/auth.js";
import { DEFAULT_AVATAR_URL } from "../config.js";
import { isUserOnline as checkOnline } from "../utils/helpers.js";

const router = express.Router();
const onlineUsers = new Map();

// List chat rooms
router.get("/rooms", requireAuth, async (req, res) => {
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
router.get("/users", requireAuth, async (req, res) => {
  try {
    const me = req.user?.email;
    const users = await User.find({ email: { $ne: me } })
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
router.get("/friends", requireAuth, async (req, res) => {
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
      isOnline: checkOnline(onlineUsers, user.email)
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get pending friend requests
router.get("/friends/pending", requireAuth, async (req, res) => {
  try {
    const me = req.user?.email;
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
router.post("/friends/request/:email", requireAuth, async (req, res) => {
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

// Accept friend request
router.post("/friends/accept/:email", requireAuth, async (req, res) => {
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

// Remove friend
router.delete("/friends/:email", requireAuth, async (req, res) => {
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

// Get DM history
router.get("/dm/:email", requireAuth, async (req, res) => {
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

export default router;
