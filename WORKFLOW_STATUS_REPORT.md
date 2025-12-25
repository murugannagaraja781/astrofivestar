Rule 1: AUTH FIRST, SOCKET NEXT
Never trust client-sent IDs.
Copy code
Js
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const user = verifyJWT(token); // MUST
  socket.userId = user.id;       // FINAL truth
  next();
});
✅ Rule 2: Use ONE canonical userId
Same ID everywhere. No excuses.
Copy code
Js
userSockets.set(socket.userId, socket);
Not:
phone number ❌
socket.id ❌
random string ❌
✅ Rule 3: Handle reconnects (MANDATORY)
Copy code
Js
io.on("connection", (socket) => {
  userSockets.set(socket.userId, socket);

  socket.on("disconnect", () => {
    userSockets.delete(socket.userId);
  });
});
No disconnect cleanup = stale map = chaos.
✅ Rule 4: Android MUST run Foreground Service
If astrologer must receive calls like WhatsApp:
Foreground service
Persistent notification
Socket reconnect logic
Otherwise STOP EXPECTING POPUPS.
✅ Rule 5: Send event ONLY after socket confirm
Copy code
Js
const astroSocket = userSockets.get(astroId);

if (!astroSocket) {
  throw new Error("Astrologer offline (socket not connected)");
}

astroSocket.emit("incoming-session", payload);
No retry? No queue? Then your design is weak.
