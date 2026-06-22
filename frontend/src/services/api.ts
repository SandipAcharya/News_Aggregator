import axios from 'axios';
import { useStore } from '../store/useStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Inject JWT Token from Zustand on every request
apiClient.interceptors.request.use(
    (config) => {
        const token = useStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Full article payload shape from Node.js API
export interface Article {
    id: string;
    title: string;
    url: string;
    image_url?: string;
    category: string;
    language: string;
    political_leaning: string;
    published_at: string;
    summary: string[];
    source_name: string;
    country?: string;
    source_type?: string;
}

export interface FetchArticlesParams {
    category?:   string | null;
    leaning?:    string | null;
    language?:   string | null;
    country?:    string | null;
    sourceType?: string | null;
    search?:     string | null;
    startDate?:  string | null;
    endDate?:    string | null;
}

export const fetchArticles = async (params: FetchArticlesParams): Promise<Article[]> => {
    const query = new URLSearchParams();
    if (params.category)   query.append('category',   params.category);
    if (params.leaning)    query.append('leaning',    params.leaning);
    if (params.language)   query.append('language',   params.language);
    if (params.country)    query.append('country',    params.country);
    if (params.sourceType) query.append('sourceType', params.sourceType);
    if (params.search)     query.append('search',     params.search);
    if (params.startDate)  query.append('startDate',  params.startDate);
    if (params.endDate)    query.append('endDate',    params.endDate);

    const response = await apiClient.get(`/news?${query.toString()}`);
    // Node API returns { data: [...], source: "cache"|"database" }
    return response.data.data;
};

// ── Auth Endpoints ─────────────────────────────────────────────────────────

export const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
};

export const signup = async (email: string, password: string, username: string) => {
    const response = await apiClient.post('/auth/signup', { email, password, username });
    return response.data;
};


