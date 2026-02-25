import {render} from '@react-email/render'
import {MatchesType} from 'common/profiles/bookmarked_searches'
import {PrivateUser, User} from 'common/user'
import {
  getNotificationDestinationsForUser,
  UNSUBSCRIBE_URL,
} from 'common/user-notification-preferences'
import NewSearchAlertsEmail from 'email/new-search_alerts'
import WelcomeEmail from 'email/welcome'
import * as admin from 'firebase-admin'
import React from 'react'
import {createT} from 'shared/locale'
import {getProfile} from 'shared/profiles/supabase'
import {getOptionsIdsToLabels} from 'shared/supabase/options'

import {NewEndorsementEmail} from '../new-endorsement'
import {NewMessageEmail} from '../new-message'
import {Test} from '../test'
import {sendEmail} from './send-email'

export const fromEmail = 'Compass <compass@compassmeet.com>'

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
  channelId: number,
) => {
  const {sendToEmail, unsubscribeUrl} = getNotificationDestinationsForUser(
    privateUser,
    'new_message',
  )
  if (!privateUser.email || !sendToEmail) return

  const profile = await getProfile(fromUser.id)

  if (!profile) {
    console.error('Could not send email notification: User not found')
    return
  }

  const locale = privateUser?.locale
  const t = createT(locale)
  console.log(`Sending email to ${privateUser.email} in ${locale}`)

  const subject = t('email.new_message.subject', '{creatorName} sent you a message!', {
    creatorName: fromUser.name,
  })

  return await sendEmail({
    from: fromEmail,
    subject,
    to: privateUser.email,
    html: await render(
      <NewMessageEmail
        fromUser={fromUser}
        fromUserProfile={profile}
        toUser={toUser}
        channelId={channelId}
        unsubscribeUrl={unsubscribeUrl}
        email={privateUser.email}
        locale={locale}
      />,
    ),
  })
}

export const sendWelcomeEmail = async (toUser: User, privateUser: PrivateUser) => {
  if (!privateUser.email) return
  const verificationLink = await admin.auth().generateEmailVerificationLink(privateUser.email)

  const locale = privateUser?.locale
  const t = createT(locale)
  console.log(`Sending welcome email to ${privateUser.email} in ${locale}`)

  const subject = t('email.welcome.subject', 'Welcome to Compass!')

  return await sendEmail({
    from: fromEmail,
    subject,
    to: privateUser.email,
    html: await render(
      <WelcomeEmail
        toUser={toUser}
        unsubscribeUrl={UNSUBSCRIBE_URL}
        email={privateUser.email}
        verificationLink={verificationLink}
        locale={locale}
      />,
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
    'new_search_alerts',
  )
  const email = privateUser.email
  if (!email || !sendToEmail) return

  const locale = privateUser?.locale
  const t = createT(locale)
  console.log(`Sending email to ${privateUser.email} in ${locale}`)

  const optionIdsToLabels = await getOptionsIdsToLabels(locale)

  const subject = t('email.search_alerts.subject', 'People aligned with your values just joined')

  return await sendEmail({
    from: fromEmail,
    subject,
    to: email,
    html: await render(
      <NewSearchAlertsEmail
        toUser={toUser}
        matches={matches}
        unsubscribeUrl={unsubscribeUrl}
        email={email}
        optionIdsToLabels={optionIdsToLabels}
        locale={locale}
      />,
    ),
  })
}

export const sendNewEndorsementEmail = async (
  privateUser: PrivateUser,
  fromUser: User,
  onUser: User,
  text: string,
) => {
  const {sendToEmail, unsubscribeUrl} = getNotificationDestinationsForUser(
    privateUser,
    'new_endorsement',
  )
  if (!privateUser.email || !sendToEmail) return

  const locale = privateUser?.locale
  const t = createT(locale)
  console.log(`Sending email to ${privateUser.email} in ${locale}`)

  const subject = t('email.new_endorsement.subject', '{fromUserName} just endorsed you!', {
    fromUserName: fromUser.name,
  })

  return await sendEmail({
    from: fromEmail,
    subject,
    to: privateUser.email,
    html: await render(
      <NewEndorsementEmail
        fromUser={fromUser}
        onUser={onUser}
        endorsementText={text}
        unsubscribeUrl={unsubscribeUrl}
        email={privateUser.email}
        locale={locale}
      />,
    ),
  })
}

export const sendTestEmail = async (toEmail: string) => {
  return await sendEmail({
    from: fromEmail,
    subject: 'Test email from Compass',
    to: toEmail,
    html: await render(<Test name="Test User" />),
  })
}
