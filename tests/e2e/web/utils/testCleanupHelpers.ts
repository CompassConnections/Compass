import {AuthPage} from '../pages/AuthPage'
import {HomePage} from '../pages/homePage'
import { OnboardingPage } from '../pages/onboardingPage'
import { ProfilePage } from '../pages/profilePage'
import { SettingsPage } from '../pages/settingsPage'
import { SignUpPage } from '../pages/signUpPage'
import {UserAccountInformation} from '../utils/accountInformation'

export async function registerWithEmail(
  homePage: HomePage,
  authPage: AuthPage,
  account: UserAccountInformation,
) {
  await homePage.goToRegisterPage()
  await authPage.fillEmailField(account.email)
  await authPage.fillPasswordField(account.password)
  await authPage.clickSignUpWithEmailButton()
}

export async function signinWithEmail(
  homePage: HomePage,
  authPage: AuthPage,
  accountOrEmail: UserAccountInformation | string,
  password?: string,
) {
  const email = typeof accountOrEmail === 'string' ? accountOrEmail : accountOrEmail.email

  const resolvedPassword = typeof accountOrEmail === 'string' ? password : accountOrEmail.password

  if (!email || !resolvedPassword) {
    throw new Error('Provide either an `account` or `email` and `password`.')
  }

  await homePage.goToSigninPage()
  await authPage.fillEmailField(email)
  await authPage.fillPasswordField(resolvedPassword)
  await authPage.clickSignInWithEmailButton()
}

export async function skipOnboardingHeadToProfile(
  onboardingPage: OnboardingPage,
  signUpPage: SignUpPage,
  profilePage: ProfilePage,
  account: UserAccountInformation,
) {
  await onboardingPage.clickSkipOnboardingButton()
  await signUpPage.fillDisplayName(account.display_name)
  await signUpPage.fillUsername(account.username)
  await signUpPage.clickNextButton()
  await signUpPage.clickNextButton()
  await profilePage.clickCloseButton()
  await onboardingPage.clickRefineProfileButton()
}

export async function deleteProfileFromSettings(
  homePage: HomePage,
  settingsPage: SettingsPage,
) {
  await homePage.clickSettingsLink()
  await settingsPage.clickDeleteAccountButton()
  await settingsPage.fillDeleteAccountSurvey('Delete me')
  await settingsPage.clickDeleteAccountButton()
  await homePage.verifyHomePageLinks()
}