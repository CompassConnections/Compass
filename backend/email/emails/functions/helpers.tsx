import { PrivateUser, User } from 'common/user'
import { getNotificationDestinationsForUser } from 'common/user-notification-preferences'
import { sendEmail } from './send-email'
import { NewMatchEmail } from '../new-match'
import { NewMessageEmail } from '../new-message'
import { NewEndorsementEmail } from '../new-endorsement'
import { Test } from '../test'
import { getLover } from 'shared/love/supabase'
import {renderToStaticMarkup} from "react-dom/server";

const from = 'Compass <no-reply@compassmeet.com>'

export const sendNewMatchEmail = async (
  privateUser: PrivateUser,
  matchedWithUser: User
) => {
  const { sendToEmail, unsubscribeUrl } = getNotificationDestinationsForUser(
    privateUser,
    'new_match'
  )
  if (!privateUser.email || !sendToEmail) return
  const lover = await getLover(privateUser.id)
  if (!lover) return

  return await sendEmail({
    from,
    subject: `You have a new match!`,
    to: privateUser.email,
    react: (
      <NewMatchEmail
        onUser={lover.user}
        email={privateUser.email}
        matchedWithUser={matchedWithUser}
        matchedLover={lover}
        unsubscribeUrl={unsubscribeUrl}
      />
    ),
  })
}

export const sendNewMessageEmail = async (
  privateUser: PrivateUser,
  fromUser: User,
  toUser: User,
  channelId: number
) => {
  const { sendToEmail, unsubscribeUrl } = getNotificationDestinationsForUser(
    privateUser,
    'new_message'
  )
  if (!privateUser.email || !sendToEmail) return

  const lover = await getLover(fromUser.id)

  if (!lover) {
    console.error('Could not send email notification: User not found')
    return
  }

  console.log({
    from,
    subject: `${fromUser.name} sent you a message!`,
    to: privateUser.email,
    html: renderToStaticMarkup(
      <NewMessageEmail
        fromUser={fromUser}
        fromUserLover={lover}
        toUser={toUser}
        channelId={channelId}
        unsubscribeUrl={unsubscribeUrl}
        email={privateUser.email}
      />
    ),
  })

  return await sendEmail({
    from,
    subject: `${fromUser.name} sent you a message!`,
    to: privateUser.email,
    html: renderToStaticMarkup(
      <NewMessageEmail
        fromUser={fromUser}
        fromUserLover={lover}
        toUser={toUser}
        channelId={channelId}
        unsubscribeUrl={unsubscribeUrl}
        email={privateUser.email}
      />
    ),
  })
}

export const sendNewEndorsementEmail = async (
  privateUser: PrivateUser,
  fromUser: User,
  onUser: User,
  text: string
) => {
  const { sendToEmail, unsubscribeUrl } = getNotificationDestinationsForUser(
    privateUser,
    'new_endorsement'
  )
  if (!privateUser.email || !sendToEmail) return

  return await sendEmail({
    from,
    subject: `${fromUser.name} just endorsed you!`,
    to: privateUser.email,
    react: (
      <NewEndorsementEmail
        fromUser={fromUser}
        onUser={onUser}
        endorsementText={text}
        unsubscribeUrl={unsubscribeUrl}
        email={privateUser.email}
      />
    ),
  })
}

export const sendTestEmail = async (toEmail: string) => {
  return await sendEmail({
    from,
    subject: 'Test email from Compass',
    to: toEmail,
    html: renderToStaticMarkup(<Test name="Test User" />),
  })
}
