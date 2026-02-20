import {expect} from '@playwright/test'

import {test} from '../fixtures/signInFixture'

test('should be logged in and see settings page', async ({authenticatedPage}) => {
  await authenticatedPage.goto('/settings')

  await expect(authenticatedPage.getByRole('heading', {name: 'Theme'})).toBeVisible()
})
