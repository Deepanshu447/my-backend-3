require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const Message = require("./models/Message");

const allowedOrigins = [
  "http://localhost:5173",                            // local development
  "https://chat-app-messenger.vercel.app/"         // production frontend
];

const app = express();
app.use(cors({ origin: allowedOrigins, credentials: true }));

// MongoDB connection
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
    console.error("❌ MONGODB_URI not set in .env file");
    process.exit(1); // Exit if URI is missing
}
console.log("Connecting to MongoDB URI:", mongoUri.replace(/:.*@/, ":*****@")); // Mask password
mongoose
    .connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // Fail faster if unreachable
        connectTimeoutMS: 10000, // Shorter timeout for connection
    })
    .then(() => {
        console.log("✅ Connected to MongoDB");
        console.log("Database name:", mongoose.connection.name); // Should be "chatapp"
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1); // Exit to catch issues early
    });

mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB error:", err);
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
});

io.on("connection", async (socket) => {
    const user = socket.handshake.query.user || "Anonymous";
    console.log(`✅ ${user} connected`);

    // Send message history to the new client
    try {
        const history = await Message.find().sort({ ts: 1 }).limit(50); // Fetch last 50 messages
        socket.emit("history", history); // Send to this client only
    } catch (err) {
        console.error("❌ Error fetching history:", err);
    }

    socket.on("message", async (msg) => {
        const payload = {
            sender: msg.sender || user,
            text: msg.text,
            ts: new Date(),
        };
        try {
            const saved = await Message.create(payload);
            console.log("💾 Saved to DB:"); // <--- already present
            io.emit("message", saved);
        } catch (err) {
            console.error("❌ Error saving message:", err);
        }
    });

    socket.on("disconnect", () => {
        console.log(`❌ ${user} disconnected`);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});