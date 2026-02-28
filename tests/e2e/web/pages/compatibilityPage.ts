import {expect, Locator, Page} from '@playwright/test'

export class ComatibilityPage {
  private readonly answeredQuestionsTab: Locator
  private readonly remaningQuestionsTab: Locator
  private readonly skippedQuestionsTab: Locator

  constructor(public readonly page: Page) {
    this.answeredQuestionsTab = page.getByText('Answered')
    this.remaningQuestionsTab = page.getByText('To Answer')
    this.skippedQuestionsTab = page.getByText('Skipped')
  }

  async clickAnsweredQuestionsTab() {
    await expect(this.answeredQuestionsTab).toBeVisible()
    await this.answeredQuestionsTab.click()
  }

  async clickRemainingQuestionsTab() {
    await expect(this.remaningQuestionsTab).toBeVisible()
    await this.remaningQuestionsTab.click()
  }

  async clickSkippedQuestionsTab() {
    await expect(this.skippedQuestionsTab).toBeVisible()
    await this.skippedQuestionsTab.click()
  }
}
