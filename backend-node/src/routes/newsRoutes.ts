import { Router, Request, Response } from 'express';
import { fetchNewsArticles, fetchArticleById, triggerArticleSummary, createArticle } from '../services/newsService';
import { getCache, setCache } from '../services/cacheService';
import { validateNewsQuery } from '../validators/newsValidators';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.get('/news', validateNewsQuery, async (req: Request, res: Response) => {
    try {
        const category   = req.query.category   as string | undefined;
        const leaning    = req.query.leaning     as string | undefined;
        const language   = req.query.language    as string | undefined;
        const country    = req.query.country     as string | undefined;
        const sourceType = req.query.sourceType  as string | undefined;
        const search     = req.query.search      as string | undefined;
        const startDate  = req.query.startDate   as string | undefined;
        const endDate    = req.query.endDate      as string | undefined;

        // Build a unique cache key covering all dimensions
        const CACHE_VERSION = 'v6';
        const cacheKey = [
            CACHE_VERSION,
            category    || 'all',
            leaning     || 'all',
            language    || 'all',
            country     || 'all',
            sourceType  || 'all',
            search      || 'none',
            startDate   || 'none',
            endDate     || 'none',
        ].join('_');

        // 1. Check Redis Cache First
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            console.log("[Cache] Hit! Key:", cacheKey);
            return res.json({ data: cachedData, source: 'cache' });
        }

        // 2. Cache Miss — Fetch from Service (Demo or DB)
        console.log("[Cache] Miss! Key:", cacheKey);
        const articles = await fetchNewsArticles({ category, leaning, language, country, sourceType, search, startDate, endDate });

        // 3. Smart TTL: unfiltered general = 1hr, search queries = 2min, everything else = 5min
        let ttl = 300; // 5 minutes default
        if (!category && !leaning && !language && !country && !sourceType && !search && !startDate && !endDate) {
            ttl = 300; // 5 minutes for the full unfiltered feed (changed from 1 hour)
        } else if (search) {
            ttl = 120; // 2 min for search (results change as new articles arrive)
        }
        await setCache(cacheKey, articles, ttl);

        res.json({ data: articles, source: 'database' });

    } catch (error) {
        console.error("[Route Error]", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get('/articles/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        // Reject non-UUID IDs immediately — no need to hit DB
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!UUID_REGEX.test(id)) return res.status(400).json({ error: 'Invalid article ID' });

        const cacheKey = `article_detail_${id}`;
        const cachedData = await getCache(cacheKey);
        if (cachedData) return res.json({ data: cachedData, source: 'cache' });

        const article = await fetchArticleById(id);
        if (!article) return res.status(404).json({ error: 'Article not found' });

        await setCache(cacheKey, article, 3600);
        res.json({ data: article, source: 'database' });
    } catch (error) {
        console.error('[Article Detail Error]', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/articles/:id/summary', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!UUID_REGEX.test(id)) return res.status(400).json({ error: 'Invalid article ID' });

        const cacheKey = `article_summary_${id}`;
        const cachedData = await getCache(cacheKey);
        if (cachedData) return res.json({ data: cachedData, source: 'cache' });

        const summary = await triggerArticleSummary(id);
        await setCache(cacheKey, summary, 86400);
        res.json({ data: summary, source: 'database' });
    } catch (error) {
        console.error('[Article Summary Error]', error);
        res.status(500).json({ error: 'Failed to fetch or generate summary' });
    }
});

// ── POST /api/articles — Create article (Auth required) ──────────────────────
router.post('/articles', requireAuth, async (req: AuthRequest, res: Response) => {
    const { title, content, excerpt, source_name, original_url, category, language, political_leaning, tags, status, image_url } = req.body;

    // Basic field validation
    if (!title || typeof title !== 'string' || title.trim().length === 0)
        return res.status(400).json({ error: 'Title is required' });
    if (!content || typeof content !== 'string' || content.trim().length === 0)
        return res.status(400).json({ error: 'Content is required' });
    if (title.length > 500)
        return res.status(400).json({ error: 'Title too long (max 500 chars)' });
    if (content.length > 500_000)
        return res.status(400).json({ error: 'Content too long (max 500,000 chars)' });
    if (excerpt && excerpt.length > 1000)
        return res.status(400).json({ error: 'Excerpt too long (max 1000 chars)' });
    if (Array.isArray(tags) && tags.length > 10)
        return res.status(400).json({ error: 'Too many tags (max 10)' });

    try {
        const result = await createArticle(req.body);
        res.json(result);
    } catch (error) {
        console.error('[Create Article Error]', error);
        res.status(500).json({ error: 'Failed to create article' });
    }
});

export default router;

