import {Section} from '@react-email/components'
import {DOMAIN} from 'common/envs/constants'
import {type User} from 'common/user'
import {Actions, CTAButton, EmailShell, Eyebrow, Heading, Lead} from 'email/utils'
import React from 'react'
import {createT} from 'shared/locale'

import {jamesUser, mockUser} from './functions/mock'

/**
 * `requested`: `fromUser` asked to join the reader's circle. `added`: `fromUser` added the reader to
 * theirs. The circle is the members someone lets see the profile fields they keep back
 * (docs/profile-visibility.md).
 */
export type CircleEmailKind = 'requested' | 'added'

interface CircleEmailProps {
  kind: CircleEmailKind
  fromUser: User
  toUser: User
  unsubscribeUrl: string
  email?: string
  locale?: string
}

/**
 * One email for both circle events. Each says what a circle is in a sentence, because this may be
 * the first place the reader meets the word, and both send the reader to the other person's profile:
 * that is where a request is answered, and where what was just shared can be read.
 */
export const CircleEmail = ({
  kind,
  fromUser,
  toUser,
  unsubscribeUrl,
  email,
  locale,
}: CircleEmailProps) => {
  const name = toUser.name.split(' ')[0]
  const t = createT(locale)
  const profileUrl = `https://${DOMAIN}/${fromUser.username}`
  const requested = kind === 'requested'

  return (
    <EmailShell
      preview={
        requested
          ? t('email.circle.requested.preview', '{fromUserName} asked to join your circle', {
              fromUserName: fromUser.name,
            })
          : t('email.circle.added.preview', '{fromUserName} added you to their circle', {
              fromUserName: fromUser.name,
            })
      }
      unsubscribeUrl={unsubscribeUrl}
      email={email ?? name}
      locale={locale}
    >
      <Section style={{textAlign: 'center'}}>
        <Eyebrow>
          {requested
            ? t('email.circle.requested.badge', 'Circle request')
            : t('email.circle.added.badge', 'Added to a circle')}
        </Eyebrow>
      </Section>

      <Heading style={{margin: '18px 0 12px 0'}}>
        {t('email.circle.greeting', 'Hi {name},', {name})}
      </Heading>

      <Lead>
        {requested
          ? t(
              'email.circle.requested.message',
              '{fromUserName} asked to join your circle and see the parts of your profile you keep for it. You can add them or simply ignore the request.',
              {fromUserName: fromUser.name},
            )
          : t(
              'email.circle.added.message',
              '{fromUserName} added you to their circle, so you can now see the parts of their profile they keep for it.',
              {fromUserName: fromUser.name},
            )}
      </Lead>

      <Actions>
        <CTAButton href={profileUrl}>
          {requested
            ? t('email.circle.requested.button', 'Open their profile to decide')
            : t('email.circle.added.button', 'View their profile')}
        </CTAButton>
      </Actions>
    </EmailShell>
  )
}

CircleEmail.PreviewProps = {
  kind: 'requested',
  fromUser: jamesUser,
  toUser: mockUser,
  unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
  email: 'someone@gmail.com',
} as CircleEmailProps

export default CircleEmail
