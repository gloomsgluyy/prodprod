#!/bin/bash
# CoalTrade OS — Health Check Script
# Crontab: */5 * * * * /opt/coaltrade/deploy/healthcheck.sh >> /var/log/coaltrade/healthcheck.log 2>&1
set -uo pipefail

APP_URL="http://127.0.0.1:3000"
MAX_RESTARTS=3
RESTART_LOG="/var/log/coaltrade/healthcheck.log"

# Check app health
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$APP_URL/api/production-readiness" 2>/dev/null || echo "000")

if [ "$STATUS" = "200" ]; then
  # App is healthy — no action needed
  exit 0
fi

echo "$(date): ⚠️ Health check failed! Status: $STATUS"

# Check how many restarts in the last hour
RECENT=$(grep -c "Restarting PM2" "$RESTART_LOG" 2>/dev/null | tail -1 || echo "0")

if [ "$RECENT" -ge "$MAX_RESTARTS" ]; then
  echo "$(date): ❌ Too many restarts ($RECENT) in recent history. Manual intervention required."
  exit 1
fi

echo "$(date): 🔄 Restarting PM2..."
pm2 reload coaltrade-os
echo "$(date): Restarting PM2 — restart #$((RECENT + 1))"

# Wait and re-check
sleep 10
STATUS2=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$APP_URL/api/production-readiness" 2>/dev/null || echo "000")

if [ "$STATUS2" = "200" ]; then
  echo "$(date): ✅ App recovered after restart"
else
  echo "$(date): ❌ App still unhealthy after restart. Status: $STATUS2"
fi
