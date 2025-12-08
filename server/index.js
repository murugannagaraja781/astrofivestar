const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(require("cors")());

const PORT = process.env.PORT || 8000;

app.get('/', (req, res) => {
    res.send('Server is running');
});

// Map to store userId -> socketId
const connectedUsers = {};

io.on("connection", (socket) => {
    // User registers their ID (e.g., 'admin1', 'client1')
    socket.on("register", (userId) => {
        connectedUsers[userId] = socket.id;
        socket.userId = userId;
        console.log(`User registered: ${userId} -> ${socket.id}`);
        socket.emit("registered", userId);
    });

    socket.on("disconnect", () => {
        if (socket.userId) {
            delete connectedUsers[socket.userId];
            console.log(`User disconnected: ${socket.userId}`);
        }
        socket.broadcast.emit("callEnded");
    });

    socket.on("callUser", (data) => {
        const targetSocketId = connectedUsers[data.userToCall];
        if (targetSocketId) {
            console.log(`Call from ${data.from} to ${data.userToCall}`);
            io.to(targetSocketId).emit("callUser", {
                signal: data.signalData,
                from: data.from,
                name: data.name
            });
        } else {
            console.log(`User ${data.userToCall} not found`);
        }
    });

    socket.on("answerCall", (data) => {
        const targetSocketId = connectedUsers[data.to];
        if (targetSocketId) {
            console.log(`Call answered by ${socket.userId} to ${data.to}`);
            io.to(targetSocketId).emit("callAccepted", data.signal);
        }
    });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
