import {test as base} from '@playwright/test'
import { getAuthAccountInfo } from "../utils/networkUtils";
import {AuthPage} from '../pages/AuthPage'
import {ComatibilityPage} from '../pages/compatibilityPage'
import {HomePage} from '../pages/homePage'
import {OnboardingPage} from '../pages/onboardingPage'
import {OrganizationPage} from '../pages/organizationPage'
import {ProfilePage} from '../pages/profilePage'
import {SettingsPage} from '../pages/settingsPage'
import {SignUpPage} from '../pages/signUpPage'
import {SocialPage} from '../pages/socialPage'
import {testAccounts, UserAccountInformation} from '../utils/accountInformation'
import {deleteUser} from '../utils/deleteUser'
import {getAuthAccountInfo} from '../utils/networkUtils'

export const test = base.extend<{
  homePage: HomePage
  onboardingPage: OnboardingPage
  signUpPage: SignUpPage
  profilePage: ProfilePage
  authPage: AuthPage
  settingsPage: SettingsPage
  socialPage: SocialPage
  organizationPage: OrganizationPage
  compatabilityPage: ComatibilityPage
  cleanUpUsers: void
  onboardingAccount: UserAccountInformation
  fakerAccount: UserAccountInformation
  specAccount: UserAccountInformation
  googleAccountOne: UserAccountInformation
  googleAccountTwo: UserAccountInformation
}>({
  onboardingAccount: async ({}, use) => {
    const account = testAccounts.email_account_all_info() // email captured here
    await use(account)
    console.log('Cleaning up onboarding 1 account...')
    await deleteUser('Email/Password', account) // same account, guaranteed
  },
  fakerAccount: async ({}, use) => {
    const account = testAccounts.faker_account()
    await use(account)
    console.log('Cleaning up faker account...')
    await deleteUser('Email/Password', account)
  },
  googleAccountOne: async ({page}, use) => {
    const account = testAccounts.google_account_one()
    const getAuthObject = await getAuthAccountInfo(page)
    await use(account)
    console.log('Cleaning up google account...')
    await deleteUser('Google', undefined, getAuthObject())
  },
  googleAccountTwo: async ({page}, use) => {
    const account = testAccounts.google_account_two()
    const getAuthObject = await getAuthAccountInfo(page)
    await use(account)
    console.log('Cleaning up google account...')
    await deleteUser('Google', undefined, getAuthObject())
  },
  specAccount: async ({}, use) => {
    const account = testAccounts.spec_account()
    await use(account)
    console.log('Cleaning up spec account...')
    await deleteUser('Email/Password', account)
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
  settingsPage: async ({page}, use) => {
    const settingsPage = new SettingsPage(page)
    await use(settingsPage)
  },
  socialPage: async ({page}, use) => {
    const socialPage = new SocialPage(page)
    await use(socialPage)
  },
  organizationPage: async ({page}, use) => {
    const organizationPage = new OrganizationPage(page)
    await use(organizationPage)
  },
})

export {expect} from '@playwright/test'
