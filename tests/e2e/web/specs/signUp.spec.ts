import {expect, test} from '../fixtures/base'
import {progressToRequiredForm} from '../utils/testCleanupHelpers'

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
    await progressToRequiredForm(homePage, authPage, specAccount, onboardingPage)
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
    await progressToRequiredForm(homePage, authPage, specAccount, onboardingPage)
    await signUpPage.fillDisplayName(specAccount.display_name)
    await signUpPage.fillUsername('')
    await signUpPage.verifyUsernameError()
    await expect(signUpPage.nextButtonLocator).toBeDisabled()
  })
})

async function progressToRequiredForm(
  homePage: HomePage,
  authPage: AuthPage,
  account: UserAccountInformation,
  onboardingPage: OnboardingPage,
) {
  await homePage.gotToHomePage()
  await homePage.clickSignUpButton()
  await authPage.fillEmailField(account.email)
  await authPage.fillPasswordField(account.password)
  await authPage.clickSignUpWithEmailButton()
  await onboardingPage.clickSkipOnboardingButton()
}
