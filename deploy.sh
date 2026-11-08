#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

REMOTE="ssod@beholder"
DEST="/var/www/vhosts/play.ssod.org"

echo "Updating Seven Spells source..."
git pull --ff-only

echo "Installing dependencies..."
npm ci

echo "Building Seven Spells web application..."
VITE_GAME_WS_URL=wss://ws.ssod.org/api/game npm run build

echo "Deploying to ${REMOTE}:${DEST}..."
rsync -avz --delete \
    --exclude='.well-known/' --exclude='deploy.sh' \
    dist/ "${REMOTE}:${DEST}/"

echo "Deployment complete."
