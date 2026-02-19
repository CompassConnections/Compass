import {Button} from 'web/components/buttons/button'
import {sendVerificationEmail} from 'web/lib/firebase/email-verification'
import {useT} from 'web/lib/locale'
import {Col} from 'web/components/layout/col'
import toast from 'react-hot-toast'
import {useFirebaseUser} from 'web/hooks/use-firebase-user'

export function EmailVerificationButton() {
  const user = useFirebaseUser()
  const t = useT()

  const isEmailVerified = user?.emailVerified

  async function reload() {
    if (!user) return false

    // Refresh user record from Firebase
    await user.reload()

    if (user.emailVerified) {
      // IMPORTANT: force a new ID token with updated claims
      await user.getIdToken(true)
      console.log('User email verified')
      return true
    } else {
      toast.error(t('', 'Email still not verified...'))
    }
  }

  return (
    <Col className={'gap-2'}>
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
      {!isEmailVerified && (
        <div className={'custom-link'}>
          <button type="button" onClick={reload} className={'w-fit mx-2'}>
            {t('settings.email.just_verified', 'I verified my email')}
          </button>
        </div>
      )}
    </Col>
  )
}
