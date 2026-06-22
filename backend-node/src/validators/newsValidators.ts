import { Request, Response, NextFunction } from 'express';

const VALID_CATEGORIES = ['Technology', 'Business', 'Politics', 'Science', 'Sports', 'Health', 'Entertainment', 'World', 'General'];
const VALID_LEANINGS   = ['Left', 'Center-Left', 'Center', 'Center-Right', 'Right', 'Far Right'];
const VALID_LANGUAGES  = ['en', 'ne', 'hi', 'zh', 'de', 'fr', 'es', 'ar'];
const VALID_COUNTRIES  = ['US', 'GB', 'NP', 'IN', 'CN', 'DE', 'FR', 'AU', 'CA', 'QA'];
const VALID_SOURCE_TYPES = ['newspaper', 'magazine', 'digital', 'broadcast', 'wire', 'blog'];

const validateStringParam = (value: any, fieldName: string, validValues?: string[]): string | null => {
    if (!value) return null;
    if (typeof value !== 'string') return `${fieldName} must be a string`;
    if (validValues && !validValues.includes(value)) {
        return `Invalid ${fieldName}. Valid values: ${validValues.join(', ')}`;
    }
    return null;
};

export const validateNewsQuery = (req: Request, res: Response, next: NextFunction) => {
    const { category, leaning, language, country, sourceType, search, startDate, endDate } = req.query;

    const checks = [
        validateStringParam(category,   'category',   VALID_CATEGORIES),
        validateStringParam(leaning,    'leaning',    VALID_LEANINGS),
        validateStringParam(language,   'language',   VALID_LANGUAGES),
        validateStringParam(country,    'country',    VALID_COUNTRIES),
        validateStringParam(sourceType, 'sourceType', VALID_SOURCE_TYPES),
        validateStringParam(search,     'search'),
        validateStringParam(startDate,  'startDate'),
        validateStringParam(endDate,    'endDate'),
    ];

    const error = checks.find(Boolean);
    if (error) return res.status(400).json({ error });

    // Prevent search queries that are too long (DoS protection)
    if (search && typeof search === 'string' && search.length > 200) {
        return res.status(400).json({ error: "Search query too long (max 200 chars)" });
    }

    next();
};

