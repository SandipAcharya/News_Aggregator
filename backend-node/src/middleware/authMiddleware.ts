import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';

export interface AuthRequest extends Request {
    user?: any;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Check if auth is bypassed for Demo Mode
    if (process.env.ENABLE_DEMO_MODE === 'true') {
        req.user = { id: 'demo-user-123', role: 'admin' };
        return next();
    }

    // 2. Validate Authorization Header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized. Missing or invalid Bearer token." });
    }

    const token = authHeader.split(' ')[1];

    // 3. Verify Token
    try {
        const decodedPayload = verifyToken(token);
        req.user = decodedPayload;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Forbidden. Token is expired or invalid." });
    }
};
