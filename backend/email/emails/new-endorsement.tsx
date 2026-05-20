import {Body, Button, Container, Head, Html, Preview, Section, Text} from '@react-email/components'
import {DOMAIN} from 'common/envs/constants'
import {type User} from 'common/user'
import {container, content, Footer, main} from 'email/utils'
import React from 'react'
import {createT} from 'shared/locale'

import {jamesUser, mockUser} from './functions/mock'

interface NewEndorsementEmailProps {
  fromUser: User
  onUser: User
  endorsementText: string
  unsubscribeUrl: string
  email?: string
  locale?: string
}

export const NewEndorsementEmail = ({
  fromUser,
  onUser,
  endorsementText,
  unsubscribeUrl,
  email,
  locale,
}: NewEndorsementEmailProps) => {
  const name = onUser.name.split(' ')[0]
  const t = createT(locale)

  const endorsementUrl = `https://${DOMAIN}/${onUser.username}`

  return (
    <Html>
      <Head />
      <Preview>
        {t('email.new_endorsement.preview', 'New endorsement from {fromUserName}', {
          fromUserName: fromUser.name,
        })}
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
                {t('email.new_endorsement.greeting', 'Hi {name},', {name})}
              </Text>
            </div>

            <Text
              style={{
                fontSize: '18px',
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: '500',
                color: '#1e1a14',
                marginBottom: '24px',
                letterSpacing: '0.01em',
                lineHeight: '1.3',
                textAlign: 'center',
              }}
            >
              {t('email.new_endorsement.message', '{fromUserName} endorsed you!', {
                fromUserName: fromUser.name,
              })}
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
              <div
                style={{
                  backgroundColor: '#faf3e9',
                  border: '1px solid #e8c99e',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px',
                  fontStyle: 'italic',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '17px',
                  lineHeight: '1.65',
                  color: '#1e1a14',
                  position: 'relative',
                }}
              >
                "{endorsementText}"
              </div>

              <Button
                href={endorsementUrl}
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
                {t('email.new_endorsement.viewButton', 'View endorsement')}
              </Button>
            </div>
          </Section>

          <Footer unsubscribeUrl={unsubscribeUrl} email={email ?? name} locale={locale} />
        </Container>
      </Body>
    </Html>
  )
}

NewEndorsementEmail.PreviewProps = {
  fromUser: jamesUser,
  onUser: mockUser,
  endorsementText:
    "Martin is someone you want to have around because he injects creativity and humor into every conversation, and his laugh is infectious! Not to mention that he's a great employee, treats everyone with respect, and is even-tempered.",
  unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
  email: 'someone@gmail.com',
} as NewEndorsementEmailProps

// const endorsementContainer = {
//   margin: '20px 0',
//   padding: '15px',
//   backgroundColor: '#f9f9f9',
//   borderRadius: '8px',
// }
//
// const endorsementTextStyle = {
//   fontSize: '16px',
//   lineHeight: '22px',
//   fontStyle: 'italic',
//   color: '#333333',
// }

export default NewEndorsementEmail
