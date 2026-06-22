import { test, expect } from '@playwright/test';

test.describe('NewsDataHub E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the local instance
    await page.goto('http://localhost');
  });

  test('should load the news feed and display articles', async ({ page }) => {
    // Check header
    await expect(page.locator('h1').filter({ hasText: 'NewsDataHub' })).toBeVisible();

    // Verify that at least one article card renders
    // We target the article cards by checking for the "Read more" links
    const articleCards = page.locator('text=Read full story');
    await expect(articleCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should allow filtering by category', async ({ page }) => {
    // Click on the Technology category filter
    await page.click('button:has-text("Technology")');
    
    // Check that the URL updated or the active state changed
    await expect(page.locator('button:has-text("Technology")')).toHaveClass(/bg-primary/);
  });

  test('should toggle dark mode', async ({ page }) => {
    const htmlElement = page.locator('html');
    
    // Click the theme toggle button (moon/sun icon)
    // Here we target the button that has the rounded-full class typical for our icon buttons
    const themeButton = page.locator('button.rounded-full.p-2').first();
    await themeButton.click();
    
    // Expect the dark class to be applied
    await expect(htmlElement).toHaveClass(/dark/);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.click('text=Sign In');
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('h2', { hasText: 'Welcome back' })).toBeVisible();
  });
});
