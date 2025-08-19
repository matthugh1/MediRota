import { test, expect } from '@playwright/test';

test.describe('Basic Smoke Tests', () => {
  test('Planner page loads correctly', async ({ page }) => {
    await page.goto('/planner');
    
    // Wait for the page to load
    await page.waitForSelector('nav[aria-label="Primary"]');
    
    // Verify basic elements are present
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('nav[aria-label="Primary"]')).toBeVisible();
    
    // Verify navigation items are present
    await expect(page.locator('text=Config')).toBeVisible();
    await expect(page.locator('text=Plan')).toBeVisible();
  });

  test('Navigation to config pages works', async ({ page }) => {
    await page.goto('/planner');
    await page.waitForSelector('nav[aria-label="Primary"]');
    
    // Test navigation to wards
    await page.click('a[href="/planner/config/wards"]');
    await page.waitForURL('**/config/wards');
    await expect(page.locator('h1')).toContainText('Wards');
    
    // Test navigation to skills
    await page.click('a[href="/planner/config/skills"]');
    await page.waitForURL('**/config/skills');
    await expect(page.locator('h1')).toContainText('Skills');
    
    // Test navigation to shift types
    await page.click('a[href="/planner/config/shift-types"]');
    await page.waitForURL('**/config/shift-types');
    await expect(page.locator('h1')).toContainText('Shift Types');
  });

  test('Sidebar toggle works', async ({ page }) => {
    await page.goto('/planner');
    await page.waitForSelector('nav[aria-label="Primary"]');
    
    // Check initial state
    await expect(page.locator('aside')).toHaveCSS('width', '280px');
    
    // Toggle sidebar
    await page.click('button[aria-label="Collapse sidebar"]');
    await expect(page.locator('aside')).toHaveCSS('width', '80px');
    
    // Toggle back
    await page.click('button[aria-label="Expand sidebar"]');
    await expect(page.locator('aside')).toHaveCSS('width', '280px');
  });
});
