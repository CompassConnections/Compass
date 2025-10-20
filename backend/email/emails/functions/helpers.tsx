import {PrivateUser, User} from 'common/user'
import {getNotificationDestinationsForUser, UNSUBSCRIBE_URL} from 'common/user-notification-preferences'
import {sendEmail} from './send-email'
import {NewMessageEmail} from '../new-message'
import {NewEndorsementEmail} from '../new-endorsement'
import {Test} from '../test'
import {getProfile} from 'shared/profiles/supabase'
import { render } from "@react-email/render"
import {MatchesType} from "common/profiles/bookmarked_searches";
import NewSearchAlertsEmail from "email/new-search_alerts";
import WelcomeEmail from "email/welcome";

const from = 'Compass <compass@compassmeet.com>'

// export const sendNewMatchEmail = async (
//   privateUser: PrivateUser,
//   matchedWithUser: User
// ) => {
//   const {sendToEmail, unsubscribeUrl} = getNotificationDestinationsForUser(
//     privateUser,
//     'new_match'
//   )
//   if (!privateUser.email || !sendToEmail) return
//   const profile = await getProfile(privateUser.id)
//   if (!profile) return
//
//   return await sendEmail({
//     from,
//     subject: `You have a new match!`,
//     to: privateUser.email,
//     react: (
//       <NewMatchEmail
//         onUser={profile.user}
//         email={privateUser.email}
//         matchedWithUser={matchedWithUser}
//         matchedProfile={profile}
//         unsubscribeUrl={unsubscribeUrl}
//       />
//     ),
//   })
// }

export const sendNewMessageEmail = async (
  privateUser: PrivateUser,
  fromUser: User,
  toUser: User,
  channelId: number
) => {
  const {sendToEmail, unsubscribeUrl} = getNotificationDestinationsForUser(
    privateUser,
    'new_message'
  )
  if (!privateUser.email || !sendToEmail) return

  const profile = await getProfile(fromUser.id)

  if (!profile) {
    console.error('Could not send email notification: User not found')
    return
  }

  return await sendEmail({
    from,
    subject: `${fromUser.name} sent you a message!`,
    to: privateUser.email,
    html: await render(
      <NewMessageEmail
        fromUser={fromUser}
        fromUserProfile={profile}
        toUser={toUser}
        channelId={channelId}
        unsubscribeUrl={unsubscribeUrl}
        email={privateUser.email}
      />
    ),
  })
}

export const sendWelcomeEmail = async (
  toUser: User,
  privateUser: PrivateUser,
) => {
  if (!privateUser.email) return
  return await sendEmail({
    from,
    subject: `Welcome to Compass!`,
    to: privateUser.email,
    html: await render(
      <WelcomeEmail
        toUser={toUser}
        unsubscribeUrl={UNSUBSCRIBE_URL}
        email={privateUser.email}
      />
    ),
  })
}

export const sendSearchAlertsEmail = async (
  toUser: User,
  privateUser: PrivateUser,
  matches: MatchesType[],
) => {
  const {sendToEmail, unsubscribeUrl} = getNotificationDestinationsForUser(
    privateUser,
    'new_search_alerts'
  )
  const email = privateUser.email;
  if (!email || !sendToEmail) return

  return await sendEmail({
    from,
    subject: `People aligned with your values just joined`,
    to: email,
    html: await render(
      <NewSearchAlertsEmail
        toUser={toUser}
        matches={matches}
        unsubscribeUrl={unsubscribeUrl}
        email={email}
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
  const {sendToEmail, unsubscribeUrl} = getNotificationDestinationsForUser(
    privateUser,
    'new_endorsement'
  )
  if (!privateUser.email || !sendToEmail) return

  return await sendEmail({
    from,
    subject: `${fromUser.name} just endorsed you!`,
    to: privateUser.email,
    html: await render(
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
    html: await render(<Test name="Test User"/>),
  })
}
