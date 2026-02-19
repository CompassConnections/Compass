import React from 'react'
import {Body, Button, Container, Head, Html, Preview, Section, Text} from '@react-email/components'
import {type User} from 'common/user'
import {mockUser} from './functions/mock'
import {button, container, content, Footer, main, paragraph} from 'email/utils'

// function randomHex(length: number) {
//   const bytes = new Uint8Array(Math.ceil(length / 2));
//   crypto.getRandomValues(bytes);
//   return Array.from(bytes, b => b.toString(16).padStart(2, "0"))
//     .join("")
//     .slice(0, length);
// }

interface WelcomeEmailProps {
  toUser: User
  unsubscribeUrl: string
  email?: string
  verificationLink?: string
}

export const WelcomeEmail = ({
  toUser,
  unsubscribeUrl,
  email,
  verificationLink,
}: WelcomeEmailProps) => {
  const name = toUser.name.split(' ')[0]

  // Some users may already have a verified email (e.g., signed it with Googl), but we send them a link anyway so that
  // their email provider marks Compass as spam-free once they click the link.
  // We can remove the verif link for them if we ask the user to click on another link in the email (which would not be related to email verification)
  // const verificationLink = `https://compassmeet.com/confirm-email/${randomHex(16)}`

  return (
    <Html>
      <Head />
      <Preview>Welcome to Compass — Please confirm your email</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Text style={paragraph}>Welcome to Compass, {name}!</Text>

            <Text style={paragraph}>
              Compass is a free, community-owned platform built to help people form deep, meaningful
              connections — platonic, romantic, or collaborative. There are no ads, no hidden
              algorithms, and no subscriptions — just a transparent, open-source space shaped by
              people like you.
            </Text>

            <Text style={paragraph}>
              To finish creating your account and start exploring Compass, please confirm your email
              below:
            </Text>

            <Button style={button} href={verificationLink}>
              Confirm My Email
            </Button>

            <Text style={{marginTop: '40px', fontSize: '10px', color: '#555'}}>
              Or copy and paste this link into your browser: <br />
              <a href={verificationLink}>{verificationLink}</a>
            </Text>

            <Text style={{marginTop: '40px', fontSize: '12px', color: '#555'}}>
              Your presence and participation are what make Compass possible. Thank you for helping
              us build an internet space that prioritizes depth, trust, and community over
              monetization.
            </Text>
          </Section>

          <Footer unsubscribeUrl={unsubscribeUrl} email={email ?? name} />
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
