# WebRTC + Socket.IO App (Separated)

This project is split into two independent parts to make deployment easier.

## � Structure
*   **`client/`**: The React Frontend (Vite)
*   **`server/`**: The Node.js Backend (Socket.IO)

---

## 🚀 How to Run Locally

You must run **two separate terminals**.

### Terminal 1: Backend
```bash
cd server
npm install
npm start
```
*   Running on: `http://localhost:8000`

### Terminal 2: Frontend
```bash
cd client
npm install
npm run dev
```
*   Running on: `http://localhost:5173`

---

## 🌍 Deployment

### Deploying Client (Frontend)
*   **Platform**: Vercel / Netlify
*   **Root Directory**: `client`
*   **Build Command**: `npm run build`
*   **Output Directory**: `dist`

### Deploying Server (Backend)
*   **Platform**: Railway / Heroku / Render
*   **Root Directory**: `server`
*   **Start Command**: `npm start`
