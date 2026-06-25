import { getDemoArticles } from './demoDataService';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://news_user:news_password@localhost:5432/news_db'
});

export interface NewsFilters {
    category?: string;
    leaning?: string;
    language?: string;
    country?: string;
    sourceType?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
}

export const fetchNewsArticles = async (filters: NewsFilters = {}) => {
    const { category, leaning, language, country, sourceType, search, startDate, endDate } = filters;

    // 1. Demo Mode — fast offline fallback
    if (process.env.ENABLE_DEMO_MODE === 'true') {
        console.log("[NewsService] Serving Demo Data");
        let articles = await getDemoArticles();

        if (category)    articles = articles.filter((a: any) => a.category?.toLowerCase() === category.toLowerCase());
        if (leaning)     articles = articles.filter((a: any) => a.political_leaning?.toLowerCase() === leaning.toLowerCase());
        if (language)    articles = articles.filter((a: any) => a.language?.toLowerCase() === language.toLowerCase());
        if (search) {
            const q = search.toLowerCase();
            articles = articles.filter((a: any) =>
                a.title?.toLowerCase().includes(q) ||
                a.summary?.join(' ').toLowerCase().includes(q)
            );
        }
        return articles;
    }

    // 2. Real PostgreSQL query with all filters
    console.log("[NewsService] Querying PostgreSQL Database");

    const params: any[] = [];

    // Build WHERE clauses dynamically
    const conditions: string[] = ['1=1'];

    if (category) {
        params.push(category);
        conditions.push(`a.category = $${params.length}`);
    }

    if (leaning) {
        params.push(leaning);
        conditions.push(`a.political_leaning = $${params.length}`);
    }

    if (language) {
        params.push(language);
        conditions.push(`a.language = $${params.length}`);
    }

    if (country) {
        params.push(country);
        conditions.push(`s.country = $${params.length}`);
    }

    if (sourceType) {
        params.push(sourceType);
        conditions.push(`s.source_type = $${params.length}`);
    }

    if (search) {
        // Boolean-style ILIKE full-text search on title + raw_content + source_name
        params.push(`%${search}%`);
        conditions.push(`(a.title ILIKE $${params.length} OR a.raw_content ILIKE $${params.length} OR s.name ILIKE $${params.length})`);
    }

    if (startDate) {
        params.push(startDate);
        conditions.push(`a.published_at >= $${params.length}::date`);
    }

    if (endDate) {
        params.push(endDate);
        conditions.push(`a.published_at < ($${params.length}::date + interval '1 day')`);
    }

    const query = `
        SELECT
            a.id, a.title, a.url, a.image_url, a.category, a.language,
            a.political_leaning, a.published_at, a.summary,
            s.name AS source_name,
            s.country AS country,
            s.source_type AS source_type
        FROM news_article a
        JOIN news_newssource s ON a.source_id = s.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY a.published_at DESC
        LIMIT 100
    `;

    try {
        const result = await pool.query(query, params);
        return result.rows;

    } catch (err) {
        console.error("Database query failed:");
        console.error("Query:", query);
        console.error("Params:", params);
        console.error("Exact PG Error:", err);
        throw new Error("Failed to fetch articles from database");
    }
};

export const fetchArticleById = async (id: string) => {
    const query = `
        SELECT
            a.id, a.title, a.url, a.image_url, a.category, a.language,
            a.political_leaning, a.published_at,
            s.name AS source_name,
            s.country AS country,
            s.source_type AS source_type
        FROM news_article a
        JOIN news_newssource s ON a.source_id = s.id
        WHERE a.id = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
};

export const triggerArticleSummary = async (id: string) => {
    // 1. First, check if summary exists in DB
    const checkQuery = `
        SELECT bullet_points, sentiment, sentiment_reason, key_entities, reading_time_mins, complexity
        FROM news_articlesummary
        WHERE article_id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);
    if (checkResult.rows.length > 0) {
        return checkResult.rows[0];
    }

    // 2. If not, trigger Django synchronously
    try {
        console.log(`[Node] Triggering Django summary generation for ${id}`);
        // Communicate with internal django-admin container over Docker network
        const djangoUrl = `http://django-admin:8000/internal/api/articles/${id}/summary`;
        const response = await axios.post(djangoUrl);
        return response.data;
    } catch (err: any) {
        console.error("[Node] Failed to generate summary from Django:", err?.response?.data || err.message);
        throw new Error("Failed to generate article summary");
    }
};
