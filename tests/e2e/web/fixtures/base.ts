import {test as base} from '@playwright/test'

import {AuthPage} from '../pages/AuthPage'
import {ComatibilityPage} from '../pages/compatibilityPage'
import {HomePage} from '../pages/homePage'
import {OnboardingPage} from '../pages/onboardingPage'
import {ProfilePage} from '../pages/profilePage'
import {SignUpPage} from '../pages/signUpPage'
import {onboarding, OnboardingUser} from '../utils/accountInformation'
import {deleteUser} from '../utils/deleteUser'

export const test = base.extend<{
  homePage: HomePage
  onboardingPage: OnboardingPage
  signUpPage: SignUpPage
  profilePage: ProfilePage
  authPage: AuthPage
  compatabilityPage: ComatibilityPage
  cleanUpUsers: void
  testAccount: OnboardingUser
  fakerAccount: OnboardingUser
}>({
  testAccount: async ({}, use) => {
    const account = onboarding.account_one() // email captured here
    await use(account)
    console.log('Cleaning up onboarding 1 account...')
    await deleteUser(account.email, account.password) // same account, guaranteed
  },
  fakerAccount: async ({}, use) => {
    const account = onboarding.faker_account() // email captured here
    await use(account)
    console.log('Cleaning up faker account...')
    await deleteUser(account.email, account.password) // same account, guaranteed
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
