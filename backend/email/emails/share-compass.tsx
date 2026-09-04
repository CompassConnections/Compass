import {Button, Link, Section, Text} from '@react-email/components'
import {DEPLOYED_WEB_URL, ENV_CONFIG} from 'common/envs/constants'
import {formatDistance, kmToMiles} from 'common/measurement-utils'
import {getXShareProfileUrl} from 'common/socials'
import {type User} from 'common/user'
import {UNSUBSCRIBE_URL} from 'common/user-notification-preferences'
import {
  Actions,
  CTAButton,
  Divider,
  EmailShell,
  fonts,
  Heading,
  link,
  Muted,
  palette,
  Paragraph,
  Quote,
  Signature,
} from 'email/utils'
import React from 'react'
import {createT} from 'shared/locale'

import {mockUser} from './functions/mock'

/** Radius used for the "members near you" line. Stored in miles, like every other radius here. */
export const NEARBY_RADIUS_MILES = 200

/**
 * Below this, the number reads as discouraging rather than compelling ("3 people near you"),
 * so we fall back to the generic growth copy.
 */
export const MIN_NEARBY_COUNT = 5

export const hasNearbyCount = (nearbyCount?: number, city?: string): boolean =>
  nearbyCount !== undefined && nearbyCount >= MIN_NEARBY_COUNT && !!city

interface ShareCompassEmailProps {
  toUser: User
  unsubscribeUrl: string
  email?: string
  locale?: string
  /** Members within `nearbyRadiusKm` of this user's city. Undefined when unknown. */
  nearbyCount?: number
  /** This user's city, e.g. "Brussels". Undefined when unknown. */
  city?: string
  /**
   * The radius `nearbyCount` was measured at. Defaults to the historical 200 miles; the outreach job
   * passes the much tighter `OUTREACH_RADIUS_KM` so the number here is the same one the dashboard and
   * Contact #E quote, rather than a second, friendlier figure for the same member.
   */
  nearbyRadiusKm?: number
  /**
   * A few members near them, rendered as plain profile links.
   *
   * This is the lowest-friction version of the ask and the one worth putting in a mass email: "I
   * joined a platform to meet someone, you should too" is a confession, "these three people are
   * interesting" is a recommendation, and only the second one gets pasted into a group chat. Profile
   * links already carry `?referrer=`, so it is credited exactly like the signup link.
   */
  nearbyProfiles?: {name: string; username: string}[]
}

export const ShareCompassEmail = ({
  toUser,
  unsubscribeUrl,
  email,
  locale,
  nearbyCount,
  city,
  nearbyRadiusKm,
  nearbyProfiles,
}: ShareCompassEmailProps) => {
  const name = toUser.name.split(' ')[0]
  const t = createT(locale)

  const profileShareUrl = getXShareProfileUrl(t, toUser.username)
  const personalised = hasNearbyCount(nearbyCount, city)
  const radius = formatDistance(
    nearbyRadiusKm === undefined ? NEARBY_RADIUS_MILES : kmToMiles(nearbyRadiusKm),
    !locale || locale === 'en' ? 'imperial' : 'metric',
  )
  // Tagged so anyone who follows a link from this email is credited to the member who was sent it.
  const profileUrl = (username: string) =>
    `https://${ENV_CONFIG.domain}/${username}?referrer=${toUser.username}`

  return (
    <EmailShell
      preview={
        personalised
          ? t('email.share.preview_nearby', '{count} people near {city} are already on Compass', {
              count: String(nearbyCount),
              city: city as string,
            })
          : t(
              'email.share.preview',
              "700 people in 6 months — here's how you help write what's next",
            )
      }
      unsubscribeUrl={unsubscribeUrl}
      email={email ?? name}
      locale={locale}
    >
      <Heading align="left" style={{fontSize: '26px'}}>
        {t('email.share.greeting', 'Hi {name},', {name})}
      </Heading>

      <Paragraph>
        {t(
          'email.share.opening',
          'I started Compass because I believe human connection can be so much more than swipes and small talk.',
        )}
      </Paragraph>

      {personalised ? (
        <>
          <Paragraph>
            {t(
              'email.share.growth_nearby',
              'Right now, {count} members are within {radius} of {city}. People in reach of you, who chose depth over vanity metrics.',
              {
                count: String(nearbyCount),
                radius,
                city: city as string,
              },
            )}
          </Paragraph>

          {/*<Text style={paragraph}>*/}
          {/*  {t(*/}
          {/*    'email.share.growth_nearby_context',*/}
          {/*    "That's what 6 months and 700 members across the platform look like where you live. It's a real signal — and it's only the beginning.",*/}
          {/*  )}*/}
          {/*</Text>*/}
        </>
      ) : (
        <Paragraph>
          {t(
            'email.share.growth',
            "In just 6 months, over 800 people have found their way here, choosing depth over vanity metrics. It's a real signal — and it's only the beginning.",
          )}
        </Paragraph>
      )}

      <Paragraph>
        {t(
          'email.share.network_effect',
          'But Compass only becomes truly useful when more people who share your values are on it. Every new member means more kindred spirits to discover and more contributors keeping it free and ad-free.',
        )}
      </Paragraph>

      {/* The objection is the reader's voice, not ours — so it gets the same rule-and-indent treatment
          every other quoted passage in this package gets, instead of an italic grey paragraph that just
          looked like de-emphasised body copy. */}
      <Quote>
        {t('email.share.objection', '"But my friends aren\'t really my type on here…"')}
      </Quote>

      <Paragraph>
        {t(
          'email.share.reframe',
          "Fair. Maybe the person you tell isn't someone you'd personally connect with on Compass. But think one step further: they bring their world with them — their friends, their colleagues, the thoughtful people in their circles. People you've never met, who might be who you're looking for. Sharing with one friend isn't just a favour to them. It's an investment in your own future connections.",
        )}
      </Paragraph>

      {!!nearbyProfiles?.length && (
        <Section style={{margin: '24px 0 0 0'}}>
          <Paragraph>
            {t(
              'email.share.link_profiles',
              'The easiest version: just link a few profiles you found interesting and let people read them. Here are three near you to start with:',
            )}
          </Paragraph>
          {nearbyProfiles.map((p) => (
            <Text key={p.username} style={{...listItem}}>
              <Link href={profileUrl(p.username)} style={link}>
                {p.name} — compassmeet.com/{p.username}
              </Link>
            </Text>
          ))}
        </Section>
      )}

      <Divider />

      <Text
        className="cm-name"
        style={{
          fontFamily: fonts.heading,
          fontSize: '20px',
          fontWeight: 600,
          color: palette.ink900,
          margin: '0 0 4px 0',
          textAlign: 'center' as const,
        }}
      >
        {t('email.share.cta_heading', 'How to share:')}
      </Text>

      <Actions style={{margin: '18px 0 0 0'}}>
        <Muted style={{marginBottom: '10px'}}>
          {t('email.share.cta_profile', "Post your profile on X (or anywhere you're active):")}
        </Muted>
        {/* X keeps its own black — a share button that doesn't look like the platform it posts to reads
            as a generic link. Everything else about it (radius, type, padding) is our button. */}
        <Button
          href={profileShareUrl}
          className="cm-cta"
          style={{
            display: 'inline-block',
            backgroundColor: '#000000',
            color: '#ffffff',
            padding: '12px 26px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontFamily: fonts.body,
            fontSize: '15px',
            fontWeight: 700,
          }}
        >
          {t('email.share.post_on_x', '𝕏  Post my profile')}
        </Button>
      </Actions>

      <Actions style={{margin: '24px 0 0 0'}}>
        <Muted style={{marginBottom: '10px'}}>
          {t('email.share.cta_link', 'Or simply share the link to Compass:')}
        </Muted>
        <CTAButton href={DEPLOYED_WEB_URL}>
          {t('email.share.share_compass', 'Share Compass')}
        </CTAButton>
      </Actions>

      {/*<Muted style={{marginTop: '32px'}}>*/}
      {/*  {t(*/}
      {/*    'email.share.community_note',*/}
      {/*    "One share. One person. That's how communities like this are built — not by ads, but by people who believe in something ethical.",*/}
      {/*  )}*/}
      {/*</Muted>*/}

      <Paragraph style={{marginTop: '28px'}}>
        {t('email.share.signature_thanks', 'Thank you for being part of it.')}
      </Paragraph>

      <Signature title={t('email.share.signature_title', 'Founder, Compass')} />
    </EmailShell>
  )
}

const listItem = {
  fontFamily: fonts.body,
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '4px 0',
}

ShareCompassEmail.PreviewProps = {
  toUser: mockUser,
  email: 'someone@gmail.com',
  unsubscribeUrl: UNSUBSCRIBE_URL,
  nearbyCount: 47,
  city: 'Brussels',
  // locale: 'fr',
} as ShareCompassEmailProps

export default ShareCompassEmail
