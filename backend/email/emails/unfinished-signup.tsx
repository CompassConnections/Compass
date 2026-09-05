import {Link} from '@react-email/components'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import {UNFINISHED_SIGNUP_GRACE_DAYS} from 'common/unfinished-signups'
import {
  Actions,
  CTAButton,
  Divider,
  EmailShell,
  Heading,
  link,
  Muted,
  Paragraph,
  paragraph,
} from 'email/utils'
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
 * From Compass rather than from Martin: a person reading a notice about a login they may not even
 * remember creating should see the name of the site, not of a stranger.
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
    >
      <Heading align="left" style={{fontSize: '26px'}}>
        {t('email.unfinished_signup.title', 'You started a Compass account')}
      </Heading>

      <Paragraph>
        {t(
          'email.unfinished_signup.what_exists',
          'On {date}, someone — most likely you — signed in to Compass with this address but did not finish creating a profile. Nothing is visible to anyone: there is no profile and no name, only the login itself.',
          {date},
        )}
      </Paragraph>

      <Paragraph>
        {t(
          'email.unfinished_signup.finish',
          'If that was you and you would like to finish, the form picks up where you left off:',
        )}
      </Paragraph>

      <Actions style={{margin: '8px 0 0 0'}}>
        <CTAButton href={finishUrl}>
          {t('email.unfinished_signup.finish_button', 'Finish my profile')}
        </CTAButton>
      </Actions>

      <Divider />

      <Paragraph>
        {t(
          'email.unfinished_signup.or_not',
          'If you would rather not, you do not have to do anything: logins that are never finished are deleted automatically {days} days after this email, and the address with them. You can also delete it right now:',
          {days},
        )}{' '}
        <Link href={deleteUrl} style={{...link, wordBreak: 'break-word'}}>
          {t('email.unfinished_signup.delete_link', 'delete this login')}
        </Link>
        .
      </Paragraph>

      <Muted align="left" style={{...paragraph, fontSize: '13px', margin: '24px 0 0 0'}}>
        {t(
          'email.unfinished_signup.only_one',
          'This is the only email you will get about it. If it was not you, someone typed your address by mistake — ignore this and the login disappears on its own.',
        )}
      </Muted>
    </EmailShell>
  )
}

UnfinishedSignupEmail.PreviewProps = {
  email: 'someone@gmail.com',
  createdAt: new Date('2026-08-30T10:00:00Z'),
  deleteUrl: `${DEPLOYED_WEB_URL}/delete-unfinished-signup?token=preview`,
} as UnfinishedSignupEmailProps

export default UnfinishedSignupEmail
