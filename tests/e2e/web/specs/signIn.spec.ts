import { userInformationFromDb } from '../../utils/databaseUtils'
import {seedUser} from '../../utils/seedDatabase'
import {expect, test} from '../fixtures/signInFixture'
import {testAccounts} from '../utils/accountInformation'
import {
  deleteProfileFromSettings,
  registerWithEmail,
  signinWithEmail,
  skipOnboardingHeadToProfile
} from '../utils/testCleanupHelpers'

//Seed the account
test.beforeAll(async () => {
  const dev_1_Account = testAccounts.dev_one_account()
  try {
    await seedUser(
      dev_1_Account.email,
      dev_1_Account.password,
      undefined,
      dev_1_Account.display_name,
      dev_1_Account.username,
    )
  } catch (_e) {
    console.log('User already exists for signinFixture', dev_1_Account.email)
  }
})

test.describe('when given valid input', () => {
  test('should be able to sign in to an available account', async ({
    homePage,
    authPage,
    dev_one_account,
  }) => {
    console.log(
      `Starting "should be able to sign in to an available account" with ${dev_one_account.username}`,
    )
    await signinWithEmail(homePage, authPage, dev_one_account)
    await homePage.goToHomePage()
    await homePage.verifySignedInHomePage(dev_one_account.display_name)
  })

  test('should successfully delete an account created via email and password', async ({
    homePage,
    onboardingPage,
    signUpPage,
    authPage,
    profilePage,
    settingsPage,
    fakerAccount,
  }) => {
    console.log(
      `Starting "should successfully delete an account created via email and password" with ${fakerAccount.username}`,
    )
    await registerWithEmail(homePage, authPage, fakerAccount)
    await skipOnboardingHeadToProfile(onboardingPage, signUpPage, profilePage, fakerAccount)

    //Verify displayed information is correct
    await profilePage.verifyDisplayName(fakerAccount.display_name)

    //Verify database info
    const dbInfo = await userInformationFromDb(fakerAccount)

    await expect(dbInfo.user.name).toContain(fakerAccount.display_name)
    await expect(dbInfo.user.username).toContain(fakerAccount.username)

    await deleteProfileFromSettings(homePage, settingsPage)
  })

  test('should successfully delete an account created via google auth', async ({
    homePage,
    onboardingPage,
    signUpPage,
    authPage,
    profilePage,
    settingsPage,
    googleAccountTwo,
    headless,
  }) => {
    console.log(
      `Starting "should successfully delete an account created via google auth" with ${googleAccountTwo.username}`,
    )
    test.skip(headless, 'Google popup auth test requires headed mode')
    await homePage.goToRegisterPage()
    await authPage.fillPasswordField('') //The test only passes when this is added...something is weird here
    await authPage.signInToGoogleAccount(
      googleAccountTwo.email,
      googleAccountTwo.display_name,
      googleAccountTwo.username,
    )
    await skipOnboardingHeadToProfile(onboardingPage, signUpPage, profilePage, googleAccountTwo)

    //Verify displayed information is correct
    await profilePage.verifyDisplayName(googleAccountTwo.display_name)

    //Verify database info
    const dbInfo = await userInformationFromDb(googleAccountTwo)

    await expect(dbInfo.user.name).toContain(googleAccountTwo.display_name)
    await expect(dbInfo.user.username).toContain(googleAccountTwo.username)

    await deleteProfileFromSettings(homePage, settingsPage)
  })
})

test.describe('when given invalid input', () => {
  test('should not be able to sign in to an available account', async ({
    homePage,
    authPage,
    dev_one_account,
    page,
  }) => {
    console.log(
      `Starting "should not be able to sign in to an available account" with ${dev_one_account.username}`,
    )
    await signinWithEmail(homePage, authPage, dev_one_account.email, 'ThisPassword')
    await expect(
      page.getByText('Failed to sign in with your email and password', {exact: true}),
    ).toBeVisible()
  })
})
