import {expect, Locator, Page} from '@playwright/test'
import {LocaleTuple} from 'common/constants'

export class HomePage {
  private readonly homePageLink: Locator
  private readonly profileLink: Locator
  private readonly aboutLink: Locator
  private readonly faqLink: Locator
  private readonly voteLink: Locator
  private readonly eventsLink: Locator
  private readonly whatsNewLink: Locator
  private readonly socialsLink: Locator
  private readonly organizationLink: Locator
  private readonly contactLink: Locator
  private readonly signUpButton: Locator
  private readonly localePicker: Locator
  private readonly signInLink: Locator
  private readonly closeButton: Locator

  constructor(public readonly page: Page) {
    this.homePageLink = page.getByText('Compass', {exact: true})
    this.profileLink = page.getByTestId('sidebar-username')
    this.aboutLink = page.getByTestId('sidebar-about')
    this.faqLink = page.getByTestId('sidebar-faq')
    this.voteLink = page.getByTestId('sidebar-vote')
    this.eventsLink = page.getByTestId('sidebar-events')
    this.whatsNewLink = page.getByTestId('sidebar-news')
    this.socialsLink = page.getByTestId('sidebar-social')
    this.organizationLink = page.getByTestId('sidebar-organization')
    this.contactLink = page.getByTestId('sidebar-contact')
    this.signUpButton = page.locator('button').filter({hasText: 'Sign up'}).first()
    this.localePicker = page.getByTestId('sidebar-locale-picker')
    this.signInLink = page.getByTestId('sidebar-signin')
    this.closeButton = page.getByRole('button', {name: 'Close'})
  }

  async gotToHomePage() {
    await this.page.goto('/home')
  }

  async gotToRegisterPage() {
    await this.page.goto('/register')
  }

  async gotToSigninPage() {
    await this.page.goto('/signin')
  }

  async clickAboutLink() {
    await expect(this.aboutLink).toBeVisible()
    await this.aboutLink.click()
  }

  async clickFaqLink() {
    await expect(this.faqLink).toBeVisible()
    await this.faqLink.click()
  }

  async clickVoteLink() {
    await expect(this.voteLink).toBeVisible()
    await this.voteLink.click()
  }

  async clickEventsLink() {
    await expect(this.eventsLink).toBeVisible()
    await this.eventsLink.click()
  }

  async clickWhatsNewLink() {
    await expect(this.whatsNewLink).toBeVisible()
    await this.whatsNewLink.click()
  }

  async clickSocialsLink() {
    await expect(this.socialsLink).toBeVisible()
    await this.socialsLink.click()
  }

  async clickOrganizationLink() {
    await expect(this.organizationLink).toBeVisible()
    await this.organizationLink.click()
  }

  async clickContactLink() {
    await expect(this.contactLink).toBeVisible()
    await this.contactLink.click()
  }

  async clickSignUpButton() {
    await expect(this.signUpButton).toBeVisible()
    await this.signUpButton.click()
  }

  async setLocale(locale: LocaleTuple) {
    if (!locale) return
    await expect(this.localePicker).toBeVisible()
    await this.localePicker.selectOption(locale[0])
  }

  async clickSignInLink() {
    await expect(this.signInLink).toBeVisible()
    await this.signInLink.click()
  }

  async verifyProfileDisplayName(displayName: string) {
    await expect(this.profileLink).toBeVisible()
    await expect(this.profileLink).toContainText(displayName)
  }
}
