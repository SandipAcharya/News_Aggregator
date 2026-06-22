# News Aggregator: Enterprise Implementation Manual

This manual provides the step-by-step 21-day enterprise development plan. To ensure absolute clarity for the team, every phase includes **concrete examples** (code snippets, JSON payloads, and logic) of what each intern is expected to produce, integrating advanced features like Auth, State Management, and robust architecture.

---

## Days 1-3: Core Data Models, Auth & Demo Mode
**Objective:** Establish the database tables, identity management, and define data structures so frontend, backend, and ML can work in parallel. Implement **Demo Mode** for instant offline development.

### 1. Node.js (Intern 2)
**Task:** Initialize Express, JWT Auth routes, and **Demo Mode**.
**Example Output (`services/news.ts`):**
```typescript
import demoArticles from '../demo-data/articles.json';

export const fetchArticles = async (query) => {
    // Demo Mode allows frontend/ML to work without a real DB or API Key
    if (process.env.ENABLE_DEMO_MODE === 'true') {
        console.log("Serving from offline cache...");
        return applyFilters(demoArticles, query); 
    }
    return prisma.article.findMany({ where: buildQuery(query) });
};
```

---

## Days 4-6: Message Queues & UI Polish
**Objective:** Scrape real news using RabbitMQ, and build a polished UI with Skeleton Loaders and Dark Mode.

### 1. React (Intern 3)
**Task:** Build Feed UI using React Query and implement Skeleton Loaders.
**Example Output (`components/ArticleFeed.tsx`):**
```tsx
import { useQuery } from '@tanstack/react-query';
import { SkeletonCard } from './SkeletonCard';

export const ArticleFeed = () => {
  const { data, isLoading } = useQuery(['articles'], fetchArticles);

  if (isLoading) return (
    <div className="grid">
      {[1,2,3,4].map(n => <SkeletonCard key={n} />)}
    </div>
  );

  return <div className="grid">{data.map(article => <Card data={article} />)}</div>;
};
```

---

## Days 7-9: The Machine Learning Microservice
**Objective:** The ML code runs independently via FastAPI, providing rich metadata like Language and Political Bias.

### 1. Machine Learning (Intern 4)
**Task:** Wrap NLP scripts into a FastAPI application for advanced metadata.
**Example Output (`main.py`):**
```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

@app.post("/api/ml/analyze")
async def analyze_article(data: ArticleInput):
    # Determine Category, Language, and Political Bias
    return {
        "category": detect_category(data.text),
        "language": detect_language(data.text),       # e.g., 'en', 'es'
        "political_leaning": detect_bias(data.text)   # e.g., 'Center-Left'
    }
```

---

## Days 10-12: The Grand Integration
**Objective:** Automate enrichment via ML microservice and allow complex Boolean searches.

### 1. Node.js (Intern 2)
**Task:** Implement Boolean Search logic in the database queries.
**Example Output (`utils/searchBuilder.ts`):**
```typescript
export const buildBooleanQuery = (searchString: string) => {
    // Converts "technology AND AI NOT crypto" to DB filters
    // This replicates the advanced filtering seen in professional tools
    const tokens = parseSearchString(searchString);
    return convertTokensToPrismaWhere(tokens);
};
```

---

## Days 13-15: Smart Caching
**Objective:** Add Redis caching to the Node.js API to handle high load, using dynamic TTLs.

### 1. Node.js (Intern 2)
**Task:** Implement Smart Redis caching on the main feed endpoint.
**Example Output (`middleware/redis.ts`):**
```typescript
import redisClient from '../lib/redis';

export const smartCacheMiddleware = async (req, res, next) => {
    const key = `articles_page_${req.query.page}`;
    const cachedData = await redisClient.get(key);
    if (cachedData) return res.json(JSON.parse(cachedData)); 
    
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        // Smart Caching: 1 hr for recent news, 24 hrs for historical
        const ttl = isRecentNewsQuery(req.query) ? 3600 : 86400;
        redisClient.setEx(key, ttl, JSON.stringify(body));
        originalJson(body);
    };
    next();
};
```

---

## Days 16-18: End-to-End Testing
**Objective:** Setup automated browser testing.

### 1. Entire Team
**Task:** Write Playwright E2E tests.
**Example Output (`playwright.config.ts`):**
```typescript
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    browserName: 'chromium',
  },
};
export default config;
```

---

## Days 19-21: API Gateway & Final Handoff
**Objective:** Deploy behind an Nginx API Gateway.
