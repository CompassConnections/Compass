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
