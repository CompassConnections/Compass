import {expect} from '@playwright/test'

import {test} from '../fixtures/deleteUserFixture'
import {AuthPage} from '../pages/AuthPage'
import {config} from '../SPEC_CONFIG'

test('user can sign up with email + password', async ({page}) => {
  const auth = new AuthPage(page)

  await page.goto('/')

  await auth.clickSignUpButton()

  await auth.fillEmailField(config.USERS.SPEC.EMAIL)
  await auth.fillPasswordField(config.USERS.SPEC.PASSWORD)

  await auth.clickSignUpWithEmailButton()

  await page.waitForURL(/^(?!.*\/signup).*$/)

  expect(page.url()).not.toContain('/signup')
})
