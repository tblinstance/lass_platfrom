#!/bin/bash
# Next.js Build and Production Run Script
# Runs inside the container directly

echo "--> Setting up Next.js deployment environment..."

# 1. Install NodeJS, NPM, and PM2 process manager
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs nginx
else
    apt-get install -y nginx
fi

npm install -g pm2

# 2. Build Next.js application
cd /var/www/app
if [ -f "package.json" ]; then
    echo "Installing package dependencies..."
    npm install
    echo "Building production build..."
    npm run build
else
    echo "ERROR: package.json not found inside NextJS project."
    exit 1
fi

# 3. Start Next.js with PM2 daemon
echo "Starting NextJS server under PM2..."
pm2 delete next-app 2>/dev/null || true
pm2 start npm --name "next-app" -- start

# 4. Proxy local port 3000 to Nginx
cat <<EOF > /etc/nginx/sites-available/default
server {
    listen 80;
    server_name localhost;

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

# Restart Nginx
systemctl restart nginx || service nginx restart
echo "--> Next.js app deployed and running under PM2 daemon!"
