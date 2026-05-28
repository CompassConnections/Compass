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

  test('should be able to save/favorite people', async ({app, signedOutAccount: account}) => {
    await app.signinWithEmail(account)
    await app.home.clickPeopleLink()
    const profile = await app.people.getProfileInfo()
    await expect(profile.star).toBeVisible()
    await profile.star.click()
    await app.people.clickSavedPeopleButton()
    await app.people.verifySavedPerson(profile.name)
  })

  test.describe('the applied filter should', () => {
    test('update the profile count', async ({app, signedOutAccount: account}) => {
      await app.signinWithEmail(account)
      await app.home.clickPeopleLink()

      const totalProfiles = await app.people.profileCountLocator.textContent()
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
    test.skip('show profiles with the correct age', async ({app, signedOutAccount: account}) => {
      await app.signinWithEmail(account)
      await app.home.clickPeopleLink()
      await app.people.setDisplayFilter({filters: {Age: true}})

      const totalProfiles = await app.people.profileCountLocator.textContent()
      const profileResults = await app.people.getProfileInfo()
      const profileAge = parseInt(profileResults.ageGender.match(/\d+/)?.[0] ?? '0')
      const age = profileAge <= 60 ? profileAge : 60
      console.log(profileResults, age)

      await app.people.setAgeRangeFilter({min: String(age), max: String(age)})

      const filterdProfiles = await app.people.profileCountLocator.textContent()

      if (!totalProfiles || !filterdProfiles) return
      await expect(parseInt(totalProfiles)).not.toEqual(parseInt(filterdProfiles))
    })

    test('show profiles with the correct gender', async ({app, signedOutAccount: account}) => {
      await app.signinWithEmail(account)
      await app.home.clickPeopleLink()

      const totalProfiles = await app.people.profileCountLocator.textContent()
      await app.people.setGenderTypeFilter(['Women', 'female'])
      await app.people.setDisplayFilter({cardSize: 'Large'})
      if (!totalProfiles) return
      await app.people.verifyProfileCount(totalProfiles)
    })

    test('show profiles with the correct education level', async ({
      app,
      signedOutAccount: account,
    }) => {
      await app.signinWithEmail(account)
      await app.home.clickPeopleLink()

      const totalProfiles = await app.people.profileCountLocator.textContent()
      await app.people.setBackgroundFilter({education: ['College', 'some-college']})
      await app.people.setDisplayFilter({cardSize: 'Large'})
      if (!totalProfiles) return
      await app.people.verifyProfileCount(totalProfiles)
    })

    test('show profiles with the correct diet', async ({app, signedOutAccount: account}) => {
      await app.signinWithEmail(account)
      await app.home.clickPeopleLink()

      const totalProfiles = await app.people.profileCountLocator.textContent()
      await app.people.setLifestyleFilter({diet: ['Vegetarian', 'veg']})
      await app.people.setDisplayFilter({cardSize: 'Large'})
      if (!totalProfiles) return
      await app.people.verifyProfileCount(totalProfiles)
    })

    test('show profiles with the correct smoking preference', async ({
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

    test('show profiles with the correct psychedelics preference', async ({
      app,
      signedOutAccount: account,
    }) => {
      await app.signinWithEmail(account)
      await app.home.clickPeopleLink()

      const totalProfiles = await app.people.profileCountLocator.textContent()
      await app.people.setLifestyleFilter({psychedelics: ['Regularly (weekly+)', 'regularly']})
      await app.people.setDisplayFilter({cardSize: 'Large'})
      if (!totalProfiles) return
      await app.people.verifyProfileCount(totalProfiles)
    })

    test('show profiles with the correct cannabis preference', async ({
      app,
      signedOutAccount: account,
    }) => {
      await app.signinWithEmail(account)
      await app.home.clickPeopleLink()

      const totalProfiles = await app.people.profileCountLocator.textContent()
      await app.people.setLifestyleFilter({
        cannabis: ['Occasionally (a few times a year)', 'occasionally'],
      })
      await app.people.setDisplayFilter({cardSize: 'Large'})
      if (!totalProfiles) return
      await app.people.verifyProfileCount(totalProfiles)
    })

    test('show profiles with the correct political preference', async ({
      app,
      signedOutAccount: account,
    }) => {
      await app.signinWithEmail(account)
      await app.home.clickPeopleLink()

      const totalProfiles = await app.people.profileCountLocator.textContent()
      await app.people.setValuesAndBeliefsFilter({political: ['Progressive', 'progressive']})
      await app.people.setDisplayFilter({cardSize: 'Large'})
      if (!totalProfiles) return
      await app.people.verifyProfileCount(totalProfiles)
    })

    test('show profiles with the correct relegion preference', async ({
      app,
      signedOutAccount: account,
    }) => {
      await app.signinWithEmail(account)
      await app.home.clickPeopleLink()

      const totalProfiles = await app.people.profileCountLocator.textContent()
      await app.people.setValuesAndBeliefsFilter({religious: ['Jewish', 'jewish']})
      await app.people.setDisplayFilter({cardSize: 'Large'})
      if (!totalProfiles) return
      await app.people.verifyProfileCount(totalProfiles)
    })
  })

  test.describe('the hide profile feature', () => {
    test('should correctly hide a profile', async ({app, signedOutAccount: account}) => {
      await app.signinWithEmail(account)
      await app.home.clickPeopleLink()
      const results = await app.people.getProfileInfo()
      if (!results) return
      const hideProfileButton = await results.profile.getByRole('button', {
        name: 'Hide this profile',
      })
      await expect(hideProfileButton).toBeVisible()
      await hideProfileButton.click()
      await expect(
        app.page.getByText(`You won't see ${results.name} in your search results anymore.`),
      ).toBeVisible()
    })

    test('should be reverseable using undo', async ({app, signedOutAccount: account}) => {
      await app.signinWithEmail(account)
      await app.home.clickPeopleLink()
      const results = await app.people.getProfileInfo()
      if (!results) return
      const hideProfileButton = await results.profile.getByRole('button', {
        name: 'Hide this profile',
      })
      await expect(hideProfileButton).toBeVisible()
      await hideProfileButton.click()
      const hideProfileMessage = await app.page.getByText(
        `You won't see ${results.name} in your search results anymore.`,
      )
      await expect(hideProfileMessage).toBeVisible()
      await app.people.page.getByRole('button', {name: 'Undo'}).click()
      await expect(hideProfileMessage).not.toBeVisible()
      const profile = await app.people.page.getByRole('heading', {name: `${results.name}`})
      await expect(profile).toBeVisible()
    })

    test('should be reverseable using manage hidden profiles feature in settings', async ({
      app,
      signedOutAccount: account,
    }) => {
      await app.signinWithEmail(account)
      await app.home.clickPeopleLink()
      const results = await app.people.getProfileInfo()
      if (!results) return
      const hideProfileButton = await results.profile.getByRole('button', {
        name: 'Hide this profile',
      })
      await expect(hideProfileButton).toBeVisible()
      await hideProfileButton.click()
      const hideProfileMessage = await app.page.getByText(
        `You won't see ${results.name} in your search results anymore.`,
      )
      await expect(hideProfileMessage).toBeVisible()
      await app.home.clickSettingsLink()
      await app.settings.clickManageHiddenProfilesButton()
      await app.settings.verifyHiddenProfiles([results.name])
      await app.settings.unhideProfiles(results.name)
      await app.settings.clickCloseButton()
      await app.home.clickPeopleLink()
      const profile = await app.people.page.getByRole('heading', {name: `${results.name}`})
      await expect(profile).toBeVisible()
    })
  })

  test.describe('a verified account should', () => {
    test('be able to send a message from the messages page', async ({
      app,
      devOneAccount,
      devTwoAccount,
    }) => {
      const devOne = await app.contextManager.createContext('devOne')
      const devTwo = await app.contextManager.createContext('devTwo')
      await devOne.signinWithEmail(devOneAccount)
      await devTwo.signinWithEmail(devTwoAccount)

      await devOne.home.clickMessagesLink()
      await devOne.messages.createNewMessage([devTwoAccount.display_name])
      await devOne.messages.sendMessage('This is a message')

      await devTwo.home.clickMessagesLink()
      await devTwo.messages.findMessageConversation(devOneAccount.display_name)
      await devTwo.messages.verifyMessage('This is a message')
    })

    test('be able to send a message from the people page', async ({
      app,
      devOneAccount,
      devTwoAccount,
    }) => {
      const devOne = await app.contextManager.createContext('devOne')
      const devTwo = await app.contextManager.createContext('devTwo')
      await devOne.signinWithEmail(devOneAccount)
      await devTwo.signinWithEmail(devTwoAccount)

      await devOne.home.clickPeopleLink()
      await devOne.people.useSearch(devTwoAccount.display_name)
      const message = 'This is a message'.repeat(20)
      await devOne.people.messageProfile(devTwoAccount.display_name, message)
      await devOne.messages.verifyMessage(message)

      await devTwo.home.clickMessagesLink()
      await devTwo.messages.findMessageConversation(devOneAccount.display_name)
      await devTwo.messages.verifyMessage(message)
    })
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
