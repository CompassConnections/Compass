import {expect, test} from '../fixtures/signInFixture'

test.describe('endorsing a member', () => {
  test('shows on their profile and reaches their notifications', async ({
    app,
    app2: endorsedApp,
    signedInAccount: author,
    signedOutAccount: endorsed,
  }) => {
    const endorsement = 'A thoughtful and generous person to talk to.'

    await app.profile.goTo(endorsed.username)
    await app.page.getByRole('button', {name: 'Write public endorsement'}).click()
    await app.page.locator('.ProseMirror').last().click()
    await app.page.keyboard.type(endorsement)
    await app.page.getByTestId('conversation-message-submit').click()

    await expect(app.page.getByText(endorsement)).toBeVisible()

    await endorsedApp.signinWithEmail(endorsed)
    await endorsedApp.home.clickNotifsLink()
    await expect(endorsedApp.page.getByText(author.display_name).first()).toBeVisible()
  })
})
