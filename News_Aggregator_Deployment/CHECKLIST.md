# News Aggregator — Deployment Checklist

## Pre-flight Checks (Do locally before anything)

### Backend Flow Verification
Run these commands locally and confirm each passes:

```powershell
# 1. All containers healthy?
docker compose ps

# 2. Node API responding?
Invoke-WebRequest http://localhost/api/news/ -UseBasicParsing | Select StatusCode
# Expected: 200

# 3. Django admin accessible?
Invoke-WebRequest http://localhost/admin/ -UseBasicParsing | Select StatusCode
# Expected: 200 or 302

# 4. Database has articles?
docker compose exec django-admin python manage.py shell -c "from news.models import Article; print(Article.objects.count(), 'articles in DB')"

# 5. Redis cache working?
docker compose exec redis redis-cli PING
# Expected: PONG

# 6. RabbitMQ connected?
docker compose logs celery-worker --tail=5
# Expected: [celery@xxx ready]

# 7. Celery Beat scheduled?
docker compose logs celery-beat --tail=5
# Expected: beat: Starting...

# 8. Test article publish (ArticleComposer flow)
# Go to http://localhost/compose, publish a test article, verify it appears in feed
```

### Frontend Flow Verification
```powershell
# 1. Can you load the homepage?
# Open http://localhost — articles should show

# 2. Can you log in?
# Go to http://localhost/login — use admin/admin

# 3. Can you compose and publish?
# Go to http://localhost/compose — fill form, click Publish

# 4. Does the article appear in feed?
# Go back to http://localhost — new article should be at top

# 5. Does AI summary work?
# Click any article → should show AI Executive Summary
```

---

## Deployment Folder Structure

```
News_Aggregator_Deployment/
├── docker-compose.prod.yml    ← Backend-only compose
├── .env.prod.example          ← Copy → .env.prod (fill real values)
├── .env.prod                  ← NEVER commit this
├── deploy.sh                  ← Run on VPS after git pull
├── nginx/
│   └── nginx.prod.conf        ← Backend reverse proxy config
└── CHECKLIST.md               ← This file
```

---

## VPS Setup (First time only)

```bash
# On your Hetzner/DigitalOcean server:
apt update && apt install -y docker.io docker-compose-v2 git

# Clone repo
git clone https://github.com/SandipAcharya/News_Aggregator.git
cd News_Aggregator

# Copy and fill env vars
cp News_Aggregator_Deployment/.env.prod.example News_Aggregator_Deployment/.env.prod
nano News_Aggregator_Deployment/.env.prod

# First deploy
bash News_Aggregator_Deployment/deploy.sh

# Seed news sources
docker compose -f News_Aggregator_Deployment/docker-compose.prod.yml exec django-admin python manage.py seed_sources

# First scrape
docker compose -f News_Aggregator_Deployment/docker-compose.prod.yml exec django-admin python manage.py shell -c "from news.tasks import scrape_rss_feeds; scrape_rss_feeds()"
```

---

## What Nginx Does (Simple Explanation)

```
Internet
    │
    ▼
 Nginx (port 80/443)  ← The "receptionist"
    │
    ├── /api/*  ──────► Node.js (port 3000)   ← Public API
    └── /admin/* ─────► Django  (port 8000)   ← Staff panel
```

Every major news portal uses Nginx or similar:
- BBC → Nginx
- Reuters → Nginx  
- The Guardian → Nginx + Varnish cache
- CNN → Nginx + AWS CloudFront

In our case Nginx also handles:
- SSL/HTTPS termination
- CORS headers for Vercel frontend
- Gzip compression
- Request size limits (for image uploads)
