import {expect, Locator, Page} from '@playwright/test'

export class NotificationPage {
  private readonly notificationTab: Locator
  private readonly settingsTab: Locator

  constructor(public readonly page: Page) {
    this.notificationTab = page.getByTestId('notifications-tab')
    this.settingsTab = page.getByTestId('settings-tab')
  }
}
