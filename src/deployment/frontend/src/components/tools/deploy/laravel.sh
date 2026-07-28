#!/bin/bash
# Laravel Deployment Script inside container
# Runs inside the container directly

echo "--> Setting up Laravel deployment environment..."

# 1. Install PHP, PHP-FPM, Composer, and Nginx
apt-get install -y nginx php-fpm php-curl php-gd php-mbstring php-xml php-zip php-mysql unzip
if ! command -v composer &> /dev/null; then
    curl -sS https://getcomposer.org/installer | php
    mv composer.phar /usr/local/bin/composer
fi

# 2. Configure Laravel
cd /var/www/app
if [ -f "composer.json" ]; then
    echo "Installing composer dependencies..."
    composer install --no-interaction --prefer-dist --optimize-autoloader
    
    if [ -f ".env.example" ] && [ ! -f ".env" ]; then
        cp .env.example .env
        php artisan key:generate
    fi
    
    # Set permissions
    chown -R www-data:www-data /var/www/app/storage /var/www/app/bootstrap/cache
    chmod -R 775 /var/www/app/storage /var/www/app/bootstrap/cache
else
    echo "ERROR: composer.json not found. Cloned directory is not a Laravel app."
    exit 1
fi

# 3. Configure Nginx
PHP_VERSION=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;")
PHP_FPM_SOCK="/var/run/php/php${PHP_VERSION}-fpm.sock"

cat <<EOF > /etc/nginx/sites-available/default
server {
    listen 80;
    server_name localhost;
    root /var/www/app/public;
    index index.php index.html index.htm;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:$PHP_FPM_SOCK;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }
}
EOF

# Restart services
systemctl restart nginx || service nginx restart
systemctl restart php${PHP_VERSION}-fpm || service php${PHP_VERSION}-fpm restart

echo "--> Laravel App deployed successfully inside container!"
