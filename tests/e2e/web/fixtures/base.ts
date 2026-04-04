import {test as base} from '@playwright/test'
import {testAccounts, UserAccountInformation} from '../utils/accountInformation'
import {deleteUser} from '../utils/deleteUser'
import {getAuthAccountInfo} from '../utils/networkUtils'
import { App } from '../pages/app'

export const test = base.extend<{
  app: App
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
  app: async ({page}, use) => {
    const appPage = new App(page)
    await use(appPage)
  },
})

export {expect} from '@playwright/test'
