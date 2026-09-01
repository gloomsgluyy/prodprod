#!/bin/bash
# CoalTrade OS — Automated Database Backup
# Crontab: 0 2 * * * /opt/coaltrade/deploy/backup.sh >> /var/log/coaltrade-backup.log 2>&1
set -euo pipefail

BACKUP_DIR="/opt/coaltrade/backups"
DB_NAME="coaltrade_production"
DB_USER="coaltrade_app"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
KEEP_DAYS=30

mkdir -p "$BACKUP_DIR"

echo "$(date): Starting backup..."

# Create compressed backup
pg_dump -h 127.0.0.1 -p 5432 -U "$DB_USER" -Fc "$DB_NAME" > "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"

# Get file size
SIZE=$(du -h "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump" | cut -f1)
echo "$(date): Backup created: ${DB_NAME}_${TIMESTAMP}.dump ($SIZE)"

# Remove old backups
DELETED=$(find "$BACKUP_DIR" -name "*.dump" -mtime +$KEEP_DAYS -delete -print | wc -l)
echo "$(date): Cleaned up $DELETED old backup(s) (older than $KEEP_DAYS days)"

echo "$(date): ✅ Backup complete"
