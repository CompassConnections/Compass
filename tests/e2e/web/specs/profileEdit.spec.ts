import {sleep} from 'common/util/time'

import {userInformationFromDb} from '../../utils/databaseUtils'
import {expect, test} from '../fixtures/signInFixture'

test.describe('editing a profile', () => {
  test('keeps the changes after a reload, and leaves the rest alone', async ({
    app,
    signedInAccount: account,
  }) => {
    const headline = 'Fond of long walks and slow mornings'

    await app.profile.goTo(account.username)
    await app.profile.clickEditProfileButton()
    await app.page.getByTestId('headline').fill(headline)
    await app.signUp.saveProfileChanges()

    await app.profile.verifyHeadline(headline)
    await app.page.reload()
    await app.profile.verifyHeadline(headline)

    // The form writes back everything it loaded, so a bad read would wipe what it did not change.
    const {profile} = await userInformationFromDb(account)
    expect(profile.headline).toBe(headline)
    expect(profile.bio).toBeTruthy()
    expect(profile.keywords).toEqual(expect.arrayContaining([expect.any(String)]))
  })

  test('disabling it takes it out of search', async ({
    app,
    app2: searcherApp,
    signedInAccount: account,
    signedOutAccount: searcher,
  }) => {
    await searcherApp.signinWithEmail(searcher)
    const search = async () => {
      await searcherApp.home.clickPeopleLink()
      await searcherApp.people.clearFilters()
      await searcherApp.people.useSearch(account.display_name)
      await sleep(1000)
    }
    const noResults = searcherApp.page.getByText('No profiles found')
    await search()
    await expect(noResults).toHaveCount(0)

    await app.profile.goTo(account.username)
    await app.profile.selectOptionFromProfileDropdown('Disable')

    await expect
      .poll(async () => (await userInformationFromDb(account)).profile.disabled)
      .toBe(true)
    await searcherApp.page.reload()
    await search()
    await expect(noResults).toBeVisible()
  })
})
