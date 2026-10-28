import {expect, Locator, Page} from '@playwright/test'
import {LocaleTuple} from 'common/constants'

export class HomePage {
  private readonly sidebar: Locator
  private readonly homePageLink: Locator
  private readonly profileLink: Locator
  private readonly signUpButton: Locator
  private readonly localePicker: Locator
  private readonly signInLink: Locator
  private readonly userMenuButton: Locator
  private readonly signOutLink: Locator
  private readonly closeButton: Locator

  constructor(public readonly page: Page) {
    this.sidebar = page.getByTestId('sidebar')
    this.homePageLink = this.sidebar.locator('a[href="/home"]')
    this.profileLink = page.getByTestId('sidebar-username')
    // The sign-up CTA reads "Join us" and may be the hero link or the sidebar button: the sidebar hides
    // its copy while the page's own is on screen (see `use-signup-cta-visible`), so match whichever shows.
    this.signUpButton = page
      .getByRole('link', {name: 'Join us'})
      .or(page.getByRole('button', {name: 'Join us'}))
      .filter({visible: true})
      .first()
    this.localePicker = page.getByTestId('sidebar-locale-picker')
    this.signInLink = page.locator('a[href="/signin"]').first()
    this.userMenuButton = page.getByTestId('sidebar-user-menu')
    this.signOutLink = page.getByText('Sign out', {exact: true})
    this.closeButton = page.getByRole('button', {name: 'Close'})
  }

  get sidebarAbout() {
    return this.sidebar.getByText('About')
  }

  get sidebarFaq() {
    return this.sidebar.getByText('FAQ')
  }

  get sidebarVote() {
    return this.sidebar.getByText('Vote')
  }

  // Events is hidden from the nav for now (see `page-base.tsx`); uncomment this, `clickEventsLink` and
  // the two `verify*` assertions below when it comes back.
  // get sidebarEvents() {
  //   return this.sidebar.getByText('Events')
  // }

  get sidebarWhatsNew() {
    return this.sidebar.getByText("What's new")
  }

  get sidebarSocials() {
    return this.sidebar.getByText('Socials')
  }

  get sidebarOrganization() {
    return this.sidebar.getByText('Organization')
  }

  get sidebarSettings() {
    return this.sidebar.getByText('Settings')
  }

  get sidebarPeople() {
    return this.sidebar.getByText('People')
  }

  get sidebarNotifs() {
    return this.sidebar.getByText('Notifs')
  }

  get sidebarMessages() {
    return this.sidebar.getByText('Messages')
  }

  get sidebarContact() {
    return this.sidebar.getByText('Contact')
  }

  async goToHomePage() {
    await this.page.goto('/home')
  }

  async goToRegisterPage() {
    await this.page.goto('/register')
  }

  async goToSigninPage() {
    await this.page.goto('/signin')
  }

  async clickAboutLink() {
    await expect(this.sidebarAbout).toBeVisible()
    await this.sidebarAbout.click()
  }

  async clickFaqLink() {
    await expect(this.sidebarFaq).toBeVisible()
    await this.sidebarFaq.click()
  }

  async clickVoteLink() {
    await expect(this.sidebarVote).toBeVisible()
    await this.sidebarVote.click()
  }

  // async clickEventsLink() {
  //   await expect(this.sidebarEvents).toBeVisible()
  //   await this.sidebarEvents.click()
  // }

  async clickWhatsNewLink() {
    await expect(this.sidebarWhatsNew).toBeVisible()
    await this.sidebarWhatsNew.click()
  }

  async clickSocialsLink() {
    await expect(this.sidebarSocials).toBeVisible()
    await this.sidebarSocials.click()
  }

  async clickOrganizationLink() {
    await expect(this.sidebarOrganization).toBeVisible()
    await this.sidebarOrganization.click()
  }

  async clickContactLink() {
    await expect(this.sidebarContact).toBeVisible()
    await this.sidebarContact.click()
  }

  async clickSettingsLink() {
    await expect(this.sidebarSettings).toBeVisible()
    await this.sidebarSettings.click()
    await this.page.waitForURL('/settings')
  }

  async clickPeopleLink() {
    await expect(this.sidebarPeople).toBeVisible()
    await this.sidebarPeople.click()
  }

  async clickNotifsLink() {
    await expect(this.sidebarNotifs).toBeVisible()
    await this.sidebarNotifs.click()
  }

  async clickMessagesLink() {
    await expect(this.sidebarMessages).toBeVisible()
    await this.sidebarMessages.click()
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
    await expect(this.sidebar).toBeVisible()
    await this.sidebar.getByText('Sign in').click()
  }

  async verifyHomePageLinks() {
    await expect(this.homePageLink).toBeVisible()
    await expect(this.sidebarAbout).toBeVisible()
    await expect(this.sidebarFaq).toBeVisible()
    await expect(this.sidebarVote).toBeVisible()
    // await expect(this.sidebarEvents).toBeVisible()
    await expect(this.sidebarWhatsNew).toBeVisible()
    await expect(this.sidebarSocials).toBeVisible()
    await expect(this.sidebarOrganization).toBeVisible()
    await expect(this.sidebarContact).toBeVisible()
    await expect(this.signUpButton).toBeVisible()
    await expect(this.signInLink).toBeVisible()
    await expect(this.localePicker).toBeVisible()
  }

  async verifySignedInHomePage(displayName: string) {
    await expect(this.homePageLink).toBeVisible()
    await expect(this.profileLink).toBeVisible()
    await expect(this.profileLink).toContainText(displayName)
    await expect(this.sidebarPeople).toBeVisible()
    await expect(this.sidebarNotifs).toBeVisible()
    await expect(this.sidebarMessages).toBeVisible()
    await expect(this.sidebarSettings).toBeVisible()
    await expect(this.sidebarAbout).toBeVisible()
    await expect(this.sidebarFaq).toBeVisible()
    await expect(this.sidebarVote).toBeVisible()
    // await expect(this.sidebarEvents).toBeVisible()
    await expect(this.sidebarWhatsNew).toBeVisible()
    await expect(this.sidebarSocials).toBeVisible()
    await expect(this.sidebarOrganization).toBeVisible()
    await expect(this.sidebarContact).toBeVisible()
    // Sign out sits behind the "…" menu next to the member's name.
    await this.userMenuButton.click()
    await expect(this.signOutLink).toBeVisible()
    await this.page.keyboard.press('Escape')
    await expect(this.signUpButton).not.toBeVisible()
    await expect(this.signInLink).not.toBeVisible()
    await expect(this.localePicker).not.toBeVisible()
  }
}
