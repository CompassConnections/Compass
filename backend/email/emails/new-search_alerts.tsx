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
import {type User} from 'common/user'
import {type LoverRow} from 'common/love/lover'
import {
  jamesLover,
  jamesUser,
  sinclairLover,
  sinclairUser,
} from './functions/mock'
import {DOMAIN} from 'common/envs/constants'
import {getLoveOgImageUrl} from 'common/love/og-image'
import {button, container, content, Footer, imageContainer, main, paragraph, profileImage} from "email/utils";
import {sendSearchAlertsEmail} from "email/functions/helpers";
import {MatchesType} from "common/love/bookmarked_searches";
import {formatFilters, locationType} from "common/searches"
import {FilterFields} from "common/filters";

interface NewMessageEmailProps {
  toUser: User
  matches: MatchesType[]
  unsubscribeUrl: string
  email?: string
}

export const NewSearchAlertsEmail = ({
                                       toUser,
                                       unsubscribeUrl,
                                       matches,
                                       email,
                                     }: NewMessageEmailProps) => {
  const name = toUser.name.split(' ')[0]

  return (
    <Html>
      <Head/>
      <Preview>Some people recently matched your bookmarked searches!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Text style={paragraph}>Hi {name},</Text>
            <Text style={paragraph}>The following people matched your bookmarked searches in the past 24h:</Text>
            <Text
              className={
                'border-ink-300bg-canvas-0 inline-flex flex-col gap-2 rounded-md border p-1 text-sm shadow-sm'
              }
            >
              <ol className="list-decimal list-inside space-y-2">
                {(matches || []).map((match) => (
                  <li key={match.id}
                      className="items-center justify-between gap-2 list-item marker:text-ink-500 marker:font-bold">
                    {formatFilters(match.description.filters as Partial<FilterFields>, match.description.location as locationType)}
                    <span>{match.matches.map(p => p.toString()).join(', ')}</span>
                  </li>
                ))}
              </ol>

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
      [
        {
          "name": "James Bond",
          "username": "jamesbond"
        },
        {
          "name": "Lily",
          "username": "lilyrose"
        }
      ]
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
      [
        {
          "name": "Lily",
          "username": "lilyrose"
        }
      ]
    ]
  }
]

NewSearchAlertsEmail.PreviewProps = {
  toUser: sinclairUser,
  email: 'someone@gmail.com',
  unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
  matches: matchSamples,
} as NewMessageEmailProps


export default NewSearchAlertsEmail
