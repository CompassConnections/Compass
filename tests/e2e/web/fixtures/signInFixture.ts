import {expect, Page, test as base} from '@playwright/test'

import {signUp} from '../../utils/firebaseUtils'
import {AuthPage} from '../pages/AuthPage'
import {config} from '../SPEC_CONFIG'

export const test = base.extend<{
  authenticatedPage: Page
}>({
  authenticatedPage: async ({page}, use) => {
    const authPage = new AuthPage(page)

    const email = config.USERS.DEV_1.EMAIL
    const password = config.USERS.DEV_1.PASSWORD

    try {
      await signUp(email, password)
    } catch (_e) {
      console.log('User already exists for signinFixture', email)
    }

    await page.goto('/signin')
    await authPage.fillEmailField(email)
    await authPage.fillPasswordField(password)
    await authPage.clickSignInWithEmailButton()

    await page.waitForURL(/^(?!.*signin).*$/)

    expect(page.url()).not.toContain('/signin')

    await use(page)
  },
})
