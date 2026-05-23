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

  test('the profile count should update successfully when applying a filter', async ({
    app,
    signedOutAccount: account,
  }) => {
    await app.signinWithEmail(account)
    await app.home.clickPeopleLink()
    await app.people.getProfileInfo()
    const totalProfiles = await app.people.profileCountLocator.textContent()
    await app.people.setConnectionTypeFilter(['Collaboration', 'collaboration'])

    const filteredProfiles = await app.people.profileCountLocator.textContent()

    expect(totalProfiles).toBeTruthy()
    expect(filteredProfiles).toBeTruthy()
    const totalCount = Number.parseInt(totalProfiles!, 10)
    const filteredCount = Number.parseInt(filteredProfiles!, 10)
    expect(Number.isNaN(totalCount)).toBe(false)
    expect(Number.isNaN(filteredCount)).toBe(false)
    await expect(filteredCount).not.toEqual(totalCount)
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
})
