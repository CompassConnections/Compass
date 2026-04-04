import {expect, test} from '../fixtures/base'

// test.describe('when given valid input', () => {
//   test('placeholder', async () => {})
// })

test.describe('when an error occurs', () => {
  test('should disable the button "Next" when the display name field is empty', async ({
    specAccount,
    app
  }) => {
    await app.registerWithEmail(specAccount)
    await app.onboarding.clickSkipOnboardingButton()
    await app.signUp.fillDisplayName('')
    await app.signUp.fillUsername(specAccount.username)
    await app.signUp.verifyDisplayNameError()
    await expect(app.signUp.nextButtonLocator).toBeDisabled()
  })

  test('should disable the button "Next" when the username field is empty', async ({
    specAccount,
    app
  }) => {
    console.log(
      `Starting "should disable the button "Next" when the username field is empty" with ${specAccount.username}`,
    )
    await app.registerWithEmail(specAccount)
    await app.onboarding.clickSkipOnboardingButton()
    await app.signUp.fillDisplayName(specAccount.display_name)
    await app.signUp.fillUsername('')
    await app.signUp.verifyUsernameError()
    await expect(app.signUp.nextButtonLocator).toBeDisabled()
  })
})
