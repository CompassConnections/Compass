import {test as base} from '@playwright/test'

import {seedUser} from '../../utils/seedDatabase'
import {App} from '../pages/app'
import {testAccounts, UserAccountInformation} from '../utils/accountInformation'
import {deleteUser} from '../utils/deleteUser'

export const test = base.extend<{
  app: App
  app2: App
  devOneAccount: UserAccountInformation
  devTwoAccount: UserAccountInformation
  specAccount: UserAccountInformation
  fakerAccount: UserAccountInformation
  googleAccountOne: UserAccountInformation
  googleAccountTwo: UserAccountInformation
  signedInAccount: UserAccountInformation
  signedOutAccount: UserAccountInformation
}>({
  app: async ({page}, use) => {
    const appPage = new App(page)
    await use(appPage)
    await appPage.contextManager?.closeAll()
  },
  app2: async ({browser}, use) => {
    // Totally isolated app which can be used to sign in a different user
    // Use {storageState: 'auth/receiver.json'} later on to save compute time by signing in only once
    const context = await browser.newContext()
    const page = await context.newPage()
    await use(new App(page))
    await context.close() // guaranteed teardown, even on failure/timeout
  },
  signedInAccount: async ({app}: {app: App}, use) => {
    const account = testAccounts.faker_account()
    await seedUser(
      account.email,
      account.password,
      undefined,
      account.display_name,
      account.username,
      true,
    )
    await app.signinWithEmail(account)
    await use(account)
    await deleteUser('Email/Password', account)
  },
  signedOutAccount: async ({}, use) => {
    const account = testAccounts.faker_account()
    await seedUser(
      account.email,
      account.password,
      undefined,
      account.display_name,
      account.username,
      true,
    )
    await use(account)
    await deleteUser('Email/Password', account)
  },
  devOneAccount: async ({}, use) => {
    const account = testAccounts.dev_one_account()
    await seedUser(
      account.email,
      account.password,
      undefined,
      account.display_name,
      account.username,
      true,
    )
    await use(account)
    await deleteUser('Email/Password', account)
  },
  devTwoAccount: async ({}, use) => {
    const account = testAccounts.dev_two_account()
    await seedUser(
      account.email,
      account.password,
      undefined,
      account.display_name,
      account.username,
      true,
    )
    await use(account)
    await deleteUser('Email/Password', account)
  },
  specAccount: async ({}, use) => {
    const account = testAccounts.spec_account()
    await seedUser(
      account.email,
      account.password,
      undefined,
      account.display_name,
      account.username,
      true,
    )
    await use(account)
    await deleteUser('Email/Password', account)
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
