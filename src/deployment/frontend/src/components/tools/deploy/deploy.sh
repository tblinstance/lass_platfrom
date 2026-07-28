#!/bin/bash
# Tblinc Coordinator Deploy Script
# Usage: ./deploy.sh <container_name> <repo_url> <preset_type> <subdomain>

CONTAINER=$1
REPO_URL=$2
PRESET=$3
SUBDOMAIN=$4

echo "============================================="
echo "Starting Tblinc deployment flow for: $CONTAINER"
echo "Repository: $REPO_URL"
echo "Preset Framework: $PRESET"
echo "Target Subdomain: $SUBDOMAIN"
echo "============================================="

# 1. Check if container is running
STATUS=$(incus info "$CONTAINER" 2>/dev/null | grep "Status" | awk '{print $2}')
if [ "$STATUS" != "RUNNING" ]; then
    echo "ERROR: Container $CONTAINER is not running. Please start it first."
    exit 1
fi

# 2. Inside the container, update packages and install git
echo "Installing git inside $CONTAINER..."
incus exec "$CONTAINER" -- apt-get update -y
incus exec "$CONTAINER" -- apt-get install -y git curl

# 3. Clone repository inside container's workspace
echo "Cloning repository $REPO_URL..."
incus exec "$CONTAINER" -- rm -rf /var/www/app
incus exec "$CONTAINER" -- git clone "$REPO_URL" /var/www/app

# 4. Trigger framework-specific deployment script
SCRIPT_DIR="$(dirname "$0")"
case "$PRESET" in
    react)
        echo "Launching React deploy script..."
        cat "$SCRIPT_DIR/react.sh" | incus exec "$CONTAINER" -- bash
        ;;
    vue)
        echo "Launching Vue deploy script..."
        cat "$SCRIPT_DIR/vue.sh" | incus exec "$CONTAINER" -- bash
        ;;
    django)
        echo "Launching Django deploy script..."
        cat "$SCRIPT_DIR/django.sh" | incus exec "$CONTAINER" -- bash
        ;;
    laravel)
        echo "Launching Laravel deploy script..."
        cat "$SCRIPT_DIR/laravel.sh" | incus exec "$CONTAINER" -- bash
        ;;
    php)
        echo "Launching Vanilla PHP deploy script..."
        cat "$SCRIPT_DIR/php.sh" | incus exec "$CONTAINER" -- bash
        ;;
    nextjs)
        echo "Launching Next.js deploy script..."
        cat "$SCRIPT_DIR/nextjs.sh" | incus exec "$CONTAINER" -- bash
        ;;
    nodejs)
        echo "Launching NodeJS Express deploy script..."
        cat "$SCRIPT_DIR/nodejs.sh" | incus exec "$CONTAINER" -- bash
        ;;
    go)
        echo "Launching Go deploy script..."
        cat "$SCRIPT_DIR/go.sh" | incus exec "$CONTAINER" -- bash
        ;;
    rails)
        echo "Launching Ruby on Rails deploy script..."
        cat "$SCRIPT_DIR/rails.sh" | incus exec "$CONTAINER" -- bash
        ;;
    flask)
        echo "Launching Python Flask deploy script..."
        cat "$SCRIPT_DIR/flask.sh" | incus exec "$CONTAINER" -- bash
        ;;
    *)
        echo "Unknown preset '$PRESET'. Cloning repo only."
        ;;
esac

# 5. Configure host-level ingress reverse proxy routing
if [ -n "$SUBDOMAIN" ]; then
    echo "Configuring reverse proxy forwarding..."
    CONTAINER_IP=$(incus list "$CONTAINER" -c 4 --format csv | awk -F' ' '{print $1}')
    if [ -n "$CONTAINER_IP" ]; then
        bash "$SCRIPT_DIR/forward.sh" "$SUBDOMAIN" "$CONTAINER_IP"
    else
        echo "WARNING: Could not resolve IP for $CONTAINER. DNS forwarding skipped."
    fi
fi

echo "============================================="
echo "Tblinc deployment completed successfully!"
echo "============================================="
