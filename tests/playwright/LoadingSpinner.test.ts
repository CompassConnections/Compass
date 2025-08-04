import {expect, test} from '@playwright/test';

test('shows loading spinner on load', async ({page}) => {
  await page.goto('http://localhost:3000/profiles'); // Adjust this to your route

  const spinner = page.locator('[data-testid="spinner"]');
  await expect(spinner).toBeVisible();
});
