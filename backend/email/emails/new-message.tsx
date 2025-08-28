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
import { type User } from 'common/user'
import { type LoverRow } from 'common/love/lover'
import {
  jamesLover,
  jamesUser,
  sinclairLover,
  sinclairUser,
} from './functions/mock'
import { DOMAIN } from 'common/envs/constants'
import { getLoveOgImageUrl } from 'common/love/og-image'

interface NewMessageEmailProps {
  fromUser: User
  fromUserLover: LoverRow
  toUser: User
  channelId: number
  unsubscribeUrl: string
}

export const NewMessageEmail = ({
  fromUser,
  fromUserLover,
  toUser,
  channelId,
  unsubscribeUrl,
}: NewMessageEmailProps) => {
  const name = toUser.name.split(' ')[0]
  const creatorName = fromUser.name
  const messagesUrl = `https://${DOMAIN}/messages/${channelId}`
  const userImgSrc = getLoveOgImageUrl(fromUser, fromUserLover)

  return (
    <Html>
      <Head />
      <Preview>New message from {creatorName}</Preview>
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

            <Text style={paragraph}>{creatorName} just messaged you!</Text>

            <Section style={imageContainer}>
              <Link href={messagesUrl}>
                <Img
                  src={userImgSrc}
                  width="375"
                  height="200"
                  alt={`${creatorName}'s profile`}
                  style={profileImage}
                />
              </Link>

              <Button href={messagesUrl} style={button}>
                View message
              </Button>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This e-mail has been sent to {name},{' '}
              {/* <Link href={unsubscribeUrl} style={{ color: 'inherit', textDecoration: 'none' }}>
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

NewMessageEmail.PreviewProps = {
  fromUser: jamesUser,
  fromUserLover: jamesLover,
  toUser: sinclairUser,
  channelId: 1,
  unsubscribeUrl: 'https://manifold.love/unsubscribe',
} as NewMessageEmailProps

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

const imageContainer = {
  textAlign: 'center' as const,
  margin: '20px 0',
}

const profileImage = {
  border: '1px solid #ec489a',
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

export default NewMessageEmail
