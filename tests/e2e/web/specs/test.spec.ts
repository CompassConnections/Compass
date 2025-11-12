import { test, expect } from '@playwright/test';

test('should be logged in and see the dashboard', async ({ page }) => {
  await page.goto('/Organization');
  await expect(page.getByRole('link', {name: 'Organization'} )).toBeVisible(); 
});