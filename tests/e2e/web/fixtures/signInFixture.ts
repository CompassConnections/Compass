import {test as base} from '@playwright/test'
import {App} from '../pages/app'
import {testAccounts, UserAccountInformation} from '../utils/accountInformation'

export const test = base.extend<{
  app: App
  dev_one_account: UserAccountInformation
  fakerAccount: UserAccountInformation
  googleAccountOne: UserAccountInformation
  googleAccountTwo: UserAccountInformation
}>({
  app: async ({page}, use) => {
    const appPage = new App(page)
    await use(appPage)
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
