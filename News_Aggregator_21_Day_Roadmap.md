# News Aggregator Enterprise Boilerplate: 21-Day Implementation Roadmap

## Overview
This document outlines the parallel development strategy for the News Aggregator Enterprise Boilerplate. The timeline is divided into 3-day sprints to ensure steady, parallel progress across the 5 team members (Lead ML Engineer + 4 Interns).

---

## Days 1-3: Enterprise Architecture, Schema & Auth Setup
**Goal:** Establish the foundational infrastructure, agree on API contracts, configure the Identity Management (Auth), and set up the **Demo Mode** so interns can work offline immediately.

### Tasks by Role:
*   **You (Lead/Architect):** Define DB schema. Create Docker Compose. Supply `articles.json` for Demo Mode.
*   **Intern 1 (Django):** Initialize Django project. Setup Models (`UserProfile`, `NewsSource`, `Article`).
*   **Intern 2 (Node.js):** Initialize Express/TS project. Implement Demo Mode toggle (`ENABLE_DEMO_MODE=true`) to serve local JSON instead of DB.
*   **Intern 3 (React):** Initialize Vite/React project. Configure Zustand & React Query. Build Login screen and Dark Mode toggle.
*   **Intern 4 (ML):** Setup Python virtual environment. Research and test models for Categorization, Political Leaning, and Language detection.

---

## Days 4-6: Data Ingestion & Protected Routes
**Goal:** Get raw data flowing into the database via RabbitMQ/Celery, and serve it out via the Node.js API protecting endpoints with JWT.

### Tasks by Role:
*   **You (Lead/Architect):** Review Intern PRs. Setup ML microservice scaffolding (FastAPI).
*   **Intern 1 (Django):** Implement Celery + RabbitMQ. Write RSS parser script to queue articles.
*   **Intern 2 (Node.js):** Implement JWT Middleware (`authMiddleware`). Create `/api/articles`.
*   **Intern 3 (React):** Build News Feed UI. Implement Skeleton Loaders and Grid/List view toggle.
*   **Intern 4 (ML):** Finalize text classification script for advanced metadata.

---

## Days 7-9: State Management & ML Pipelines Base
**Goal:** Deploy the ML models as a callable microservice. Add advanced UI filtering.

### Tasks by Role:
*   **You (Lead/Architect):** Help Intern 4 package ML scripts into FastAPI.
*   **Intern 1 (Django):** Build Django Admin panel to manage RSS feed sources with RBAC.
*   **Intern 2 (Node.js):** Implement advanced filtering endpoints (`?leaning=left&lang=en`).
*   **Intern 3 (React):** Implement Category Filter sidebar with Political Bias and Language toggles.
*   **Intern 4 (ML):** Wrap the classification models into a FastAPI app with endpoints.

---

## Days 10-12: Enterprise Integration (Scraping + ML)
**Goal:** Connect the Django ingestion pipeline with the ML service to automatically enrich data. Add Boolean Search.

### Tasks by Role:
*   **You (Lead/Architect):** Monitor integration. Tune ML model parameters.
*   **Intern 1 (Django):** Update Celery pipeline: Fetch article -> ML FastAPI -> Save to DB.
*   **Intern 2 (Node.js):** Implement Boolean Search parser (`AND`, `OR`, `NOT`) for DB queries.
*   **Intern 3 (React):** Add "Bookmark" and "Like" buttons using React Query mutations.
*   **Intern 4 (ML):** Optimize FastAPI endpoints for async batch processing.

---

## Days 13-15: Smart Caching & Real-time Features
**Goal:** Implement Smart Redis TTL Caching and Optimistic UI Updates.

### Tasks by Role:
*   **You (Lead/Architect):** Code review and architecture audit.
*   **Intern 1 (Django):** Implement duplicate article detection.
*   **Intern 2 (Node.js):** Implement Smart Redis caching: 1 hour TTL for recent news, 24 hours for historical news.
*   **Intern 3 (React):** Implement Optimistic UI Updates for Bookmarks. Add Search bar with debouncing.
*   **Intern 4 (ML):** Add entity extraction (tagging people/companies).

---

## Days 16-18: E2E Testing & Security
**Goal:** Ensure the pipeline handles edge cases. Write End-to-End Tests.

### Tasks by Role:
*   **You (Lead/Architect):** Setup Playwright testing environment.
*   **Intern 1 (Django):** Write Playwright tests for Django Admin login/RBAC.
*   **Intern 2 (Node.js):** Audit API security (Helmet, CORS, Rate Limiting).
*   **Intern 3 (React):** Write Playwright tests simulating user reading flows and filtering.
*   **Intern 4 (ML):** Handle edge cases in ML processing (e.g., very short articles).

---

## Days 19-21: DevOps, API Gateway & Final Handoff
**Goal:** Wrap up the enterprise boilerplate, configure Nginx API Gateway, and Docker Swarm deployment.

### Tasks by Role:
*   **You (Lead/Architect):** Configure Nginx Reverse Proxy / API Gateway.
*   **Intern 1 (Django):** Write README.
*   **Intern 2 (Node.js):** Write Swagger/OpenAPI documentation.
*   **Intern 3 (React):** Write README for Frontend setup.
*   **Intern 4 (ML):** Document ML microservice specs.
