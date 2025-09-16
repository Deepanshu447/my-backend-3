import Message from "./models/Message.js";

const onlineUsers = new Map();

export function initSocket(io) {
    io.on("connection", (socket) => {
        const { uid, username } = socket.handshake.query;

        if (!uid) {
            console.log("⚠️ Connection without UID — disconnecting");
            socket.disconnect(true);
            return;
        }

        onlineUsers.set(uid, socket.id);
        console.log(`✅ ${username || uid} connected`);

        io.emit("online-users", Array.from(onlineUsers.keys()));

        socket.on("send-message", async (msg) => {
            try {
                const saved = await Message.create(msg);

                // Deliver to receiver if online
                const receiverSocketId = onlineUsers.get(msg.receiverUid);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receive-message", saved);
                }

                // Also send back to sender to confirm delivery
                socket.emit("receive-message", saved);
            } catch (err) {
                console.error("Message save error:", err);
            }
        });

        socket.on("disconnect", () => {
            onlineUsers.delete(uid);
            io.emit("online-users", Array.from(onlineUsers.keys()));
            console.log(`❌ ${username || uid} disconnected`);
        });

        socket.on("send-message", (message) => {
            const messageWithTime = {
                ...message,
                timestamp: new Date().toISOString(), // trusted server clock
            };

            io.emit("message", messageWithTime);
        });
    });
}
