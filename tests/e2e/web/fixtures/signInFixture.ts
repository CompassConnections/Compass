import {expect, Page, test as base} from '@playwright/test'

import {seedUser} from '../../utils/seedDatabase'
import {AuthPage} from '../pages/AuthPage'
import { HomePage } from "../pages/homePage";
import { testAccounts, UserAccountInformation } from "../utils/accountInformation";

export const test = base.extend<{
  authenticatedPage: Page
  signedInPage: AuthPage
  authPage: AuthPage
  homePage: HomePage
  dev_one_account: UserAccountInformation
}>({
  authenticatedPage: async ({
    page,
    homePage,
    authPage,
  }, use) => {
    const dev_1_Account = testAccounts.dev_one_account()
    // const authPage = new AuthPage(page)
    
    try {
      await seedUser(
        dev_1_Account.email,
        dev_1_Account.password,
        undefined,
        dev_1_Account.display_name,
        dev_1_Account.username
      )
    } catch (_e) {
      console.log('User already exists for signinFixture', dev_1_Account.email)
    }
    await homePage.gotToSigninPage()
    // await page.goto('/signin')
    await authPage.fillEmailField(dev_1_Account.email)
    await authPage.fillPasswordField(dev_1_Account.password)
    await authPage.clickSignInWithEmailButton()

    await page.waitForURL(/^(?!.*signin).*$/)

    expect(page.url()).not.toContain('/signin')

    await use(page)
  },
  homePage: async ({page}, use) => {
    const homePage = new HomePage(page)
    await use(homePage)
  },
  authPage: async ({page}, use) => {
    const authPage = new AuthPage(page)
    await use(authPage)
  },
  dev_one_account: async ({}, use) => {
    const account = testAccounts.dev_one_account()
    await use(account)
  }
})

export {expect} from '@playwright/test'