import {notificationPreferencesOf, userInformationFromDb} from '../../utils/databaseUtils'
import {expect, test} from '../fixtures/signInFixture'

test.describe('settings', () => {
  test('turning off direct messages persists', async ({app, signedInAccount: account}) => {
    await app.home.clickSettingsLink()
    await app.settings.toggleDirectMessagingPreferences()

    await expect
      .poll(async () => (await userInformationFromDb(account)).profile.allow_direct_messaging)
      .toBe(false)
  })

  test('a notification preference persists', async ({app, signedInAccount: account}) => {
    const before = await notificationPreferencesOf(account.username)

    await app.home.clickNotifsLink()
    await app.page.locator('a[href="#"]', {hasText: 'Settings'}).click()
    await app.page.getByRole('switch').first().click()

    await expect.poll(async () => notificationPreferencesOf(account.username)).not.toEqual(before)
  })
})
