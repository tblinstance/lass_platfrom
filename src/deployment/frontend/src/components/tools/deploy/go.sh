#!/bin/bash
# Golang Deployment Script
# Runs inside the container directly

echo "--> Setting up Golang deployment environment..."

# 1. Install Go Compiler and Nginx
apt-get install -y golang-go nginx

# 2. Build Go application
cd /var/www/app
if [ -f "go.mod" ]; then
    echo "Resolving go modules..."
    go mod download
    echo "Compiling binary executable..."
    go build -o app_server .
else
    # Fallback compilation
    echo "No go.mod. Compiling single file source..."
    go build -o app_server main.go
fi

# 3. Setup Systemd Service to daemonize
cat <<EOF > /etc/systemd/system/go-app.service
[Unit]
Description=Golang Web App
After=network.target

[Service]
WorkingDirectory=/var/www/app
ExecStart=/var/www/app/app_server
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl start go-app
systemctl enable go-app

# 4. Proxy to Nginx (default port 8080)
cat <<EOF > /etc/nginx/sites-available/default
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

systemctl restart nginx || service nginx restart
echo "--> Golang application compiled and running via systemd service!"
