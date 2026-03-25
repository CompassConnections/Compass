import {test, expect} from '../fixtures/signInFixture'
import * as fs from "fs";

test.describe('when given valid input', () => {
  test('should be logged in and see settings page', async ({ 
    authenticatedPage,
    homePage,
  }) => {
    await homePage.gotToHomePage()
    // await authenticatedPage.goto('/settings')

    // await expect(authenticatedPage.getByRole('heading', { name: 'Theme' })).toBeVisible()
  })
});

test.describe('when an error occurs', () => {
  test('placeholder', async () => {});
});

