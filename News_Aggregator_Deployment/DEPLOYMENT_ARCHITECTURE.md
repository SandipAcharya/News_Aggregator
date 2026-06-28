# 🚀 News Aggregator — Complete Architecture & Flow

Because you are using **Groq (LLaMA)** for your ML summarization instead of running heavy ML models locally, your server requirements drop dramatically! Your `ml-fastapi` container is simply acting as a lightweight bridge to the Groq API (or uses simple keyword extraction fallback). 

This means **you can comfortably run this entire backend on a cheap $6/month 4GB VPS** with zero out-of-memory crashes.

Below is the complete documentation of your data flow, architecture, and deployment costs.

---

## 1. Local Setup Data Flow (How it actually works)

This diagram shows what happens under the hood when your system fetches news, processes it, and serves it to users.

```mermaid
sequenceDiagram
    autonumber
    participant Beat as Celery Beat (Clock)
    participant MQ as RabbitMQ (Queue)
    participant Worker as Celery Worker (Scraper)
    participant ML as ML FastAPI (Bridge)
    participant Groq as External Groq API (LLaMA)
    participant DB as PostgreSQL
    participant Cache as Redis Cache
    participant Node as Node.js API
    participant UI as React Frontend

    Beat->>MQ: 1. "Time to scrape! Add job to queue" (Every 30m)
    MQ->>Worker: 2. Worker picks up scraping job
    Worker->>Worker: 3. Fetch RSS Feeds & extract raw HTML
    Worker->>ML: 4. Send raw text to ML service for processing
    ML->>Groq: 5. Forward text to Groq API (LLaMA 3)
    Groq-->>ML: 6. Returns JSON (Summary, Tags, Leaning)
    ML-->>Worker: 7. Returns parsed insights to worker
    Worker->>DB: 8. Save structured Article to PostgreSQL
    Worker->>Cache: 9. Invalidate old cache
    
    UI->>Node: 10. User visits site, requests feed
    Node->>Cache: 11. Check Redis for cached feed
    alt Cache Miss
        Node->>DB: 12. Fetch from PostgreSQL
        DB-->>Node: 13. Return Articles
        Node->>Cache: 14. Save to Redis for 5 minutes
    end
    Node-->>UI: 15. Send JSON to Frontend
```

---

## 2. Proposed Deployment Architecture

This diagram maps out where everything lives in the real world when deployed.

```mermaid
flowchart TD
    %% Users
    User[User Browser / Phone]

    %% VPS
    subgraph VPS [VPS - Single Server]
        FE[React / Vite Frontend]
        NGINX[NGINX Reverse Proxy]
        
        subgraph APIs [API Layer]
            Node[Node.js API]
            Django[Django Admin]
            ML[ML FastAPI Proxy]
        end
        
        subgraph Background [Background Processing]
            Beat[Celery Beat]
            Worker[Celery Worker]
        end
        
        subgraph Data [Data Layer]
            DB[(PostgreSQL)]
            Redis[(Redis)]
            MQ[(RabbitMQ)]
        end
    end

    %% Connections
    User -->|Visits UI| FE
    User -->|API Calls| DNS
    DNS -->|Routes to Server| NGINX
    
    FE -->|Fetches Images| R2
    
    NGINX -->|/api/*| Node
    NGINX -->|/admin/*| Django
    
    Node --> DB & Redis
    Django --> DB & Redis
    
    Beat --> MQ
    MQ --> Worker
    Worker --> DB & Redis & R2
    Worker <--> ML
    ML <--> Groq
```

---

## 3. Server Sizing & Cost Breakdown

Because all the heavy AI processing is offloaded to Groq's external servers (or handled by lightweight fallback logic), your VPS only handles networking, basic data storage, and Python/Node processes.

### Recommended Server Specs
* **Provider:** Hetzner Cloud
* **Instance:** CX22
* **OS:** Ubuntu 24.04 LTS
* **Specs:** 2 vCPU, 4GB RAM, 40GB NVMe SSD
* **Monthly Cost:** ~$3.50 to $6.00 / month (depending on region)

### Resource Usage Breakdown (4GB RAM Limit)
Here is how your 4GB of RAM will be distributed among your Docker containers:
* **Operating System (Ubuntu):** ~500 MB
* **PostgreSQL:** ~500 MB
* **RabbitMQ & Redis:** ~300 MB
* **Django Admin & Node API:** ~400 MB
* **Celery Workers (Scrapers):** ~500 MB
* **ML FastAPI (Proxy only):** ~100 MB
* **Total Usage:** **~2.3 GB / 4.0 GB**
* **Verdict:** You have plenty of safe overhead!

### Total Platform Pricing

| Service | Provider | Purpose | Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Frontend Hosting** | VPS Container | React static bundle served via NGINX | **$0.00** |
| **AI Summarization** | Groq API | Processes news via LLaMA | **$0.00** *(Generous Free Tier)* |
| **Image Storage** | Cloudflare R2 | Serves article thumbnails | **$0.00** *(First 10GB free, $0 bandwidth)* |
| **Domain Routing** | Cloudflare | DNS + SSL | **~$0.80** *($10/year)* |
| **Backend & Frontend** | Hetzner CX22 | Runs all 9 Docker containers | **~$6.00** |
| **Total Startup Cost** | | | **~$6.80 / month** |

---

## 4. Why This Single-Server Architecture is Bulletproof

1. **Simplified Deployment:** By putting the Frontend and Backend on a single VPS, everything spins up instantly with one `docker-compose up -d --build` command. You don't have to manage multiple deployment platforms.
2. **AI Delegation:** By using Groq API instead of running local PyTorch models, your CPU and RAM requirements drop by over 80%.
3. **Database Speed:** By keeping PostgreSQL, Redis, Node, and Django all in the same Docker network on the same Hetzner server, they communicate via local sockets (0.1ms latency). If you used an external DB (like Neon), every database query would take 50ms+.
