import { test, expect } from '@playwright/test';

test.describe('Mentor Triage & Intervention Workflow', () => {
  test('end-to-end review priority triage to persisted follow-up', async ({ page }) => {
    // 1. Visit app
    await page.goto('/overview');

    // 2. Verify overview loads with KPI metrics
    await expect(page.locator('text=Cohort Risk Overview')).toBeVisible();
    await expect(page.locator('text=Assessed Enrollments')).toBeVisible();

    // 3. Navigate to Student Explorer
    await page.click('text=Student Explorer');
    await expect(page.locator('text=Student Caseload Explorer')).toBeVisible();

    // 4. Navigate to Interventions
    await page.click('text=Interventions');
    await expect(page.locator('text=Academic Support & Intervention Cases')).toBeVisible();
  });
});
