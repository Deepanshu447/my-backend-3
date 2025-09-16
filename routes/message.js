import express from "express";
import Message from "../models/Message.js";

const router = express.Router();

// Fetch conversation between two users
router.get("/messages", async (req, res) => {
  try {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) {
      return res.status(400).json({ error: "user1 and user2 are required" });
    }

    const messages = await Message.find({
      $or: [
        { senderUid: user1, receiverUid: user2 },
        { senderUid: user2, receiverUid: user1 },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Messages fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
