const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");
const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());

const PORT = process.env.PORT || 8000;

app.get('/', (req, res) => {
    res.send('Server is running');
});

// Map to track active users (socket.id -> userData or vice versa)
const activeUsers = new Map();

io.on("connection", (socket) => {
    // 1. Basic Connection
    socket.emit("me", socket.id);

    // 2. User joins (identifies themselves)
    socket.on("join-room", (userId) => {
        // In a real app, join a specific room. Here we treat 'userId' as a room or identity.
        // For simplicity in this demo, we can just join a room with their ID
        socket.join(userId);
        activeUsers.set(socket.id, userId);
        console.log(`User registered: ${userId} (${socket.id})`);
        // Notify others or just acknowledge
        socket.emit("room-joined", userId);
    });

    socket.on("disconnect", () => {
        socket.broadcast.emit("callEnded");
        activeUsers.delete(socket.id);
    });

    // 3. Signaling: Call User
    socket.on("call-user", ({ userToCall, signalData, from, name }) => {
        console.log(`Call initiated from ${from} to ${userToCall}`);
        io.to(userToCall).emit("call-user", {
            signal: signalData,
            from,
            name
        });
    });

    // 4. Signaling: Answer Call
    socket.on("answer-call", (data) => {
        console.log(`Call answered by ${data.from} for ${data.to}`);
        io.to(data.to).emit("call-accepted", data.signal);
    });

    // 5. Signaling: ICE Candidate (Optional if using simple-peer fully, but good for stability)
    // Simple-peer usually wraps candidates in 'signal' data, so the above two cover it.
    // However, if we need explicit candidate exchange:
    socket.on("ice-candidate", ({ target, candidate }) => {
        io.to(target).emit("ice-candidate", candidate);
    });

    // 6. Chat System
    socket.on("message", ({ to, message, from }) => {
        // Send to specific user
        io.to(to).emit("message", { message, from });
        // Also send back to sender to confirm (or handle in frontend)
    });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
