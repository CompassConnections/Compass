import {expect, test} from '../fixtures/base'

test.describe('when given valid input', () => {
  test('placeholder', async () => {})
})

test.describe('when an error occurs', () => {
  test('should disable the button "Next" when the display name field is empty', async ({
    specAccount,
    homePage,
    authPage,
    onboardingPage,
    signUpPage,
  }) => {
    await homePage.gotToHomePage()
    await homePage.clickSignUpButton()
    await authPage.fillEmailField(specAccount.email)
    await authPage.fillPasswordField(specAccount.password)
    await authPage.clickSignUpWithEmailButton()
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
    await homePage.gotToHomePage()
    await homePage.clickSignUpButton()
    await authPage.fillEmailField(specAccount.email)
    await authPage.fillPasswordField(specAccount.password)
    await authPage.clickSignUpWithEmailButton()
    await onboardingPage.clickSkipOnboardingButton()
    await signUpPage.fillDisplayName(specAccount.display_name)
    await signUpPage.fillUsername('')
    await signUpPage.verifyUsernameError()
    await expect(signUpPage.nextButtonLocator).toBeDisabled()
  })
})
