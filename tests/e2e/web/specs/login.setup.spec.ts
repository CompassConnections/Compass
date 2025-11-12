import { test as base, expect } from '@playwright/test';
import path from 'path';
import { LoginPage } from '../pages/login-page';
import { config } from '../config';

const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});

test('Login test', async ({ loginPage, page }) => {
  await test.step('Navigated to login page', async () => {
    await page.goto('/');
  });
  await test.step(
    'Logging in '.concat(page.url(), ' as ', config.DEFAULT_LOGIN),
    async () => {
      await page.waitForLoadState('networkidle');
      await loginPage.clickSignInText();
      await loginPage.fillEmailField(config.DEFAULT_LOGIN);
      await loginPage.fillPasswprdField(config.DEFAULT_PASSWORD);
      await page.waitForLoadState('networkidle');
      await loginPage.clickSignInWithEmailButton();
      await expect(page.getByText(/Sign in to your account/)).not.toBeVisible();
    },
  );

await test.step('Saved auth state', async () => {
  await page.context().storageState({
    path: path.resolve(__dirname, '..', '.auth', 'user.json'),
  });
});

});
