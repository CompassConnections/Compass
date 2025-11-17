import { test as base, Page } from '@playwright/test';
import { SignInPage } from '../pages/signInPage';
import { config } from '../TESTING_CONFIG';

export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    const signInPage = new SignInPage(page);

    await page.goto('/signin');
    await signInPage.fillEmailField(config.DEFAULT_LOGIN);
    await signInPage.fillPasswprdField(config.DEFAULT_PASSWORD);
    await signInPage.clickSignInWithEmailButton();

    await page.waitForLoadState('networkidle');

    await use(page);
  },
});
