import {Column, Img, Link, Row, Section, Text} from '@react-email/components'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import React from 'react'
import {createT} from 'shared/locale'

interface Props {
  email?: string
  unsubscribeUrl: string
  locale?: string
}

export const Footer = ({email, unsubscribeUrl, locale}: Props) => {
  const t = createT(locale)
  return (
    <Section
      style={{
        margin: '32px 0 20px 0',
        textAlign: 'center' as const,
        padding: '20px 0 0 0',
      }}
    >
      <div
        style={{
          borderTop: '1px solid #dee5b2',
          paddingTop: '24px',
          marginBottom: '20px',
        }}
      >
        <Row>
          <Column align="center">
            <Link href={`${DEPLOYED_WEB_URL}/github`} target="_blank">
              <Img
                src={`${DEPLOYED_WEB_URL}/images/github-logo.png`}
                width="24"
                height="24"
                alt="GitHub"
                style={{
                  display: 'inline-block',
                  margin: '0 6px',
                  opacity: '0.7',
                  transition: 'opacity 0.12s ease',
                }}
              />
            </Link>
            <Link href={`${DEPLOYED_WEB_URL}/discord`} target="_blank">
              <Img
                src={`${DEPLOYED_WEB_URL}/images/discord-logo.png`}
                width="24"
                height="24"
                alt="Discord"
                style={{
                  display: 'inline-block',
                  margin: '0 6px',
                  opacity: '0.7',
                  transition: 'opacity 0.12s ease',
                }}
              />
            </Link>
            <Link href={`${DEPLOYED_WEB_URL}/x`} target="_blank">
              <Img
                src={`${DEPLOYED_WEB_URL}/images/x-logo.png`}
                width="24"
                height="24"
                alt="X"
                style={{
                  display: 'inline-block',
                  margin: '0 6px',
                  opacity: '0.7',
                  transition: 'opacity 0.12s ease',
                }}
              />
            </Link>
            <Link href={`${DEPLOYED_WEB_URL}/patreon`} target="_blank">
              <Img
                src={`${DEPLOYED_WEB_URL}/images/patreon-logo.png`}
                width="24"
                height="24"
                alt="Patreon"
                style={{
                  display: 'inline-block',
                  margin: '0 6px',
                  opacity: '0.7',
                  transition: 'opacity 0.12s ease',
                }}
              />
            </Link>
            <Link href={`${DEPLOYED_WEB_URL}/paypal`} target="_blank">
              <Img
                src={`${DEPLOYED_WEB_URL}/images/paypal-logo.png`}
                width="24"
                height="24"
                alt="PayPal"
                style={{
                  display: 'inline-block',
                  margin: '0 6px',
                  opacity: '0.7',
                  transition: 'opacity 0.12s ease',
                }}
              />
            </Link>
          </Column>
        </Row>

        <Row>
          <Column align="center">
            <Text
              style={{
                fontSize: '12px',
                color: '#beaea2',
                marginTop: '20px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: '400',
              }}
            >
              © {new Date().getFullYear()} Compass
            </Text>

            <Text
              style={{
                fontSize: '11px',
                color: '#beaea2',
                marginTop: '8px',
                lineHeight: '1.6',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {t(
                'email.footer.sent_to',
                'The email was sent to {email}. To no longer receive these emails, unsubscribe',
                {email},
              )}{' '}
              <Link
                href={unsubscribeUrl}
                style={{
                  color: '#c17f3e',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}
              >
                {t('email.footer.unsubscribe_link', 'here')}
              </Link>
              .
            </Text>
          </Column>
        </Row>
      </div>
    </Section>
  )
}

export const footer = {
  margin: '20px 0',
  textAlign: 'center' as const,
}

export const footerText = {
  fontSize: '11px',
  lineHeight: '22px',
  color: '#000000',
  fontFamily: 'Ubuntu, Helvetica, Arial, sans-serif',
}

export const blackLinks = {
  color: 'black',
}

// const footerLink = {
// color: 'inherit',
// textDecoration: 'none',
// }

export const main = {
  // backgroundColor: '#f4f4f4',
  fontFamily: 'Arial, sans-serif',
  wordSpacing: 'normal',
}

export const container = {
  margin: '0 auto',
  maxWidth: '600px',
}

export const logoContainer = {
  padding: '20px 0px 5px 0px',
  textAlign: 'center' as const,
  backgroundColor: '#ffffff',
}

export const content = {
  backgroundColor: '#ffffff',
  padding: '20px 25px',
}

export const paragraph = {
  // fontSize: '12px',
  lineHeight: '24px',
  margin: '10px 0',
  color: '#000000',
  // fontFamily: 'Arial, Helvetica, sans-serif',
}

export const imageContainer = {
  textAlign: 'center' as const,
  margin: '20px 0',
}

export const profileImage = {
  // border: '1px solid #ec489a',
}

export const button = {
  backgroundColor: '#4887ec',
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
