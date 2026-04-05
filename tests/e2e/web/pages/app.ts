import {Page} from '@playwright/test'

import {UserAccountInformation} from '../utils/accountInformation'
import {AuthPage} from './authPage'
import {CompatibilityPage} from './compatibilityPage'
import {HomePage} from './homePage'
import {OnboardingPage} from './onboardingPage'
import {OrganizationPage} from './organizationPage'
import {ProfilePage} from './profilePage'
import {SettingsPage} from './settingsPage'
import {SignUpPage} from './signUpPage'
import {SocialPage} from './socialPage'

export class App {
  readonly auth: AuthPage
  readonly compatibility: CompatibilityPage
  readonly home: HomePage
  readonly onboarding: OnboardingPage
  readonly organization: OrganizationPage
  readonly profile: ProfilePage
  readonly settings: SettingsPage
  readonly signUp: SignUpPage
  readonly social: SocialPage

  constructor(public readonly page: Page) {
    this.auth = new AuthPage(page)
    this.compatibility = new CompatibilityPage(page)
    this.home = new HomePage(page)
    this.onboarding = new OnboardingPage(page)
    this.organization = new OrganizationPage(page)
    this.profile = new ProfilePage(page)
    this.settings = new SettingsPage(page)
    this.signUp = new SignUpPage(page)
    this.social = new SocialPage(page)
  }

  async deleteProfileFromSettings() {
    await this.home.clickSettingsLink()
    await this.settings.clickDeleteAccountButton()
    await this.settings.fillDeleteAccountSurvey('Delete me')
    await this.settings.clickDeleteAccountButton()
    await this.home.verifyHomePageLinks()
  }

  async skipOnboardingHeadToProfile(account: UserAccountInformation) {
    await this.onboarding.clickSkipOnboardingButton()
    await this.signUp.fillDisplayName(account.display_name)
    await this.signUp.fillUsername(account.username)
    await this.signUp.clickNextButton()
    await this.signUp.clickNextButton()
    await this.profile.clickCloseButton()
    await this.onboarding.clickRefineProfileButton()
  }

  async registerWithEmail(account: UserAccountInformation) {
    await this.home.goToRegisterPage()
    await this.auth.fillEmailField(account.email)
    await this.auth.fillPasswordField(account.password)
    await this.auth.clickSignUpWithEmailButton()
  }

  async signinWithEmail(accountOrEmail: UserAccountInformation | string, password?: string) {
    const email = typeof accountOrEmail === 'string' ? accountOrEmail : accountOrEmail.email

    const resolvedPassword = typeof accountOrEmail === 'string' ? password : accountOrEmail.password

    if (!email || !resolvedPassword) {
      throw new Error('Provide either an `account` or `email` and `password`.')
    }

    await this.home.goToSigninPage()
    await this.auth.fillEmailField(email)
    await this.auth.fillPasswordField(resolvedPassword)
    await this.auth.clickSignInWithEmailButton()
    await this.page.waitForURL('/')
  }
}
