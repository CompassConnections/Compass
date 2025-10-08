import {Body, Button, Column, Container, Head, Html, Preview, Row, Section, Text,} from '@react-email/components'
import {type User} from 'common/user'
import {DOMAIN} from 'common/envs/constants'
import {jamesUser, mockUser} from './functions/mock'
import {button, container, content, Footer, main, paragraph} from "email/utils";

interface NewEndorsementEmailProps {
  fromUser: User
  onUser: User
  endorsementText: string
  unsubscribeUrl: string
  email?: string
}

export const NewEndorsementEmail = ({
                                      fromUser,
                                      onUser,
                                      endorsementText,
                                      unsubscribeUrl,
                                      email,
                                    }: NewEndorsementEmailProps) => {
  const name = onUser.name.split(' ')[0]

  const endorsementUrl = `https://${DOMAIN}/${onUser.username}`

  return (
    <Html>
      <Head/>
      <Preview>New endorsement from {fromUser.name}</Preview>
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
            <Text style={paragraph}>Hi {name},</Text>

            <Text style={paragraph}>{fromUser.name} just endorsed you!</Text>

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
                View endorsement
              </Button>
            </Section>
          </Section>

          <Footer unsubscribeUrl={unsubscribeUrl} email={email ?? name}/>
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
