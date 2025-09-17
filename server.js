// server.js (ESM)
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/message.js";
import { initSocket } from "./socket.js";

const allowedOrigins = [
  "http://localhost:5173",
  "https://team-x-chat-app.vercel.app",
];

dotenv.config();
const app = express();

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

app.use(authRoutes);
app.use(messageRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

initSocket(io);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
});
