import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import {DOMAIN} from 'common/envs/constants'
import {FilterFields} from 'common/filters'
import {formatFilters, locationType} from 'common/filters-format'
import {MatchesType} from 'common/profiles/bookmarked_searches'
import {type User} from 'common/user'
import {container, content, Footer, main, paragraph} from 'email/utils'
import React from 'react'
import {createT} from 'shared/locale'

import {mockUser} from './functions/mock'

interface NewMessageEmailProps {
  toUser: User
  matches: MatchesType[]
  unsubscribeUrl: string
  email?: string
  optionIdsToLabels?: Record<string, Record<string, string>>
  locale?: string
}

export const NewSearchAlertsEmail = ({
  toUser,
  unsubscribeUrl,
  matches,
  email,
  optionIdsToLabels = {},
  locale,
}: NewMessageEmailProps) => {
  const name = toUser.name.split(' ')[0]
  const t = createT(locale)
  const measurementSystem = locale === 'en' ? 'imperial' : 'metric'

  return (
    <Html>
      <Head />
      <Preview>
        {t('email.search_alerts.preview', 'New people share your values — reach out and connect')}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Text style={paragraph}>{t('email.search_alerts.greeting', 'Hi {name},', {name})}</Text>

            <Text style={paragraph}>
              {t(
                'email.search_alerts.intro',
                'In the past 24 hours, new people joined Compass whose values and interests align with your saved searches. Compass is a gift from the community, and it comes alive when people like you take the step to connect with one another.',
              )}
            </Text>

            {(matches || []).map((match) => (
              <Section key={match.id} style={{marginBottom: '20px'}}>
                <div
                  style={{
                    backgroundColor: '#f7f4ef',
                    border: '1px solid #dee5b2',
                    borderRadius: '14px',
                    padding: '0px 20px 10px 20px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <Text
                    style={{
                      fontWeight: '600',
                      marginBottom: '14px',
                      color: '#1e1a14',
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: '18px',
                      letterSpacing: '0.01em',
                      lineHeight: '1.3',
                    }}
                  >
                    {formatFilters(
                      match.description.filters as Partial<FilterFields>,
                      match.description.location as locationType,
                      optionIdsToLabels,
                      measurementSystem,
                      t,
                    )?.join(' • ')}
                  </Text>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                    {match.matches.map((p) => (
                      <Link
                        key={p.username}
                        href={`https://${DOMAIN}/${p.username}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '7px 14px',
                          maxWidth: '100%',
                          boxSizing: 'border-box',
                          backgroundColor: '#faf3e9',
                          border: '1px solid #e8c99e',
                          borderRadius: '14px',
                          lineHeight: '1.2',
                          textDecoration: 'none',
                        }}
                      >
                        {p.avatarUrl && (
                          <Img
                            src={p.avatarUrl}
                            alt={`${p.username} avatar`}
                            width={40}
                            height={40}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '9999px',
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <span style={{display: 'inline-flex', flexDirection: 'column'}}>
                          <span style={{color: '#1e1a14', fontWeight: '600', fontSize: '14px'}}>
                            {p.name}
                          </span>
                          <span style={{color: '#c17f3e', fontSize: '12px'}}>@{p.username}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </Section>
            ))}

            <Section style={{textAlign: 'center', marginTop: '30px'}}>
              <Text style={{marginBottom: '20px'}}>
                {t(
                  'email.search_alerts.callToAction',
                  'If someone resonates with you, reach out. A simple hello can be the start of a meaningful friendship, collaboration, or relationship.',
                )}
              </Text>
              <Link
                href={`https://${DOMAIN}/messages`}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#c17f3e',
                  color: '#ffffff',
                  padding: '14px 24px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '15px',
                  fontFamily: "'DM Sans', sans-serif",
                  border: '1px solid #a6682e',
                  transition: 'all 0.12s ease',
                }}
              >
                {t('email.search_alerts.startConversation', 'Start a Conversation')}
              </Link>
            </Section>

            <Text style={{marginTop: '40px', fontSize: '12px', color: '#555'}}>
              {t(
                'email.search_alerts.communityNote',
                'Compass is built and sustained by the community — no ads, no hidden algorithms, no subscriptions. Your presence and participation make it possible.',
              )}
            </Text>
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} email={email ?? name} locale={locale} />
        </Container>
      </Body>
    </Html>
  )
}

const matchSamples = [
  {
    id: 'ID search 1',
    description: {
      filters: {
        orderBy: 'created_time',
      },
      location: null,
    },
    matches: [
      {
        name: 'James Bond Junior',
        username: 'jamesbond',
        avatarUrl: 'https://ui-avatars.com/api/?name=JB',
      },
      {
        name: 'Lily',
        username: 'lilyrose',
      },
    ],
  },
  {
    id: 'ID search 2',
    description: {
      filters: {
        genders: ['female'],
        education: ['doctorate'],
        orderBy: 'created_time',
      },
      location: null,
    },
    matches: [
      {
        name: 'Lily',
        username: 'lilyrose',
      },
    ],
  },
]

NewSearchAlertsEmail.PreviewProps = {
  toUser: mockUser,
  email: 'someone@gmail.com',
  unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
  matches: matchSamples,
} as NewMessageEmailProps

export default NewSearchAlertsEmail
