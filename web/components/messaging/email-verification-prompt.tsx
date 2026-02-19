import clsx from 'clsx'
import {EmailVerificationButton} from 'web/components/email-verification-button'
import {Col} from 'web/components/layout/col'

interface EmailVerificationPromptProps {
  t: any
  className?: string
}

export function EmailVerificationPrompt({t, className}: EmailVerificationPromptProps) {
  return (
    <Col className={clsx('gap-4 max-w-xl', className)}>
      <h3>
        {t(
          'messaging.email_verification_required',
          'You must verify your email to message people.',
        )}
      </h3>
      <EmailVerificationButton />
    </Col>
  )
}
