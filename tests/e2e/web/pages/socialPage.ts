import {expect, Locator, Page} from '@playwright/test'
import {
  discordLink,
  githubRepo,
  instagramLink,
  redditLink,
  stoatLink,
  supportEmail,
  xLink,
} from 'common/constants'

export class SocialPage {
  private readonly pageTitle: Locator
  private readonly communityHeading: Locator
  private readonly followAndUpdatesHeading: Locator
  private readonly developmentHeading: Locator
  private readonly contactHeading: Locator
  private readonly discordButton: Locator
  private readonly redditButton: Locator
  private readonly stoatButton: Locator
  private readonly xButton: Locator
  private readonly instagramButton: Locator
  private readonly githubButton: Locator
  private readonly emailButton: Locator

  constructor(public readonly page: Page) {
    this.pageTitle = page.getByRole('heading', {name: 'Socials'})
    this.communityHeading = page.getByRole('heading', {name: 'Community'})
    this.followAndUpdatesHeading = page.getByRole('heading', {name: 'Follow & Updates'})
    this.developmentHeading = page.getByRole('heading', {name: 'Development'})
    this.contactHeading = page.getByRole('heading', {name: 'Contact'})
    this.discordButton = page.getByRole('link', {name: 'Discord'})
    this.redditButton = page.getByRole('link', {name: 'Reddit'})
    this.stoatButton = page.getByRole('link', {name: 'Revolt / Stoat'})
    this.xButton = page.getByRole('link', {name: 'X'})
    this.instagramButton = page.getByRole('link', {name: 'Instagram'})
    this.githubButton = page.getByRole('link', {name: 'GitHub'})
    this.emailButton = page.getByRole('link', {name: `Email ${supportEmail}`})
  }

  async goToSocialPage() {
    await this.page.goto('/social')
  }

  async verifySocialPage() {
    await expect(this.page).toHaveURL(/\/social$/)
    await expect(this.pageTitle).toBeVisible()
    await expect(this.communityHeading).toBeVisible()
    await expect(this.followAndUpdatesHeading).toBeVisible()
    await expect(this.developmentHeading).toBeVisible()
    await expect(this.contactHeading).toBeVisible()

    await this.verifySocialLinks()
  }

  async verifySocialLinks() {
    await expect(this.discordButton).toBeVisible()
    await expect(this.discordButton).toHaveAttribute('href', discordLink)

    await expect(this.redditButton).toBeVisible()
    await expect(this.redditButton).toHaveAttribute('href', redditLink)

    await expect(this.stoatButton).toBeVisible()
    await expect(this.stoatButton).toHaveAttribute('href', stoatLink)

    await expect(this.xButton).toBeVisible()
    await expect(this.xButton).toHaveAttribute('href', xLink)

    await expect(this.instagramButton).toBeVisible()
    await expect(this.instagramButton).toHaveAttribute('href', instagramLink)

    await expect(this.githubButton).toBeVisible()
    await expect(this.githubButton).toHaveAttribute('href', githubRepo)

    await expect(this.emailButton).toBeVisible()
    await expect(this.emailButton).toHaveAttribute('href', `mailto:${supportEmail}`)
  }

  async clickDiscordButton() {
    await expect(this.discordButton).toBeVisible()
    await this.discordButton.click()
  }

  async clickRedditButton() {
    await expect(this.redditButton).toBeVisible()
    await this.redditButton.click()
  }

  async clickStoatButton() {
    await expect(this.stoatButton).toBeVisible()
    await this.stoatButton.click()
  }

  async clickXButton() {
    await expect(this.xButton).toBeVisible()
    await this.xButton.click()
  }

  async clickInstagramButton() {
    await expect(this.instagramButton).toBeVisible()
    await this.instagramButton.click()
  }

  async clickGitHubButton() {
    await expect(this.githubButton).toBeVisible()
    await this.githubButton.click()
  }

  async clickEmailButton() {
    await expect(this.emailButton).toBeVisible()
    await this.emailButton.click()
  }
}
