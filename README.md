# WebRTC + Socket.IO Video Call App

This project contains both the **React Frontend** (Client) and the **Node.js/Express Backend** (Server).

## 🛠️ Setup (First Time Only)
Before running anything, make sure to install all dependencies (including dev tools like Vite):

```bash
npm install
```

---

## 🚀 How to Run Locally

You need to run **two separate terminals**: one for the Server, one for the Client.

### Terminal 1: Start the Backend Server
This runs the Socket.IO signaling server.
```bash
npm run server
```
*   Runs on: `http://localhost:8000` (or 5000 if not set)
*   *Note: If you see "Address already in use", see Troubleshooting below.*

### Terminal 2: Start the React Client
This runs the frontend website.
```bash
npm run dev
```
*   Runs on: `http://localhost:5173`
*   Open this link in your browser to test.

---

## 📱 Testing the Call
1.  Open `http://localhost:5173` in **Browser Tab A**.
2.  Open `http://localhost:5173` in **Browser Tab B** (Incognito).
3.  **Tab A**: Enter ID `user1` -> Click Login.
4.  **Tab B**: Enter ID `user2` -> Click Login.
5.  **Tab A**: Paste `user2` in the "ID to Call" box -> Click Call.
6.  **Tab B**: Click Answer.

---

## ⚠️ Troubleshooting

### "sh: vite: command not found"
This happens if you installed only production dependencies. Run:
```bash
npm install
```

### "Error: listen EADDRINUSE: address already in use :::8000"
This means the server is **already running** in the background. You need to stop it.

**Mac/Linux:**
Find the process ID (PID):
```bash
lsof -i :8000
```
Kill the process:
```bash
kill -9 <PID>
```
*Or just kill all node processes:*
```bash
pkill -f node
```
