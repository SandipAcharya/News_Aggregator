import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import newsRoutes from './routes/newsRoutes';
import authRoutes from './routes/authRoutes';
import { connectCache } from './services/cacheService';

import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
app.use(cookieParser());
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
const allowedOrigins = [
    'http://localhost:5173', 
    'http://localhost', 
    process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// Routes
app.use('/api/auth', authRoutes);
app.use('/api', newsRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: "OK", mode: process.env.ENABLE_DEMO_MODE === 'true' ? "DEMO" : "PRODUCTION" });
});

// Boot Server
const startServer = async () => {
    await connectCache(); // Redis is optional - won't crash if unavailable
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Node.js API Gateway running on port ${PORT}`);
        console.log(`📋 Mode: ${process.env.ENABLE_DEMO_MODE === 'true' ? '🟡 DEMO (serving demo-data/articles.json)' : '🟢 PRODUCTION (PostgreSQL)'}`);
    });
};

startServer();
