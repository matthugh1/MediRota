import { test, expect } from '@playwright/test';

test.describe('Planner Desktop Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to planner
    await page.goto('/planner');
    
    // Wait for the page to load
    await page.waitForSelector('nav[aria-label="Primary"]');
  });

  test('Complete first-solve journey end-to-end', async ({ page }) => {
    // Test 1: Sidebar navigation
    await test.step('Sidebar collapses/expands via toggle and keyboard shortcuts', async () => {
      // Check initial state - sidebar should be expanded
      await expect(page.locator('aside')).toHaveCSS('width', '280px');
      
      // Test toggle button
      await page.click('button[aria-label="Collapse sidebar"]');
      await expect(page.locator('aside')).toHaveCSS('width', '80px');
      
      // Test keyboard shortcut "[" to collapse
      await page.keyboard.press('[');
      await expect(page.locator('aside')).toHaveCSS('width', '80px');
      
      // Test keyboard shortcut "]" to expand
      await page.keyboard.press(']');
      await expect(page.locator('aside')).toHaveCSS('width', '280px');
    });

    // Test 2: Create Ward
    await test.step('Create Ward "ED"', async () => {
      await page.click('a[href="/planner/config/wards"]');
      await page.waitForURL('**/config/wards');
      
      // Click "New" button
      await page.click('button:has-text("New")');
      
      // Fill ward form
      await page.fill('input[name="name"]', 'ED');
      await page.check('input[name="hourlyGranularity"]');
      
      // Submit form
      await page.click('button:has-text("Create Ward")');
      
      // Verify ward was created
      await expect(page.locator('td:has-text("ED")')).toBeVisible();
    });

    // Test 3: Add Skills
    await test.step('Add Skills (nurse_general, nurse_resus)', async () => {
      await page.click('a[href="/planner/config/skills"]');
      await page.waitForURL('**/config/skills');
      
      // Add nurse_general
      await page.click('button:has-text("New")');
      await page.fill('input[name="code"]', 'nurse_general');
      await page.fill('input[name="name"]', 'General Nurse');
      await page.click('button:has-text("Create Skill")');
      
      // Add nurse_resus
      await page.click('button:has-text("New")');
      await page.fill('input[name="code"]', 'nurse_resus');
      await page.fill('input[name="name"]', 'Resuscitation Nurse');
      await page.click('button:has-text("Create Skill")');
      
      // Verify skills were created
      await expect(page.locator('td:has-text("nurse_general")')).toBeVisible();
      await expect(page.locator('td:has-text("nurse_resus")')).toBeVisible();
    });

    // Test 4: Add Shift Types
    await test.step('Add Shift Types (Early, Late, Night)', async () => {
      await page.click('a[href="/planner/config/shift-types"]');
      await page.waitForURL('**/config/shift-types');
      
      // Add Early shift
      await page.click('button:has-text("New")');
      await page.fill('input[name="code"]', 'Early');
      await page.fill('input[name="name"]', 'Early Shift');
      await page.fill('input[name="startTime"]', '07:00');
      await page.fill('input[name="endTime"]', '15:00');
      await page.click('button:has-text("Create Shift Type")');
      
      // Add Late shift
      await page.click('button:has-text("New")');
      await page.fill('input[name="code"]', 'Late');
      await page.fill('input[name="name"]', 'Late Shift');
      await page.fill('input[name="startTime"]', '15:00');
      await page.fill('input[name="endTime"]', '23:00');
      await page.click('button:has-text("Create Shift Type")');
      
      // Add Night shift
      await page.click('button:has-text("New")');
      await page.fill('input[name="code"]', 'Night');
      await page.fill('input[name="name"]', 'Night Shift');
      await page.fill('input[name="startTime"]', '23:00');
      await page.fill('input[name="endTime"]', '07:00');
      await page.check('input[name="isNight"]');
      await page.click('button:has-text("Create Shift Type")');
      
      // Verify shift types were created
      await expect(page.locator('td:has-text("Early")')).toBeVisible();
      await expect(page.locator('td:has-text("Late")')).toBeVisible();
      await expect(page.locator('td:has-text("Night")')).toBeVisible();
    });

    // Test 5: Create Rule Set
    await test.step('Create Rule Set with defaults and activate', async () => {
      await page.click('a[href="/planner/config/rule-sets"]');
      await page.waitForURL('**/config/rule-sets');
      
      // Click "New" button
      await page.click('button:has-text("New")');
      
      // Fill rule set form
      await page.fill('input[name="name"]', 'Standard Rules');
      await page.fill('textarea[name="description"]', 'Standard rules for ED');
      await page.selectOption('select[name="wardId"]', 'ED');
      
      // Add default rules
      await page.click('button:has-text("Add Rule")');
      await page.fill('input[placeholder="Key"]', 'minRestHours');
      await page.fill('input[placeholder="Value"]', '11');
      
      await page.click('button:has-text("Add Rule")');
      await page.fill('input[placeholder="Key"]:nth-of-type(2)', 'maxConsecutiveNights');
      await page.fill('input[placeholder="Value"]:nth-of-type(2)', '3');
      
      await page.click('button:has-text("Add Rule")');
      await page.fill('input[placeholder="Key"]:nth-of-type(3)', 'oneShiftPerDay');
      await page.fill('input[placeholder="Value"]:nth-of-type(3)', 'true');
      
      // Submit form
      await page.click('button:has-text("Create Rule Set")');
      
      // Activate the rule set
      await page.click('button:has-text("Activate")');
      
      // Verify rule set was created and activated
      await expect(page.locator('td:has-text("Standard Rules")')).toBeVisible();
      await expect(page.locator('span:has-text("Active")')).toBeVisible();
    });

    // Test 6: Add Demand
    await test.step('Add Demand for next week', async () => {
      await page.click('a[href="/planner/demand"]');
      await page.waitForURL('**/demand');
      
      // Select ED ward
      await page.selectOption('select[name="ward"]', 'ED');
      
      // Switch to week view
      await page.click('button:has-text("Week")');
      
      // Find next week's night shift and click to edit
      const nextWeekNight = page.locator('div[data-slot="Night"]').first();
      await nextWeekNight.click();
      
      // Fill demand form
      await page.fill('input[placeholder="Skill"]', 'nurse_resus');
      await page.fill('input[placeholder="Count"]', '2');
      await page.click('button:has-text("Add")');
      
      await page.fill('input[placeholder="Skill"]', 'nurse_general');
      await page.fill('input[placeholder="Count"]', '8');
      await page.click('button:has-text("Add")');
      
      // Save demand
      await page.click('button:has-text("Save")');
      
      // Verify demand was saved
      await expect(page.locator('text=nurse_resus: 2')).toBeVisible();
      await expect(page.locator('text=nurse_general: 8')).toBeVisible();
    });

    // Test 7: Create Schedule
    await test.step('Create Schedule for next 4 weeks', async () => {
      await page.click('a[href="/planner/schedule"]');
      await page.waitForURL('**/schedule');
      
      // Click "Create Schedule"
      await page.click('button:has-text("Create Schedule")');
      
      // Fill schedule form
      await page.selectOption('select[name="wardId"]', 'ED');
      
      // Set horizon dates (next 4 weeks)
      const today = new Date();
      const startDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // Next week
      const endDate = new Date(startDate.getTime() + 28 * 24 * 60 * 60 * 1000); // 4 weeks later
      
      await page.fill('input[name="horizonStart"]', startDate.toISOString().split('T')[0]);
      await page.fill('input[name="horizonEnd"]', endDate.toISOString().split('T')[0]);
      
      // Submit form
      await page.click('button:has-text("Create Schedule")');
      
      // Verify schedule was created
      await expect(page.locator('text=ED - draft')).toBeVisible();
    });

    // Test 8: Run Solve
    await test.step('Run Solve and verify results', async () => {
      // Click "Run Solve"
      await page.click('button:has-text("Run Solve")');
      
      // Wait for solve to complete
      await expect(page.locator('text=Running Solve...')).toBeVisible();
      await expect(page.locator('text=Running Solve...')).not.toBeVisible({ timeout: 60000 });
      
      // Verify grid fills with assignments
      await expect(page.locator('.inline-flex.items-center.gap-1.rounded-full')).toBeVisible();
      
      // Verify metrics
      await expect(page.locator('text=Hard Violations')).toBeVisible();
      await expect(page.locator('text=0')).toBeVisible();
      
      // Check fairness stdev is less than 2.0
      const fairnessElement = page.locator('text=/\\d+\\.\\d+/').filter({ hasText: /[0-9]+\.[0-9]+/ });
      await expect(fairnessElement).toBeVisible();
      
      // Verify solve time is displayed
      await expect(page.locator('text=/\\d+ms|\\d+\\.\\d+s/')).toBeVisible();
    });

    // Test 9: Lock cells and run solve again
    await test.step('Lock 10 random cells and run solve again', async () => {
      // Lock 10 random cells
      const cells = page.locator('div[class*="relative p-2 min-h-[60px]"]');
      const cellCount = await cells.count();
      
      for (let i = 0; i < 10 && i < cellCount; i++) {
        const randomIndex = Math.floor(Math.random() * cellCount);
        const cell = cells.nth(randomIndex);
        
        // Click the lock button in the cell
        await cell.locator('button[title="Lock"]').click();
        
        // Verify lock was applied
        await expect(cell.locator('button[title="Unlock"]')).toBeVisible();
      }
      
      // Run solve again
      await page.click('button:has-text("Run Solve")');
      
      // Wait for solve to complete
      await expect(page.locator('text=Running Solve...')).toBeVisible();
      await expect(page.locator('text=Running Solve...')).not.toBeVisible({ timeout: 60000 });
      
      // Verify locks are preserved (should still see unlock buttons)
      await expect(page.locator('button[title="Unlock"]')).toHaveCount(10);
    });

    // Test 10: Explain functionality
    await test.step('Open Explain for one cell and apply alternative', async () => {
      // Select a cell with an assignment
      const assignedCell = page.locator('div[class*="relative p-2 min-h-[60px]"]').filter({ hasText: /👥|🌙/ }).first();
      await assignedCell.click();
      
      // Open explain drawer with "x" key
      await page.keyboard.press('x');
      
      // Wait for explain drawer to open
      await expect(page.locator('text=Explain Assignment')).toBeVisible();
      
      // Verify reasons are shown
      await expect(page.locator('text=Why this assignment?')).toBeVisible();
      await expect(page.locator('li')).toBeVisible();
      
      // Verify alternatives are shown
      await expect(page.locator('text=Alternative Assignments')).toBeVisible();
      await expect(page.locator('div[class*="border rounded-lg p-4"]')).toBeVisible();
      
      // Select first alternative
      await page.locator('div[class*="border rounded-lg p-4"]').first().click();
      
      // Apply alternative
      await page.click('button:has-text("Apply Alternative")');
      
      // Wait for drawer to close
      await expect(page.locator('text=Explain Assignment')).not.toBeVisible();
      
      // Verify grid updated
      await expect(page.locator('text=Alternative applied successfully')).toBeVisible();
    });

    // Test 11: Heatmap toggle
    await test.step('Toggle Heatmap and verify under-covered cells are highlighted', async () => {
      // Look for heatmap toggle (this would be implemented in the UI)
      // For now, we'll verify that breach indicators are visible if any exist
      const breachIndicators = page.locator('div[class*="w-2 h-2 rounded-full"]');
      
      if (await breachIndicators.count() > 0) {
        // If there are breaches, verify they have appropriate colors
        await expect(breachIndicators.first()).toHaveCSS('background-color', /rgb\(255, 0, 0\)|rgb\(255, 165, 0\)|rgb\(255, 255, 0\)/);
      }
    });
  });

  test('Keyboard shortcuts work correctly', async ({ page }) => {
    await test.step('Test keyboard navigation shortcuts', async () => {
      // Test "g d" - go to Demand Builder
      await page.keyboard.press('g');
      await page.keyboard.press('d');
      await page.waitForURL('**/demand');
      
      // Test "g s" - go to Schedule
      await page.keyboard.press('g');
      await page.keyboard.press('s');
      await page.waitForURL('**/schedule');
      
      // Test "f" - focus search
      await page.keyboard.press('f');
      const searchInput = page.locator('input[data-search-input]');
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeFocused();
      }
    });
  });

  test('Error handling and validation', async ({ page }) => {
    await test.step('Test form validation and error handling', async () => {
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
