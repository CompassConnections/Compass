import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {sendVerificationEmail} from 'web/lib/firebase/email-verification'
import clsx from 'clsx'

interface EmailVerificationPromptProps {
  firebaseUser: any
  t: any
  className?: string
}

export function EmailVerificationPrompt(
  {
    firebaseUser,
    t,
    className
  }: EmailVerificationPromptProps) {
  return (
    <Col className={clsx('gap-4 max-w-xl', className)}>
      <h3>{t('messaging.email_verification_required', "You must verify your email to message people.")}</h3>
      <Button color={'gray-outline'} onClick={() => sendVerificationEmail(firebaseUser!, t)} disabled={false}>
        {t('settings.email.send_verification', 'Send verification email')}
      </Button>
    </Col>
  )
}
