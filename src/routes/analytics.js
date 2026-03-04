import express from "express";
import { User } from "../models/index.js";

const router = express.Router();

// Get analytics stats
router.get("/stats", async (req, res) => {
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

      return {
        user_id: String(u.id),
        username: u.nickname,
        total_wins: safeWins,
        total_losses: safeLosses
      };
    });

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Export analytics as JSON
router.get("/export", async (req, res) => {
  try {
    const users = await User.find({})
      .select("id nickname wins losses matches")
      .sort({ wins: -1, matches: -1, nickname: 1 })
      .lean();

    const stats = users.map((u) => {
      const safeWins = Number(u.wins || 0);
      const safeLosses = Number(u.losses || 0);

      return {
        user_id: String(u.id),
        username: u.nickname,
        total_wins: safeWins,
        total_losses: safeLosses
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

export default router;
