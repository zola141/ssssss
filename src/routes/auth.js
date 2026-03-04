import express from "express";
import bcrypt from "bcrypt";
import { User, Counter } from "../models/index.js";
import { authTokens, requireAuth } from "../middleware/auth.js";
import { DEFAULT_AVATAR_URL } from "../config.js";

const router = express.Router();

export const setupAuthRoutes = (router, upload) => {
  // Register
  router.post("/register", upload.single("profile"), async (req, res) => {
    try {
      const { email, password, name, nickname, country, gender, age } = req.body;

      if (!email || !password || !name || !nickname || !country || !gender || !age) {
        return res.status(400).send("All fields are required!");
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).send("User already exists!");
      }

      const counter = await Counter.findOneAndUpdate(
        { name: "user" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const hashedPassword = await bcrypt.hash(password, 10);
      const profileImageUrl = req.file ? `/uploads/${req.file.filename}` : DEFAULT_AVATAR_URL;

      const newUser = new User({
        id: counter.seq,
        name,
        nickname,
        email,
        password: hashedPassword,
        profileImageUrl,
        wins: 0,
        losses: 0,
        draws: 0,
        matches: 0,
        country,
        gender,
        age: parseInt(age)
      });

      await newUser.save();
      res.redirect("/");

    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // Login
  router.post("/login", async (req, res) => {
    try {
      const { nickname, password } = req.body;

      const user = await User.findOne({ nickname });
      if (!user) {
        return res.status(400).json({ success: false, message: "Wrong nickname or password!" });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(400).json({ success: false, message: "Wrong nickname or password!" });
      }

      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      authTokens.set(token, { userId: user._id, email: user.email });

      res.json({
        success: true,
        token,
        email: user.email,
        nickname: user.nickname,
        profileImageUrl: user.profileImageUrl || DEFAULT_AVATAR_URL
      });

    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Update profile
  router.put("/api/users/me", requireAuth, upload.single("profile"), async (req, res) => {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const updates = {};
      const allowedFields = ["name", "nickname", "country", "gender", "age"];

      allowedFields.forEach((field) => {
        if (typeof req.body[field] !== "undefined" && req.body[field] !== "") {
          updates[field] = req.body[field];
        }
      });

      if (typeof updates.age !== "undefined") {
        const parsedAge = parseInt(updates.age, 10);
        if (Number.isNaN(parsedAge) || parsedAge <= 0) {
          return res.status(400).json({ message: "Invalid age" });
        }
        updates.age = parsedAge;
      }

      if (req.file) {
        updates.profileImageUrl = `/uploads/${req.file.filename}`;
      }

      const updated = await User.findOneAndUpdate(
        { email },
        { $set: updates },
        { new: true }
      ).select("email profileImageUrl wins losses draws matches id nickname name age gender country");

      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      const payload = updated.toObject();
      payload.profileImageUrl = payload.profileImageUrl || DEFAULT_AVATAR_URL;
      return res.json(payload);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  return router;
};

export default router;
