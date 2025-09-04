require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const Message = require("./models/Message");
const User = require("./models/User");

const app = express();

// Allow local + production
const allowedOrigins = ["https://chat-app-advance-five.vercel.app"];
app.use(cors({ origin: allowedOrigins, credentials: true }));

// --- MongoDB connection ---
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("❌ MONGODB_URI not set in .env file");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// --- HTTP + Socket.IO ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// --- Memory: track online users ---
const onlineUsers = new Map(); // username -> socket.id

// --- Socket.IO connection handler ---
io.on("connection", async (socket) => {
  const username = socket.handshake.query.user;
  if (!username) {
    console.log("⚠️ Connection without username");
    socket.disconnect(true); // <--- fix: close socket
    return;
  }

  console.log(`✅ ${username} connected`);
  onlineUsers.set(username, socket.id);

  // --- Ensure user exists in DB ---
  try {
    await User.findOneAndUpdate(
      { username },
      { username },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("❌ Error saving user in DB:", err);
  }

  // --- Broadcast online users ---
  io.emit("online-users", Array.from(onlineUsers.keys()));

  // --- Handle private messages ---
  socket.on("private-message", async (msg) => {
    const { sender, receiver, text } = msg; // <-- fixed: use receiver
    if (!receiver || !sender || !text) return;

    const payload = {
      sender,
      receiver,
      text,
      ts: new Date(),
    };

    try {
      // Save to DB
      const saved = await Message.create(payload);

      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("private-message", saved);
      }

      // Send to sender too (so both see same DB-synced object)
      const senderSocketId = onlineUsers.get(sender);
      if (senderSocketId) {
        io.to(senderSocketId).emit("private-message", saved);
      }
    } catch (err) {
      console.error("❌ Error saving private message:", err);
    }
  });

  // --- Handle disconnect ---
  socket.on("disconnect", () => {
    onlineUsers.delete(username);
    io.emit("online-users", Array.from(onlineUsers.keys()));
    console.log(`❌ ${username} disconnected`);
  });
});

// --- REST endpoint: fetch all registered users ---
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "username -_id").lean();
    res.json(users.map((u) => u.username));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// --- REST endpoint: fetch conversation messages ---
app.get("/messages", async (req, res) => {
  const { user1, user2 } = req.query;
  if (!user1 || !user2)
    return res.status(400).json({ error: "user1 and user2 required" });

  try {
    const msgs = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ ts: 1 });
    res.json(msgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
