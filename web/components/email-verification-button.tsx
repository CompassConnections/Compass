import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {useFirebaseUser} from 'web/hooks/use-firebase-user'
import {sendVerificationEmail} from 'web/lib/firebase/email-verification'
import {useT} from 'web/lib/locale'

export function EmailVerificationButton() {
  const firebaseUser = useFirebaseUser()
  const t = useT()

  const isEmailVerified = firebaseUser?.emailVerified

  async function reload() {
    if (!firebaseUser) return false

    // Refresh user record from Firebase
    await firebaseUser.reload()

    if (firebaseUser.emailVerified) {
      // IMPORTANT: force a new ID token with updated claims
      await firebaseUser.getIdToken(true)
      console.log('User email verified')
      return true
    } else {
      toast.error(t('settings.email.not_verified', 'Email still not verified...'))
    }
  }

  return (
    <Col className={'gap-2'}>
      <Button
        color={'gray-outline'}
        onClick={() => sendVerificationEmail(firebaseUser, t)}
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
