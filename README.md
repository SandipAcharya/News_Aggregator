# 📰 InPanda News Aggregator

> **An enterprise-grade, real-time news aggregation platform** powered by a multi-service microarchitecture. Automatically scrapes 16+ global RSS feeds, enriches articles with ML-based categorization, and serves them through a high-performance caching API to a modern React interface.

![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![Docker](https://img.shields.io/badge/docker-compose-blue)
![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL%2015-336791)
![Node.js](https://img.shields.io/badge/api-Node.js%20Express-339933)
![React](https://img.shields.io/badge/frontend-React%2018-61DAFB)

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Quick Start (Docker)](#quick-start-docker)
- [Manual Development Setup](#manual-development-setup)
- [Data Pipeline Flow](#data-pipeline-flow)
- [Live System Verification](#live-system-verification)
- [API Reference](#api-reference)
- [Health Check Commands](#health-check-commands)
- [Environment Variables](#environment-variables)

---

## Architecture Overview

The system is composed of **9 Docker services** communicating over an internal network, fronted by an Nginx reverse proxy.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
│                    http://localhost (port 80)                        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   NGINX GATEWAY     │  ← Reverse proxy & load balancer
                    │   (nginx:alpine)    │
                    └──┬──────────────┬───┘
                       │              │
          ┌────────────▼───┐   ┌──────▼────────────┐
          │  REACT FRONTEND │   │   NODE.JS API     │  ← /api/* routes
          │  (Vite + React) │   │   Express :3000   │
          │  Zustand + RQ   │   │   JWT Auth        │
          └────────────────┘   └──────┬────────────┘
                                      │
                    ┌─────────────────┼──────────────────┐
                    │                 │                   │
          ┌─────────▼──────┐ ┌───────▼──────┐           │
          │  REDIS CACHE   │ │  POSTGRESQL  │           │
          │  (redis:7)     │ │  (postgres15)│           │
          │  Smart TTL     │ │  news_db     │           │
          └────────────────┘ └───────▲──────┘           │
                                      │                   │
                          ┌───────────┴──────────┐        │
                          │   DJANGO BACKEND     │        │
                          │   (python:3.11-slim) │        │
                          │   ORM + Migrations   │        │
                          └───────────▲──────────┘        │
                                      │                   │
                    ┌─────────────────┼────────────────┐  │
                    │                 │                  │  │
          ┌─────────▼──────┐ ┌────────▼──────┐         │  │
          │ CELERY WORKER  │ │  CELERY BEAT  │         │  │
          │ (ForkPool x12) │ │  Scheduler    │         │  │
          │ Executes tasks │ │  Every 30 min │         │  │
          └─────────▲──────┘ └────────▲──────┘         │  │
                    │                 │                  │  │
                    └────────┬────────┘                  │  │
                             │                           │  │
                    ┌────────▼────────┐        ┌─────────▼──▼──────┐
                    │   RABBITMQ      │        │   ML FASTAPI      │
                    │ (amqp :5672)    │        │  Enrichment API   │
                    │ Message Broker  │        │  Category/Leaning │
                    └─────────────────┘        └───────────────────┘
                             │
                    ┌────────▼────────┐
                    │   RSS FEEDS     │
                    │ 16 Global Feeds │
                    │ BBC · Guardian  │
                    │ CNN · Hindu...  │
                    └─────────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite + TypeScript | User Interface |
| **State** | Zustand + React Query | Client & server state management |
| **Styling** | Tailwind CSS | Utility-first dark theme |
| **API Gateway** | Node.js + Express | JWT auth, routing, caching |
| **Database** | PostgreSQL 15 | Primary article storage |
| **Cache** | Redis 7 | Smart query result caching |
| **Scraping** | Django + feedparser | RSS ingestion engine |
| **Task Queue** | Celery + RabbitMQ | Async background processing |
| **ML Enrichment** | FastAPI + Python | Category & bias classification |
| **Reverse Proxy** | Nginx Alpine | Gateway, SSL termination |
| **Containerization** | Docker Compose | Full local orchestration |

---

## Project Structure

```
News_Aggregator/
├── docker-compose.yml          # Orchestrates all 9 services
├── nginx/
│   └── nginx.conf              # Reverse proxy routing rules
│
├── frontend/                   # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── ArticleFeed.tsx # Main feed with React Query
│   │   │   └── Filters.tsx     # Sidebar filter UI
│   │   ├── services/
│   │   │   └── api.ts          # Axios client + Article types
│   │   └── store/
│   │       └── useStore.ts     # Zustand global state
│   └── Dockerfile
│
├── backend-node/               # Node.js Express API Gateway
│   ├── src/
│   │   ├── routes/
│   │   │   ├── newsRoutes.ts   # GET /api/news with all filters
│   │   │   └── authRoutes.ts   # POST /api/auth/login|register
│   │   ├── services/
│   │   │   ├── newsService.ts  # PostgreSQL query builder
│   │   │   └── cacheService.ts # Redis smart caching
│   │   └── middleware/
│   │       └── authMiddleware.ts # JWT verification
│   ├── .env                    # PORT, DATABASE_URL, JWT_SECRET
│   └── Dockerfile
│
├── backend-django/             # Django scraping engine
│   ├── news/
│   │   ├── models.py           # NewsSource, Article models
│   │   ├── tasks.py            # scrape_rss_feeds Celery task
│   │   └── management/commands/
│   │       └── seed_sources.py # Seed 16 RSS feed sources
│   ├── core/
│   │   └── settings.py         # Celery Beat schedule (30 min)
│   └── Dockerfile
│
├── ml-fastapi/                 # ML enrichment microservice
│   └── ...                     # Category & leaning classifier
│
└── ARCHITECTURE.md             # Detailed technical documentation
```

---

## Quick Start (Docker)

> **Prerequisites:** Docker Desktop running on your machine.

### Step 1 — Build and Start All Services
```powershell
docker-compose up -d --build
```

**Expected Output:**
```
✔ Container news_aggregator-db-1             Started
✔ Container news_aggregator-redis-1          Started
✔ Container news_aggregator-rabbitmq-1       Started
✔ Container news_aggregator-django-admin-1   Started
✔ Container news_aggregator-node-api-1       Started
✔ Container news_aggregator-celery-worker-1  Started
✔ Container news_aggregator-celery-beat-1    Started
✔ Container news_aggregator-ml-fastapi-1     Started
✔ Container news_aggregator-frontend-1       Started
✔ Container news_aggregator-nginx-gateway-1  Started
```

### Step 2 — Initialize the Database
```powershell
docker-compose exec django-admin python manage.py migrate
```

**Expected Output:**
```
Applying news.0001_initial... OK
Applying news.0002_newssource_country_source_type... OK
Applying news.0003_alter_article_url... OK
Applying users.0001_initial... OK
```

### Step 3 — Seed RSS Feed Sources
```powershell
docker-compose exec django-admin python manage.py seed_sources
```

**Expected Output:**
```
✅ Created: BBC News (GB)
✅ Created: The Guardian (GB)
✅ Created: Al Jazeera English (QA)
✅ Created: CNN (US)
✅ Created: The New York Times (US)
✅ Created: The Washington Post (US)
✅ Created: TechCrunch (US)
✅ Created: The Verge (US)
✅ Created: Wired (US)
✅ Created: Bloomberg (US)
✅ Created: Financial Times (GB)
✅ Created: The Kathmandu Post (NP)
✅ Created: The Hindu (IN)
✅ Created: NDTV (IN)
✅ Created: Science Daily (US)
✅ Created: NASA Breaking News (US)

🌐 Seeding complete — 16 created, 0 updated.
```

### Step 4 — Run the First Scrape
```powershell
docker-compose exec django-admin python manage.py shell -c "from news.tasks import scrape_rss_feeds; print(scrape_rss_feeds())"
```

**Expected Output:**
```
Scraped 441 new articles.
```

### Step 5 — Open the App
```
http://localhost
```

> **After Step 4, you're done!** Celery Beat will automatically scrape new articles every 30 minutes in the background without any further action.

---

## Manual Development Setup

For local development without Docker (requires a running PostgreSQL instance):

### Backend Node.js API
```powershell
cd backend-node
npm install
# Edit .env → set ENABLE_DEMO_MODE=true for offline mode
npm run dev
```

### Frontend React App
```powershell
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

> Set `ENABLE_DEMO_MODE=true` in `backend-node/.env` if you don't have a local PostgreSQL instance running. The API will serve offline mock data instead.

---

## Data Pipeline Flow

```
Every 30 minutes:
═══════════════════════════════════════════════════════════════

1. [Celery Beat] ──fires──► scrape_rss_feeds task
                                    │
2.                         [RabbitMQ Queue]
                                    │
3.                         [Celery Worker]
                                    │
                    loops over 16 NewsSource records
                                    │
                    fetches each RSS XML feed (feedparser)
                                    │
                    saves new articles → [PostgreSQL]
                    (duplicate URLs are auto-skipped)
                                    │
4.                         [ML FastAPI]  (optional enrichment)
                            assigns category + political leaning
                                    │
5. [User opens browser] ──GET /api/news──► [Nginx] ──► [Node.js]
                                                            │
                                                    Check [Redis]
                                                    Cache Hit? ──Yes──► return cached JSON
                                                         │
                                                        No
                                                         │
                                                    SQL JOIN query
                                                    [PostgreSQL]
                                                         │
                                                    Cache result in Redis (TTL: 5min)
                                                         │
6.                         [React] renders article cards from JSON response
```

---

## Live System Verification

These outputs were captured from a live running instance:

### Database Article Count
```
docker-compose exec db psql -U news_user -d news_db -c "SELECT COUNT(*) FROM news_article;"

 count
-------
   526
(1 row)
```

### Article Distribution by Source
```
docker-compose exec db psql -U news_user -d news_db -c \
  "SELECT s.name, COUNT(a.id) as articles FROM news_article a \
   JOIN news_newssource s ON a.source_id = s.id \
   GROUP BY s.name ORDER BY articles DESC;"

 name                | articles
---------------------+----------
 The Hindu           |       74
 Science Daily       |       60
 Wired               |       50
 CNN                 |       50
 The Guardian        |       45
 The Kathmandu Post  |       41
 Bloomberg           |       39
 BBC News            |       38
 NDTV                |       29
 Al Jazeera English  |       25
 TechCrunch          |       20
 The New York Times  |       17
 Financial Times     |       12
 NASA Breaking News  |       10
 The Verge           |       10
 The Washington Post |        6
(16 rows)
```

### Celery Worker Health
```
docker-compose logs --tail=5 celery-worker

celery-worker-1  | [2026-06-22 06:26:59] Connected to amqp://guest:**@rabbitmq:5672//
celery-worker-1  | [2026-06-22 06:27:00] celery@5e012c34fff8 ready.
celery-worker-1  | [2026-06-22 06:30:00] Task news.tasks.scrape_rss_feeds received
celery-worker-1  | [2026-06-22 06:30:22] Task succeeded in 22.8s: 'Scraped 10 new articles.'
```

### Redis Cache
```
docker-compose exec redis redis-cli KEYS "*"

1) "v5_all_all_all_all_all_none_none_none"
```

---

## API Reference

### `GET /api/news`

Returns a paginated list of articles with optional filtering.

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `category` | string | `Technology` | Filter by ML-assigned category |
| `leaning` | string | `Center` | Political leaning (Left/Center/Right) |
| `language` | string | `en` | ISO language code |
| `country` | string | `US` | ISO 3166-1 country code of the source |
| `sourceType` | string | `newspaper` | Source type (newspaper/digital/broadcast) |
| `search` | string | `climate change` | Full-text search on title + content |
| `startDate` | string | `2026-06-01` | Date range filter (ISO format) |
| `endDate` | string | `2026-06-22` | Date range filter (ISO format) |

**Sample Response:**
```json
{
  "data": [
    {
      "id": "uuid-here",
      "title": "Pound Falls on Growing Political Upheaval",
      "url": "https://www.theguardian.com/...",
      "category": "General",
      "political_leaning": "Center",
      "language": "en",
      "published_at": "2026-06-22T05:45:55Z",
      "summary": [],
      "source_name": "The Guardian",
      "country": "GB",
      "source_type": "newspaper"
    }
  ],
  "source": "database"
}
```

### `POST /api/auth/login`
```json
{ "username": "user@example.com", "password": "yourpassword" }
```

### `POST /api/auth/register`
```json
{ "username": "newuser", "email": "user@example.com", "password": "yourpassword" }
```

### `GET /health`
Returns the server mode and status.
```json
{ "status": "OK", "mode": "PRODUCTION" }
```

---

## Health Check Commands

```powershell
# Are all containers running?
docker-compose ps

# Total articles in the database
docker-compose exec db psql -U news_user -d news_db -c "SELECT COUNT(*) FROM news_article;"

# Articles per source
docker-compose exec db psql -U news_user -d news_db -c \
  "SELECT s.name, COUNT(a.id) FROM news_article a \
   JOIN news_newssource s ON a.source_id=s.id \
   GROUP BY s.name ORDER BY 2 DESC;"

# Is Celery scraping successfully?
docker-compose logs --tail=20 celery-worker

# What queries are cached in Redis?
docker-compose exec redis redis-cli KEYS "*"

# Check Node.js API is live
curl http://localhost/health

# View Django Admin Panel
start http://localhost/admin
```

---

## Environment Variables

### `backend-node/.env`
```env
PORT=3000
ENABLE_DEMO_MODE=false        # Set to true for offline dev (no DB needed)
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://news_user:news_password@localhost:5432/news_db
JWT_SECRET=change-this-to-a-long-random-secret-in-production
FRONTEND_URL=http://localhost:5173
```

### `backend-django/.env` (or environment block in docker-compose.yml)
```env
DATABASE_URL=postgresql://news_user:news_password@db:5432/news_db
CELERY_BROKER_URL=amqp://guest:guest@rabbitmq:5672//
DJANGO_SECRET_KEY=your-secret-key-here
```

---

## Adding Custom RSS Feeds

### Option A — Via Django Admin UI
1. Create a superuser: `docker-compose exec django-admin python manage.py createsuperuser`
2. Open `http://localhost/admin`
3. Navigate to **News → News Sources** and click **Add**
4. Enter the RSS feed URL, country, and source type
5. Celery Beat will automatically pick it up on the next 30-minute cycle

### Option B — Via `seed_sources.py`
Add an entry to the `SOURCES` list in `backend-django/news/management/commands/seed_sources.py`:
```python
{
    "name": "Your Source Name",
    "url": "https://www.yoursource.com",
    "rss_feed_url": "https://www.yoursource.com/rss",
    "country": "US",          # ISO 3166-1 alpha-2
    "source_type": "digital", # newspaper | magazine | digital | broadcast | wire | blog
},
```
Then run: `docker-compose exec django-admin python manage.py seed_sources`

---

*Built with ❤️ by the InPanda Team*
