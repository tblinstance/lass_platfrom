#!/bin/bash
# PHP Deployment Script inside container
# Runs inside the container directly

echo "--> Setting up PHP deployment environment..."

# 1. Install PHP, PHP-FPM, and Nginx
apt-get install -y nginx php-fpm php-curl php-gd php-mbstring php-xml php-zip

# 2. Configure Nginx to proxy to PHP-FPM
PHP_VERSION=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;")
PHP_FPM_SOCK="/var/run/php/php${PHP_VERSION}-fpm.sock"

cat <<EOF > /etc/nginx/sites-available/default
server {
    listen 80;
    server_name localhost;
    root /var/www/app;
    index index.php index.html index.htm;

    location / {
        try_files \$uri \$uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:$PHP_FPM_SOCK;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }
}
EOF

# Make sure permissions are right
chown -R www-data:www-data /var/www/app

# Restart services
systemctl restart nginx || service nginx restart
systemctl restart php${PHP_VERSION}-fpm || service php${PHP_VERSION}-fpm restart

echo "--> PHP App deployed successfully inside container!"
