import {expect, Locator, Page} from '@playwright/test'

export class SettingsPage {
    private readonly deleteAccountButton: Locator
    private readonly closeButton: Locator
    private readonly cancelButton: Locator
    private readonly deleteSurveyModal: Locator
    private readonly deleteSurveyReasons: Locator
    private readonly deleteSurveyDetails: Locator

    constructor(public readonly page: Page) {
        this.deleteAccountButton = page.getByRole('button', { name: 'Delete account' })
        this.closeButton = page.getByRole('button', { name: 'Close' })
        this.cancelButton = page.getByRole('button', { name: 'Cancel' })
        this.deleteSurveyModal = page.getByTestId('delete-survey-modal')
        this.deleteSurveyReasons = page.getByTestId('delete-account-survey-reasons')
        this.deleteSurveyDetails = page.getByRole('textbox')
    }

    async clickDeleteAccountButton() {
        await expect(this.deleteAccountButton).toBeVisible()
        await this.deleteAccountButton.click()
    }

    async clickCloseButton() {
        await expect(this.closeButton).toBeVisible()
        await this.closeButton.click()
    }

    async clickCancelButton() {
        await expect(this.cancelButton).toBeVisible()
        await this.cancelButton.click()
    }

    async fillDeleteAccountSurvey(reason: string) {
        await expect(this.deleteSurveyModal).toBeVisible()
        await expect(this.deleteSurveyReasons).toBeVisible()
        await this.deleteSurveyReasons.locator('div').nth(1).click()
        await expect(this.deleteSurveyDetails).toBeVisible()
        await this.deleteSurveyDetails.fill(reason)
    }
}