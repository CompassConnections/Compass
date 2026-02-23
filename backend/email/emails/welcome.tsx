import React from 'react'
import {Body, Button, Container, Head, Html, Preview, Section, Text} from '@react-email/components'
import {type User} from 'common/user'
import {mockUser} from './functions/mock'
import {button, container, content, Footer, main, paragraph} from 'email/utils'
import {createT} from 'shared/locale'

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
      <Preview>{t('email.welcome.preview', 'Welcome to Compass — Please confirm your email')}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Text style={paragraph}>{t('email.welcome.title', 'Welcome to Compass, {name}!', {name})}</Text>

            <Text style={paragraph}>{t('email.welcome.intro', 'Compass is a free, community-owned platform built to help people form deep, meaningful connections — platonic, romantic, or collaborative. There are no ads, no hidden algorithms, and no subscriptions — just a transparent, open-source space shaped by people like you.')}</Text>

            <Text style={paragraph}>{t('email.welcome.confirmation', 'To finish creating your account and start exploring Compass, please confirm your email below:')}</Text>

            <Button style={button} href={verificationLink}>
              {t('email.welcome.confirmButton', 'Confirm My Email')}
            </Button>

            <Text style={{marginTop: '40px', fontSize: '10px', color: '#555'}}>
              {t('email.welcome.copyLink', 'Or copy and paste this link into your browser:')} <br />
              <a href={verificationLink}>{verificationLink}</a>
            </Text>

            <Text style={{marginTop: '40px', fontSize: '12px', color: '#555'}}>
              {t('email.welcome.thanks', 'Your presence and participation are what make Compass possible. Thank you for helping us build an internet space that prioritizes depth, trust, and community over monetization.')}
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
