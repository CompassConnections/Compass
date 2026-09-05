import {render} from '@react-email/render'
import {defaultLocale} from 'common/constants'
import {debug} from 'common/logger'
import {milesToKm} from 'common/measurement-utils'
import {LocalDensity, OUTREACH_RADIUS_KM} from 'common/outreach/outreach'
import {MatchesType} from 'common/profiles/bookmarked_searches'
import {PrivateUser, User} from 'common/user'
import {
  getNotificationDestinationsForUser,
  UNSUBSCRIBE_URL,
} from 'common/user-notification-preferences'
import EmptyRoomEmail from 'email/empty-room'
import NewSearchAlertsEmail from 'email/new-search-alerts'
import ShareCompassEmail, {hasNearbyCount, NEARBY_RADIUS_MILES} from 'email/share-compass'
import UnfinishedSignupEmail from 'email/unfinished-signup'
import WelcomeEmail from 'email/welcome'
import * as admin from 'firebase-admin'
import React from 'react'
import {createT} from 'shared/locale'
import {getNearbyMemberCount, getProfile} from 'shared/profiles/supabase'
import {getOptionsIdsToLabels} from 'shared/supabase/options'
import {createUnsubscribeToken, getUnsubscribeUrlOneClick} from 'shared/unsubscribe-tokens'

import {NewEndorsementEmail} from '../new-endorsement'
import {NewMessageEmail} from '../new-message'
import {ProposalCommentEmail} from '../proposal-comment'
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

  // From Martin rather than the generic `fromEmail`, and replying to him rather than to the shared
  // hello@ inbox that `sendEmail` defaults to: this email now asks the reader to hit reply and talk to
  // the founder, and that ask is only true if the reply actually lands in his inbox.
  return await sendEmail({
    from: 'Martin from Compass <martin@compassmeet.com>',
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

export const sendProposalCommentEmail = async (
  privateUser: PrivateUser,
  fromUser: User,
  toUser: User,
  params: {proposalId: number; proposalTitle: string; commentText: string; stance?: string},
) => {
  const {sendToEmail, unsubscribeUrl} = getNotificationDestinationsForUser(
    privateUser,
    'comment_on_proposal',
  )
  if (!privateUser.email || !sendToEmail) return

  const locale = privateUser?.locale
  const t = createT(locale)

  const subject = t(
    'email.proposal_comment.subject',
    'New discussion on a proposal you voted on: {proposalTitle}',
    {proposalTitle: params.proposalTitle},
  )

  return await sendEmail({
    from: fromEmail,
    subject,
    to: privateUser.email,
    html: await render(
      <ProposalCommentEmail
        fromUser={fromUser}
        toUser={toUser}
        proposalId={params.proposalId}
        proposalTitle={params.proposalTitle}
        commentText={params.commentText}
        stance={params.stance}
        unsubscribeUrl={unsubscribeUrl}
        email={privateUser.email}
        locale={locale}
      />,
    ),
  })
}

/**
 * @param density Precomputed local numbers, quoted verbatim instead of the historical 200-mile count.
 *   The outreach job passes this so the figure a member is emailed is the same one the dashboard shows
 *   next to their name; called without it (the ad-hoc script path) nothing changes.
 */
export const sendShareCompassEmail = async (
  toUser: User,
  privateUser: PrivateUser,
  density?: LocalDensity,
) => {
  const notificationType = 'platform_updates'
  const {sendToEmail, unsubscribeUrl} = getNotificationDestinationsForUser(
    privateUser,
    notificationType,
  )
  const email = privateUser.email
  if (!email || !sendToEmail) {
    debug('No email or user turned off emails', toUser.username, toUser.id)
    return
  }

  const locale = privateUser?.locale
  const t = createT(locale)
  console.log(`Sending email to ${privateUser.email} in ${locale ?? defaultLocale} (${toUser.id})`)

  const profile = density ? undefined : await getProfile(toUser.id)
  const city = density ? (density.city ?? undefined) : (profile?.city ?? undefined)
  const nearbyCount = density
    ? density.count
    : profile
      ? await getNearbyMemberCount(profile, milesToKm(NEARBY_RADIUS_MILES)).catch((e) => {
          // A failed count must not block the send — fall back to the generic copy.
          debug('Failed to count nearby members', toUser.id, e)
          return undefined
        })
      : undefined

  const personalised = hasNearbyCount(nearbyCount, city)

  const subject = personalised
    ? t('email.share.preview_nearby', '{count} people near {city} are already on Compass', {
        count: String(nearbyCount),
        city: city as string,
      })
    : t('email.share.preview', "600 people in 6 months — here's how you help write what's next")

  const token = await createUnsubscribeToken(toUser.id, notificationType)
  const unsubscribeUrlOneClick = getUnsubscribeUrlOneClick(token)

  return await sendEmail({
    from: 'Martin from Compass <martin@compassmeet.com>',
    replyTo: 'martin@compassmeet.com',
    subject,
    to: email,
    html: await render(
      <ShareCompassEmail
        toUser={toUser}
        unsubscribeUrl={unsubscribeUrl}
        email={email}
        locale={locale}
        nearbyCount={nearbyCount}
        city={city}
        nearbyRadiusKm={density ? OUTREACH_RADIUS_KM : undefined}
        nearbyProfiles={density?.nearby}
      />,
    ),
    headers: {
      'List-Unsubscribe': `<mailto:unsubscribe@compassmeet.com?subject=${token}>, <${unsubscribeUrlOneClick}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'List-ID': 'Compass <compassmeet.com>',
    },
  })
}

/**
 * Contact #E. Sent once per member, ever — the caller claims the send through `outreach_sends` before
 * calling this, so nothing here re-checks it.
 */
export const sendEmptyRoomEmail = async (
  toUser: User,
  privateUser: PrivateUser,
  density: {count: number; city: string},
  opts?: {wasInactive?: boolean},
) => {
  const notificationType = 'platform_updates'
  const {sendToEmail, unsubscribeUrl} = getNotificationDestinationsForUser(
    privateUser,
    notificationType,
  )
  const email = privateUser.email
  if (!email || !sendToEmail) {
    debug('No email or user turned off emails', toUser.username, toUser.id)
    return
  }

  const locale = privateUser?.locale
  const t = createT(locale)

  const token = await createUnsubscribeToken(toUser.id, notificationType)
  const unsubscribeUrlOneClick = getUnsubscribeUrlOneClick(token)

  return await sendEmail({
    // From Martin rather than from Compass: it is a message admitting the product does not work for
    // them yet, and that is not a thing a platform says about itself.
    from: 'Martin from Compass <martin@compassmeet.com>',
    replyTo: 'martin@compassmeet.com',
    subject: t('email.empty_room.subject', 'The honest number for {city}', {city: density.city}),
    to: email,
    html: await render(
      <EmptyRoomEmail
        toUser={toUser}
        unsubscribeUrl={unsubscribeUrl}
        email={email}
        locale={locale}
        nearbyCount={density.count}
        city={density.city}
        wasInactive={opts?.wasInactive}
      />,
    ),
    headers: {
      'List-Unsubscribe': `<mailto:unsubscribe@compassmeet.com?subject=${token}>, <${unsubscribeUrlOneClick}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'List-ID': 'Compass <compassmeet.com>',
    },
  })
}

/**
 * The one notice for a login that never became an account. See `UnfinishedSignupEmail` for why it
 * is plain, once, and from Compass. There is no `PrivateUser` to consult here — that row is exactly
 * what does not exist — so no preference gate: the sweep's ledger is the only thing that decides
 * whether this goes out, and it says once.
 */
export const sendUnfinishedSignupEmail = async (
  email: string,
  {createdAt, deleteUrl, locale}: {createdAt: Date; deleteUrl: string; locale?: string},
) => {
  const t = createT(locale)
  return await sendEmail({
    from: fromEmail,
    subject: t('email.unfinished_signup.subject', 'Your unfinished Compass account'),
    to: email,
    html: await render(
      <UnfinishedSignupEmail
        email={email}
        createdAt={createdAt}
        deleteUrl={deleteUrl}
        locale={locale}
      />,
    ),
  })
}

export const sendTestEmail = async (toEmail: string) => {
  return await sendEmail({
    from: 'Martin from Compass <martin@compassmeet.com>',
    replyTo: 'martin@compassmeet.com',
    subject: 'Test email from Compass',
    to: toEmail,
    html: await render(<Test name="Test User" />),
  })
}
