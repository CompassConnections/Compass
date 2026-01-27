import React from 'react';
import {Body, Container, Head, Html, Link, Preview, Section, Text,} from '@react-email/components'
import {type User} from 'common/user'
import {mockUser,} from './functions/mock'
import {DOMAIN} from 'common/envs/constants'
import {container, content, Footer, main, paragraph} from "email/utils";
import {MatchesType} from "common/profiles/bookmarked_searches";
import {formatFilters, locationType} from "common/searches"
import {FilterFields} from "common/filters";

interface NewMessageEmailProps {
  toUser: User
  matches: MatchesType[]
  unsubscribeUrl: string
  email?: string
  optionIdsToLabels?: Record<string, Record<string, string>>
}

export const NewSearchAlertsEmail = ({
                                       toUser,
                                       unsubscribeUrl,
                                       matches,
                                       email,
                                       optionIdsToLabels = {},
                                     }: NewMessageEmailProps) => {
  const name = toUser.name.split(' ')[0]

  return (
    <Html>
      <Head/>
      <Preview>New people share your values — reach out and connect</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Text style={paragraph}>Hi {name},</Text>

            <Text style={paragraph}>
              In the past 24 hours, new people joined Compass whose values and
              interests align with your saved searches. Compass is a gift from the
              community, and it comes alive when people like you take the step to
              connect with one another.
            </Text>

            {(matches || []).map((match) => (
              <Section key={match.id} style={{marginBottom: "20px"}}>
                <Text style={{fontWeight: "bold", marginBottom: "5px"}}>
                  {formatFilters(
                    match.description.filters as Partial<FilterFields>,
                    match.description.location as locationType,
                    optionIdsToLabels,
                  )?.join(" • ")}
                </Text>
                <Text style={{margin: 0}}>
                  {match.matches.map((p, i) => (
                    <span key={p.username}>
                  {p.name} (
                  <Link
                    href={`https://${DOMAIN}/${p.username}`}
                    style={{color: "#2563eb", textDecoration: "none"}}
                  >
                    @{p.username}
                  </Link>
                  )
                      {i < match.matches.length - 1 && ", "}
                </span>
                  ))}
                </Text>
              </Section>
            ))}

            <Section style={{textAlign: "center", marginTop: "30px"}}>
              <Text style={{marginBottom: "20px"}}>
                If someone resonates with you, reach out. A simple hello can be the
                start of a meaningful friendship, collaboration, or relationship.
              </Text>
              <Link
                href={`https://${DOMAIN}/messages`}
                style={{
                  display: "inline-block",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  padding: "12px 20px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                Start a Conversation
              </Link>
            </Section>

            <Text style={{marginTop: "40px", fontSize: "12px", color: "#555"}}>
              Compass is built and sustained by the community — no ads, no hidden
              algorithms, no subscriptions. Your presence and participation make it
              possible.
            </Text>
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} email={email ?? name}/>
        </Container>
      </Body>
    </Html>

  )
}

const matchSamples = [
  {
    "id": "ID search 1",
    "description": {
      "filters": {
        "orderBy": "created_time"
      },
      "location": null
    },
    "matches": [
      {
        "name": "James Bond",
        "username": "jamesbond"
      },
      {
        "name": "Lily",
        "username": "lilyrose"
      }
    ]
  },
  {
    "id": "ID search 2",
    "description": {
      "filters": {
        "genders": [
          "female"
        ],
        "orderBy": "created_time"
      },
      "location": null
    },
    "matches": [
      {
        "name": "Lily",
        "username": "lilyrose"
      }
    ]
  }
]

NewSearchAlertsEmail.PreviewProps = {
  toUser: mockUser,
  email: 'someone@gmail.com',
  unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
  matches: matchSamples,
} as NewMessageEmailProps


export default NewSearchAlertsEmail
