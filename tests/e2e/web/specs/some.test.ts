import {expect, test} from '@playwright/test';

test('shows', async ({page}) => {
  await page.goto('/'); // Adjust this to your route
  expect(await page.title()).toBe('Compass');
  //
  // const spinner = page.locator('[data-testid="spinner"]');
  // await expect(spinner).toBeVisible();
});
