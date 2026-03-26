import {test, expect} from '../fixtures/signInFixture'
import {seedUser} from '../../utils/seedDatabase'
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
  test('should be able to sign in to an available account', async ({
    homePage,
    authPage,
    dev_one_account,
  }) => {
    await homePage.gotToSigninPage()
    await authPage.fillEmailField(dev_one_account.email)
    await authPage.fillPasswordField(dev_one_account.password)
    await authPage.clickSignInWithEmailButton()
    await homePage.goToHomePage()
    await homePage.verifySignedInHomePage(dev_one_account.display_name)
  })

  test('login check', async ({}) => {})
})

test.describe('when an error occurs', () => {
  test('placeholder', async () => {})
})
