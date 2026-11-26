#!/usr/bin/env bash
# Build and (re)start FactoryGrid. Run from anywhere inside the repo:
#   bash deploy/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f deploy/.env.prod ]; then
  echo "deploy/.env.prod is missing. Copy deploy/env.prod.example and fill it in." >&2
  exit 1
fi

git pull --ff-only

echo "== Backend"
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d --build

echo "== Frontend"
pnpm install --frozen-lockfile --filter "frontend..."
PUBLIC_URL=$(grep -E "^PUBLIC_URL=" deploy/.env.prod | cut -d= -f2-)
if [ -z "$PUBLIC_URL" ]; then echo "PUBLIC_URL is not set in deploy/.env.prod" >&2; exit 1; fi
# The frontend appends /api/v1 itself.
VITE_API_BASE_URL="$PUBLIC_URL" pnpm --filter frontend build
sudo rsync -a --delete frontend/dist/ /var/www/factorygrid/

echo "== Waiting for API health"
for _ in $(seq 1 60); do
  if curl -sf http://127.0.0.1:8081/actuator/health; then
    echo
    echo "Deployed."
    exit 0
  fi
  sleep 2
done
echo "API did not become healthy. Check: docker compose -f deploy/docker-compose.prod.yml logs api" >&2
exit 1
