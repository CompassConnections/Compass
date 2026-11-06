import {banUser, setProfileColumns} from '../../utils/databaseUtils'
import {expect, test} from '../fixtures/signInFixture'

// Set explicitly, because a check that it is absent proves nothing if it was never there.
const HEADLINE = 'Happiest somewhere near the sea'

const pageData = (page: {locator: (selector: string) => {textContent: () => Promise<any>}}) =>
  page.locator('#__NEXT_DATA__').textContent()

test.describe('a signed-out visitor', () => {
  test('sees only the name on a members-only profile, in the page and in its data', async ({
    app,
    signedOutAccount: account,
  }) => {
    await setProfileColumns(account.username, {visibility: 'member', headline: HEADLINE})

    await app.profile.goTo(account.username)

    await expect(app.page.getByTestId('profile-display-name-age').first()).toContainText(
      account.display_name,
    )
    await expect(app.page.getByText(HEADLINE)).toHaveCount(0)
    expect(await pageData(app.page)).not.toContain(HEADLINE)
  })

  test('sees a public profile in full', async ({app, signedOutAccount: account}) => {
    await setProfileColumns(account.username, {visibility: 'public', headline: HEADLINE})

    await app.profile.goTo(account.username)

    await app.profile.verifyHeadline(HEADLINE)
  })
})

test.describe('a signed-in member', () => {
  // A full page load reads the profile signed out, then again once the session is back. The first
  // answer is redacted, and it must not replace the second however late it lands.
  test('sees their whole profile even if the signed-out read lands last', async ({
    app,
    signedInAccount: account,
  }) => {
    await setProfileColumns(account.username, {visibility: 'member', headline: HEADLINE})
    await app.page.route('**/rpc/get_profile_by_user_id', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      await route.continue()
    })

    await app.profile.goTo(account.username)
    await app.profile.verifyHeadline(HEADLINE)
    await app.page.waitForTimeout(4000)

    await app.profile.verifyHeadline(HEADLINE)
  })
})

test.describe('a banned member', () => {
  test('is behind the suspension wall for others, with nothing in the page data', async ({
    app,
    signedInAccount: _viewer,
    signedOutAccount: banned,
  }) => {
    await setProfileColumns(banned.username, {visibility: 'public', headline: HEADLINE})
    await banUser(banned.username, 'confirmed_abuse')

    await app.profile.goTo(banned.username)

    await expect(app.page.getByText('This account has been suspended.')).toBeVisible()
    await expect(app.page.getByText(HEADLINE)).toHaveCount(0)
    expect(await pageData(app.page)).not.toContain(HEADLINE)
  })

  test('is told their account is on hold, and can still browse', async ({
    app,
    signedOutAccount: held,
  }) => {
    await banUser(held.username, 'under_review')
    await app.signinWithEmail(held)

    await app.home.clickPeopleLink()

    await expect(app.page.getByText('Your account is on hold')).toBeVisible()
    await expect(app.page.getByTestId('people-profile-grid')).toBeVisible()
  })
})
