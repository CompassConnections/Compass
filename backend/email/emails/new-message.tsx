import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import {ANDROID_APP_URL} from 'common/constants'
import {DOMAIN} from 'common/envs/constants'
import {type ProfileRow} from 'common/profiles/profile'
import {type User} from 'common/user'
import { container, content, Footer, main} from 'email/utils'
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
  // fromUserProfile,
  toUser,
  channelId,
  unsubscribeUrl,
  email,
  locale,
}: NewMessageEmailProps) => {
  const name = toUser.name.split(' ')[0]
  const creatorName = fromUser.name
  const messagesUrl = `https://${DOMAIN}/messages/${channelId}`
  // const userImgSrc = getOgImageUrl(fromUser, fromUserProfile)
  const t = createT(locale)

  return (
    <Html>
      <Head />
      <Preview>
        {t('email.new_message.preview', 'New message from {creatorName}', {creatorName})}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/*<Section style={logoContainer}>*/}
          {/*  <Img*/}
          {/*    src="..."*/}
          {/*    width="550"*/}
          {/*    height="auto"*/}
          {/*    alt="compassmeet.com"*/}
          {/*  />*/}
          {/*</Section>*/}

          <Section style={content}>
            <div
              style={{
                textAlign: 'center',
                marginBottom: '32px',
              }}
            >
              <Text
                style={{
                  fontSize: '28px',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: '500',
                  color: '#1e1a14',
                  marginBottom: '8px',
                  letterSpacing: '-0.01em',
                  lineHeight: '1.1',
                }}
              >
                {t('email.new_message.greeting', 'Hi {name},', {name})}
              </Text>
            </div>

            <div
              style={{
                backgroundColor: '#f7f4ef',
                border: '1px solid #dee5b2',
                borderRadius: '14px',
                padding: '24px',
                margin: '24px 0',
                textAlign: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: '18px',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: '500',
                  color: '#1e1a14',
                  marginBottom: '20px',
                  letterSpacing: '0.01em',
                  lineHeight: '1.3',
                }}
              >
                {t('email.new_message.message', '{creatorName} just messaged you!', {creatorName})}
              </Text>

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
                  padding: '14px 32px',
                  margin: '0',
                  border: '1px solid #a6682e',
                  transition: 'all 0.12s ease',
                }}
              >
                {t('email.new_message.viewButton', 'View message')}
              </Button>
            </div>

            <Text
              style={{
                fontSize: '13px',
                lineHeight: '1.75',
                color: '#8c8070',
                marginTop: '32px',
                textAlign: 'center',
              }}
            >
              {t(
                'email.new_message.daily_limit',
                "To avoid overloading your inbox, you'll receive at most one email per day per conversation. If {creatorName} sends more messages today, you won't be notified by email.",
                {creatorName},
              )}{' '}
              {t(
                'email.new_message.app_prompt',
                'Want real-time notifications? Download the Compass app for Android:',
              )}{' '}
              <Link
                href={ANDROID_APP_URL}
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
