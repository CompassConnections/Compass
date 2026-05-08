import {Body, Button, Container, Head, Html, Preview, Section, Text} from '@react-email/components'
import {type User} from 'common/user'
import { container, content, Footer, main, paragraph} from 'email/utils'
import React from 'react'
import {createT} from 'shared/locale'

import {mockUser} from './functions/mock'

interface WelcomeEmailProps {
  toUser: User
  unsubscribeUrl: string
  email?: string
  verificationLink?: string
  locale?: string
}

export const WelcomeEmail = ({
  toUser,
  unsubscribeUrl,
  email,
  verificationLink,
  locale,
}: WelcomeEmailProps) => {
  const name = toUser.name.split(' ')[0]
  const t = createT(locale)

  return (
    <Html>
      <Head />
      <Preview>
        {t('email.welcome.preview', 'Welcome to Compass — Please confirm your email')}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <div
              style={{
                textAlign: 'center',
                marginBottom: '32px',
              }}
            >
              <Text
                style={{
                  fontSize: '32px',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: '500',
                  color: '#1e1a14',
                  marginBottom: '8px',
                  letterSpacing: '-0.01em',
                  lineHeight: '1.1',
                }}
              >
                {t('email.welcome.title', 'Welcome to Compass, {name}!', {name})}
              </Text>
            </div>

            <Text
              style={{
                ...paragraph,
                fontSize: '15px',
                lineHeight: '1.75',
                color: '#8c8070',
                marginBottom: '24px',
              }}
            >
              {t(
                'email.welcome.intro',
                'Compass is a free, community-owned platform built to help people form deep, meaningful connections — platonic, romantic, or collaborative. There are no ads, no hidden algorithms, and no subscriptions — just a transparent, open-source space shaped by people like you.',
              )}
            </Text>

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
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1e1a14',
                  marginBottom: '16px',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {t(
                  'email.welcome.confirmation',
                  'To finish creating your account and start exploring Compass, please confirm your email below:',
                )}
              </Text>

              <Button
                href={verificationLink}
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
                {t('email.welcome.confirmButton', 'Confirm My Email')}
              </Button>
            </div>

            <Text
              style={{
                marginTop: '32px',
                fontSize: '12px',
                color: '#beaea2',
                textAlign: 'center',
                lineHeight: '1.6',
              }}
            >
              {t('email.welcome.copyLink', 'Or copy and paste this link into your browser:')} <br />
              <a
                href={verificationLink}
                style={{
                  color: '#c17f3e',
                  textDecoration: 'none',
                  wordBreak: 'break-all',
                }}
              >
                {verificationLink}
              </a>
            </Text>

            <Text
              style={{
                marginTop: '40px',
                fontSize: '13px',
                color: '#8c8070',
                lineHeight: '1.75',
                fontStyle: 'italic',
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              {t(
                'email.welcome.thanks',
                'Your presence and participation are what make Compass possible. Thank you for helping us build an internet space that prioritizes depth, trust, and community over monetization.',
              )}
            </Text>
          </Section>

          <Footer unsubscribeUrl={unsubscribeUrl} email={email ?? name} locale={locale} />
        </Container>
      </Body>
    </Html>
  )
}

WelcomeEmail.PreviewProps = {
  toUser: mockUser,
  email: 'someone@gmail.com',
  unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
} as WelcomeEmailProps

export default WelcomeEmail
