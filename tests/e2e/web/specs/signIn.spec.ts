import {expect, test} from '../fixtures/signInFixture'

test.describe('when given valid input', () => {
  test('should be able to sign in to an available account', async ({
    app,
<<<<<<< HEAD
    signedOutAccount: account,
  }) => {
    await app.signinWithEmail(account)
    await app.home.goToHomePage()
    await app.home.verifySignedInHomePage(account.display_name)
=======
    dev_one_account
  }) => {
    await app.signinWithEmail(dev_one_account)
    await app.home.goToHomePage()
    await app.home.verifySignedInHomePage(dev_one_account.display_name)
  })

  // test('Trial', async ({
  //   app,
  //   dev_one_account
  // }) => {
  //   await app.signinWithEmail(dev_one_account)
  //   await app.home.clickPeopleLink()
  // })

  test('should successfully delete an account created via email and password', async ({
    app,
    signedOutAccount: account,
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
>>>>>>> 35402a77 (Updated People page)
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

  test('login check', async ({}) => {
    
  });
})

test.describe('when an error occurs', () => {
  test('placeholder', async () => {})
})
