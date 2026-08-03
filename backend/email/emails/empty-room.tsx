import {Body, Container, Head, Html, Link, Preview, Section, Text} from '@react-email/components'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import {formatDistance, kmToMiles} from 'common/measurement-utils'
import {OUTREACH_RADIUS_KM} from 'common/outreach/outreach'
import {type User} from 'common/user'
import {UNSUBSCRIBE_URL} from 'common/user-notification-preferences'
import {container, content, Footer, main, paragraph} from 'email/utils'
import React from 'react'
import {createT} from 'shared/locale'

import {mockUser} from './functions/mock'

/**
 * Contact #E — the empty room.
 *
 * The largest group on the platform by a wide margin: far more people search, find nobody, and leave
 * than ever reply to anything. Everything else Compass sends them is beside the point, because the
 * point is that there is nobody there.
 *
 * It is also the only message that asks for something without having delivered something first. That
 * is not an exception to the rule so much as the rule read properly — what it delivers is the honest
 * account of the value *not* being there, which is the one thing nobody else will tell them. Hence no
 * feature announcements, no encouragement, and no suggestion that trying harder would work.
 */
interface EmptyRoomEmailProps {
  toUser: User
  unsubscribeUrl: string
  email?: string
  locale?: string
  /** Members within `radiusKm` of them. The number the message is built on. */
  nearbyCount: number
  city: string
  radiusKm?: number
  /** True when they were picked up for having gone quiet rather than for the count alone. */
  wasInactive?: boolean
}

export const EmptyRoomEmail = ({
  toUser,
  unsubscribeUrl,
  email,
  locale,
  nearbyCount,
  city,
  radiusKm = OUTREACH_RADIUS_KM,
  wasInactive,
}: EmptyRoomEmailProps) => {
  const name = toUser.name.split(' ')[0]
  const t = createT(locale)
  const radius = formatDistance(kmToMiles(radiusKm), locale === 'en' ? 'imperial' : 'metric')

  return (
    <Html>
      <Head />
      <Preview>{t('email.empty_room.preview', 'The honest number for {city}', {city})}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Text style={paragraph}>{t('email.empty_room.greeting', 'Hi {name},', {name})}</Text>

            {wasInactive && (
              <Text style={paragraph}>
                {t(
                  'email.empty_room.away',
                  "You haven't been back in a couple of weeks, and I think I know why. Rather than guess, here is the number.",
                )}
              </Text>
            )}

            <Text style={paragraph}>
              {t(
                'email.empty_room.number',
                "There isn't really anyone here for you within {radius} of {city} yet — {count} people only.",
                {radius, city, count: String(nearbyCount)},
              )}
            </Text>

            <Text style={paragraph}>
              {t(
                'email.empty_room.no_feature',
                "It's unlikely a new feature fixes that. Compass is a directory, and a directory of almost nobody is of almost no use, however good the search is. The only thing that changes it is people like you arriving.",
              )}
            </Text>

            <Text style={paragraph}>
              {t(
                'email.empty_room.ask',
                "Which is why the one honest thing I can ask is whether there's someone you'd actually want in the room. Just one person. If nobody comes to mind, that's completely fine and I won't ask again!",
              )}
            </Text>

            <Section style={{marginTop: '20px'}}>
              <Link href={`${DEPLOYED_WEB_URL}/referrals`}>
                {t('email.empty_room.link', 'compassmeet.com/referrals')}
              </Link>
            </Section>

            <Text style={{...paragraph, marginTop: '28px'}}>
              Martin Braquet
              <br />
              <span style={{fontSize: '12px', color: '#888'}}>
                {t('email.empty_room.signature_title', 'Founder, Compass')}
              </span>
            </Text>
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} email={email ?? name} locale={locale} />
        </Container>
      </Body>
    </Html>
  )
}

EmptyRoomEmail.PreviewProps = {
  toUser: mockUser,
  email: 'someone@gmail.com',
  unsubscribeUrl: UNSUBSCRIBE_URL,
  nearbyCount: 3,
  city: 'Groningen',
} as EmptyRoomEmailProps

export default EmptyRoomEmail
