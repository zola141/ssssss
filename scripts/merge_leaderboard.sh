#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/home/szine-/Desktop/final_project (copy)"
HAMZA_FE="$ROOT_DIR/hamza_part/frontend"

mkdir -p /goinfre/$USER/.npm-cache /goinfre/$USER/.npm-tmp

npm config set cache /goinfre/$USER/.npm-cache --location=user
npm config set fund false --location=user
npm config set audit false --location=user
npm config set progress false --location=user
npm config set fetch-retries 5 --location=user
npm config set fetch-retry-mintimeout 20000 --location=user
npm config set fetch-retry-maxtimeout 120000 --location=user
npm config set fetch-timeout 300000 --location=user
npm cache clean --force || true

cd "$HAMZA_FE"
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps --no-audit --no-fund --no-progress --verbose
npm run build

echo "✅ Hamza frontend build complete"
echo "Now restart main backend:"
echo "  cd '$ROOT_DIR' && node app.js"
echo "Then test:"
echo "  http://localhost:3000/__leaderboard-debug"
echo "  http://localhost:3000/leaderboard"
