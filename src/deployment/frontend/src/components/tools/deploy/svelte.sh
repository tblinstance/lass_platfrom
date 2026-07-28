#!/bin/bash
# SvelteKit Deployment Script inside container
# Runs inside the container directly

echo "--> Setting up SvelteKit deployment environment..."

# 1. Install NodeJS and NPM
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs nginx
else
    apt-get install -y nginx
fi

npm install -g pm2

# 2. Build application
cd /var/www/app
if [ -f "package.json" ]; then
    echo "Installing node dependencies..."
    npm install
    
    echo "Building SvelteKit app..."
    npm run build
fi

# 3. Create Nginx Configuration
cat <<EOF > /etc/nginx/sites-available/default
server {
    listen 80;
    server_name localhost;
    
    # SvelteKit node-adapter typically runs on port 3000
    location / {
        proxy_pass http://127.0.0.1:3000;
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

# 4. Start app with PM2
pm2 stop svelte-app || true
# Assuming build outputs to build/index.js (node-adapter)
if [ -f "build/index.js" ]; then
    pm2 start build/index.js --name "svelte-app" --time
else
    # Fallback to preview or dev if build not standard
    pm2 start npm --name "svelte-app" --time -- run preview -- --port 3000 || pm2 start npm --name "svelte-app" --time -- run dev -- --port 3000
fi

echo "--> SvelteKit App deployed successfully inside container!"
