import { Router, Request, Response } from 'express';
import { fetchNewsArticles, fetchArticleById, triggerArticleSummary } from '../services/newsService';
import { getCache, setCache } from '../services/cacheService';
import { validateNewsQuery } from '../validators/newsValidators';

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
        const cacheKey = `article_detail_${id}`;
        
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.json({ data: cachedData, source: 'cache' });
        }

        const article = await fetchArticleById(id);
        if (!article) return res.status(404).json({ error: "Article not found" });

        await setCache(cacheKey, article, 3600); // cache for 1 hour
        res.json({ data: article, source: 'database' });
    } catch (error) {
        console.error("[Article Detail Error]", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get('/articles/:id/summary', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const cacheKey = `article_summary_${id}`;
        
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.json({ data: cachedData, source: 'cache' });
        }

        const summary = await triggerArticleSummary(id);
        
        await setCache(cacheKey, summary, 86400); // cache AI summary for 24 hours
        res.json({ data: summary, source: 'database' });
    } catch (error) {
        console.error("[Article Summary Error]", error);
        res.status(500).json({ error: "Failed to fetch or generate summary" });
    }
});

export default router;

