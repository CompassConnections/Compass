import {Img, Link, Section, Text} from '@react-email/components'
import {DEPLOYED_WEB_URL, DOMAIN} from 'common/envs/constants'
import {type ProfileRow} from 'common/profiles/profile'
import {type User} from 'common/user'
import {
  Actions,
  CTAButton,
  Divider,
  EmailShell,
  Eyebrow,
  fonts,
  Heading,
  Lead,
  link,
  Muted,
  palette,
} from 'email/utils'
import React from 'react'
import {createT} from 'shared/locale'

import {jamesProfile, jamesUser, mockUser} from './functions/mock'

interface NewMessageEmailProps {
  fromUser: User
  fromUserProfile: ProfileRow
  toUser: User
  channelId: number
  unsubscribeUrl: string
  email?: string
  locale?: string
}

export const NewMessageEmail = ({
  fromUser,
  fromUserProfile,
  toUser,
  channelId,
  unsubscribeUrl,
  email,
  locale,
}: NewMessageEmailProps) => {
  const name = toUser.name.split(' ')[0]
  const creatorName = fromUser.name
  const messagesUrl = `https://${DOMAIN}/messages/${channelId}`
  const profileUrl = `https://${DOMAIN}/${fromUser.username}`
  // Every client renders <img> reliably, none of them render a CSS-generated placeholder — so an absent
  // avatar falls back to the same asset the web app uses rather than to a broken image icon.
  const avatarUrl = fromUser.avatarUrl
  const t = createT(locale)

  // Age and city are the two facts a reader can act on at a glance; anything more turns the card into a
  // profile page and competes with the one button this email has.
  const meta = [fromUserProfile?.age, fromUserProfile?.city].filter(Boolean).join(' · ')

  return (
    <EmailShell
      preview={t('email.new_message.preview', 'New message from {creatorName}', {creatorName})}
      unsubscribeUrl={unsubscribeUrl}
      email={email ?? name}
      locale={locale}
    >
      {/* A pill rather than a headline: it names the event in one glance, above the fold and above the
          greeting, which is what the reader is scanning for when the subject line already said someone
          wrote to them. */}
      <Section style={{textAlign: 'center'}}>
        <Eyebrow>{t('email.new_message.badge', 'New message')}</Eyebrow>
      </Section>

      <Heading style={{margin: '18px 0 12px 0'}}>
        {t('email.new_message.greeting', 'Hi {name},', {name})}
      </Heading>

      {/* This line used to sit in a chat bubble nested inside the person card — a box inside a box, for a
          sentence that is not actually a quote of anything. It is the lead, so it reads as the lead. */}
      <Lead>
        {t('email.new_message.message', '{creatorName} just messaged you!', {creatorName})}
      </Lead>

      {/* The person sits straight on the sheet. This used to be a bordered card, with the greeting
          above it and the button below it — a rectangle inside a rectangle for what is really just an
          avatar and a name. The ring around the photo already separates it from the ground, so the box
          was drawing a second boundary around a boundary. The avatar is the whole point either way: a
          face converts where a name does not. The ring is a padded round div rather than a box-shadow,
          which Gmail strips. */}
      <Section style={{textAlign: 'center', margin: '4px 0 0 0'}}>
        {avatarUrl && (
          <Link href={profileUrl} style={{textDecoration: 'none'}}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px',
                backgroundColor: palette.primary200,
                borderRadius: '9999px',
                lineHeight: '0',
              }}
            >
              <Img
                src={avatarUrl}
                alt={creatorName}
                width={96}
                height={96}
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '9999px',
                  objectFit: 'cover',
                  display: 'block',
                  border: `3px solid ${palette.canvas0}`,
                }}
              />
            </span>
          </Link>
        )}

        <Text
          className="cm-name"
          style={{
            fontFamily: fonts.heading,
            fontSize: '22px',
            fontWeight: 600,
            color: palette.ink900,
            margin: '16px 0 0 0',
            lineHeight: '1.2',
            textAlign: 'center' as const,
          }}
        >
          {creatorName}
        </Text>

        <Text
          className="cm-accent"
          style={{
            fontFamily: fonts.body,
            fontSize: '13px',
            color: palette.primary600,
            margin: '4px 0 0 0',
            lineHeight: '1.4',
            textAlign: 'center' as const,
          }}
        >
          @{fromUser.username}
          {meta ? ` · ${meta}` : ''}
        </Text>
      </Section>

      <Actions style={{margin: '26px 0 4px 0'}}>
        <CTAButton href={messagesUrl}>
          {t('email.new_message.viewButton', 'Read & reply')}
        </CTAButton>

        <Muted style={{marginTop: '14px'}}>
          <Link href={profileUrl} style={link}>
            {t('email.new_message.view_profile', 'View profile')}
          </Link>
        </Muted>
      </Actions>

      <Muted
        style={{
          fontFamily: fonts.heading,
          fontSize: '16px',
          fontStyle: 'italic',
          marginTop: '24px',
        }}
      >
        {t(
          'email.new_message.nudge',
          'One sentence back is usually all it takes to start something real.',
        )}
      </Muted>

      <Divider />

      <Muted>
        {t(
          'email.new_message.daily_limit',
          "To avoid overloading your inbox, you'll receive at most one email per day per conversation. If {creatorName} sends more messages today, you won't be notified by email.",
          {creatorName},
        )}{' '}
        {/* A new key rather than a reword: the fr/de files already translate the old one as
            "the Compass app for Android", and those resolve ahead of this fallback — so
            reusing it would leave two of three languages saying Android-only. */}
        {t('email.new_message.app_prompt.v2', 'Want real-time notifications? Get the Compass app:')}{' '}
        {/* Our own /download rather than a store link. Mail is the one place where the
            device that opens it is genuinely unknowable — the same message gets read on a
            laptop and on the phone it is about. */}
        <Link href={`${DEPLOYED_WEB_URL}/download`} style={link}>
          {t('email.new_message.app_link', 'Get the app')}
        </Link>
        {'.'}
      </Muted>
    </EmailShell>
  )
}

NewMessageEmail.PreviewProps = {
  fromUser: jamesUser,
  fromUserProfile: jamesProfile,
  toUser: mockUser,
  channelId: 1,
  email: 'someone@gmail.com',
  unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
  // locale: 'fr',
} as NewMessageEmailProps

export default NewMessageEmail
