import { test as base, Page, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { config } from '../SPEC_CONFIG';

export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);

    await page.goto('/signin');
    await authPage.fillEmailField(config.USERS.DEV_1.EMAIL);
    await authPage.fillPasswordField(config.USERS.DEV_1.PASSWORD);
    await authPage.clickSignInWithEmailButton();

    await page.waitForURL(/^(?!.*signin).*$/);

    expect(page.url()).not.toContain('/signin')

    await use(page);
  },
});
