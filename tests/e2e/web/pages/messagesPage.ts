import {expect, Locator, Page} from '@playwright/test'

export class MessagesPage {
  private readonly messagesPageHeader: Locator
  private readonly messagesTable: Locator
  private readonly messagesRow: Locator
  private readonly messagesUsername: Locator
  private readonly messagesTimestamp: Locator
  private readonly newMessageButton: Locator
  private readonly newMessageSearchUsers: Locator
  private readonly newMessageSearchResults: Locator
  private readonly newMessageSearchCreateButton: Locator
  private readonly newMessageStart: Locator
  private readonly messageInput: Locator
  private readonly messageSubmit: Locator
  private readonly conversation: Locator
  private readonly conversationMessage: Locator

  constructor(public readonly page: Page) {
    this.messagesPageHeader = page.getByRole('heading', {name: 'Messages'})
    this.messagesTable = page.getByTestId('messages-table')
    this.messagesRow = page.getByTestId('messages-row')
    this.messagesUsername = page.getByTestId('messages-username')
    this.messagesTimestamp = page.getByTestId('messages-timestamp')
    this.newMessageButton = page.getByRole('button', {name: 'New Message'})
    this.newMessageSearchUsers = page.getByRole('textbox', {name: 'Search users...'})
    this.newMessageSearchResults = page.getByTestId('search-results')
    this.newMessageSearchCreateButton = page.getByRole('button', {name: 'Create'})
    this.newMessageStart = page.getByText('No messages yet.', {exact: true})
    this.messageInput = page.locator('.tiptap')
    this.messageSubmit = page.getByTestId('conversation-message-submit')
    this.conversation = page.getByTestId('conversation')
    this.conversationMessage = page.getByTestId('conversation-message')
  }

  async verifyMessagesPage() {
    await expect(this.messagesPageHeader).toBeVisible()
  }

  async createNewMessage(username: string[]) {
    await expect(this.newMessageButton).toBeVisible()
    await this.newMessageButton.click()
    await expect(this.newMessageSearchUsers).toBeVisible()
    for (let i = 0; i < username.length; i++) {
      await this.newMessageSearchUsers.fill(username[i])
      await expect(this.newMessageSearchResults).toBeVisible()
      const results = await this.newMessageSearchResults
        .getByTestId('search-results-username')
        .all()
      const targetUser = username[i].toLowerCase()
      for (let j = 0; j < results.length; j++) {
        const usernameResults = (await results[j].textContent())?.toLowerCase()
        if (usernameResults === targetUser) {
          await results[j].click()
          break
        }
      }
    }

    await expect(this.newMessageSearchCreateButton).toBeVisible()
    await this.newMessageSearchCreateButton.click()
  }

  async sendMessage(message: string) {
    await expect(this.messageInput).toBeVisible()
    await this.messageInput.fill(message)
    await expect(this.messageSubmit).toBeVisible()
    await this.messageSubmit.click()
    const verified = await this.verifyMessage(message)
    if (!verified) throw new Error(`Message "${message}" was not found in conversation after sending`)
  }

  async findMessageConversation(displayName: string) {
    await expect(this.messagesTable).toBeVisible()
    await this.page.waitForTimeout(1000)
    const doMessagesExist = (await this.messagesRow.count()) > 0
    if (doMessagesExist) {
      const messages = await this.messagesRow.getByTestId('messages-username').all()

      for (let i = 0; i < messages.length; i++) {
        await expect(messages[i]).toBeVisible()
        const messageFromUser = await messages[i].textContent()
        if (messageFromUser?.toLowerCase() === displayName.toLowerCase()) await messages[i].click()
      }
    } else {
      throw new Error('There are no messages on this account')
    }
  }

  async verifyMessage(messageContent: string) {
    await expect(this.conversation).toBeVisible()
    await this.page.waitForTimeout(1000)
    const messageCount = (await this.conversationMessage.count()) > 0
    if (messageCount) {
      const messages = await this.conversationMessage.all()
      for (let i = 0; i < messages.length; i++) {
        const message = await messages[i].textContent()
        if (message?.toLowerCase() === messageContent.toLowerCase()) return true
      }
      return false
    } else {
      throw new Error('There are no messages in this conversation')
    }
  }
}
