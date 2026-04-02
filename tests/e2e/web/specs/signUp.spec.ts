import {expect, test} from '../fixtures/base'
import {registerWithEmail} from '../utils/testCleanupHelpers'

// test.describe('when given valid input', () => {
//   test('placeholder', async () => {})
// })

test.describe('when an error occurs', () => {
  test('should disable the button "Next" when the display name field is empty', async ({
    specAccount,
    homePage,
    authPage,
    onboardingPage,
    signUpPage,
  }) => {
    console.log(
      `Starting "should disable the button "Next" when the display name field is empty" with ${specAccount.username}`,
    )
    await registerWithEmail(homePage, authPage, specAccount)
    await onboardingPage.clickSkipOnboardingButton()
    await signUpPage.fillDisplayName('')
    await signUpPage.fillUsername(specAccount.username)
    await signUpPage.verifyDisplayNameError()
    await expect(signUpPage.nextButtonLocator).toBeDisabled()
  })

  test('should disable the button "Next" when the username field is empty', async ({
    specAccount,
    homePage,
    authPage,
    onboardingPage,
    signUpPage,
  }) => {
    console.log(
      `Starting "should disable the button "Next" when the username field is empty" with ${specAccount.username}`,
    )
    await registerWithEmail(homePage, authPage, specAccount)
    await onboardingPage.clickSkipOnboardingButton()
    await signUpPage.fillDisplayName(specAccount.display_name)
    await signUpPage.fillUsername('')
    await signUpPage.verifyUsernameError()
    await expect(signUpPage.nextButtonLocator).toBeDisabled()
  })
})
