import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Register or fetch user
router.post("/register", async (req, res) => {
  try {
    const { uid, email, username } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: "uid and email are required" });
    }

    let user = await User.findOne({ uid });
    if (!user) {
      user = await User.create({ uid, email, username });
    }

    res.json(user);
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// List all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-__v");
    res.json(users);
  } catch (err) {
    console.error("Users fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
