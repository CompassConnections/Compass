import { test, expect } from '@playwright/test';

//the first test is to confirm setup.ts works

test('should be logged and see settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', {name: 'Theme'} )).toBeVisible(); 
});
