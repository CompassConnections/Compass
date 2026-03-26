import {expect, test} from '../fixtures/signInFixture'

test.describe('when given valid input', () => {
  test('should be able to sign in to an available account', async ({
    app,
    signedOutAccount: account,
  }) => {
    await app.signinWithEmail(account)
    await app.home.goToHomePage()
    await app.home.verifySignedInHomePage(account.display_name)
  })

  test('the profile count should update sucessfully when applying a filter', async ({
    app,
    signedOutAccount: account,
  }) => {
    await app.signinWithEmail(account)
    await app.home.clickPeopleLink()
    await app.people.getProfileInfo()
    const totalProfiles = await app.people.profileCountLocator.textContent()
    await app.people.setConnectionTypeFilter(['Collaboration', 'collaboration'])

    const filterdProfiles = await app.people.profileCountLocator.textContent()

    if (!totalProfiles || !filterdProfiles) return
    await expect(parseInt(totalProfiles)).not.toEqual(parseInt(filterdProfiles))
  })
})

test.describe('when given invalid input', () => {
  test('should not be able to sign in to an available account', async ({
    app,
    signedOutAccount: account,
    page,
  }) => {
    await app.signinWithEmail(account.email, 'ThisPassword', false)
    await expect(
      page.getByText('Failed to sign in with your email and password', {exact: true}),
    ).toBeVisible()
  })

  test('login check', async ({}) => {
    
  });
})

test.describe('when an error occurs', () => {
  test('placeholder', async () => {})
})
