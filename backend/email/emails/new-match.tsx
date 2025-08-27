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
import { DOMAIN } from 'common/envs/constants'
import { type LoverRow } from 'common/love/lover'
import { getLoveOgImageUrl } from 'common/love/og-image'
import { type User } from 'common/user'
import { jamesLover, jamesUser, sinclairUser } from './functions/mock'

interface NewMatchEmailProps {
  onUser: User
  matchedWithUser: User
  matchedLover: LoverRow
  unsubscribeUrl: string
}

export const NewMatchEmail = ({
  onUser,
  matchedWithUser,
  matchedLover,
  unsubscribeUrl,
}: NewMatchEmailProps) => {
  const name = onUser.name.split(' ')[0]
  const userImgSrc = getLoveOgImageUrl(matchedWithUser, matchedLover)
  const userUrl = `https://${DOMAIN}/${matchedWithUser.username}`

  return (
    <Html>
      <Head />
      <Preview>You have a new match!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src="https://manifold.love/manifold-love-banner.png"
              width="550"
              height="auto"
              alt="manifold.love"
            />
          </Section>

          <Section style={content}>
            <Text style={paragraph}>Hi {name},</Text>

            <Text style={paragraph}>
              {matchedWithUser.name} just matched with you!
            </Text>

            <Section style={imageContainer}>
              <Link href={userUrl}>
                <Img
                  src={userImgSrc}
                  width="375"
                  height="200"
                  alt=""
                  style={profileImage}
                />
              </Link>

              <Button href={userUrl} style={button}>
                View profile
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

NewMatchEmail.PreviewProps = {
  onUser: sinclairUser,
  matchedWithUser: jamesUser,
  matchedLover: jamesLover,
  unsubscribeUrl: 'https://manifold.love/unsubscribe',
} as NewMatchEmailProps

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

const footerLink = {
  color: 'inherit',
  textDecoration: 'none',
}

export default NewMatchEmail
