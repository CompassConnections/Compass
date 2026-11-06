import {sleep} from 'common/src/util/time'

import {expect, test} from '../fixtures/signInFixture'
import {getCardAgeGender, getCardName, getCardSeekingInfo, getCardStar} from '../pages/peoplePage'

test.describe('the people page', () => {
  test('should be able to save/favorite people', async ({app, signedOutAccount: account}) => {
    await app.signinWithEmail(account)
    await app.home.clickPeopleLink()
    await app.people.clearFilters()
    const profile = await app.people.getProfileInfo()
    const star = await getCardStar(profile)
    const name = await getCardName(profile)
    await expect(star).toBeVisible()
    await star.click()
    await sleep(1000)
    await app.people.clickSavedPeopleButton()
    await app.people.verifySavedPerson(name)
  })

  test.describe('the applied filter should', () => {
    test('update the profile count', async ({app, signedInAccount}) => {
      await app.home.clickPeopleLink()
      await app.people.clearFilters()

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

      // The seeking line only renders on the Large card, which this test selects above.
      const profile = await app.people.getProfileInfo()
      if (!profile) throw new Error('No profile found')
      const seeking = await getCardSeekingInfo(profile)
      await expect(seeking).toContain('Collaboration')
    })

    /**
     * The count changes some time after the filter is set, so the check has to poll for it.
     */
    test('show profiles with the correct age', async ({app, signedInAccount}) => {
      await app.home.clickPeopleLink()
      await app.people.clearFilters()
      await app.people.setDisplayFilter({filters: {Age: true}})

      const totalProfiles = await app.people.profileCountLocator.textContent()
      const profile = await app.people.getProfileInfo()
      const ageGender = await getCardAgeGender(profile)
      if (!ageGender) throw new Error('Age not found')
      const profileAge = parseInt(ageGender.match(/\d+/)?.[0] ?? '0')
      const age = profileAge <= 60 ? profileAge : 60
      console.log(profile, age)

      await app.people.setAgeRangeFilter({min: String(age), max: String(age)})

      await expect
        .poll(async () => app.people.profileCountLocator.textContent())
        .not.toEqual(totalProfiles)
    })

    test('show profiles with the correct gender', async ({app, signedInAccount}) => {
      await app.home.clickPeopleLink()
      await app.people.clearFilters()

      const totalProfiles = await app.people.profileCountLocator.textContent()
      await app.people.setGenderTypeFilter(['Woman', 'female'])
      await app.people.setDisplayFilter({cardSize: 'Large'})
      if (!totalProfiles) return
      await app.people.verifyProfileCount(totalProfiles)
    })

    test('show profiles with the correct education level', async ({app, signedInAccount}) => {
      await app.home.clickPeopleLink()
      await app.people.clearFilters()

      const totalProfiles = await app.people.profileCountLocator.textContent()
      await app.people.setBackgroundFilter({education: ['College', 'some-college']})
      await app.people.setDisplayFilter({cardSize: 'Large'})
      if (!totalProfiles) return
      await app.people.verifyProfileCount(totalProfiles)
    })

    test('show profiles with the correct diet', async ({app, signedInAccount}) => {
      await app.home.clickPeopleLink()
      await app.people.clearFilters()

      const totalProfiles = await app.people.profileCountLocator.textContent()
      await app.people.setLifestyleFilter({diet: ['Vegetarian', 'veg']})
      await app.people.setDisplayFilter({cardSize: 'Large'})
      if (!totalProfiles) return
      await app.people.verifyProfileCount(totalProfiles)
    })

    test('show profiles with the correct smoking preference', async ({app, signedInAccount}) => {
      await app.home.clickPeopleLink()
      await app.people.clearFilters()

      const totalProfiles = await app.people.profileCountLocator.textContent()
      await app.people.setLifestyleFilter({smoker: 'Yes'})
      await app.people.setDisplayFilter({cardSize: 'Large'})
      if (!totalProfiles) return
      await app.people.verifyProfileCount(totalProfiles)
    })

    test('show profiles with the correct psychedelics preference', async ({
      app,
      signedInAccount,
    }) => {
      await app.home.clickPeopleLink()
      await app.people.clearFilters()

      const totalProfiles = await app.people.profileCountLocator.textContent()
      await app.people.setLifestyleFilter({psychedelics: ['Regularly (weekly+)', 'regularly']})
      await app.people.setDisplayFilter({cardSize: 'Large'})
      if (!totalProfiles) return
      await app.people.verifyProfileCount(totalProfiles)
    })

    test('show profiles with the correct cannabis preference', async ({app, signedInAccount}) => {
      await app.home.clickPeopleLink()
      await app.people.clearFilters()

      const totalProfiles = await app.people.profileCountLocator.textContent()
      await app.people.setLifestyleFilter({
        cannabis: ['Occasionally (a few times a year)', 'occasionally'],
      })
      await app.people.setDisplayFilter({cardSize: 'Large'})
      if (!totalProfiles) return
      await app.people.verifyProfileCount(totalProfiles)
    })

    test('show profiles with the correct political preference', async ({app, signedInAccount}) => {
      await app.home.clickPeopleLink()
      await app.people.clearFilters()

      const totalProfiles = await app.people.profileCountLocator.textContent()
      await app.people.setValuesAndBeliefsFilter({political: ['Progressive', 'progressive']})
      await app.people.setDisplayFilter({cardSize: 'Large'})
      if (!totalProfiles) return
      await app.people.verifyProfileCount(totalProfiles)
    })

    test('show profiles with the correct religion preference', async ({app, signedInAccount}) => {
      await app.home.clickPeopleLink()
      await app.people.clearFilters()

      const totalProfiles = await app.people.profileCountLocator.textContent()
      await app.people.setValuesAndBeliefsFilter({religious: ['Jewish', 'jewish']})
      await app.people.setDisplayFilter({cardSize: 'Large'})
      if (!totalProfiles) return
      await app.people.verifyProfileCount(totalProfiles)
    })
  })

  // Each test hides `signedOutAccount` — a profile the fixture seeds and deletes for this test alone —
  // rather than a permanent seeded member, so the tests neither depend on `seed-test-data` having been
  // run against the database nor leave a hidden-profile row behind on a shared account.
  test.describe('the hide profile feature', () => {
    test('should correctly hide a profile', async ({app, signedInAccount, signedOutAccount}) => {
      await app.home.clickPeopleLink()
      await app.people.clearFilters()
      await app.people.useSearch(signedOutAccount.display_name)
      await sleep(1000)
      const profile = await app.people.getProfileInfo()
      if (!profile) throw new Error('Profile not found')
      const name = await getCardName(profile)
      console.log(profile)
      const hideProfileButton = profile.getByRole('button', {
        name: 'Hide this profile',
      })
      await expect(hideProfileButton).toBeVisible()
      await hideProfileButton.click()
      await expect(
        app.page.getByText(`You won't see ${name} in your search results anymore.`),
      ).toBeVisible()
    })

    test('should be reversible using undo', async ({app, signedInAccount, signedOutAccount}) => {
      await app.home.clickPeopleLink()
      await app.people.clearFilters()
      await app.people.useSearch(signedOutAccount.display_name)
      await sleep(1000)
      const profile = await app.people.getProfileInfo()
      if (!profile) throw new Error('Profile not found')
      const name = await getCardName(profile)
      const hideProfileButton = profile.getByRole('button', {
        name: 'Hide this profile',
      })
      await expect(hideProfileButton).toBeVisible()
      await hideProfileButton.click()
      const hideProfileMessage = app.page.getByText(
        `You won't see ${name} in your search results anymore.`,
      )
      await expect(hideProfileMessage).toBeVisible()
      await app.people.page.getByRole('button', {name: 'Undo'}).click()
      await expect(hideProfileMessage).not.toBeVisible()
      const undoProfile = app.people.page.getByRole('heading', {name: `${name}`})
      await expect(undoProfile).toBeVisible()
    })

    test('should be reversible using manage hidden profiles feature in settings', async ({
      app,
      signedInAccount,
      signedOutAccount,
    }) => {
      await app.home.clickPeopleLink()
      await app.people.clearFilters()
      await app.people.useSearch(signedOutAccount.display_name)
      await sleep(1000)
      const profile = await app.people.getProfileInfo()
      if (!profile) throw new Error('Profile not found')
      const name = await getCardName(profile)
      if (!name) throw new Error('Name not found')
      const hideProfileButton = profile.getByRole('button', {
        name: 'Hide this profile',
      })
      await expect(hideProfileButton).toBeVisible()
      await hideProfileButton.click()
      const hideProfileMessage = app.page.getByText(
        `You won't see ${name} in your search results anymore.`,
      )
      await expect(hideProfileMessage).toBeVisible()
      await app.home.clickSettingsLink()
      await app.settings.clickManageHiddenProfilesButton()
      await app.settings.verifyHiddenProfiles([name])
      await app.settings.unhideProfiles(name)
      await app.settings.clickCloseButton()
      await app.home.clickPeopleLink()
      await app.people.clearFilters()
      const undoProfile = app.people.page.getByRole('heading', {name: `${name}`})
      await expect(undoProfile).toBeVisible()
    })
  })
})
