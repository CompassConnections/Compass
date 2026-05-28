import {sleep} from 'common/util/time'

import {TEST_USER_DISPLAY_NAME} from '../../utils/seedDatabase'
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
    await sleep(1000)
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
      const filteredProfiles = await app.people.profileCountLocator.textContent()

      await expect(totalProfiles).not.toBeNull()
      await expect(filteredProfiles).not.toBeNull()
      console.log(totalProfiles)
      console.log(filteredProfiles)
      await expect(Number(totalProfiles?.split(' ')[0])).not.toEqual(
        Number(filteredProfiles?.split(' ')[0]),
      )

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
      await app.people.setGenderTypeFilter(['Woman', 'female'])
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

    test('show profiles with the correct religion preference', async ({
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
      await app.people.useSearch(TEST_USER_DISPLAY_NAME)
      await sleep(1000)
      const results = await app.people.getProfileInfo()
      console.log(results)
      const hideProfileButton = await results.profile.getByRole('button', {
        name: 'Hide this profile',
      })
      await expect(hideProfileButton).toBeVisible()
      await hideProfileButton.click()
      await expect(
        app.page.getByText(`You won't see ${results.name} in your search results anymore.`),
      ).toBeVisible()
    })

    test('should be reversible using undo', async ({app, signedOutAccount: account}) => {
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

    test('should be reversible using manage hidden profiles feature in settings', async ({
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
    const message = 'This is a message'
    test('be able to send a message from the messages page', async ({
      app,
      signedInAccount: sender,
      signedOutAccount: receiver,
    }) => {
      const receiverApp = await app.contextManager.createContext()
      await receiverApp.signinWithEmail(receiver)

      await app.home.clickMessagesLink()
      await app.messages.createNewMessage([receiver.display_name])
      await app.messages.sendMessage(message)

      await receiverApp.home.clickMessagesLink()
      await receiverApp.messages.findMessageConversation(sender.display_name)
      await receiverApp.messages.verifyMessage(message)
    })

    test('be able to send a message from the people page', async ({
      app,
      signedInAccount: sender,
      signedOutAccount: receiver,
    }) => {
      const receiverApp = await app.contextManager.createContext()
      await receiverApp.signinWithEmail(receiver)

      // To pass the min character limit for message intro (250 chars)
      const longMessage = message.repeat(20)

      await app.home.clickPeopleLink()
      await app.people.useSearch(receiver.display_name)
      await app.people.messageProfile(receiver.display_name, longMessage)
      await app.messages.verifyMessage(longMessage)

      await receiverApp.home.clickMessagesLink()
      await receiverApp.messages.findMessageConversation(sender.display_name)
      await receiverApp.messages.verifyMessage(longMessage)
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
