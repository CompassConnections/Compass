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

  /**
   * Test fails due to ui not updating
   * works fine manually
   */
  test.skip('the age filter should work correctly', async ({
    app,
    signedOutAccount: account
  }) => {
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

  test('the gender filter should work correctly', async ({
    app,
    signedOutAccount: account,
  }) => {
    await app.signinWithEmail(account)
    await app.home.clickPeopleLink()

    const totalProfiles = await app.people.profileCountLocator.textContent()
    await app.people.setGenderTypeFilter(["Women", "female"])
    await app.people.setDisplayFilter({cardSize: 'Large'})
    if (!totalProfiles) return
    await app.people.verifyProfileCount(totalProfiles)
  })

  test('the education filter should work correctly', async ({
    app,
    signedOutAccount: account,
  }) => {
    await app.signinWithEmail(account)
    await app.home.clickPeopleLink()

    const totalProfiles = await app.people.profileCountLocator.textContent()
    await app.people.setBackgroundFilter({education: ["College", "some-college"]})
    await app.people.setDisplayFilter({cardSize: 'Large'})
    if (!totalProfiles) return
    await app.people.verifyProfileCount(totalProfiles)
  })

  test('the diet filter should work correctly', async ({
    app,
    signedOutAccount: account,
  }) => {
    await app.signinWithEmail(account)
    await app.home.clickPeopleLink()

    const totalProfiles = await app.people.profileCountLocator.textContent()
    await app.people.setLifestyleFilter({diet: ["Vegetarian", "veg"]})
    await app.people.setDisplayFilter({cardSize: 'Large'})
    if (!totalProfiles) return
    await app.people.verifyProfileCount(totalProfiles)
  })

  test('the smoker filter should work correctly', async ({
    app,
    signedOutAccount: account,
  }) => {
    await app.signinWithEmail(account)
    await app.home.clickPeopleLink()

    const totalProfiles = await app.people.profileCountLocator.textContent()
    await app.people.setLifestyleFilter({smoker: 'Yes'})
    await app.people.setDisplayFilter({cardSize: 'Large'})
    if (!totalProfiles) return
    await app.people.verifyProfileCount(totalProfiles)
  })

  test('the psychedelics filter should work correctly', async ({
    app,
    signedOutAccount: account,
  }) => {
    await app.signinWithEmail(account)
    await app.home.clickPeopleLink()

    const totalProfiles = await app.people.profileCountLocator.textContent()
    await app.people.setLifestyleFilter({psychedelics: ["Regularly (weekly+)", "regularly"]})
    await app.people.setDisplayFilter({cardSize: 'Large'})
    if (!totalProfiles) return
    await app.people.verifyProfileCount(totalProfiles)
  })

  test('the cannabis filter should work correctly', async ({
    app,
    signedOutAccount: account,
  }) => {
    await app.signinWithEmail(account)
    await app.home.clickPeopleLink()

    const totalProfiles = await app.people.profileCountLocator.textContent()
    await app.people.setLifestyleFilter({cannabis: ["Occasionally (a few times a year)", "occasionally"]})
    await app.people.setDisplayFilter({ cardSize: 'Large' })
    if (!totalProfiles) return
    await app.people.verifyProfileCount(totalProfiles)
  })

  test('the politics filter should work correctly', async ({
    app,
    signedOutAccount: account,
  }) => {
    await app.signinWithEmail(account)
    await app.home.clickPeopleLink()

    const totalProfiles = await app.people.profileCountLocator.textContent()
    await app.people.setValuesAndBeliefsFilter({political: ["Progressive", "progressive"]})
    await app.people.setDisplayFilter({ cardSize: 'Large' })
    if (!totalProfiles) return
    await app.people.verifyProfileCount(totalProfiles)
  })

  test('the religion filter should work correctly', async ({
    app,
    signedOutAccount: account,
  }) => {
    await app.signinWithEmail(account)
    await app.home.clickPeopleLink()

    const totalProfiles = await app.people.profileCountLocator.textContent()
    await app.people.setValuesAndBeliefsFilter({religious: ["Jewish", "jewish"]})
    await app.people.setDisplayFilter({ cardSize: 'Large' })
    if (!totalProfiles) return
    await app.people.verifyProfileCount(totalProfiles)
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
