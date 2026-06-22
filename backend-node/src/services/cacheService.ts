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

export const getCache = async (key: string) => {
    if (!isConnected) return null;
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

export const setCache = async (key: string, data: any, ttlInSeconds: number) => {
    if (!isConnected) return;
    try {
        await redisClient.setEx(key, ttlInSeconds, JSON.stringify(data));
    } catch {
        // silently skip
    }
};
