import {Link, Text} from '@react-email/components'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import {type User} from 'common/user'
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
  paragraph,
  Signature,
} from 'email/utils'
import React from 'react'
import {createT} from 'shared/locale'

import {mockUser} from './functions/mock'

interface WelcomeEmailProps {
  toUser: User
  unsubscribeUrl: string
  email?: string
  verificationLink?: string
  locale?: string
}

export const WelcomeEmail = ({
  toUser,
  unsubscribeUrl,
  email,
  verificationLink,
  locale,
}: WelcomeEmailProps) => {
  const name = toUser.name.split(' ')[0]
  const t = createT(locale)

  // Tagged with their own username, so a share made in the first hour is still credited to them — the
  // same attribution /referrals and the about-page share block already speak.
  const referralUrl = `${DEPLOYED_WEB_URL}/?referrer=${toUser.username}`

  return (
    <EmailShell
      preview={t('email.welcome.preview', 'Welcome to Compass — Please confirm your email')}
      unsubscribeUrl={unsubscribeUrl}
      email={email ?? name}
      locale={locale}
    >
      <Heading style={{fontSize: '32px', margin: '0 0 20px 0'}}>
        {t('email.welcome.title', 'Welcome to Compass, {name}!', {name})}
      </Heading>

      <Paragraph>
        {/* A new key rather than a reword of `email.welcome.intro`, since fr and de resolve ahead
            of this fallback and would otherwise keep serving the old sentence. The old one described
            Compass by what it isn't ("no ads, no hidden algorithms, no subscriptions") and never
            said the one thing a new member needs on day zero: that this is a searchable directory
            and searching is the thing to go do. Same vocabulary as the home hero ("Don't Swipe.
            Search.", "No algorithm decides for you who's worth writing to") and the /about subtitle
            ("a free, public directory of people looking for depth"), so the email a member reads
            first and the page that convinced them read as one product. */}
        {t(
          'email.welcome.intro.v2',
          'Compass is a free, public directory for finding your people — friends, partners, or collaborators. Every profile is written by hand and fully searchable: values, interests, politics, diet, languages, and twenty other filters, plus free-text search that reads what people wrote. No swiping, no ads. It’s built by volunteers, funded by donations, and governed by its members.',
        )}
      </Paragraph>

      {/* The confirm step used to sit in a bordered card on the sheet — a box inside a box for one
          sentence and one button. The button is already the loudest thing on the page; a frame around
          it adds a boundary without adding a distinction. */}
      <Text
        className="cm-name"
        style={{
          fontFamily: fonts.heading,
          fontSize: '20px',
          fontWeight: 500,
          color: palette.ink900,
          lineHeight: '1.4',
          textAlign: 'center' as const,
          margin: '28px 0 0 0',
        }}
      >
        {t(
          'email.welcome.confirmation',
          'To finish creating your account and start exploring Compass, please confirm your email below:',
        )}
      </Text>

      <Actions style={{margin: '20px 0 0 0'}}>
        <CTAButton href={verificationLink}>
          {t('email.welcome.confirmButton', 'Confirm My Email')}
        </CTAButton>
      </Actions>

      <Divider />

      {/*<Text*/}
      {/*  style={{*/}
      {/*    marginTop: '32px',*/}
      {/*    fontSize: '12px',*/}
      {/*    color: '#beaea2',*/}
      {/*    textAlign: 'center',*/}
      {/*    lineHeight: '1.6',*/}
      {/*  }}*/}
      {/*>*/}
      {/*  {t('email.welcome.copyLink', 'Or copy and paste this link into your browser:')} <br />*/}
      {/*  <a*/}
      {/*    href={verificationLink}*/}
      {/*    style={{*/}
      {/*      color: '#c17f3e',*/}
      {/*      textDecoration: 'none',*/}
      {/*      wordBreak: 'break-all',*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    {verificationLink}*/}
      {/*  </a>*/}
      {/*</Text>*/}

      {/*<Text*/}
      {/*  style={{*/}
      {/*    marginTop: '40px',*/}
      {/*    fontSize: '13px',*/}
      {/*    color: '#8c8070',*/}
      {/*    lineHeight: '1.75',*/}
      {/*    fontStyle: 'italic',*/}
      {/*    fontFamily: "'Cormorant Garamond', serif",*/}
      {/*  }}*/}
      {/*>*/}
      {/*  {t(*/}
      {/*    'email.welcome.thanks',*/}
      {/*    'Your presence and participation are what make Compass possible. Thank you for helping us build an internet space that prioritizes depth, trust, and community over monetization.',*/}
      {/*  )}*/}
      {/*</Text>*/}

      {/* The one ask this email makes, and deliberately not a share ask: on day zero the reader has
          had no experience of Compass yet, so asking them to recommend it costs credibility and
          converts badly. A reply costs them one sentence, and it is what opens the founder sequence
          (see martin/outreach/new-members.md, Contact #1). It also gives before it asks — the offer
          to hand back two or three profiles is the reciprocity turn, moved to day zero because it
          is cheap and it is the thing a new member actually wants.

          No button here on purpose: "Confirm My Email" must stay the only button in this email, or
          the account never gets created and nothing else matters. */}
      <Paragraph style={{color: palette.ink900, marginTop: '0'}}>
        {t(
          'email.welcome.founder_note',
          "I'm Martin, and I started Compass. If you'd like, reply and tell me what brought you here as well as who you're hoping to find. I can usually point you straight at two or three people worth writing to.",
        )}
      </Paragraph>

      <Signature title={t('email.welcome.signature_title', 'Founder, Compass')} />

      {/* The share seed. A P.S. rather than a section, because at this moment it is a thought to
          plant, not an action to demand — the real ask comes a week later once a saved search has
          fired. Framed as the reader's own upside, the same argument as the /about closing block:
          growth is a network effect they benefit from, never a favour to us. */}
      <Muted align="left" style={{...paragraph, fontSize: '13px', margin: '24px 0 0 0'}}>
        {t(
          'email.welcome.ps',
          'P.S. — Compass is still small enough that this genuinely matters: it gets better for you with every person you bring, because even a friend who isn’t who you’re looking for brings their circle with them. If someone comes to mind, here’s your link: ',
        )}
        <Link href={referralUrl} style={{...link, wordBreak: 'break-word'}}>
          {referralUrl.replace(/^https?:\/\//, '')}
        </Link>
      </Muted>
    </EmailShell>
  )
}

WelcomeEmail.PreviewProps = {
  toUser: mockUser,
  email: 'someone@gmail.com',
  unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
} as WelcomeEmailProps

export default WelcomeEmail
