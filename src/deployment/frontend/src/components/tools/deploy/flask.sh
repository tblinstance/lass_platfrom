#!/bin/bash
# Python Flask Deployment Script
# Runs inside the container directly

echo "--> Setting up Python Flask deployment environment..."

# 1. Install Python3, pip, venv, and Nginx
apt-get install -y python3 python3-pip python3-venv nginx

# 2. Setup workspace
cd /var/www/app
python3 -m venv venv
source venv/bin/activate

if [ -f "requirements.txt" ]; then
    echo "Installing pip requirements..."
    pip install -r requirements.txt
fi

pip install gunicorn

# 3. Create Systemd Service for Gunicorn daemon
# Detect Flask app entry point (defaulting to app.py or main.py)
ENTRY_FILE="app"
if [ -f "main.py" ]; then
    ENTRY_FILE="main"
fi

cat <<EOF > /etc/systemd/system/gunicorn-flask.service
[Unit]
Description=Gunicorn Flask Daemon
After=network.target

[Service]
User=root
WorkingDirectory=/var/www/app
ExecStart=/var/www/app/venv/bin/gunicorn --workers 3 --bind unix:/run/gunicorn-flask.sock $ENTRY_FILE:app

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl start gunicorn-flask
systemctl enable gunicorn-flask

# 4. Proxy to Nginx
cat <<EOF > /etc/nginx/sites-available/default
server {
    listen 80;
    server_name localhost;

    location / {
        include proxy_params;
        proxy_pass http://unix:/run/gunicorn-flask.sock;
    }
}
EOF

# Restart Nginx
systemctl restart nginx || service nginx restart
echo "--> Python Flask app deployed successfully under Gunicorn daemon!"
