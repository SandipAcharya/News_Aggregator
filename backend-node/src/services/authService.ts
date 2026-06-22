import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-enterprise-key-123';
const JWT_EXPIRES_IN = '24h';

export const generateToken = (userId: string, role: string): string => {
    return jwt.sign({ id: userId, role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
};

export const verifyToken = (token: string): any => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error("Invalid or Expired Token");
    }
};

export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(12); // Enterprise standard cost factor
    return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};
