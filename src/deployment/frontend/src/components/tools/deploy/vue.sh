#!/bin/bash
# Vue Build and Serve Script inside container
# Runs inside the container directly

echo "--> Setting up Vue deployment environment..."

# 1. Install NodeJS and NPM
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs nginx
else
    apt-get install -y nginx
fi

# 2. Build application
cd /var/www/app
if [ -f "package.json" ]; then
    echo "Installing node dependencies..."
    npm install
    echo "Building production build..."
    npm run build
else
    echo "ERROR: package.json not found inside cloned repository."
    exit 1
fi

# 3. Configure Nginx to serve production build folder
echo "Configuring Nginx virtual host..."
BUILD_DIR="/var/www/app/dist"

cat <<EOF > /etc/nginx/sites-available/default
server {
    listen 80;
    server_name localhost;

    location / {
        root $BUILD_DIR;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Restart Nginx
systemctl restart nginx || service nginx restart
echo "--> Vue App deployed successfully inside container!"
