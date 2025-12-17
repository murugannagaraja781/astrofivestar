# How to Deploy "Astro 5 Star" to the Internet 🚀

To make this website "Real Live" and accessible to everyone, you need to deploy it to a cloud hosting provider. Since you are using **Node.js** and **MongoDB**, **Render.com** or **Railway.app** are the best and easiest options.

**Prerequisite:** You need your **MongoDB Connection URI** handy (starts with `mongodb+srv://...`).

---

## Option 1: Deploy on Render (Recommended & Free Tier Available)

1.  **Push Code to GitHub**:
    *   Create a repository on GitHub.
    *   Push your `astrofivestar` folder code to this repository.
2.  **Sign up for Render**: Go to [render.com](https://render.com) and sign up/login.
3.  **Create a Web Service**:
    *   Click "New +" -> "Web Service".
    *   Connect your GitHub repository.
4.  **Configure**:
    *   **Name**: `rise-astro` (or similar).
    *   **Runtime**: `Node`.
    *   **Build Command**: `npm install`.
    *   **Start Command**: `node server.js`.
5.  **Environment Variables** (Crucial!):
    *   Scroll down to "Environment Variables".
    *   Add Key: `MONGO_URI`
    *   Value: *Paste your actual MongoDB Connection String here*.
6.  **Deploy**: Click "Create Web Service".

**That's it!** Render will give you a URL like `https://rise-astro.onrender.com`.
*   **HTTPS is automatic** (required for Video/Audio calls to work on mobile).
*   **WebRTC** will work because of HTTPS.

---

## Option 2: Server Requirements (If usage VPS)

If you use a VPS like DigitalOcean or AWS EC2:
1.  **Install Node.js 18+**.
2.  **Clone your code**.
3.  **SSL is Mandatory**: You MUST use HTTPS (e.g., using Nginx + Certbot/Let's Encrypt).
    *   *Why?* Browsers block Camera/Microphone access on insecure (`http://`) sites unless it's `localhost`.

---

## Important Note on WebRTC (Video Calls)

This app uses **Peer-to-Peer (P2P)** technology.
*   **STUN Servers**: We are using Google's public STUN servers. This works for 80-90% of networks.
*   **TURN Servers**: For a **commercial-grade** "Real Live" site, you eventually need a **TURN Server** (like Twilio or multiple cloud providers) to guarantee video connects even on strict corporate/mobile networks.
    *   *For now, the current setup is fine for a demo or start-up.*

## Verify Your Deployment
1.  Open your new `https://...` URL.
2.  Login as Astrologer.
3.  Open the same URL on your **Mobile Phone**.
4.  Login as Client.
5.  Test the call!
