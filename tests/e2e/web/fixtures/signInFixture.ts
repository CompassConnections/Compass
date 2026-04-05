import {test as base} from '@playwright/test'

import {seedUser} from '../../utils/seedDatabase'
import {App} from '../pages/app'
import {testAccounts, UserAccountInformation} from '../utils/accountInformation'
import {deleteUser} from '../utils/deleteUser'

export const test = base.extend<{
  app: App
  dev_one_account: UserAccountInformation
  fakerAccount: UserAccountInformation
  googleAccountOne: UserAccountInformation
  googleAccountTwo: UserAccountInformation
  signedInAccount: UserAccountInformation
  signedOutAccount: UserAccountInformation
}>({
  app: async ({page}, use) => {
    const appPage = new App(page)
    await use(appPage)
  },
  signedInAccount: async ({app}: {app: App}, use) => {
    const account = testAccounts.faker_account()
    await seedUser(
      account.email,
      account.password,
      undefined,
      account.display_name,
      account.username,
    )
    await app.signinWithEmail(account)
    await use(account)
    await deleteUser('Email/Password', account)
  },
  signedOutAccount: async ({app}: {app: App}, use) => {
    const account = testAccounts.faker_account()
    await seedUser(
      account.email,
      account.password,
      undefined,
      account.display_name,
      account.username,
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
