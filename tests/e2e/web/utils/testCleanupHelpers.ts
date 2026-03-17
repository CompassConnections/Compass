import {AuthPage} from '../pages/AuthPage'
import {HomePage} from '../pages/homePage'
import {UserAccountInformation} from '../utils/accountInformation'

export async function registerWithEmail(
  homePage: HomePage,
  authPage: AuthPage,
  account: UserAccountInformation,
) {
  await homePage.gotToRegisterPage()
  await authPage.fillEmailField(account.email)
  await authPage.fillPasswordField(account.password)
  await authPage.clickSignUpWithEmailButton()
}

export async function registerWithGoogleAccount(
  homePage: HomePage,
  authPage: AuthPage,
  account: UserAccountInformation,
) {
  await homePage.gotToRegisterPage()
  await authPage.fillEmailField(account.email)
  await authPage.fillPasswordField(account.password)
  await authPage.clickGoogleButton()
}

export async function signinWithEmail(
  homePage: HomePage,
  authPage: AuthPage,
  account: UserAccountInformation,
) {
  await homePage.gotToSigninPage()
  await authPage.fillEmailField(account.email)
  await authPage.fillPasswordField(account.password)
  await authPage.clickSignInWithEmailButton()
}

export async function signinWithGoogleAccount(
  homePage: HomePage,
  authPage: AuthPage,
  account: UserAccountInformation,
) {
  await homePage.gotToSigninPage()
  await authPage.fillEmailField(account.email)
  await authPage.fillPasswordField(account.password)
  await authPage.clickGoogleButton()
}
