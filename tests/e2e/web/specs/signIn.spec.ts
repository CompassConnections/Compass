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
    expect(totalProfiles).toBeTruthy()
    const totalCount = Number.parseInt(totalProfiles!, 10)
    expect(Number.isNaN(totalCount)).toBe(false)

    await app.people.setConnectionTypeFilter(['Collaboration', 'collaboration'])
    await app.people.setDisplayFilter({cardSize: 'Large'})
    const filterdProfiles = await app.people.profileCountLocator.textContent()

    if (!totalProfiles || !filterdProfiles) return
    await expect(parseInt(totalProfiles)).not.toEqual(parseInt(filterdProfiles))

    const results = await app.people.getProfileInfo()
    if (!results) return
    await expect(results.seeking).toContain('Collaboration')
  })

  test('the age filter should work correctly', async ({app, signedOutAccount: account}) => {
    await app.signinWithEmail(account)
    await app.home.clickPeopleLink()
    await app.people.setDisplayFilter({filters: {Age: true}})

    const totalProfiles = await app.people.profileCountLocator.textContent()
    const profileResults = await app.people.getProfileInfo()
    const profileAge = parseInt(profileResults.ageGender.match(/\d+/)?.[0] ?? '0')
    const age = profileAge <= 60 ? profileAge : 60
    console.log(profileResults, age)

    await app.people.setAgeRangeFilter({min: String(age), max: String(age)})

    // The count updates asynchronously after the filter is applied, so poll until it changes.
    await expect
      .poll(async () =>
        Number.parseInt((await app.people.profileCountLocator.textContent())!, 10),
      )
      .not.toEqual(totalCount)
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
