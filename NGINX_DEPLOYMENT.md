# Deployment Guide with NGINX (VPS/Ubuntu) 🌐

This guide explains how to host your "Rise Astro" app on a Linux VPS (Ubuntu) using **NGINX** as a reverse proxy and **PM2** to keep the app running.

## 1. Prerequisites
- A VPS (DigitalOcean Droplet, AWS EC2, etc.) running Ubuntu.
- A Domain Name (e.g., `astrofivestar.com`) pointed to your VPS IP address.
- **Node.js** installed on the server.

## 2. Setup the App
1.  Clone your code to the server (e.g., in `/var/www/astro`).
2.  Install dependencies:
    ```bash
    cd /var/www/astro
    npm install
    ```
3.  **Install PM2** (Process Manager) to keep your app running forever:
    ```bash
    sudo npm install -g pm2
    ```
4.  Start your app with PM2:
    ```bash
    # Make sure to set your Mongo URI here or in a .env file
    export MONGO_URI="mongodb+srv://..."
    pm2 start server.js --name "astro-app"
    pm2 save
    pm2 startup
    ```

## 3. Install & Configure NGINX
1.  Install NGINX:
    ```bash
    sudo apt update
    sudo apt install nginx
    ```
2.  Create a configuration file for your site:
    ```bash
    sudo nano /etc/nginx/sites-available/astro
    ```
3.  **Paste the following configuration** (Replace `yourdomain.com` with your actual domain):

    ```nginx
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;

        location / {
            proxy_pass http://localhost:3000; # Points to your Node app
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```
    *Note: The `Upgrade` and `Connection` headers are **Critical** for Socket.IO/WebSockets to work.*

4.  Enable the site and restart NGINX:
    ```bash
    sudo ln -s /etc/nginx/sites-available/astro /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

## 4. Setup SSL (HTTPS) - **Mandatory for Video Calls** 🔒
Browser security requires HTTPS for camera/microphone access.

1.  Install Certbot:
    ```bash
    sudo apt install certbot python3-certbot-nginx
    ```
2.  Run Certbot to fetch a free certificate:
    ```bash
    sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
    ```
3.  Follow the prompts. Certbot will automatically update your NGINX config to use HTTPS.

## 5. Done! 🚀
Visit `https://yourdomain.com`. Your app should be live with secure Video/Audio calls enabled.
