import {AuthPage} from '../pages/AuthPage'
import {HomePage} from '../pages/homePage'
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
