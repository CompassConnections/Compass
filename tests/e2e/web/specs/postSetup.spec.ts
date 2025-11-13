import { test, expect } from '@playwright/test';

//the first test is to confirm setup.ts works

test('should be logged and see organization link', async ({ page }) => {
    await page.goto('/Organization');
    await expect(page.getByRole('link', {name: 'Organization'} )).toBeVisible(); 
});
