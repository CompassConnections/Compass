import {userInformationFromDb} from '../../utils/databaseUtils'
import {seedUser} from '../../utils/seedDatabase'
import {expect, test} from '../fixtures/signInFixture'
import {testAccounts} from '../utils/accountInformation'

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
  test('should be able to sign in to an available account', async ({app, dev_one_account}) => {
    await app.signinWithEmail(dev_one_account)
    await app.home.goToHomePage()
    await app.home.verifySignedInHomePage(dev_one_account.display_name)
  })

  test('should successfully delete an account created via email and password', async ({
    app,
    fakerAccount,
  }) => {
    await app.registerWithEmail(fakerAccount)
    await app.skipOnboardingHeadToProfile(fakerAccount)

    //Verify displayed information is correct
    await app.profile.verifyDisplayName(fakerAccount.display_name)

    //Verify database info
    const dbInfo = await userInformationFromDb(fakerAccount)

    await expect(dbInfo.user.name).toContain(fakerAccount.display_name)
    await expect(dbInfo.user.username).toContain(fakerAccount.username)

    await app.deleteProfileFromSettings()
  })

  test('should successfully delete an account created via google auth', async ({
    app,
    googleAccountTwo,
    headless,
  }) => {
    test.skip(headless, 'Google popup auth test requires headed mode')
    await app.home.goToRegisterPage()
    await app.auth.fillPasswordField('') //The test only passes when this is added...something is weird here
    await app.auth.signInToGoogleAccount(
      googleAccountTwo.email,
      googleAccountTwo.display_name,
      googleAccountTwo.username,
    )
    await app.skipOnboardingHeadToProfile(googleAccountTwo)

    //Verify displayed information is correct
    await app.profile.verifyDisplayName(googleAccountTwo.display_name)

    //Verify database info
    const dbInfo = await userInformationFromDb(googleAccountTwo)

    await expect(dbInfo.user.name).toContain(googleAccountTwo.display_name)
    await expect(dbInfo.user.username).toContain(googleAccountTwo.username)

    await app.deleteProfileFromSettings()
  })
})

test.describe('when given invalid input', () => {
  test('should not be able to sign in to an available account', async ({
    app,
    dev_one_account,
    page,
  }) => {
    await app.signinWithEmail(dev_one_account.email, 'ThisPassword')
    await expect(
      page.getByText('Failed to sign in with your email and password', {exact: true}),
    ).toBeVisible()
  })
})
