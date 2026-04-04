import {test as base} from '@playwright/test'
import {AuthPage} from '../pages/AuthPage'
import {HomePage} from '../pages/homePage'
import {testAccounts, UserAccountInformation} from '../utils/accountInformation'
import { OnboardingPage } from '../pages/onboardingPage'
import { SignUpPage } from '../pages/signUpPage'
import { ProfilePage } from '../pages/profilePage'
import { SettingsPage } from '../pages/settingsPage'

export const test = base.extend<{
  homePage: HomePage
  onboardingPage: OnboardingPage
  signUpPage: SignUpPage
  profilePage: ProfilePage
  settingsPage: SettingsPage
  authPage: AuthPage
  dev_one_account: UserAccountInformation
  fakerAccount: UserAccountInformation
  googleAccountOne: UserAccountInformation
  googleAccountTwo: UserAccountInformation
}>({
  homePage: async ({page}, use) => {
    const homePage = new HomePage(page)
    await use(homePage)
  },
  onboardingPage: async ({page}, use) => {
    const onboardingPage = new OnboardingPage(page)
    await use(onboardingPage)
  },
  signUpPage: async ({page}, use) => {
    const signUpPage = new SignUpPage(page)
    await use(signUpPage)
  },
  profilePage: async ({page}, use) => {
    const profilePage = new ProfilePage(page)
    await use(profilePage)
  },
  settingsPage: async ({page}, use) => {
    const settingsPage = new SettingsPage(page)
    await use(settingsPage)
  },
  authPage: async ({page}, use) => {
    const authPage = new AuthPage(page)
    await use(authPage)
  },
  dev_one_account: async ({}, use) => {
    const account = testAccounts.dev_one_account()
    await use(account)
  },
  fakerAccount: async ({}, use) => {
    const account = testAccounts.faker_account()
    await use(account)
  },
  googleAccountOne: async ({}, use) => {
    const account = testAccounts.google_account_one()
    await use(account)
  },
  googleAccountTwo: async ({}, use) => {
    const account = testAccounts.google_account_two()
    await use(account)
  },
})

export {expect} from '@playwright/test'
