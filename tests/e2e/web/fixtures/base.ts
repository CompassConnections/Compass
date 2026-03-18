import {test as base} from '@playwright/test'
import {AuthPage} from '../pages/AuthPage'
import {ComatibilityPage} from '../pages/compatibilityPage'
import {HomePage} from '../pages/homePage'
import {OnboardingPage} from '../pages/onboardingPage'
import {ProfilePage} from '../pages/profilePage'
import {SignUpPage} from '../pages/signUpPage'
import {testAccounts, UserAccountInformation} from '../utils/accountInformation'
import {deleteUser} from '../utils/deleteUser'

export type AuthObject = {
  idToken: string,
  localId: string,
}

export const test = base.extend<{
  homePage: HomePage
  onboardingPage: OnboardingPage
  signUpPage: SignUpPage
  profilePage: ProfilePage
  authPage: AuthPage
  compatabilityPage: ComatibilityPage
  cleanUpUsers: void
  onboardingAccount: UserAccountInformation
  fakerAccount: UserAccountInformation
  specAccount: UserAccountInformation
  googleAccount: UserAccountInformation
}>({
  onboardingAccount: async ({}, use) => {
    const account = testAccounts.email_account_all_info() // email captured here
    await use(account)
    console.log('Cleaning up onboarding 1 account...')
    await deleteUser('Email/Password', account.email, account.password) // same account, guaranteed
  },
  fakerAccount: async ({}, use) => {
    const account = testAccounts.faker_account()
    await use(account)
    console.log('Cleaning up faker account...')
    await deleteUser('Email/Password', account.email, account.password)
  },
  googleAccount: async ({page}, use) => {
    const account = testAccounts.google_account()
    let accountIdTokenAndLocalId: AuthObject | undefined
    await page.route("**/accounts:signInWithIdp**", async(route) => {
      const response = await route.fetch()
      const body = await response.json()
      accountIdTokenAndLocalId = {idToken: body.idToken, localId: body.localId}
      await route.fulfill({response})
    })
    await use(account)

    console.log('Cleaning up google account...')
    if (!accountIdTokenAndLocalId) {
      throw new Error("Sign-in was never intercepted — did the test actually sign in?");
    }
    await deleteUser('Google', undefined, undefined, accountIdTokenAndLocalId)
  },
  specAccount: async ({}, use) => {
    const account = testAccounts.spec_account()
    await use(account)
    console.log('Cleaning up spec account...')
    await deleteUser('Email/Password', account.email, account.password)
  },
  onboardingPage: async ({page}, use) => {
    const onboardingPage = new OnboardingPage(page)
    await use(onboardingPage)
  },
  homePage: async ({page}, use) => {
    const homePage = new HomePage(page)
    await use(homePage)
  },
  signUpPage: async ({page}, use) => {
    const signUpPage = new SignUpPage(page)
    await use(signUpPage)
  },
  authPage: async ({page}, use) => {
    const authPage = new AuthPage(page)
    await use(authPage)
  },
  profilePage: async ({page}, use) => {
    const profilePage = new ProfilePage(page)
    await use(profilePage)
  },
  compatabilityPage: async ({page}, use) => {
    const compatibilityPage = new ComatibilityPage(page)
    await use(compatibilityPage)
  },
})

export {expect} from '@playwright/test'
