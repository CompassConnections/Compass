import {expect, Page, test as base} from '@playwright/test'

import {seedUser} from '../../utils/seedDatabase'
import {AuthPage} from '../pages/AuthPage'
import {HomePage} from '../pages/homePage'
import {testAccounts, UserAccountInformation} from '../utils/accountInformation'

export const test = base.extend<{
  signedInPage: Page
  authPage: AuthPage
  homePage: HomePage
  dev_one_account: UserAccountInformation
}>({
  signedInPage: async ({
    page,
    authPage,
    homePage,
    dev_one_account
  }, use) => {
    await homePage.gotToSigninPage()
    await authPage.fillEmailField(dev_one_account.email)
    await authPage.fillPasswordField(dev_one_account.password)
    await authPage.clickSignInWithEmailButton()
    await homePage.goToHomePage()
    await homePage.verifySignedInHomePage(dev_one_account.display_name)

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
  },
})

export {expect} from '@playwright/test'
