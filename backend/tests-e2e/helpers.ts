import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  async navigateToPlanner() {
    await this.page.goto('/planner');
    await this.page.waitForSelector('nav[aria-label="Primary"]');
  }

  async createWard(name: string, hourlyGranularity = false) {
    await this.page.click('a[href="/planner/config/wards"]');
    await this.page.waitForURL('**/config/wards');
    
    await this.page.click('button:has-text("New")');
    await this.page.fill('input[name="name"]', name);
    
    if (hourlyGranularity) {
      await this.page.check('input[name="hourlyGranularity"]');
    }
    
    await this.page.click('button:has-text("Create Ward")');
    await expect(this.page.locator(`td:has-text("${name}")`)).toBeVisible();
  }

  async createSkill(code: string, name: string) {
    await this.page.click('a[href="/planner/config/skills"]');
    await this.page.waitForURL('**/config/skills');
    
    await this.page.click('button:has-text("New")');
    await this.page.fill('input[name="code"]', code);
    await this.page.fill('input[name="name"]', name);
    await this.page.click('button:has-text("Create Skill")');
    
    await expect(this.page.locator(`td:has-text("${code}")`)).toBeVisible();
  }

  async createShiftType(code: string, name: string, startTime: string, endTime: string, isNight = false) {
    await this.page.click('a[href="/planner/config/shift-types"]');
    await this.page.waitForURL('**/config/shift-types');
    
    await this.page.click('button:has-text("New")');
    await this.page.fill('input[name="code"]', code);
    await this.page.fill('input[name="name"]', name);
    await this.page.fill('input[name="startTime"]', startTime);
    await this.page.fill('input[name="endTime"]', endTime);
    
    if (isNight) {
      await this.page.check('input[name="isNight"]');
    }
    
    await this.page.click('button:has-text("Create Shift Type")');
    await expect(this.page.locator(`td:has-text("${code}")`)).toBeVisible();
  }

  async createRuleSet(name: string, description: string, wardId: string, rules: Array<{key: string, value: string}>) {
    await this.page.click('a[href="/planner/config/rule-sets"]');
    await this.page.waitForURL('**/config/rule-sets');
    
    await this.page.click('button:has-text("New")');
    await this.page.fill('input[name="name"]', name);
    await this.page.fill('textarea[name="description"]', description);
    await this.page.selectOption('select[name="wardId"]', wardId);
    
    // Add rules
    for (const rule of rules) {
      await this.page.click('button:has-text("Add Rule")');
      const keyInputs = this.page.locator('input[placeholder="Key"]');
      const valueInputs = this.page.locator('input[placeholder="Value"]');
      const lastKeyInput = keyInputs.last();
      const lastValueInput = valueInputs.last();
      
      await lastKeyInput.fill(rule.key);
      await lastValueInput.fill(rule.value);
    }
    
    await this.page.click('button:has-text("Create Rule Set")');
    await expect(this.page.locator(`td:has-text("${name}")`)).toBeVisible();
  }

  async addDemand(wardName: string, slot: string, demands: Array<{skill: string, count: number}>) {
    await this.page.click('a[href="/planner/demand"]');
    await this.page.waitForURL('**/demand');
    
    await this.page.selectOption('select[name="ward"]', wardName);
    await this.page.click('button:has-text("Week")');
    
    const slotElement = this.page.locator(`div[data-slot="${slot}"]`).first();
    await slotElement.click();
    
    for (const demand of demands) {
      await this.page.fill('input[placeholder="Skill"]', demand.skill);
      await this.page.fill('input[placeholder="Count"]', demand.count.toString());
      await this.page.click('button:has-text("Add")');
    }
    
    await this.page.click('button:has-text("Save")');
    
    // Verify demands were saved
    for (const demand of demands) {
      await expect(this.page.locator(`text=${demand.skill}: ${demand.count}`)).toBeVisible();
    }
  }

  async createSchedule(wardName: string, horizonStart: string, horizonEnd: string) {
    await this.page.click('a[href="/planner/schedule"]');
    await this.page.waitForURL('**/schedule');
    
    await this.page.click('button:has-text("Create Schedule")');
    await this.page.selectOption('select[name="wardId"]', wardName);
    await this.page.fill('input[name="horizonStart"]', horizonStart);
    await this.page.fill('input[name="horizonEnd"]', horizonEnd);
    await this.page.click('button:has-text("Create Schedule")');
    
    await expect(this.page.locator(`text=${wardName} - draft`)).toBeVisible();
  }

  async runSolve() {
    await this.page.click('button:has-text("Run Solve")');
    await expect(this.page.locator('text=Running Solve...')).toBeVisible();
    await expect(this.page.locator('text=Running Solve...')).not.toBeVisible({ timeout: 60000 });
    
    // Verify solve completed successfully
    await expect(this.page.locator('.inline-flex.items-center.gap-1.rounded-full')).toBeVisible();
    await expect(this.page.locator('text=Hard Violations')).toBeVisible();
  }

  async lockRandomCells(count: number) {
    const cells = this.page.locator('div[class*="relative p-2 min-h-[60px]"]');
    const cellCount = await cells.count();
    
    for (let i = 0; i < count && i < cellCount; i++) {
      const randomIndex = Math.floor(Math.random() * cellCount);
      const cell = cells.nth(randomIndex);
      
      await cell.locator('button[title="Lock"]').click();
      await expect(cell.locator('button[title="Unlock"]')).toBeVisible();
    }
  }

  async openExplainForCell() {
    const assignedCell = this.page.locator('div[class*="relative p-2 min-h-[60px]"]').filter({ hasText: /👥|🌙/ }).first();
    await assignedCell.click();
    await this.page.keyboard.press('x');
    
    await expect(this.page.locator('text=Explain Assignment')).toBeVisible();
    await expect(this.page.locator('text=Why this assignment?')).toBeVisible();
    await expect(this.page.locator('text=Alternative Assignments')).toBeVisible();
  }

  async applyAlternative() {
    await this.page.locator('div[class*="border rounded-lg p-4"]').first().click();
    await this.page.click('button:has-text("Apply Alternative")');
    await expect(this.page.locator('text=Explain Assignment')).not.toBeVisible();
    await expect(this.page.locator('text=Alternative applied successfully')).toBeVisible();
  }

  async testSidebarNavigation() {
    // Test collapse/expand
    await expect(this.page.locator('aside')).toHaveCSS('width', '280px');
    await this.page.click('button[aria-label="Collapse sidebar"]');
    await expect(this.page.locator('aside')).toHaveCSS('width', '80px');
    await this.page.keyboard.press(']');
    await expect(this.page.locator('aside')).toHaveCSS('width', '280px');
  }

  async testKeyboardShortcuts() {
    // Test "g d" - go to Demand Builder
    await this.page.keyboard.press('g');
    await this.page.keyboard.press('d');
    await this.page.waitForURL('**/demand');
    
    // Test "g s" - go to Schedule
    await this.page.keyboard.press('g');
    await this.page.keyboard.press('s');
    await this.page.waitForURL('**/schedule');
  }
}
