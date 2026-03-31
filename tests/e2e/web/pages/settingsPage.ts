import {expect, Locator, Page} from '@playwright/test'
import {LocaleTuple} from 'common/constants'
import {FontsTuple} from 'web/components/font-picker'

export class SettingsPage {
  private readonly localePicker: Locator
  private readonly measurementSystemToggle: Locator
  private readonly themeToggle: Locator
  private readonly fontPicker: Locator
  private readonly downloadProfileJSONDataButton: Locator
  private readonly manageHiddenProfilesButton: Locator
  private readonly hiddenProfilesSection: Locator
  private readonly directMessagingPreferenceToggle: Locator
  private readonly privateInterestSignalsToggle: Locator
  private readonly sendVerificationEmailButton: Locator
  private readonly verifiedEmailLink: Locator
  private readonly changeEmailButton: Locator
  private readonly sendPasswordResetButton: Locator
  private readonly deleteAccountButton: Locator
  private readonly closeButton: Locator
  private readonly cancelButton: Locator
  private readonly deleteSurveyModal: Locator
  private readonly deleteSurveyReasons: Locator
  private readonly deleteSurveyDetails: Locator

  constructor(public readonly page: Page) {
    this.localePicker = page.getByTestId('sidebar-locale-picker')
    this.measurementSystemToggle = page.getByTestId('measuerment-system-toggle')
    this.themeToggle = page.getByTestId('settings-dark-light-toggle')
    this.fontPicker = page.getByTestId('settings-font-picker')
    this.downloadProfileJSONDataButton = page.getByRole('button', {
      name: 'Download all my data (JSON)',
    })
    this.manageHiddenProfilesButton = page.getByRole('button', {name: 'Manage hidden profiles'})
    this.hiddenProfilesSection = page.getByTestId('hidden-profiles')
    this.directMessagingPreferenceToggle = page.getByTestId('settings-direct-message-toggle')
    this.privateInterestSignalsToggle = page.getByTestId('settings-private-interest-signal-toggle')
    this.sendVerificationEmailButton = page.getByRole('button', {name: 'Send verification email'})
    this.verifiedEmailLink = page.getByRole('button', {name: 'I verified my email'}) // Need method for this
    this.changeEmailButton = page.getByRole('button', {name: 'Change email address'})
    this.sendPasswordResetButton = page.getByRole('button', {name: 'Send password reset email'})
    this.deleteAccountButton = page.getByRole('button', {name: 'Delete account'})
    this.closeButton = page.getByRole('button', {name: 'Close'})
    this.cancelButton = page.getByRole('button', {name: 'Cancel'})
    this.deleteSurveyModal = page.getByTestId('delete-survey-modal')
    this.deleteSurveyReasons = page.getByTestId('delete-account-survey-reasons')
    this.deleteSurveyDetails = page.getByRole('textbox')
  }

  async setLocale(locale: LocaleTuple) {
    if (!locale) return
    await expect(this.localePicker).toBeVisible()
    await this.localePicker.selectOption(locale[0])
  }

  async toggleMeasurementSystem() {
    await expect(this.measurementSystemToggle).toBeVisible()
    await this.measurementSystemToggle.click()
  }

  async toggleDisplayTheme() {
    await expect(this.themeToggle).toBeVisible()
    await this.themeToggle.click()
  }

  async setFont(font: FontsTuple) {
    if (!font) return
    await expect(this.fontPicker).toBeVisible()
    await this.fontPicker.selectOption(font[0])
  }

  async clickdownloadProfileDataButton() {
    await expect(this.downloadProfileJSONDataButton).toBeVisible()
    await this.downloadProfileJSONDataButton.click()
  }

  async clickManageHiddenProfilesButton() {
    await expect(this.manageHiddenProfilesButton).toBeVisible()
    await this.manageHiddenProfilesButton.click()
  }

  async clickCancelButton() {
    await expect(this.cancelButton).toBeVisible()
    await this.cancelButton.click()
  }

  async verifyHiddenProfiles(profiles: string[]) {
    await expect(this.hiddenProfilesSection).toBeVisible()
    for (let i = 0; i < profiles.length; i++) {
      try {
        await expect(
          this.hiddenProfilesSection.getByRole('link', {name: `${profiles[i]}`}),
        ).toBeVisible({timeout: 2000})
      } catch (error) {
        throw new Error(`Profile ${profiles[i]} has not been hidden`)
      }
    }
  }

  async unhideProfiles(profile: string) {
    await expect(this.hiddenProfilesSection).toBeVisible()
    const hiddenProfiles = await this.hiddenProfilesSection.count()
    let matchIndex = -1
    for (let i = 0; i < hiddenProfiles; i++) {
      const target = await this.hiddenProfilesSection.getByRole('link', {name: `${profile}`})
      if (target) {
        matchIndex = i
      }
    }
    await this.hiddenProfilesSection
      .locator('div')
      .nth(matchIndex)
      .getByRole('button', {name: 'Unhide'})
      .click()
  }

  async toggleDirectMessagingPreferences() {
    await expect(this.directMessagingPreferenceToggle).toBeVisible()
    await this.directMessagingPreferenceToggle.click()
  }

  async togglePrivateInterestSignalsPreferences() {
    await expect(this.privateInterestSignalsToggle).toBeVisible()
    await this.privateInterestSignalsToggle.click()
  }

  async clickSendVerificationEmailButton() {
    await expect(this.sendVerificationEmailButton).toBeVisible()
    await this.sendVerificationEmailButton.click()
  }

  async clickChangeEmailAddressButton() {
    await expect(this.changeEmailButton).toBeVisible()
    await this.changeEmailButton.click()
  }

  async clickSendPasswordResetEmailButton() {
    await expect(this.sendPasswordResetButton).toBeVisible()
    await this.sendPasswordResetButton.click()
  }

  async clickDeleteAccountButton() {
    await expect(this.deleteAccountButton).toBeVisible()
    await this.deleteAccountButton.click()
  }

  async clickCloseButton() {
    await expect(this.closeButton).toBeVisible()
    await this.closeButton.click()
  }

  async fillDeleteAccountSurvey(reason: string) {
    await expect(this.deleteSurveyModal).toBeVisible()
    await expect(this.deleteSurveyReasons).toBeVisible()
    await this.deleteSurveyReasons.locator('div').nth(1).click()
    await expect(this.deleteSurveyDetails).toBeVisible()
    await this.deleteSurveyDetails.fill(reason)
  }
}
