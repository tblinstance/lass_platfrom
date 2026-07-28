#!/bin/bash
# Ruby on Rails Deployment Script
# Runs inside the container directly

echo "--> Setting up Ruby on Rails deployment environment..."

# 1. Install Ruby, Bundler, SQLite / Postgres dev packages, and Nginx
apt-get install -y ruby ruby-dev build-essential libsqlite3-dev libpq-dev git nginx curl

if ! command -v bundle &> /dev/null; then
    gem install bundler
fi

# 2. Configure Rails Workspace
cd /var/www/app
if [ -f "Gemfile" ]; then
    echo "Installing ruby gems..."
    bundle config set --local deployment 'true'
    bundle config set --local without 'development test'
    bundle install
    
    # Precompile assets and database setup
    if [ -f "bin/rails" ]; then
        echo "Running rails database setup and asset compilation..."
        RAILS_ENV=production bundle exec rails db:prepare
        RAILS_ENV=production bundle exec rails assets:precompile
    fi
else
    echo "ERROR: Gemfile not found. Cloned workspace is not a Rails application."
    exit 1
fi

# 3. Create Systemd Puma Service daemon
cat <<EOF > /etc/systemd/system/puma.service
[Unit]
Description=Puma HTTP Server
After=network.target

[Service]
WorkingDirectory=/var/www/app
Environment=RAILS_ENV=production
ExecStart=/usr/local/bin/bundle exec puma -C config/puma.rb
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl start puma
systemctl enable puma

# 4. Proxy to Nginx (default Rails Puma port 3000)
cat <<EOF > /etc/nginx/sites-available/default
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

systemctl restart nginx || service nginx restart
echo "--> Ruby on Rails application Puma server successfully deployed!"
