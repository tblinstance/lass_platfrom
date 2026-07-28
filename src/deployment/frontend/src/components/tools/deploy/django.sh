#!/bin/bash
# Django Deployment Script inside container
# Runs inside the container directly

echo "--> Setting up Django deployment environment..."

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

pip install gunicorn

# Run migrations and static collection if applicable
if [ -f "manage.py" ]; then
    echo "Running django migrations..."
    python manage.py migrate --noinput
fi

# 3. Create Systemd Service for Gunicorn daemon
echo "Creating systemd daemon configuration..."
APP_NAME=$(basename "/var/www/app")

cat <<EOF > /etc/systemd/system/gunicorn.service
[Unit]
Description=gunicorn daemon
After=network.target

[Service]
User=root
WorkingDirectory=/var/www/app
ExecStart=/var/www/app/venv/bin/gunicorn --workers 3 --bind unix:/run/gunicorn.sock backend.wsgi:application

[Install]
WantedBy=multi-user.target
EOF

# Start and enable gunicorn daemon
systemctl daemon-reload
systemctl start gunicorn
systemctl enable gunicorn

# 4. Configure Nginx reverse proxy
cat <<EOF > /etc/nginx/sites-available/default
server {
    listen 80;
    server_name localhost;

    location / {
        include proxy_params;
        proxy_pass http://unix:/run/gunicorn.sock;
    }
}
EOF

# Restart Nginx
systemctl restart nginx || service nginx restart
echo "--> Django App deployed successfully inside container!"
