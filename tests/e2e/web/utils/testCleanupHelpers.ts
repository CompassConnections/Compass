import {AuthPage} from '../pages/AuthPage'
import {HomePage} from '../pages/homePage'
import {OnboardingPage} from '../pages/onboardingPage'
import {UserAccountInformation} from '../utils/accountInformation'

export async function progressToRequiredForm(
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