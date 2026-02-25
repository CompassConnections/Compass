import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import {DOMAIN} from 'common/envs/constants'
import {type User} from 'common/user'
import {button, container, content, Footer, main, paragraph} from 'email/utils'
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
            <Text style={paragraph}>
              {t('email.new_endorsement.greeting', 'Hi {name},', {name})}
            </Text>

            <Text style={paragraph}>
              {t('email.new_endorsement.message', '{fromUserName} endorsed you!', {
                fromUserName: fromUser.name,
              })}
            </Text>

            <Section style={endorsementContainer}>
              <Row>
                {/*<Column>*/}
                {/*  <Img*/}
                {/*    src={fromUser.avatarUrl}*/}
                {/*    width="50"*/}
                {/*    height="50"*/}
                {/*    alt=""*/}
                {/*    style={avatarImage}*/}
                {/*  />*/}
                {/*</Column>*/}
                <Column>
                  <Text style={endorsementTextStyle}>"{endorsementText}"</Text>
                </Column>
              </Row>

              <Button href={endorsementUrl} style={button}>
                {t('email.new_endorsement.viewButton', 'View endorsement')}
              </Button>
            </Section>
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
    "Sinclair is someone you want to have around because she injects creativity and humor into every conversation, and her laugh is infectious! Not to mention that she's a great employee, treats everyone with respect, and is even-tempered.",
  unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
  email: 'someone@gmail.com',
} as NewEndorsementEmailProps

const endorsementContainer = {
  margin: '20px 0',
  padding: '15px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
}

const endorsementTextStyle = {
  fontSize: '16px',
  lineHeight: '22px',
  fontStyle: 'italic',
  color: '#333333',
}

export default NewEndorsementEmail
