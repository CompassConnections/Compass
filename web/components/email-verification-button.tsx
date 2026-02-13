import {User} from 'firebase/auth'
import {Button} from 'web/components/buttons/button'
import {sendVerificationEmail} from 'web/lib/firebase/email-verification'
import {useT} from 'web/lib/locale'
import {Col} from "web/components/layout/col"

export function EmailVerificationButton(props: {
  user: User
}) {
  const {user} = props
  const t = useT()

  const isEmailVerified = user.emailVerified

  return (
    <Col>
      <Button
        color={'gray-outline'}
        onClick={() => sendVerificationEmail(user, t)}
        disabled={isEmailVerified}
        className={'w-fit'}
      >
        {isEmailVerified
          ? t('settings.email.verified', 'Email Verified ✔️')
          : t('settings.email.send_verification', 'Send verification email')}
      </Button>
    </Col>
  )
}
