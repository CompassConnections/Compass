import {test} from '../fixtures/signInFixture'

test.describe('a verified account should', () => {
  // A first message has to be at least 200 characters and pick up something from the recipient's
  // profile (common/src/moderation/first-message.ts); quoting their seeded headline does both.
  // No quotes and no trailing space: the editor normalises both, and `verifyMessage` compares the
  // rendered text with this string exactly.
  const opener = (receiver: {headline?: string}) =>
    [
      `I read your headline, ${receiver.headline}, and it stuck with me.`,
      ...Array(3).fill('What made you put it that way? This is a message to find out.'),
    ].join(' ')
  test('be able to send a message from the messages page', async ({
    app,
    app2: receiverApp,
    signedInAccount: sender,
    signedOutAccount: receiver,
  }) => {
    await receiverApp.signinWithEmail(receiver)

    const message = opener(receiver)
    await app.home.clickMessagesLink()
    await app.messages.createNewMessage([receiver.display_name])
    await app.messages.sendMessage(message)

    await receiverApp.home.clickMessagesLink()
    await receiverApp.messages.findMessageConversation(sender.display_name)
    await receiverApp.messages.verifyMessage(message)
  })

  test('be able to send a message from the people page', async ({
    app,
    app2: receiverApp,
    signedInAccount: sender,
    signedOutAccount: receiver,
  }) => {
    await receiverApp.signinWithEmail(receiver)

    const longMessage = opener(receiver)

    await app.home.clickPeopleLink()
    await app.people.clearFilters()
    await app.people.useSearch(receiver.display_name)
    await app.people.messageProfile(receiver.display_name, longMessage)
    await app.messages.verifyMessage(longMessage)

    await receiverApp.home.clickMessagesLink()
    await receiverApp.messages.findMessageConversation(sender.display_name)
    await receiverApp.messages.verifyMessage(longMessage)
  })
})
