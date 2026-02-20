import {expect, Locator, Page} from '@playwright/test'

export class HomePage {
  private readonly homePageLink: Locator
  private readonly aboutLink: Locator
  private readonly faqLink: Locator
  private readonly voteLink: Locator
  private readonly signUpButton: Locator
  private readonly signInLink: Locator
  private readonly closeButton: Locator

  constructor(public readonly page: Page) {
    this.homePageLink = page.getByText('Compass dev', {exact: true})
    this.aboutLink = page.locator('span:has-text("About")')
    this.faqLink = page.getByText('FAQ', {exact: true})
    this.voteLink = page.getByText('Vote', {exact: true})
    this.signUpButton = page.locator('button').filter({hasText: 'Sign up'}).first()
    this.signInLink = page.locator('span:has-text("Sign in")')
    this.closeButton = page.getByRole('button', {name: 'Close'})
  }

  async gotToHomePage() {
    await this.page.goto('/')
  }

  async clickSignUpButton() {
    await expect(this.signUpButton).toBeVisible()
    await this.signUpButton.click()
  }
}
