import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import {DEPLOYED_WEB_URL, DOMAIN} from 'common/envs/constants'
import {type ProfileRow} from 'common/profiles/profile'
import {type User} from 'common/user'
import {container, content, DARK_MODE_CSS, Footer, main} from 'email/utils'
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
    <Html>
      <Head>
        <style>{DARK_MODE_CSS}</style>
      </Head>
      <Preview>
        {t('email.new_message.preview', 'New message from {creatorName}', {creatorName})}
      </Preview>
      <Body style={main} className="cm-body">
        <Container style={container}>
          {/*<Section style={logoContainer}>*/}
          {/*  <Img*/}
          {/*    src="..."*/}
          {/*    width="550"*/}
          {/*    height="auto"*/}
          {/*    alt="compassmeet.com"*/}
          {/*  />*/}
          {/*</Section>*/}

          <Section style={content} className="cm-surface">
            <div
              style={{
                textAlign: 'center',
                marginBottom: '28px',
              }}
            >
              {/* A pill rather than a headline: it names the event in one glance, above the fold and above
                  the greeting, which is what the reader is scanning for when the subject line already
                  said someone wrote to them. */}
              <span
                className="cm-chip"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#faf3e9',
                  border: '1px solid #e8c99e',
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#a6682e',
                  lineHeight: '1.2',
                }}
              >
                {t('email.new_message.badge', 'New message')}
              </span>

              <Text
                style={{
                  fontSize: '28px',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: '500',
                  color: '#1e1a14',
                  margin: '18px 0 0 0',
                  letterSpacing: '-0.01em',
                  lineHeight: '1.1',
                }}
                className="cm-name"
              >
                {t('email.new_message.greeting', 'Hi {name},', {name})}
              </Text>
            </div>

            <div
              className="cm-card"
              style={{
                backgroundColor: '#f7f4ef',
                border: '1px solid #dee5b2',
                borderRadius: '18px',
                padding: '28px 24px 26px 24px',
                margin: '24px 0',
                textAlign: 'center',
              }}
            >
              {/* The avatar is the whole point of the redesign: a face converts where a name does not.
                  The ring is a padded round div rather than a box-shadow, which Gmail strips. */}
              {avatarUrl && (
                <Link href={profileUrl} style={{textDecoration: 'none'}}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px',
                      backgroundColor: '#e8c99e',
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
                        border: '3px solid #ffffff',
                      }}
                    />
                  </span>
                </Link>
              )}

              <Text
                className="cm-name"
                style={{
                  fontSize: '22px',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: '600',
                  color: '#1e1a14',
                  margin: '16px 0 0 0',
                  lineHeight: '1.2',
                  letterSpacing: '0.01em',
                }}
              >
                {creatorName}
              </Text>

              <Text
                className="cm-accent"
                style={{
                  fontSize: '13px',
                  fontFamily: "'DM Sans', sans-serif",
                  color: '#c17f3e',
                  margin: '4px 0 0 0',
                  lineHeight: '1.3',
                }}
              >
                @{fromUser.username}
                {meta ? ` · ${meta}` : ''}
              </Text>

              {/* A chat bubble, not a paragraph: the asymmetric corner reads as a message in every client
                  without needing a CSS triangle that Outlook would drop. */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e8c99e',
                  borderRadius: '18px 18px 18px 4px',
                  padding: '18px 20px',
                  margin: '22px 0 0 0',
                  textAlign: 'left',
                }}
                className="cm-chip"
              >
                <Text
                  style={{
                    fontSize: '18px',
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: 'italic',
                    fontWeight: '500',
                    color: '#1e1a14',
                    margin: '0',
                    letterSpacing: '0.01em',
                    lineHeight: '1.4',
                  }}
                  className="cm-name"
                >
                  {t('email.new_message.message', '{creatorName} just messaged you!', {
                    creatorName,
                  })}
                </Text>
              </div>

              <Button
                href={messagesUrl}
                style={{
                  backgroundColor: '#c17f3e',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '15px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  textAlign: 'center' as const,
                  display: 'inline-block',
                  padding: '14px 36px',
                  margin: '24px 0 0 0',
                  border: '1px solid #a6682e',
                  transition: 'all 0.12s ease',
                }}
              >
                {t('email.new_message.viewButton', 'Read & reply')}
              </Button>

              <Text
                className="cm-muted"
                style={{
                  fontSize: '12px',
                  fontFamily: "'DM Sans', sans-serif",
                  color: '#8c8070',
                  margin: '14px 0 0 0',
                  lineHeight: '1.5',
                }}
              >
                <Link
                  href={profileUrl}
                  style={{color: '#c17f3e', textDecoration: 'none', fontWeight: '500'}}
                >
                  {t('email.new_message.view_profile', 'View profile')}
                </Link>
              </Text>
            </div>

            {/* The nudge sits outside the card so the card stays a single, clean unit — and because the
                reader who is going to reply has already clicked by the time they reach this line. */}
            <Text
              className="cm-muted"
              style={{
                fontSize: '14px',
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: 'italic',
                lineHeight: '1.6',
                color: '#8c8070',
                marginTop: '24px',
                textAlign: 'center',
              }}
            >
              {t(
                'email.new_message.nudge',
                'One sentence back is usually all it takes to start something real.',
              )}
            </Text>

            <hr
              style={{
                border: 'none',
                borderTop: '1px solid #ece7de',
                margin: '28px 0 0 0',
              }}
            />

            <Text
              className="cm-muted"
              style={{
                fontSize: '13px',
                lineHeight: '1.75',
                color: '#8c8070',
                marginTop: '20px',
                textAlign: 'center',
              }}
            >
              {t(
                'email.new_message.daily_limit',
                "To avoid overloading your inbox, you'll receive at most one email per day per conversation. If {creatorName} sends more messages today, you won't be notified by email.",
                {creatorName},
              )}{' '}
              {/* A new key rather than a reword: the fr/de files already translate the old one as
                  "the Compass app for Android", and those resolve ahead of this fallback — so
                  reusing it would leave two of three languages saying Android-only. */}
              {t(
                'email.new_message.app_prompt.v2',
                'Want real-time notifications? Get the Compass app:',
              )}{' '}
              {/* Our own /download rather than a store link. Mail is the one place where the
                  device that opens it is genuinely unknowable — the same message gets read on a
                  laptop and on the phone it is about. */}
              <Link
                href={`${DEPLOYED_WEB_URL}/download`}
                style={{
                  color: '#c17f3e',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}
              >
                {t('email.new_message.app_link', 'Get the app')}
              </Link>
              {'.'}
            </Text>
          </Section>

          <Footer unsubscribeUrl={unsubscribeUrl} email={email ?? name} locale={locale} />
        </Container>
      </Body>
    </Html>
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
