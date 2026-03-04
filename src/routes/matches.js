import express from "express";
import { User } from "../models/index.js";
import { requireAuth } from "../middleware/auth.js";
import { checkAndUnlockAchievements } from "../utils/helpers.js";

const router = express.Router();

// Get match history
router.get("/history", requireAuth, async (req, res) => {
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

// Record match result
router.post("/record", requireAuth, async (req, res) => {
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

    if (result === 'win') {
      user.wins += 1;
    } else if (result === 'loss') {
      user.losses += 1;
    } else {
      user.draws += 1;
    }
    user.matches += 1;

    user.matchHistory.push({
      matchId: `match_${Date.now()}`,
      opponent: opponentEmail,
      opponentNickname: opponentNickname || 'Unknown',
      result,
      duration: duration || 0,
      scores: { playerScore: playerScore || 0, opponentScore: opponentScore || 0 }
    });

    if (user.matchHistory.length > 100) {
      user.matchHistory = user.matchHistory.slice(-100);
    }

    checkAndUnlockAchievements(user, result);

    await user.save();

    return res.json({
      stats: {
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        matches: user.matches
      },
      newAchievements: user.achievements.filter(a => !a.unlockedAt || (Date.now() - a.unlockedAt) < 5000)
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
