import {Body, Container, Head, Html, Link, Preview, Section, Text} from '@react-email/components'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import {getXShareProfileUrl} from 'common/socials'
import {type User} from 'common/user'
import {UNSUBSCRIBE_URL} from 'common/user-notification-preferences'
import {container, content, Footer, main, paragraph} from 'email/utils'
import React from 'react'
import {createT} from 'shared/locale'

import {mockUser} from './functions/mock'

interface ShareCompassEmailProps {
  toUser: User
  unsubscribeUrl: string
  email?: string
  locale?: string
}

export const ShareCompassEmail = ({
  toUser,
  unsubscribeUrl,
  email,
  locale,
}: ShareCompassEmailProps) => {
  const name = toUser.name.split(' ')[0]
  const t = createT(locale)

  const profileShareUrl = getXShareProfileUrl(toUser.username, t)

  return (
    <Html>
      <Head />
      <Preview>
        {t('email.share.preview', "600 people in 6 months — here's how you help write what's next")}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Text style={paragraph}>{t('email.share.greeting', 'Hi {name},', {name})}</Text>

            <Text style={paragraph}>
              {t(
                'email.share.opening',
                'I started Compass because I believe human connection can be so much more than swipes and small talk. You joined because you believe that too — and that means a lot to me.',
              )}
            </Text>

            <Text style={paragraph}>
              {t(
                'email.share.growth',
                "In just 6 months, over 600 people have found their way here. That's 600 people who chose depth over algorithms, values over vanity metrics. It's a real signal — and it's only the beginning.",
              )}
            </Text>

            <Text style={paragraph}>
              {t(
                'email.share.network_effect',
                'But Compass only becomes truly powerful when more people who share your values are on it. Every new member means more kindred spirits to discover, richer events, a stronger community, and more contributors keeping it free and ad-free.',
              )}
            </Text>

            <Text style={{...paragraph, fontStyle: 'italic', color: '#555'}}>
              {t('email.share.objection', '"But my friends aren\'t really my type on here…"')}
            </Text>

            <Text style={paragraph}>
              {t(
                'email.share.reframe',
                "Fair. Maybe the person you tell isn't someone you'd personally connect with on Compass. But think one step further: they bring their world with them — their friends, their colleagues, the thoughtful people in their circles. People you've never met, who might be exactly who you're looking for. Sharing with one friend isn't just a favour to them. It's an investment in your own future connections.",
              )}
            </Text>

            <Text style={{...paragraph, fontWeight: 'bold', fontSize: '16px'}}>
              {t('email.share.cta_heading', 'How to share:')}
            </Text>

            <Section style={{marginBottom: '20px', textAlign: 'center'}}>
              <Text style={{...paragraph, marginBottom: '8px'}}>
                {t(
                  'email.share.cta_profile',
                  "Post your profile on X (or anywhere you're active):",
                )}
              </Text>
              <Link
                href={profileShareUrl}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                }}
              >
                {t('email.share.post_on_x', '𝕏  Post my profile')}
              </Link>
            </Section>

            <Section style={{textAlign: 'center', marginTop: '10px'}}>
              <Text style={{...paragraph, marginBottom: '12px'}}>
                {t('email.share.cta_link', 'Or simply share the link to Compass:')}
              </Text>
              <Link
                href={DEPLOYED_WEB_URL}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                }}
              >
                {t('email.share.share_compass', 'Share Compass')}
              </Link>
            </Section>

            <Text style={{marginTop: '40px', fontSize: '12px', color: '#555'}}>
              {t(
                'email.share.community_note',
                "One share. One person. That's how communities like this are built — not by ads, but by people who believe in something ethical.",
              )}
            </Text>

            <Text style={paragraph}>
              {t('email.share.signature_thanks', 'Thank you for being part of it.')}
            </Text>

            <Text style={{...paragraph, marginTop: '8px'}}>
              Martin Braquet
              <br />
              <span style={{fontSize: '12px', color: '#888'}}>
                {t('email.share.signature_title', 'Founder, Compass')}
              </span>
            </Text>
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} email={email ?? name} locale={locale} />
        </Container>
      </Body>
    </Html>
  )
}

ShareCompassEmail.PreviewProps = {
  toUser: mockUser,
  email: 'someone@gmail.com',
  unsubscribeUrl: UNSUBSCRIBE_URL,
  // locale: 'fr',
} as ShareCompassEmailProps

export default ShareCompassEmail
