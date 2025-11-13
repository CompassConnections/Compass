import { test as base, expect } from '@playwright/test';
import { SignInPage } from '../pages/signInPage';
import { config } from '../TESTING_CONFIG';

//Baisc login using fixture created from signInPage

const test = base.extend<{ signInPage: SignInPage }>({
  signInPage: async ({ page }, use) => {
    const signInPage = new SignInPage(page);
    await use(signInPage);
  },
});

test('Signin test', async ({ signInPage, page }) => {
  await test.step('Navigated to login page', async () => {
    await page.goto('/');
  });
  await test.step(
    'Logging in '.concat(page.url(), ' as ', config.DEFAULT_LOGIN),
    async () => {
      await page.waitForLoadState('networkidle');
      await signInPage.clickSignInText();
      await signInPage.fillEmailField(config.DEFAULT_LOGIN);
      await signInPage.fillPasswprdField(config.DEFAULT_PASSWORD);
      await page.waitForLoadState('networkidle');
      await signInPage.clickSignInWithEmailButton();
      await expect(page.getByText(/Sign in to your account/)).not.toBeVisible();
    },
  );

});
