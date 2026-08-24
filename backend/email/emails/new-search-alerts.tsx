import {Img, Link, Section, Text} from '@react-email/components'
import {DEPLOYED_WEB_URL, DOMAIN} from 'common/envs/constants'
import {FilterFields} from 'common/filters'
import {formatFilters, locationType} from 'common/filters-format'
import {MatchesType} from 'common/profiles/bookmarked_searches'
import {type User} from 'common/user'
import {
  Actions,
  CTAButton,
  Divider,
  EmailShell,
  fonts,
  Heading,
  Muted,
  palette,
  Paragraph,
} from 'email/utils'
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
    <EmailShell
      preview={t(
        'email.search_alerts.preview',
        'New people share your values — reach out and connect',
      )}
      unsubscribeUrl={unsubscribeUrl}
      email={email ?? name}
      locale={locale}
    >
      <Heading align="left" style={{fontSize: '26px'}}>
        {t('email.search_alerts.greeting', 'Hi {name},', {name})}
      </Heading>

      <Paragraph>
        {t(
          'email.search_alerts.intro',
          'In the past 24 hours, new people joined Compass whose values and interests align with your saved searches. Compass is a gift from the community, and it comes alive when people like you take the step to connect with one another.',
        )}
      </Paragraph>

      {/* One group per saved search: the search as a section heading, the people as cards under it.
          It used to be a filled card wrapping filled chips — two nested surfaces for what is really a
          label and a list. Same shape the about page uses for its own sections (`SectionLabel`): the
          heading names the group, a hairline closes it, and the content sits on the sheet. */}
      {(matches || []).map((match) => (
        <Section key={match.id} style={{margin: '28px 0 0 0'}}>
          <Text
            className="cm-name"
            style={{
              fontFamily: fonts.heading,
              fontSize: '18px',
              fontWeight: 600,
              color: palette.ink900,
              lineHeight: '1.35',
              margin: '0 0 4px 0',
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

          <div
            style={{
              borderTop: `1px solid ${palette.hairline}`,
              margin: '0 0 14px 0',
            }}
          />

          {/* No pill and no border on the rows below. They used to be bordered chips inside a bordered
              card inside the sheet — three nested boundaries for a list of names. The avatar is the only
              shape a member row needs; without it the name and handle carry themselves. */}
          <div style={{fontSize: 0}}>
            {match.matches.map((p) => (
              <Link
                key={p.username}
                href={`https://${DOMAIN}/${p.username}`}
                style={{
                  display: 'inline-block',
                  verticalAlign: 'top',
                  marginRight: '22px',
                  marginBottom: '14px',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  lineHeight: '1.2',
                  textDecoration: 'none',
                }}
              >
                <table
                  role="presentation"
                  cellPadding={0}
                  cellSpacing={0}
                  border={0}
                  style={{borderCollapse: 'collapse'}}
                >
                  <tbody>
                    <tr>
                      {/* Always an avatar, falling back to the same placeholder the web app uses.
                          Rendering the picture only when there is one left avatarless members sitting a
                          line higher than their neighbours, since the row's height is the photo's. */}
                      <td style={{paddingRight: '10px', verticalAlign: 'middle'}}>
                        <Img
                          src={p.avatarUrl ?? `${DEPLOYED_WEB_URL}/images/default-avatar.png`}
                          alt={`${p.username} avatar`}
                          width={40}
                          height={40}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '9999px',
                            objectFit: 'cover',
                            display: 'block',
                            backgroundColor: palette.canvas200,
                          }}
                        />
                      </td>
                      <td style={{verticalAlign: 'middle'}}>
                        <span
                          className="cm-name"
                          style={{
                            display: 'block',
                            fontFamily: fonts.body,
                            color: palette.ink900,
                            fontWeight: 600,
                            fontSize: '14px',
                            lineHeight: '1.3',
                          }}
                        >
                          {p.name}
                        </span>
                        <span
                          className="cm-accent"
                          style={{
                            display: 'block',
                            fontFamily: fonts.body,
                            color: palette.primary600,
                            fontSize: '12px',
                            lineHeight: '1.3',
                          }}
                        >
                          @{p.username}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Link>
            ))}
          </div>
        </Section>
      ))}

      <Actions style={{margin: '32px 0 0 0'}}>
        <Paragraph style={{textAlign: 'center', marginBottom: '20px'}}>
          {t(
            'email.search_alerts.callToAction',
            'If someone resonates with you, reach out. A simple hello can be the start of a meaningful friendship, collaboration, or relationship.',
          )}
        </Paragraph>
        <CTAButton href={`https://${DOMAIN}/messages`}>
          {t('email.search_alerts.startConversation', 'Start a Conversation')}
        </CTAButton>
      </Actions>

      <Divider />

      <Muted>
        {t(
          'email.search_alerts.communityNote',
          'Compass is built and sustained by the community — no ads, no hidden algorithms, no subscriptions. Your presence and participation make it possible.',
        )}
      </Muted>
    </EmailShell>
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
