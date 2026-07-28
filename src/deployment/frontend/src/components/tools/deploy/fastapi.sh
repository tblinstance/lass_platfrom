#!/bin/bash
# FastAPI Deployment Script inside container
# Runs inside the container directly

echo "--> Setting up Python FastAPI deployment environment..."

# 1. Install Python3, Virtualenv, Pip, and Nginx
apt-get install -y python3 python3-pip python3-venv nginx

# 2. Setup virtualenv and dependencies
cd /var/www/app
python3 -m venv venv
source venv/bin/activate

if [ -f "requirements.txt" ]; then
    echo "Installing pip requirements..."
    pip install -r requirements.txt
fi

# Ensure uvicorn and fastapi are installed
pip install fastapi uvicorn gunicorn

# 3. Create Systemd Service for Gunicorn with Uvicorn workers
echo "Creating systemd daemon configuration..."

cat <<EOF > /etc/systemd/system/fastapi.service
[Unit]
Description=fastapi daemon
After=network.target

[Service]
User=root
WorkingDirectory=/var/www/app
ExecStart=/var/www/app/venv/bin/gunicorn --workers 3 --worker-class uvicorn.workers.UvicornWorker --bind unix:/run/fastapi.sock main:app

[Install]
WantedBy=multi-user.target
EOF

# Start and enable daemon
systemctl daemon-reload
systemctl start fastapi
systemctl enable fastapi

# 4. Configure Nginx reverse proxy
cat <<EOF > /etc/nginx/sites-available/default
server {
    listen 80;
    server_name localhost;

    location / {
        include proxy_params;
        proxy_pass http://unix:/run/fastapi.sock;
    }
}
EOF

# Restart Nginx
systemctl restart nginx || service nginx restart
echo "--> FastAPI App deployed successfully inside container!"
