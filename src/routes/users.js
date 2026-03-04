import express from "express";
import { User } from "../models/index.js";
import { requireAuth } from "../middleware/auth.js";
import { DEFAULT_AVATAR_URL } from "../config.js";

const router = express.Router();

// Get user profile
router.get("/me", requireAuth, async (req, res) => {
  try {
    // Use email from query OR from authenticated user context
    const email = req.query.email || req.user?.email;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email }).select("email profileImageUrl wins losses draws matches id nickname name age gender country matchHistory achievements");
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

export default router;
