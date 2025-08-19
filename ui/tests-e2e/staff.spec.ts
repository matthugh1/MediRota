import { test, expect } from '@playwright/test';

test.describe('Staff Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to staff page
    await page.goto('/planner/staff');
  });

  test('should create, edit, and delete staff member', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="staff-table"]', { timeout: 10000 });

    // Click "New Staff" button
    await page.click('[data-testid="staff-new"]');

    // Wait for drawer to open
    await page.waitForSelector('[data-testid="staff-form"]');

    // Fill the form
    await page.fill('input[id="fullName"]', 'Dr. Jane Smith');
    
    // Select role (Doctor)
    await page.click('button:has-text("Select role")');
    await page.click('li:has-text("doctor")');
    
    // Select job (Doctor)
    await page.click('button:has-text("Select job")');
    await page.click('li:has-text("Doctor")');
    
    // Fill grade band
    await page.fill('input[id="gradeBand"]', 'Consultant');
    
    // Set contract hours
    await page.fill('input[id="contractHoursPerWeek"]', '37.5');
    
    // Select wards (if any exist)
    const wardSelect = page.locator('[data-testid="wardIds"]');
    if (await wardSelect.isVisible()) {
      await wardSelect.click();
      // Try to select first available ward
      const wardOptions = page.locator('[role="option"]');
      if (await wardOptions.count() > 0) {
        await wardOptions.first().click();
      }
    }
    
    // Select skills
    const skillSelect = page.locator('[data-testid="skillIds"]');
    if (await skillSelect.isVisible()) {
      await skillSelect.click();
      // Try to select Resus skill
      const resusOption = page.locator('[role="option"]:has-text("Resus")');
      if (await resusOption.isVisible()) {
        await resusOption.click();
      }
      
      // Try to select Ventilator skill
      const ventilatorOption = page.locator('[role="option"]:has-text("Ventilator")');
      if (await ventilatorOption.isVisible()) {
        await ventilatorOption.click();
      }
    }

    // Save the staff member
    await page.click('[data-testid="staff-save"]');

    // Wait for success toast and drawer to close
    await expect(page.locator('text=Staff Created')).toBeVisible();
    await expect(page.locator('[data-testid="staff-form"]')).not.toBeVisible();

    // Verify staff member appears in table
    await expect(page.locator('text=Dr. Jane Smith')).toBeVisible();
    await expect(page.locator('text=Doctor')).toBeVisible();
    await expect(page.locator('text=Consultant')).toBeVisible();

    // Search by name
    await page.click('[data-testid="staff-search"]');
    await page.fill('[data-testid="staff-search"]', 'Jane');
    
    // Verify filtered results
    await expect(page.locator('text=Dr. Jane Smith')).toBeVisible();

    // Clear search
    await page.fill('[data-testid="staff-search"]', '');

    // Edit the staff member
    const editButton = page.locator('tr:has-text("Dr. Jane Smith") button[title="Edit staff member"]');
    await editButton.click();

    // Wait for drawer to open
    await page.waitForSelector('[data-testid="staff-form"]');

    // Toggle active status to false
    await page.uncheck('input[type="checkbox"]');

    // Add another skill
    const skillSelectEdit = page.locator('[data-testid="skillIds"]');
    if (await skillSelectEdit.isVisible()) {
      await skillSelectEdit.click();
      // Try to select MRI Scanning skill
      const mriOption = page.locator('[role="option"]:has-text("MRI")');
      if (await mriOption.isVisible()) {
        await mriOption.click();
      }
    }

    // Save changes
    await page.click('[data-testid="staff-save"]');

    // Wait for success toast
    await expect(page.locator('text=Staff Updated')).toBeVisible();

    // Verify changes in table
    await expect(page.locator('text=Inactive')).toBeVisible();

    // Delete the staff member
    const deleteButton = page.locator('tr:has-text("Dr. Jane Smith") button[title="Delete staff member"]');
    await deleteButton.click();

    // Confirm deletion
    await expect(page.locator('text=Delete Staff Member')).toBeVisible();
    await page.click('button:has-text("Delete")');

    // Wait for success toast
    await expect(page.locator('text=Staff Deleted')).toBeVisible();

    // Verify staff member is removed
    await expect(page.locator('text=Dr. Jane Smith')).not.toBeVisible();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="staff-table"]', { timeout: 10000 });

    // Test "/" shortcut to focus search
    await page.keyboard.press('/');
    await expect(page.locator('[data-testid="staff-search"]')).toBeFocused();

    // Test "n" shortcut to open new staff drawer
    await page.keyboard.press('n');
    await expect(page.locator('[data-testid="staff-form"]')).toBeVisible();
  });

  test('should show empty state when no staff exist', async ({ page }) => {
    // If no staff exist, should show empty state
    const emptyState = page.locator('text=No Staff Members');
    const addButton = page.locator('[data-testid="staff-new"]:has-text("Add First Staff Member")');
    
    // Either empty state or table should be visible
    const hasStaff = await page.locator('[data-testid="staff-table"]').isVisible();
    
    if (!hasStaff) {
      await expect(emptyState).toBeVisible();
      await expect(addButton).toBeVisible();
    }
  });

  test('should handle form validation', async ({ page }) => {
    // Click "New Staff" button
    await page.click('[data-testid="staff-new"]');

    // Wait for drawer to open
    await page.waitForSelector('[data-testid="staff-form"]');

    // Try to save without filling required fields
    await page.click('[data-testid="staff-save"]');

    // Should show validation errors
    await expect(page.locator('text=Full name is required')).toBeVisible();
    await expect(page.locator('text=Role is required')).toBeVisible();
    await expect(page.locator('text=Job is required')).toBeVisible();

    // Fill required fields
    await page.fill('input[id="fullName"]', 'Test Staff');
    await page.click('button:has-text("Select role")');
    await page.click('li:has-text("nurse")');
    await page.click('button:has-text("Select job")');
    await page.click('li:has-text("Nurse")');

    // Try to save again
    await page.click('[data-testid="staff-save"]');

    // Should save successfully
    await expect(page.locator('text=Staff Created')).toBeVisible();
  });
});
