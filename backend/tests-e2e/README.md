# E2E Tests for MediRota

This directory contains end-to-end tests for the MediRota application using Playwright.

## Test Structure

- `planner.spec.ts` - Comprehensive test covering the full planner desktop flow
- `planner-simple.spec.ts` - Simplified test using helper functions
- `helpers.ts` - Reusable test helper functions

## Running Tests

### Prerequisites

1. Ensure the backend server is running
2. Ensure the UI development server is running
3. Ensure the solver service is running
4. Ensure the database is set up with test data

### Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test planner.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

## Test Scenarios

### Complete First-Solve Journey

The main test covers the complete workflow:

1. **Sidebar Navigation**
   - Collapse/expand via toggle button
   - Keyboard shortcuts `[` and `]`

2. **Configuration Setup**
   - Create Ward "ED" with hourly granularity
   - Add Skills: nurse_general, nurse_resus
   - Add Shift Types: Early, Late, Night
   - Create Rule Set with defaults and activate

3. **Demand Planning**
   - Add demand for next week
   - Set nurse_resus=2, nurse_general=8 for Nights

4. **Schedule Creation**
   - Create schedule for next 4 weeks
   - Verify schedule is in draft status

5. **Solve Execution**
   - Run solve and verify completion
   - Check metrics: Hard Violations=0, Fairness stdev < 2.0
   - Verify solve time is displayed

6. **Lock Management**
   - Lock 10 random cells
   - Run solve again
   - Verify locks are preserved

7. **Explain Functionality**
   - Open explain for a cell
   - View reasons and alternatives
   - Apply an alternative
   - Verify grid updates

8. **Keyboard Shortcuts**
   - Test `g d` (go to Demand Builder)
   - Test `g s` (go to Schedule)
   - Test `f` (focus search)

## Test Helpers

The `TestHelpers` class provides reusable functions for common operations:

- `createWard()` - Create a new ward
- `createSkill()` - Create a new skill
- `createShiftType()` - Create a new shift type
- `createRuleSet()` - Create a rule set with rules
- `addDemand()` - Add demand for a specific slot
- `createSchedule()` - Create a new schedule
- `runSolve()` - Run the solver and wait for completion
- `lockRandomCells()` - Lock random cells in the grid
- `openExplainForCell()` - Open explain drawer for a cell
- `applyAlternative()` - Apply an alternative assignment

## CI/CD Integration

The tests are automatically run on:

- Pull requests to `main` and `develop` branches
- Pushes to `main` and `develop` branches

The GitHub Actions workflow:

1. Sets up PostgreSQL database
2. Installs dependencies
3. Starts backend and solver services
4. Runs E2E tests
5. Uploads test results and videos as artifacts

## Debugging

### View Test Results

After running tests, view the HTML report:

```bash
npx playwright show-report
```

### Debug Mode

Run tests in debug mode to step through:

```bash
npm run test:e2e:debug
```

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots
- Videos
- Traces

These are saved in `test-results/` and `playwright-report/`.

## Writing New Tests

1. Use the existing test structure as a template
2. Leverage the `TestHelpers` class for common operations
3. Use `test.step()` to organize test sections
4. Add appropriate assertions to verify expected behavior
5. Include error handling and edge cases

## Best Practices

- Use descriptive test names and step descriptions
- Wait for elements to be visible before interacting
- Use data attributes for reliable element selection
- Handle async operations properly
- Clean up test data when necessary
- Use page object model for complex pages
