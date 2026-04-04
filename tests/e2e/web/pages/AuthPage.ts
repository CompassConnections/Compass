import {expect, Locator, Page} from '@playwright/test'

//sets up of all the functions that signin tests will use.
export class AuthPage {
  private readonly signInLink: Locator
  private readonly signUpButton: Locator
  private readonly emailField: Locator
  private readonly passwordField: Locator
  private readonly signInWithEmailButton: Locator
  private readonly googleButton: Locator
  private readonly signUpWithEmailButton: Locator

  constructor(public readonly page: Page) {
    this.signInLink = page.getByRole('link', {name: 'Sign in'})
    this.signUpButton = page.getByRole('button', {name: 'Sign up'})
    this.emailField = page.getByLabel('Email')
    this.passwordField = page.getByLabel('Password')
    this.signInWithEmailButton = page.getByRole('button', {name: 'Sign in with Email'})
    this.googleButton = page.getByRole('button', {name: 'Google'})
    this.signUpWithEmailButton = page.getByRole('button', {name: 'Sign up with Email'})
  }

  async clickSignInLink() {
    await expect(this.signInLink).toBeVisible()
    await this.signInLink.click()
  }

  async clickSignUpButton() {
    await expect(this.signUpButton).toBeVisible()
    await this.signUpButton.click()
  }

  async clickSignInWithEmailButton() {
    await expect(this.signInWithEmailButton).toBeVisible()
    await this.signInWithEmailButton.click()
  }

  async clickGoogleButton() {
    await expect(this.googleButton).toBeVisible()
    await this.googleButton.click()
  }

  async getGooglePopupPage(): Promise<Page> {
    const [popup] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.clickGoogleButton(),
    ])
    await popup.waitForLoadState()
    return popup
  }

  async signInToGoogleAccount(email: string, display_name?: string, username?: string) {
    const popup = await this.getGooglePopupPage()
    await popup.getByText('Add new account', {exact: true}).click()
    await popup.getByLabel('Email').fill(email)
    if (display_name) await popup.getByLabel('Display name').fill(display_name)
    if (username) await popup.getByLabel('Screen name', {exact: true}).fill(username)
    await popup.getByText('Sign in with Google.com', {exact: true}).click()
    await popup.waitForEvent('close')
  }

  async clickSignUpWithEmailButton() {
    await expect(this.signUpWithEmailButton).toBeVisible()
    await this.signUpWithEmailButton.click()
  }

  async fillEmailField(email: string) {
    await expect(this.emailField).toBeVisible()
    await this.emailField.fill(email)
  }

  async fillPasswordField(password: string) {
    await expect(this.passwordField).toBeVisible()
    await this.passwordField.fill(password)
  }
}
