import { Router, Request, Response } from 'express';
import { generateToken, generateRefreshToken, verifyRefreshToken, hashPassword, comparePassword } from '../services/authService';
import { sendOTP, sendPasswordResetOTP } from '../services/emailService';
import { getCache, setCache, deleteCache } from '../services/cacheService';
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
        const existing = await pool.query(
            'SELECT id FROM auth_user WHERE email = $1 OR username = $2',
            [email, username || email]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: "A user with that email already exists" });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const derivedUsername = username || email.split('@')[0];

        const pendingUser = {
            username: derivedUsername,
            email,
            password,
            role,
            otpCode
        };

        await setCache(`registration:${email}`, pendingUser, 600);
        await sendOTP(email, otpCode);

        // ✅ Use derivedUsername, not newUser.username (user doesn't exist in DB yet)
        res.status(201).json({
            message: "OTP sent to your email. Please verify to complete registration.",
            username: derivedUsername
        });
    } catch (error) {
        console.error("[Auth] Signup failed:", error);
        res.status(500).json({ error: "Signup failed. Please try again." });
    }
});

// ── POST /api/auth/verify-otp ────────────────────────────────────────────────
router.post('/verify-otp', async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required" });
    }

    try {
        const pendingUser = await getCache(`registration:${email}`);

        if (!pendingUser) {
            return res.status(400).json({ error: "OTP expired or invalid email" });
        }

        if (pendingUser.otpCode !== otp) {
            return res.status(400).json({ error: "Invalid OTP" });
        }

        // OTP is valid! Hash password and insert into Database
        const hashedPassword = await hashPassword(pendingUser.password);

        // Insert into auth_user
        const result = await pool.query(
            `INSERT INTO auth_user (username, email, password, is_active, is_staff, is_superuser, date_joined, first_name, last_name)
             VALUES ($1, $2, $3, true, false, false, NOW(), '', '')
             RETURNING id`,
            [pendingUser.username, pendingUser.email, `bcrypt$$${hashedPassword}`]
        );

        const newUser = result.rows[0];

        // Insert into users_userprofile (email_verified is set to true immediately)
        await pool.query(
            `INSERT INTO users_userprofile (id, user_id, role, preferences, email_verified, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, '{}', true, NOW(), NOW())`,
            [newUser.id, pendingUser.role]
        );

        // Clear cache
        await deleteCache(`registration:${email}`);

        res.json({ message: "Email verified successfully. You can now log in." });
    } catch (error) {
        console.error("[Auth] OTP Verification failed:", error);
        res.status(500).json({ error: "Verification failed. Please try again." });
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
        const accessToken = generateToken('demo-id', 'admin');
        const refreshToken = generateRefreshToken('demo-id', 'admin');
        return res.json({ token: accessToken, refreshToken, message: "Demo Login Successful", role: 'admin' });
    }

    try {
        // Look up user by email in Django's auth_user table
        const result = await pool.query(
            `SELECT u.id, u.email, u.password, u.is_active, COALESCE(p.role, 'user') AS role, p.email_verified
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

        if (!user.email_verified) {
            return res.status(403).json({ error: "Please verify your email address before logging in." });
        }

        // Extract bcrypt hash stored in our custom format: "bcrypt$$<hash>"
        const storedHash = user.password.startsWith('bcrypt$$')
            ? user.password.replace('bcrypt$$', '')
            : user.password;

        const isMatch = await comparePassword(password, storedHash);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const accessToken = generateToken(user.id.toString(), user.role);
        const refreshToken = generateRefreshToken(user.id.toString(), user.role);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ token: accessToken, message: "Login successful", role: user.role });

    } catch (error) {
        console.error("[Auth] Login failed:", error);
        res.status(500).json({ error: "Login failed. Please try again." });
    }
});

// ── POST /api/auth/refresh-token ─────────────────────────────────────────────
router.post('/refresh-token', async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token is missing" });
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);
        const newAccessToken = generateToken(decoded.id, decoded.role);
        
        // Optionally rotate the refresh token
        const newRefreshToken = generateRefreshToken(decoded.id, decoded.role);
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ token: newAccessToken });
    } catch (error) {
        return res.status(403).json({ error: "Invalid or expired refresh token" });
    }
});

// ── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', async (req: Request, res: Response) => {
    res.clearCookie('refreshToken');
    res.json({ message: "Logout successful" });
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

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post('/forgot-password', async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
        const userResult = await pool.query('SELECT id FROM auth_user WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            return res.json({ message: "If that email is registered, you will receive a reset OTP shortly." });
        }
        
        const userId = userResult.rows[0].id;
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOTP = await hashPassword(otpCode);
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes
        
        await pool.query(
            `UPDATE users_userprofile 
             SET reset_password_otp = $1, 
                 reset_password_otp_expires = $2, 
                 reset_password_attempts = 0, 
                 reset_password_verified = false,
                 updated_at = NOW()
             WHERE user_id = $3`,
            [hashedOTP, expiresAt, userId]
        );
        
        await sendPasswordResetOTP(email, otpCode);
        
        res.json({ message: "If that email is registered, you will receive a reset OTP shortly." });
    } catch (error) {
        console.error("[Auth] Forgot password failed:", error);
        res.status(500).json({ error: "Failed to process request." });
    }
});

// ── POST /api/auth/verify-reset-otp ──────────────────────────────────────────
router.post('/verify-reset-otp', async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required" });
    }

    try {
        const result = await pool.query(
            `SELECT u.id, p.reset_password_otp, p.reset_password_otp_expires, p.reset_password_attempts 
             FROM auth_user u
             JOIN users_userprofile p ON p.user_id = u.id
             WHERE u.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Invalid request." });
        }

        const user = result.rows[0];

        if (!user.reset_password_otp || !user.reset_password_otp_expires) {
            return res.status(400).json({ error: "No reset request found or OTP expired." });
        }

        if (user.reset_password_attempts >= 5) {
            return res.status(403).json({ error: "Too many failed attempts. Please request a new OTP." });
        }

        if (new Date() > new Date(user.reset_password_otp_expires)) {
            return res.status(400).json({ error: "OTP has expired." });
        }

        const isMatch = await comparePassword(otp, user.reset_password_otp);
        
        if (!isMatch) {
            await pool.query(
                'UPDATE users_userprofile SET reset_password_attempts = reset_password_attempts + 1 WHERE user_id = $1',
                [user.id]
            );
            return res.status(400).json({ error: "Invalid OTP." });
        }

        await pool.query(
            'UPDATE users_userprofile SET reset_password_verified = true, updated_at = NOW() WHERE user_id = $1',
            [user.id]
        );

        res.json({ message: "OTP verified successfully. You may now reset your password." });
    } catch (error) {
        console.error("[Auth] Verify reset OTP failed:", error);
        res.status(500).json({ error: "Failed to verify OTP." });
    }
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────
router.post('/reset-password', async (req: Request, res: Response) => {
    const { email, otp, newPassword, confirmPassword } = req.body;
    
    if (!email || !otp || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: "All fields are required." });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match." });
    }

    try {
        const result = await pool.query(
            `SELECT u.id, p.reset_password_otp, p.reset_password_otp_expires, p.reset_password_verified 
             FROM auth_user u
             JOIN users_userprofile p ON p.user_id = u.id
             WHERE u.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Invalid request." });
        }

        const user = result.rows[0];

        if (!user.reset_password_verified) {
            return res.status(403).json({ error: "OTP must be verified first." });
        }

        if (new Date() > new Date(user.reset_password_otp_expires)) {
            return res.status(400).json({ error: "Reset session has expired. Please request a new OTP." });
        }

        const isMatch = await comparePassword(otp, user.reset_password_otp);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid OTP." });
        }

        const hashedPassword = await hashPassword(newPassword);

        await pool.query(
            'UPDATE auth_user SET password = $1 WHERE id = $2',
            [`bcrypt$$${hashedPassword}`, user.id]
        );

        await pool.query(
            `UPDATE users_userprofile 
             SET reset_password_otp = NULL, 
                 reset_password_otp_expires = NULL, 
                 reset_password_attempts = 0, 
                 reset_password_verified = false,
                 updated_at = NOW()
             WHERE user_id = $1`,
            [user.id]
        );

        res.json({ message: "Password has been reset successfully. You can now log in." });
    } catch (error) {
        console.error("[Auth] Reset password failed:", error);
        res.status(500).json({ error: "Failed to reset password." });
    }
});

export default router;

