#!/bin/bash

# ==========================================
# 🔧 Astro 5 Star - NGINX Fixer (Redirect Loop)
# ==========================================

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting NGINX Fixer...${NC}"

# 1. Ask for Domain Name again to be sure
echo "Enter your Domain Name (e.g., astro5star.com):"
read DOMAIN

# 2. Check for SSL Certificates
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

if [ ! -d "$CERT_PATH" ]; then
  echo -e "${RED}Error: SSL Certificates not found in $CERT_PATH${NC}"
  echo "Please check if you typed the domain correctly or if Certbot ran successfully."
  echo "Trying to find any certificate directory..."
  ls -d /etc/letsencrypt/live/*/
  exit 1
fi

echo -e "${GREEN}Found Certificates! Applying Fix for $DOMAIN...${NC}"

# 3. Write Correct NGINX Config (Overwriting old one)
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

sudo bash -c "cat > $NGINX_CONF" <<EOF
# Block 1: HTTP -> HTTPS Redirect
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$host\$request_uri;
}

# Block 2: HTTPS Service
server {
    listen 443 ssl;
    server_name $DOMAIN www.$DOMAIN;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Proxy to Node.js App
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;

        # Timeout settings for long WebSocket connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
EOF

# 4. Link & Restart
echo -e "${GREEN}Restarting NGINX...${NC}"
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}✅ FIX APPLIED!${NC}"
echo -e "Try opening https://$DOMAIN in Incognito Mode."
echo -e "${GREEN}==========================================${NC}"
