import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import {UNFINISHED_SIGNUP_GRACE_DAYS} from 'common/unfinished-signups'
import {EmailShell, LetterButton, LetterParagraph, Signature, TextLink} from 'email/utils'
import React from 'react'
import {createT} from 'shared/locale'

/**
 * The one notice a login that never became an account receives.
 *
 * This is an account notice, not outreach, and everything about it follows from that. It goes to
 * someone who is not a member — they typed an address into the sign-up form, or handed one over
 * through Google or Apple, and stopped — so there is no preference to check, no name to greet them
 * by, and no standing to sell them anything. Under the ePrivacy rules a "come back and finish" email
 * with a pitch in it is direct marketing to someone who never opted in; a plain statement of what
 * exists, what happens to it, and how to end it sooner is account administration. So: no feature
 * list, no encouragement, no founder letter, and it is sent exactly once. Deletion on the stated
 * date is what makes the sentence about deletion true.
 *
 * Sent from the Compass address rather than Martin's: a person reading a notice about a login they
 * may not even remember creating should see the name of the site in their inbox, not of a stranger.
 * It is signed by Martin all the same, like every Compass email — a name at the bottom says a person
 * is answerable for the notice; it is a signature, not a founder letter.
 */
interface UnfinishedSignupEmailProps {
  email: string
  /** When the login was created — the date the notice quotes. */
  createdAt: Date
  /** The "delete it now" link; also what the footer's unsubscribe points at, since deleting the login is the only way to receive nothing further. */
  deleteUrl: string
  locale?: string
}

export const UnfinishedSignupEmail = ({
  email,
  createdAt,
  deleteUrl,
  locale,
}: UnfinishedSignupEmailProps) => {
  const t = createT(locale)
  const finishUrl = `${DEPLOYED_WEB_URL}/onboarding`
  const date = createdAt.toLocaleDateString(locale ?? 'en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const days = String(UNFINISHED_SIGNUP_GRACE_DAYS)

  return (
    <EmailShell
      preview={t(
        'email.unfinished_signup.preview',
        'A login was created on Compass with this address, but no profile',
      )}
      unsubscribeUrl={deleteUrl}
      email={email}
      locale={locale}
      variant="plain"
    >
      {/*<Heading align="left" style={{fontSize: '24px', lineHeight: '1.25', margin: '0 0 16px 0'}}>*/}
      {/*  {t('email.unfinished_signup.title', 'You started a Compass account')}*/}
      {/*</Heading>*/}

      <LetterParagraph>
        {t(
          'email.unfinished_signup.what_exists',
          'On {date}, you signed in to Compass with this address but did not finish creating a profile. Nothing is visible to anyone yet though.',
          {date},
        )}
      </LetterParagraph>

      <LetterParagraph>
        {t(
          'email.unfinished_signup.finish',
          'If you would like to finish, the form picks up where you left off:',
        )}
      </LetterParagraph>

      <LetterButton href={finishUrl}>
        {t('email.unfinished_signup.finish_button', 'Finish my profile')}
      </LetterButton>

      <LetterParagraph>
        {t(
          'email.unfinished_signup.or_not',
          'If you would rather not, your login will be deleted automatically in {days} days. You can also',
          {days},
        )}{' '}
        <TextLink href={deleteUrl} style={{wordBreak: 'break-word'}}>
          {t('email.unfinished_signup.delete_link', 'delete it right now')}
        </TextLink>
        .
      </LetterParagraph>

      {/*<Muted align="left" style={{fontSize: '14px', lineHeight: '1.6', color: palette.ink600}}>*/}
      {/*  {t(*/}
      {/*    'email.unfinished_signup.only_one',*/}
      {/*    'This is the only email you will get about it. If it was not you, someone typed your address by mistake — ignore this and the login disappears on its own.',*/}
      {/*  )}*/}
      {/*</Muted>*/}

      <Signature
        title={t('email.signature_title', 'Founder, Compass')}
        style={{fontSize: '16px', lineHeight: '1.5', margin: '24px 0 0 0'}}
      />
    </EmailShell>
  )
}

UnfinishedSignupEmail.PreviewProps = {
  email: 'someone@gmail.com',
  createdAt: new Date('2026-08-30T10:00:00Z'),
  deleteUrl: `${DEPLOYED_WEB_URL}/delete-unfinished-signup?token=preview`,
} as UnfinishedSignupEmailProps

export default UnfinishedSignupEmail
