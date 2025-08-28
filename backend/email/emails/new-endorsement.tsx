import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import { type User } from 'common/user'
import { DOMAIN } from 'common/envs/constants'
import { jamesUser, sinclairUser } from './functions/mock'

interface NewEndorsementEmailProps {
  fromUser: User
  onUser: User
  endorsementText: string
  unsubscribeUrl: string
}

export const NewEndorsementEmail = ({
  fromUser,
  onUser,
  endorsementText,
  unsubscribeUrl,
}: NewEndorsementEmailProps) => {
  const name = onUser.name.split(' ')[0]

  const endorsementUrl = `https://${DOMAIN}/${onUser.username}`

  return (
    <Html>
      <Head />
      <Preview>New endorsement from {fromUser.name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src="https://manifold.love/manifold-love-banner.png"
              width="550"
              height="auto"
              alt="compassmeet.com"
            />
          </Section>

          <Section style={content}>
            <Text style={paragraph}>Hi {name},</Text>

            <Text style={paragraph}>{fromUser.name} just endorsed you!</Text>

            <Section style={endorsementContainer}>
              <Row>
                <Column>
                  <Img
                    src={fromUser.avatarUrl}
                    width="50"
                    height="50"
                    alt=""
                    style={avatarImage}
                  />
                </Column>
                <Column>
                  <Text style={endorsementTextStyle}>"{endorsementText}"</Text>
                </Column>
              </Row>

              <Button href={endorsementUrl} style={button}>
                View endorsement
              </Button>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This e-mail has been sent to {name},{' '}
              {/* <Link href={unsubscribeUrl} style={footerLink}>
                click here to unsubscribe from this type of notification
              </Link>
              . */}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

NewEndorsementEmail.PreviewProps = {
  fromUser: jamesUser,
  onUser: sinclairUser,
  endorsementText:
    "Sinclair is someone you want to have around because she injects creativity and humor into every conversation, and her laugh is infectious! Not to mention that she's a great employee, treats everyone with respect, and is even-tempered.",
  unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
} as NewEndorsementEmailProps

const main = {
  backgroundColor: '#f4f4f4',
  fontFamily: 'Arial, sans-serif',
  wordSpacing: 'normal',
}

const container = {
  margin: '0 auto',
  maxWidth: '600px',
}

const logoContainer = {
  padding: '20px 0px 5px 0px',
  textAlign: 'center' as const,
  backgroundColor: '#ffffff',
}

const content = {
  backgroundColor: '#ffffff',
  padding: '20px 25px',
}

const paragraph = {
  fontSize: '18px',
  lineHeight: '24px',
  margin: '10px 0',
  color: '#000000',
  fontFamily: 'Arial, Helvetica, sans-serif',
}

const endorsementContainer = {
  margin: '20px 0',
  padding: '15px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
}

const avatarImage = {
  borderRadius: '50%',
}

const endorsementTextStyle = {
  fontSize: '16px',
  lineHeight: '22px',
  fontStyle: 'italic',
  color: '#333333',
}

const button = {
  backgroundColor: '#ec489a',
  borderRadius: '12px',
  color: '#ffffff',
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: '16px',
  fontWeight: 'semibold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '6px 10px',
  margin: '10px 0',
}

const footer = {
  margin: '20px 0',
  textAlign: 'center' as const,
}

const footerText = {
  fontSize: '11px',
  lineHeight: '22px',
  color: '#000000',
  fontFamily: 'Ubuntu, Helvetica, Arial, sans-serif',
}

const footerLink = {
  color: 'inherit',
  textDecoration: 'none',
}

export default NewEndorsementEmail
