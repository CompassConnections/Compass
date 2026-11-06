import {sleep} from 'common/util/time'

import {expect, test} from '../fixtures/signInFixture'

test.describe('blocking', () => {
  test('hides each person from the other, until unblocked', async ({
    app,
    app2: blockedApp,
    signedInAccount: blocker,
    signedOutAccount: blocked,
  }) => {
    await blockedApp.signinWithEmail(blocked)

    await app.profile.goTo(blocked.username)
    await app.profile.blockOrUnblock('Block', blocked.display_name)
    await expect(app.page.getByText('Blocked.', {exact: false})).toBeVisible()
    await expect(app.page.getByRole('dialog')).toHaveCount(0)

    const searchFor = async (searcher: typeof app, name: string) => {
      await searcher.home.clickPeopleLink()
      await searcher.people.clearFilters()
      await searcher.people.useSearch(name)
      await sleep(1000)
    }
    const noResults = (searcher: typeof app) => searcher.page.getByText('No profiles found')

    await searchFor(app, blocked.display_name)
    await expect(noResults(app)).toBeVisible()
    await searchFor(blockedApp, blocker.display_name)
    await expect(noResults(blockedApp)).toBeVisible()

    await app.profile.goTo(blocked.username)
    await app.profile.blockOrUnblock('Unblock', blocked.display_name)
    await expect(app.page.getByText('Unblocked.', {exact: false})).toBeVisible()

    await searchFor(app, blocked.display_name)
    await expect(noResults(app)).toHaveCount(0)
  })
})
