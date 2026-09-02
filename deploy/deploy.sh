#!/bin/bash
# CoalTrade OS — Zero-Downtime Deploy Script
# Usage: ./deploy/deploy.sh
set -euo pipefail

APP_DIR="/opt/coaltrade/app/prodprod"
LOG_FILE="/var/log/coaltrade/deploy.log"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG_FILE"; }

log "🚀 Starting deployment..."

cd "$APP_DIR"

# Refuse to deploy over uncommitted tracked server changes.
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  log "❌ Deployment stopped: tracked local changes exist. Preserve/review them first."
  git status --short | tee -a "$LOG_FILE"
  exit 1
fi

# 1. Pull latest code
log "📥 Pulling latest code..."
git pull origin main

# 2. Install dependencies (termasuk devDeps untuk Next.js build)
log "📦 Installing dependencies..."
npm install

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
