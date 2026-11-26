#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu 24.04 Lightsail instance. Run as the ubuntu user:
#   bash deploy/server-setup.sh
set -euo pipefail

sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y git nginx certbot python3-certbot-nginx ca-certificates curl

# Docker
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
fi

# Node 24 + pnpm, used to build the frontend
if ! command -v node >/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
sudo npm install -g pnpm@9.15.9

# 2 GB swap so builds don't run out of memory
if [ ! -f /swapfile ]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Nginx site (skipped if already installed, so certbot changes survive a re-run)
sudo mkdir -p /var/www/factorygrid
[ -f /etc/nginx/sites-available/factorygrid ] || sudo cp "$(dirname "$0")/nginx-factorygrid.conf" /etc/nginx/sites-available/factorygrid
sudo ln -sf /etc/nginx/sites-available/factorygrid /etc/nginx/sites-enabled/factorygrid
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

mkdir -p "$HOME/backups"
echo
echo "Setup done. Log out and back in (for docker group), then:"
echo "  cp deploy/env.prod.example deploy/.env.prod && nano deploy/.env.prod"
echo "  sudo certbot --nginx -d factorygrid.dualapptech.com --redirect --agree-tos -m <your-email>"
echo "  bash deploy/deploy.sh"
