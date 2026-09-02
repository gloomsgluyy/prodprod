#!/bin/bash
# CoalTrade OS — Zero-Downtime Deploy Script
# Usage: ./deploy/deploy.sh
set -euo pipefail

APP_DIR="/opt/coaltrade/app/prodprod"
LOG_FILE="/var/log/coaltrade/deploy.log"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG_FILE"; }

log "🚀 Starting deployment..."

cd "$APP_DIR"

# Preserve tracked server-local edits automatically before pulling.
# Never discard or re-apply them over the deployed release.
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  STASH_NAME="server-local-before-deploy-$(date +%Y%m%d-%H%M%S)"
  log "⚠️ Tracked local changes found; stashing safely as: $STASH_NAME"
  git diff > "/root/${STASH_NAME}.patch"
  git stash push -m "$STASH_NAME"
  log "✅ Local tracked changes preserved in git stash and /root/${STASH_NAME}.patch"
fi

# 1. Pull latest code
log "📥 Pulling latest code..."
git pull origin main

# 2. Install dependencies (termasuk devDeps untuk Next.js build)
log "📦 Installing dependencies..."
npm install --include=dev --production=false

if [ ! -x "node_modules/.bin/tsc" ]; then
  log "❌ Deployment stopped: TypeScript compiler is missing after dependency install."
  exit 1
fi

# 3. Generate Prisma client
log "🔧 Generating Prisma client..."
npx prisma generate

# 4. Run migrations (if any)
log "🗄️ Running database migrations..."
npx prisma migrate deploy

# Migration must be fully applied before the app is rebuilt/reloaded.
if ! npx prisma migrate status | grep -q "Database schema is up to date"; then
  log "❌ Deployment stopped: migration status is not up to date."
  exit 1
fi

# 5. Build Next.js
log "🏗️ Building application..."
npm run build

# Next standalone does not copy these runtime assets automatically.
log "📁 Syncing standalone runtime assets..."
mkdir -p .next/standalone/.next/static
cp -a .next/static/. .next/standalone/.next/static/
if [ -d public ]; then
  mkdir -p .next/standalone/public
  cp -a public/. .next/standalone/public/
fi

# 6. Reload PM2 (zero-downtime)
log "♻️ Reloading application (zero-downtime)..."
pm2 reload coaltrade-os

# 7. Flush Redis cache (optional — uncomment if needed)
# log "🧹 Flushing Redis cache..."
# redis-cli -a "$REDIS_PASSWORD" FLUSHDB

# 8. Wait and verify health
log "🏥 Verifying health..."
sleep 5
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/production-readiness || echo "000")

if [ "$STATUS" = "200" ]; then
  log "✅ Deployment complete! Health check: OK"
else
  log "⚠️ Deployment complete but health check returned: $STATUS"
  log "   Check logs: pm2 logs coaltrade-os --lines 50"
fi

pm2 status | tee -a "$LOG_FILE"
