import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import {type User} from 'common/user'
import {
  EmailShell,
  Heading,
  LetterButton,
  LetterParagraph,
  Muted,
  palette,
  Signature,
  TextLink,
} from 'email/utils'
import React from 'react'
import {createT} from 'shared/locale'

import {mockUser} from './functions/mock'

interface WelcomeEmailProps {
  toUser: User
  unsubscribeUrl: string
  email?: string
  /** Absent when the address is already verified (Google, Apple): the confirm step is then left out. */
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
      preview={
        verificationLink
          ? t('email.welcome.preview', 'Welcome to Compass — Please confirm your email')
          : t('email.welcome.preview_verified', 'Your Compass account is ready')
      }
      unsubscribeUrl={unsubscribeUrl}
      email={email ?? name}
      locale={locale}
      variant="plain"
    >
      <Heading align="left" style={{fontSize: '24px', lineHeight: '1.25', margin: '0 0 16px 0'}}>
        {t('email.welcome.title', 'Welcome to Compass, {name}!', {name})}
      </Heading>

      <LetterParagraph>
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
          'Compass is a free, public directory for finding your people, such as a life partner or friends. Profiles are written by hand and searchable by shared values. No swiping. No ads. It’s built by volunteers like me and funded by donations.',
        )}
      </LetterParagraph>

      {/* The confirm step used to sit in a bordered card on the sheet — a box inside a box for one
          sentence and one button. The button is already the loudest thing on the page; a frame around
          it adds a boundary without adding a distinction. It was then a centred 20px serif line, a
          second headline competing with the first; it is a sentence, so it is set as one. */}
      {verificationLink && (
        <>
          <LetterParagraph>
            {t(
              'email.welcome.confirmation',
              'To finish creating your account and start exploring Compass, please confirm your email below:',
            )}
          </LetterParagraph>

          <LetterButton href={verificationLink}>
            {t('email.welcome.confirmButton', 'Confirm My Email')}
          </LetterButton>
        </>
      )}

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
          the account never gets created and nothing else matters. (When the address is already
          verified there is no button at all, and the email is simply a letter.) */}
      <LetterParagraph>
        {t(
          'email.welcome.founder_note',
          "I'm the person who brought Compass to life. If you'd like, tell me what brought you here and who you're hoping to find. I can point you at a few people worth writing to.",
        )}
      </LetterParagraph>

      <Signature
        title={t('email.welcome.signature_title', 'Founder, Compass')}
        style={{fontSize: '16px', lineHeight: '1.5', margin: '24px 0 0 0'}}
      />

      {/* The share seed. A P.S. rather than a section, because at this moment it is a thought to
          plant, not an action to demand — the real ask comes a week later once a saved search has
          fired. Framed as the reader's own upside, the same argument as the /about closing block:
          growth is a network effect they benefit from, never a favour to us. */}
      <Muted
        align="left"
        style={{fontSize: '14px', lineHeight: '1.6', color: palette.ink600, margin: '24px 0 0 0'}}
      >
        {t(
          'email.welcome.ps',
          'P.S.: If someone you know is looking for meaningful relationships, here’s your link: ',
        )}
        <TextLink href={referralUrl} style={{wordBreak: 'break-word'}}>
          {referralUrl.replace(/^https?:\/\//, '')}
        </TextLink>
      </Muted>
    </EmailShell>
  )
}

WelcomeEmail.PreviewProps = {
  toUser: mockUser,
  email: 'someone@gmail.com',
  verificationLink: 'https://compassmeet.com/confirm-email?preview',
  unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
} as WelcomeEmailProps

export default WelcomeEmail
