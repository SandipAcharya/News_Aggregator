# News Aggregator — System Architecture & Data Flow

> **Verified on:** 2026-06-22  
> **Stack:** Django · Celery · RabbitMQ · PostgreSQL · Redis · Node.js · React  
> **Status:** ✅ All systems operational

---

## Architecture Overview

```
[RSS Feeds] → [Celery Scraper] → [PostgreSQL] → [Node.js API] → [Redis Cache] → [React UI]
                   ↑                                                  ↑
              [Celery Beat]                                    [Nginx Gateway]
              (every 30min)                                    (port 80)
```

---

## 1. Ingestion Layer — Celery + RabbitMQ + Django

The platform uses an asynchronous background worker system. No manual intervention is needed.

- **Automated Scheduling**: **Celery Beat** dispatches the `scrape_rss_feeds` task to **RabbitMQ** (`amqp://rabbitmq:5672`) every 30 minutes, where a **Celery Worker** executes it.
- **Data Fetching**: Iterates over all active `NewsSource` records, fetching RSS XML feeds using `feedparser`. Duplicate URLs are ignored.
- **Data Cleaning**: The scraper completely strips HTML tags and decodes HTML entities from raw descriptions using strict Regex before storing them in PostgreSQL.
- **Image Extraction Engine**:
  1. Checks `media:content` and `media:thumbnail` RSS tags.
  2. Checks for enclosure attachments (e.g., podcasts/images).
  3. Parses the raw HTML description for embedded `<img>` tags.
  4. **Ultimate Fallback**: If the publisher strips images from RSS (e.g., The Kathmandu Post), it opens an invisible HTTP connection to the actual article webpage and scrapes the `<meta property="og:image">` Open Graph tag.
- **Machine Learning**: Passes the clean text to the FastAPI service to classify `category` and `political_leaning`.

### ✅ Verified Celery Execution Log
```
[2026-06-22 06:26:59] celery@5e012c34fff8 ready.
[2026-06-22 06:30:00] Task news.tasks.scrape_rss_feeds[67f689cb] received
[2026-06-22 06:30:22] Task succeeded in 22.8s: 'Scraped 10 new articles.'
```

---

## 2. Storage Layer — PostgreSQL

Articles are persisted into a relational schema with full ML-enriched metadata.

### Key Tables
| Table | Purpose |
|-------|---------|
| `news_newssource` | 16 seeded RSS feed sources with country & type metadata |
| `news_article` | All scraped articles with category, political leaning, language |

### ✅ Verified Article Distribution (526 total articles, 16 active sources)
```
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

### ✅ Sample Article Records
```
 title                                                          | category   | political_leaning | language
----------------------------------------------------------------+------------+-------------------+----------
 AMMA crisis: Let people with conviction and empathy lead...    | Technology | Center            | en
 Pound Falls on Growing Political Upheaval                      | General    | Center            | en
 The 'academy effect' on Bengaluru's football culture           | General    | Center            | en
```

---

## 3. Caching Layer — Redis

The Node.js API uses Redis to cache repeated queries and reduce database load.

- Cache keys are generated from the user's full filter state: `v5_{category}_{leaning}_{language}_{country}_{sourceType}_{search}_{startDate}_{endDate}`
- Cache TTL is **2 minutes** for active searches, **5 minutes** for unfiltered feeds.

### ✅ Verified Redis Cache Keys
```
docker-compose exec redis redis-cli KEYS "*"
1) "v5_all_all_all_all_all_none_none_none"
```

---

## 4. API Gateway — Node.js Express

The Node.js server handles all client-facing requests. It performs dynamic SQL `JOIN` queries against PostgreSQL, supporting 8 simultaneous filter dimensions.

### Endpoint: `GET /api/news`
| Query Parameter | Type | Description |
|----------------|------|-------------|
| `category` | string | Filter by topic (e.g., Technology, Sports) |
| `leaning` | string | Filter by political leaning (Left, Center, Right) |
| `language` | string | Filter by language (en, hi, ne) |
| `country` | string | Filter by source country (US, IN, NP) |
| `sourceType` | string | Filter by source type (newspaper, digital) |
| `search` | string | Full-text ILIKE search on title + content |
| `startDate` | string | Date range start (ISO format) |
| `endDate` | string | Date range end (ISO format) |

### Sample API Response
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Pound Falls on Growing Political Upheaval",
      "category": "General",
      "political_leaning": "Center",
      "language": "en",
      "published_at": "2026-06-22T05:45:55Z",
      "source_name": "BBC News",
      "country": "GB",
      "source_type": "broadcast",
      "summary": []
    }
  ],
  "source": "database"
}
```

---

## 5. User Interface — React + Zustand + React Query

The frontend is served by the **Nginx reverse proxy** on port 80, which routes:
- `/` → React frontend (port 80 internal)
- `/api/` → Node.js API Gateway (port 3000 internal)
- `/admin/` → Django Admin Panel (port 8000 internal)

**State Management:**
- **Zustand** manages all filter state (category, leaning, country, etc.)
- **React Query** manages server-state caching and re-fetching. When "Apply Filters" is clicked, the cache is invalidated and a fresh parameterized request is sent to the Node API.

---

## 6. Starting the System

```powershell
# 1. Build and start all containers
docker-compose up -d --build

# 2. Apply database migrations
docker-compose exec django-admin python manage.py migrate

# 3. Seed the 16 RSS sources
docker-compose exec django-admin python manage.py seed_sources

# 4. Run the first manual scrape
docker-compose exec django-admin python manage.py shell -c "from news.tasks import scrape_rss_feeds; print(scrape_rss_feeds())"

# 5. Open the UI
start http://localhost
```

After step 4, **Celery Beat automatically takes over**, scraping new articles every 30 minutes without any further manual action.

---

## 7. Health Verification Commands

```powershell
# Check total articles in the database
docker-compose exec db psql -U news_user -d news_db -c "SELECT COUNT(*) FROM news_article;"

# Check article breakdown by source
docker-compose exec db psql -U news_user -d news_db -c "SELECT s.name, COUNT(a.id) FROM news_article a JOIN news_newssource s ON a.source_id=s.id GROUP BY s.name ORDER BY 2 DESC;"

# Check Celery worker is alive and scraping
docker-compose logs --tail=20 celery-worker

# Check Redis cache keys
docker-compose exec redis redis-cli KEYS "*"

# Check all containers are healthy
docker-compose ps
```
