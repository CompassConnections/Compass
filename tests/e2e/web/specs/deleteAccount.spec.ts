import {dbUserExists} from '../../utils/databaseUtils'
import {firebaseUserExists} from '../../utils/firebaseUtils'
import {expect, test} from '../fixtures/signInFixture'
import {testAccounts} from '../utils/accountInformation'

test.describe('delete account', () => {
  test('should successfully delete an account created via email and password', async ({
    app,
    signedInAccount: account,
  }) => {
    await app.deleteProfileFromSettings()

    const firebaseUserId = await firebaseUserExists(account.email, account.password)
    expect(firebaseUserId).toBeUndefined()

    const dbExists = await dbUserExists(account.username)
    expect(dbExists).toBe(false)
  })

  test('should successfully delete an account created via google auth', async ({app, headless}) => {
    test.skip(headless, 'Google popup auth test requires headed mode')

    // Cannot sign in programmatically with Google
    const deleteAccount = testAccounts.faker_account()
    await app.home.goToRegisterPage()
    await app.auth.signInToGoogleAccount(
      deleteAccount.email,
      deleteAccount.display_name,
      deleteAccount.username,
    )
    await app.skipOnboardingHeadToProfile(deleteAccount)

    await app.deleteProfileFromSettings()

    const dbExists = await dbUserExists(deleteAccount.username)
    expect(dbExists).toBe(false)
  })
})
