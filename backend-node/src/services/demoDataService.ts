import fs from 'fs';
import path from 'path';

export const getDemoArticles = async () => {
    try {
        const filePath = path.join(__dirname, '../../demo-data/articles.json');
        const rawData = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error("Failed to load demo data:", error);
        return [];
    }
};
