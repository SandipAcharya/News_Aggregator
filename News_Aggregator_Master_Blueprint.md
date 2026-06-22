# News Aggregator: Enterprise Master Blueprint & Architecture Guide

This document is the complete 21-day enterprise master plan. It combines **System Architecture Diagrams** (showing how the system evolves) with **Concrete Code Examples** (showing exactly what each team member needs to write). We have incorporated enterprise-level standards including **State Management**, **Authentication/Authorization**, **Message Queues**, **Demo Mode Development**, and **Smart TTL Caching**.

This is designed to be read top-to-bottom. *(Note: If your Markdown viewer supports Mermaid, the architecture blocks will render as diagrams).*

---

## Phase 1: Foundation, Identity & Demo Mode (Days 1-3)
**Objective:** Define the core database schema, set up IAM (JWT, OAuth 2.0), and implement the **Demo Mode Pattern** so interns can work offline with pre-cached JSON files immediately.

### Evolving Architecture (Phase 1)
```mermaid
graph TD
    subgraph "Phase 1: Enterprise Foundation & Demo Mode"
        DB[(PostgreSQL - Core & Users)]
        Django[Django Admin/Models] -->|Defines Schema| DB
        Node[Node.js Express API] -->|Reads/Writes Auth| DB
        React[React UI] -->|JWT Auth Requests| Node
        
        DemoData[(Local JSON Files)] -.->|ENABLE_DEMO_MODE=true| Node
    end
```

### Team Tasks & Examples
*   **Django (Intern 1):** Define Postgres Tables including extended metadata (Language, Political Leaning).
*   **Node.js (Intern 2):** Create Auth workflows and implement Demo Mode toggle.
    ```javascript
    // services/news.service.js
    const getArticles = async () => {
        if (process.env.ENABLE_DEMO_MODE === 'true') {
            return require('../demo-data/articles.json'); // Instant offline dev
        }
        return await prisma.article.findMany();
    };
    ```
*   **React (Intern 3):** Setup UI with **Dark Mode** support and CSS variables. Implement State Management (Zustand).

---

## Phase 2: Ingestion Engine & UI Polish (Days 4-6)
**Objective:** Background web scraping via RabbitMQ/Celery. Frontend implements polished UX with Skeleton Loaders and Grid/List views.

### Evolving Architecture (Phase 2)
```mermaid
graph TD
    subgraph "Phase 2: Ingestion & Polished UI"
        Web((The Internet: RSS Feeds))
        MQ[[RabbitMQ]]
        Worker[Celery Background Worker]
        DB[(PostgreSQL)]
        Node[Node.js Express API]
        React[React Client with Skeletons]

        Web -->|Scraped by| Worker
        Worker -->|Queued via| MQ
        MQ -->|Writes Raw Data| DB
        DB -->|Queried by| Node
        Node -->|Serves JSON| React
    end
```

### Team Tasks & Examples
*   **React (Intern 3):** Implement Skeleton Loaders and Grid/List toggle in the UI. Use React Query for fetching.
*   **Django (Intern 1):** Write RSS scraper utilizing RabbitMQ for durable task queueing.

---

## Phase 3: Advanced ML Scaffolding (Days 7-9)
**Objective:** Add FastAPI microservice. The ML model now classifies Categories, **Languages**, and **Political Leaning**.

### Evolving Architecture (Phase 3)
```mermaid
graph TD
    subgraph "Phase 3: Advanced ML Microservice"
        FastAPI[FastAPI ML Service: Port 8000]
        CatModel[Category Classifier]
        PolModel[Political Bias Detector]
        LangModel[Language Detector]
        
        FastAPI --> CatModel
        FastAPI --> PolModel
        FastAPI --> LangModel
    end
```

### Team Tasks & Examples
*   **Machine Learning (Intern 4):** Build endpoints that output rich metadata for advanced filtering.
*   **Node.js (Intern 2):** Ensure API routes accept advanced filter queries (e.g., `?leaning=left&lang=en`).

---

## Phase 4: Enterprise Integration Pipeline (Days 10-12)
**Objective:** Orchestrate data flow from Scraper -> ML Service -> DB via RabbitMQ. Add complex Boolean Search logic.

### Team Tasks & Examples
*   **Node.js (Intern 2):** Implement Boolean Search (AND/OR/NOT) in the Postgres queries.
    ```javascript
    // Allow queries like "technology AND (AI OR Robotics) NOT crypto"
    const articles = await queryBuilder.applyBooleanSearch(req.query.q);
    ```

---

## Phase 5: Smart Caching Strategy (Days 13-15)
**Objective:** Introduce Redis with dynamic TTLs (1 hour for recent news, 24 hours for historical) to minimize DB load.

### Evolving Architecture (Phase 5)
```mermaid
graph TD
    subgraph "Phase 5: Smart Caching Layer"
        Node[Node.js API] -->|Check Cache| Redis[(Redis)]
        Redis -- Miss --> DB[(PostgreSQL)]
        Node -->|Recent News| Redis1[TTL: 1 Hour]
        Node -->|Historical| Redis24[TTL: 24 Hours]
    end
```

### Team Tasks & Examples
*   **Node.js (Intern 2):** Implement dynamic Redis TTL middleware.
    ```javascript
    const ttl = isRecentNews(data) ? 3600 : 86400; // 1hr vs 24hr
    redis.setex(cacheKey, ttl, JSON.stringify(data));
    ```

---

## Phase 6: Extractive Summarization & Personalization (Days 16-18)
**Objective:** Add Extractive Summarization via ML and personalized feeds based on user state.

---

## Phase 7: Production Orchestration & E2E Testing (Days 19-21)
**Objective:** Nginx API Gateway, Docker deployment, and rigorous End-to-End (E2E) testing using Playwright.

### Final Production Architecture (Phase 7)
```mermaid
graph TD
    subgraph "Production Environment (Docker / Nginx)"
        Client[React Browser SPA] -->|HTTPS| Nginx[Nginx API Gateway]
        Playwright[Playwright E2E Tests] -.->|Automated Testing| Client
        
        Nginx -->|Rate Limited| Node[Node.js Service]
        Node <--> DB[(PostgreSQL)]
        Node <--> Redis[(Redis)]
        
        RabbitMQ[[RabbitMQ]] <--> Celery[Django Celery Workers]
        Celery <--> FastAPI[ML Microservice]
        Celery --> DB
    end
```

### Team Tasks & Examples
*   **All Interns:** Write Playwright E2E tests simulating real user flows (login, filter, read).
    ```typescript
    // e2e/news-feed.spec.ts
    test('user can filter by political leaning', async ({ page }) => {
      await page.goto('/');
      await page.click('text=Filters');
      await page.check('text=Center-Left');
      await expect(page.locator('.article-card')).toHaveCount(10);
    });
    ```
