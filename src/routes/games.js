import express from "express";
import { User } from "../models/index.js";

const router = express.Router();

// Record game results
router.post("/result", async (req, res) => {
  try {
    const { winnersEmails, losersEmails } = req.body;

    for (const email of winnersEmails) {
      await User.findOneAndUpdate(
        { email },
        { $inc: { wins: 1, matches: 1 } }
      );
    }

    for (const email of losersEmails) {
      await User.findOneAndUpdate(
        { email },
        { $inc: { losses: 1, matches: 1 } }
      );
    }

    res.json({ message: "Game results updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
