#!/bin/bash
# Host-level Nginx Ingress Reverse Proxy Configuration Script
# Configures subdomain routing mapping to target container IP

SUBDOMAIN=$1
TARGET_IP=$2

if [ -z "$SUBDOMAIN" ] || [ -z "$TARGET_IP" ]; then
    echo "Usage: ./forward.sh <subdomain> <target_ip>"
    exit 1
fi

echo "--> Mapping ingress rule on host: $SUBDOMAIN.tblinc.com -> http://$TARGET_IP:80"

CONF_FILE="/etc/nginx/sites-available/$SUBDOMAIN.tblinc.com"

# Create virtual host config
cat <<EOF > "$CONF_FILE"
server {
    listen 80;
    server_name $SUBDOMAIN.tblinc.com;

    location / {
        proxy_pass http://$TARGET_IP:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Link config to enabled sites
ln -sf "$CONF_FILE" "/etc/nginx/sites-enabled/"

# Test and reload host Nginx service
if nginx -t 2>/dev/null; then
    systemctl reload nginx || service nginx reload
    echo "--> DNS Ingress proxy rules loaded successfully for $SUBDOMAIN.tblinc.com"
else
    echo "ERROR: Nginx config test failed. Ingress rules rolled back."
    rm -f "/etc/nginx/sites-enabled/$SUBDOMAIN.tblinc.com"
    exit 1
fi
