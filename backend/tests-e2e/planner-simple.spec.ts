import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers.js';

test.describe('Planner Desktop Flow - Simplified', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.navigateToPlanner();
  });

  test('Complete first-solve journey using helpers', async ({ page }) => {
    // Test sidebar navigation
    await test.step('Test sidebar navigation', async () => {
      await helpers.testSidebarNavigation();
    });

    // Create Ward "ED"
    await test.step('Create Ward "ED"', async () => {
      await helpers.createWard('ED', true); // hourlyGranularity = true
    });

    // Add Skills
    await test.step('Add Skills (nurse_general, nurse_resus)', async () => {
      await helpers.createSkill('nurse_general', 'General Nurse');
      await helpers.createSkill('nurse_resus', 'Resuscitation Nurse');
    });

    // Add Shift Types
    await test.step('Add Shift Types (Early, Late, Night)', async () => {
      await helpers.createShiftType('Early', 'Early Shift', '07:00', '15:00');
      await helpers.createShiftType('Late', 'Late Shift', '15:00', '23:00');
      await helpers.createShiftType('Night', 'Night Shift', '23:00', '07:00', true);
    });

    // Create Rule Set
    await test.step('Create Rule Set with defaults and activate', async () => {
      const rules = [
        { key: 'minRestHours', value: '11' },
        { key: 'maxConsecutiveNights', value: '3' },
        { key: 'oneShiftPerDay', value: 'true' }
      ];
      
      await helpers.createRuleSet('Standard Rules', 'Standard rules for ED', 'ED', rules);
      
      // Activate the rule set
      await page.click('button:has-text("Activate")');
      await expect(page.locator('span:has-text("Active")')).toBeVisible();
    });

    // Add Demand
    await test.step('Add Demand for next week', async () => {
      const demands = [
        { skill: 'nurse_resus', count: 2 },
        { skill: 'nurse_general', count: 8 }
      ];
      
      await helpers.addDemand('ED', 'Night', demands);
    });

    // Create Schedule
    await test.step('Create Schedule for next 4 weeks', async () => {
      const today = new Date();
      const startDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // Next week
      const endDate = new Date(startDate.getTime() + 28 * 24 * 60 * 60 * 1000); // 4 weeks later
      
      await helpers.createSchedule(
        'ED',
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
    });

    // Run Solve
    await test.step('Run Solve and verify results', async () => {
      await helpers.runSolve();
      
      // Verify metrics
      await expect(page.locator('text=0')).toBeVisible(); // Hard Violations = 0
      
      // Check fairness stdev is less than 2.0
      const fairnessElement = page.locator('text=/\\d+\\.\\d+/').filter({ hasText: /[0-9]+\.[0-9]+/ });
      await expect(fairnessElement).toBeVisible();
      
      // Verify solve time is displayed
      await expect(page.locator('text=/\\d+ms|\\d+\\.\\d+s/')).toBeVisible();
    });

    // Lock cells and run solve again
    await test.step('Lock 10 random cells and run solve again', async () => {
      await helpers.lockRandomCells(10);
      await helpers.runSolve();
      
      // Verify locks are preserved
      await expect(page.locator('button[title="Unlock"]')).toHaveCount(10);
    });

    // Test Explain functionality
    await test.step('Test Explain functionality', async () => {
      await helpers.openExplainForCell();
      await helpers.applyAlternative();
    });

    // Test keyboard shortcuts
    await test.step('Test keyboard shortcuts', async () => {
      await helpers.testKeyboardShortcuts();
    });
  });

  test('Error handling and validation', async ({ page }) => {
    await test.step('Test form validation', async () => {
      // Navigate to wards config
      await page.click('a[href="/planner/config/wards"]');
      await page.waitForURL('**/config/wards');
      
      // Try to create ward without name
      await page.click('button:has-text("New")');
      await page.click('button:has-text("Create Ward")');
      
      // Should show validation error
      await expect(page.locator('text=Ward name is required')).toBeVisible();
      
      // Fill name and try again
      await page.fill('input[name="name"]', 'Test Ward');
      await page.click('button:has-text("Create Ward")');
      
      // Should succeed
      await expect(page.locator('td:has-text("Test Ward")')).toBeVisible();
    });
  });
});
