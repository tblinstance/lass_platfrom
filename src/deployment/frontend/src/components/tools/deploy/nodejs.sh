#!/bin/bash
# NodeJS / Express Deployment Script
# Runs inside the container directly

echo "--> Setting up Node.js Express API environment..."

# 1. Install NodeJS and PM2 process manager
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs nginx
else
    apt-get install -y nginx
fi

npm install -g pm2

# 2. Setup workspace
cd /var/www/app
if [ -f "package.json" ]; then
    echo "Installing NPM dependencies..."
    npm install
else
    echo "ERROR: package.json not found."
    exit 1
fi

# 3. Detect main entry point and daemonize
ENTRY_POINT="index.js"
if [ -f "server.js" ]; then
    ENTRY_POINT="server.js"
elif [ -f "app.js" ]; then
    ENTRY_POINT="app.js"
fi

echo "Starting Node server ($ENTRY_POINT) under PM2..."
pm2 delete express-api 2>/dev/null || true
pm2 start "$ENTRY_POINT" --name "express-api"

# 4. Proxy to Nginx
# Detect port from file (defaulting to 3000 or 8080)
PORT=3000
if grep -q "8080" "$ENTRY_POINT" 2>/dev/null; then
    PORT=8080
fi

cat <<EOF > /etc/nginx/sites-available/default
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Restart Nginx
systemctl restart nginx || service nginx restart
echo "--> NodeJS Express API deployed successfully under PM2!"
