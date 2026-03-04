import express from "express";
import { User } from "../models/index.js";
import { requireAuth } from "../middleware/auth.js";
import { checkAndUnlockAchievements } from "../utils/helpers.js";

const router = express.Router();

// Get achievements (for /api/achievements route)
router.get("/", requireAuth, async (req, res) => {
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

// Get progression stats
router.get("/progression", requireAuth, async (req, res) => {
  try {
    const email = req.user?.email;
    
    const user = await User.findOne({ email }).select("wins losses draws matches");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const winRate = user.matches > 0 ? ((user.wins / user.matches) * 100).toFixed(1) : 0;
    const elo = Math.max(100, 1000 + (user.wins * 30) - (user.losses * 15));

    return res.json({
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

export default router;
