import { Router, Request, Response } from 'express';
import { generateToken, hashPassword, comparePassword } from '../services/authService';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://news_user:news_password@localhost:5432/news_db'
});

// ── POST /api/auth/signup ────────────────────────────────────────────────────
router.post('/signup', async (req: Request, res: Response) => {
    const { email, password, username, role = 'user' } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        // Check if email already taken
        const existing = await pool.query(
            'SELECT id FROM auth_user WHERE email = $1 OR username = $2',
            [email, username || email]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: "A user with that email already exists" });
        }

        // Django stores passwords as "algorithm$iterations$salt$hash"
        // We store bcrypt in our custom format — compatible with Node's verifyToken flow
        const hashedPassword = await hashPassword(password);
        const derivedUsername = username || email.split('@')[0];

        // Insert into Django's built-in auth_user table
        const result = await pool.query(
            `INSERT INTO auth_user (username, email, password, is_active, is_staff, is_superuser, date_joined, first_name, last_name)
             VALUES ($1, $2, $3, true, false, false, NOW(), '', '')
             RETURNING id, username, email`,
            [derivedUsername, email, `bcrypt$$${hashedPassword}`]
        );

        const newUser = result.rows[0];

        // Also create the UserProfile with the role
        await pool.query(
            `INSERT INTO users_userprofile (id, user_id, role, preferences, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, '{}', NOW(), NOW())`,
            [newUser.id, role]
        );

        res.status(201).json({ message: "User created successfully", username: newUser.username });
    } catch (error) {
        console.error("[Auth] Signup failed:", error);
        res.status(500).json({ error: "Signup failed. Please try again." });
    }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    // Demo Mode bypass — auto-login as admin
    if (process.env.ENABLE_DEMO_MODE === 'true') {
        const token = generateToken('demo-id', 'admin');
        return res.json({ token, message: "Demo Login Successful", role: 'admin' });
    }

    try {
        // Look up user by email in Django's auth_user table
        const result = await pool.query(
            `SELECT u.id, u.email, u.password, u.is_active, COALESCE(p.role, 'user') AS role
             FROM auth_user u
             LEFT JOIN users_userprofile p ON p.user_id = u.id
             WHERE u.email = $1`,
            [email]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: "Account is deactivated" });
        }

        // Extract bcrypt hash stored in our custom format: "bcrypt$$<hash>"
        const storedHash = user.password.startsWith('bcrypt$$')
            ? user.password.replace('bcrypt$$', '')
            : user.password;

        const isMatch = await comparePassword(password, storedHash);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = generateToken(user.id.toString(), user.role);
        res.json({ token, message: "Login successful", role: user.role });

    } catch (error) {
        console.error("[Auth] Login failed:", error);
        res.status(500).json({ error: "Login failed. Please try again." });
    }
});

import { requireAuth, AuthRequest } from '../middleware/authMiddleware';

// ── GET /api/auth/preferences ────────────────────────────────────────────────
router.get('/preferences', requireAuth, async (req: AuthRequest, res: Response) => {
    if (process.env.ENABLE_DEMO_MODE === 'true') {
        return res.json({ preferences: { theme: 'dark', defaultCategory: 'Technology' } });
    }

    try {
        const userId = req.user?.id;
        const result = await pool.query(
            'SELECT preferences FROM users_userprofile WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User profile not found" });
        }

        res.json({ preferences: result.rows[0].preferences || {} });
    } catch (error) {
        console.error("[User] Get preferences failed:", error);
        res.status(500).json({ error: "Failed to fetch preferences" });
    }
});

// ── PUT /api/auth/preferences ────────────────────────────────────────────────
router.put('/preferences', requireAuth, async (req: AuthRequest, res: Response) => {
    if (process.env.ENABLE_DEMO_MODE === 'true') {
        return res.json({ message: "Preferences updated (Demo Mode)" });
    }

    try {
        const userId = req.user?.id;
        const { preferences } = req.body;

        if (!preferences || typeof preferences !== 'object') {
            return res.status(400).json({ error: "Preferences must be a JSON object" });
        }

        await pool.query(
            'UPDATE users_userprofile SET preferences = $1, updated_at = NOW() WHERE user_id = $2',
            [JSON.stringify(preferences), userId]
        );

        res.json({ message: "Preferences updated successfully" });
    } catch (error) {
        console.error("[User] Update preferences failed:", error);
        res.status(500).json({ error: "Failed to update preferences" });
    }
});

export default router;

