#!/bin/bash
# ============================================================
# deploy.sh — Run this on your VPS after git pull
# Usage: bash deploy.sh
# ============================================================

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  News Aggregator — Production Deploy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Pull latest code
echo "[1/5] Pulling latest code..."
git pull origin main

# 2. Rebuild & restart containers
echo "[2/5] Rebuilding Docker containers..."
docker compose -f News_Aggregator_Deployment/docker-compose.prod.yml up -d --build

# 3. Run Django migrations
echo "[3/5] Applying database migrations..."
docker compose -f News_Aggregator_Deployment/docker-compose.prod.yml exec django-admin python manage.py migrate --noinput

# 4. Collect Django static files
echo "[4/5] Collecting static files..."
docker compose -f News_Aggregator_Deployment/docker-compose.prod.yml exec django-admin python manage.py collectstatic --noinput

# 5. Flush Redis cache (so stale data doesn't show)
echo "[5/5] Flushing Redis cache..."
docker compose -f News_Aggregator_Deployment/docker-compose.prod.yml exec redis redis-cli FLUSHALL 2>/dev/null || echo "   (Using external Redis — skip)"

echo ""
echo "✅ Deployment complete!"
echo "   API:   https://api.yourdomain.com"
echo "   Admin: https://api.yourdomain.com/admin"
