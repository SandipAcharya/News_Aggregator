import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Create Redis Client
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        connectTimeout: 2000,
        reconnectStrategy: false // Don't hang trying to reconnect
    }
});

// Suppress Redis errors entirely - it is optional for local dev
redisClient.on('error', () => {}); 

let isConnected = false;

export const connectCache = async () => {
    try {
        await redisClient.connect();
        isConnected = true;
        console.log('[Cache] Redis connected.');
    } catch (error) {
        isConnected = false;
        console.log('[Cache] Redis unavailable - running without cache (demo/local mode).');
    }
};

const memoryCache = new Map<string, { data: any, expiresAt: number }>();

export const getCache = async (key: string) => {
    if (!isConnected) {
        const item = memoryCache.get(key);
        if (item && item.expiresAt > Date.now()) {
            return item.data;
        }
        memoryCache.delete(key);
        return null;
    }
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

export const setCache = async (key: string, data: any, ttlInSeconds: number) => {
    if (!isConnected) {
        memoryCache.set(key, { data, expiresAt: Date.now() + (ttlInSeconds * 1000) });
        return;
    }
    try {
        await redisClient.setEx(key, ttlInSeconds, JSON.stringify(data));
    } catch {
        // fallback if redis fails unexpectedly
        memoryCache.set(key, { data, expiresAt: Date.now() + (ttlInSeconds * 1000) });
    }
};

export const deleteCache = async (key: string) => {
    if (!isConnected) {
        memoryCache.delete(key);
        return;
    }
    try {
        await redisClient.del(key);
    } catch {
        memoryCache.delete(key);
    }
};
