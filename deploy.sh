#!/bin/bash

# ==========================================
# 🚀 Astro 5 Star - Auto Deployment Script
# ==========================================
# Run this script on your Ubuntu VPS (fresh install recommended)
# Usage: sudo bash deploy.sh

# --- 1. User Configuration ---
# You can hardcode these or type them when prompted
DOMAIN_NAME=""     # e.g., astrofivestar.com
MONGO_URI=""  # Your MongoDB Connection String

# --- Setup Colors ---
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Auto-Deployment...${NC}"

# --- 2. Update System ---
echo -e "${GREEN}Step 1: Updating System...${NC}"
sudo apt update && sudo apt upgrade -y
sudo apt install curl git nginx -y

# --- 3. Install Node.js (v18) ---
echo -e "${GREEN}Step 2: Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# --- 4. Install Process Manager (PM2) ---
echo -e "${GREEN}Step 3: Installing PM2...${NC}"
sudo npm install -g pm2

# --- 5. Setup Project Folder ---
# Assuming we are running this script FROM the project folder or pulling repo
# If running locally in the folder uploaded via SCP/FTP:
APP_DIR=$(pwd)

echo -e "${GREEN}Step 4: Installing Dependencies in $APP_DIR...${NC}"
cd $APP_DIR
npm install

# --- 6. Configure Environment ---
if [ -z "$MONGO_URI" ]; then
  echo "Enter your MongoDB URI:"
  read MONGO_URI
fi

# Create .env file if needed or export vars (PM2 ecosystem is better but simple start works)
export MONGO_URI="$MONGO_URI"

# --- 7. Start Application with PM2 ---
echo -e "${GREEN}Step 5: Starting App with PM2...${NC}"
pm2 start server.js --name "astro-app" --update-env
pm2 save
pm2 startup | tail -n 1 | bash # Execute the command PM2 gives to startup on boot

# --- 8. Configure NGINX ---
if [ -z "$DOMAIN_NAME" ]; then
  echo "Enter your Domain Name (e.g., example.com):"
  read DOMAIN_NAME
fi

echo -e "${GREEN}Step 6: Configuring NGINX for $DOMAIN_NAME...${NC}"

NGINX_CONF="/etc/nginx/sites-available/$DOMAIN_NAME"

sudo bash -c "cat > $NGINX_CONF" <<EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable Site
sudo ln -s $NGINX_CONF /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# --- 9. Setup SSL (HTTPS) ---
echo -e "${GREEN}Step 7: Installing SSL (Certbot)...${NC}"
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos -m admin@$DOMAIN_NAME

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}Visit: https://$DOMAIN_NAME${NC}"
echo -e "${GREEN}==========================================${NC}"
