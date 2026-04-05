import {expect, test} from '../fixtures/signInFixture'

test.describe('when given valid input', () => {
  test('should be able to sign in to an available account', async ({app, signedInAccount}) => {
    await app.home.goToHomePage()
    await app.home.verifySignedInHomePage(signedInAccount.display_name)
  })
})

test.describe('when given invalid input', () => {
  test('should not be able to sign in to an available account', async ({
    app,
    signedOutAccount,
    page,
  }) => {
    await app.signinWithEmail(signedOutAccount.email, 'ThisPassword', false)
    await expect(
      page.getByText('Failed to sign in with your email and password', {exact: true}),
    ).toBeVisible()
  })
})
