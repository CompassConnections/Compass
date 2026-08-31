'use client'

import {debug} from 'common/logger'
import {signInWithEmailAndPassword} from 'firebase/auth'
import Link from 'next/link'
import {useSearchParams} from 'next/navigation'
import React, {Suspense, useEffect, useState} from 'react'
import {
  AuthDivider,
  AuthError,
  AuthFieldGroup,
  AuthFooter,
  AuthForm,
  AuthHeader,
  AuthInput,
  AuthShell,
  AuthSubmitButton,
} from 'web/components/auth/auth-form'
import {AppleButton, GoogleButton} from 'web/components/buttons/sign-up-button'
import {InfoIcon} from 'web/components/icons'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {useUser} from 'web/hooks/use-user'
import {sendPasswordReset} from 'web/lib/firebase/password'
import {appleLogin, auth, canAppleLogin, googleLogin} from 'web/lib/firebase/users'
import {useT} from 'web/lib/locale'
import {signinSignupRedirect, socialSigninSignup} from 'web/lib/util/signup'

export default function LoginPage() {
  return (
    <Suspense fallback={<div></div>}>
      <RegisterComponent />
    </Suspense>
  )
}

function RegisterComponent() {
  const t = useT()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [redirectPath, setRedirectPath] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [_, setIsLoadingGoogle] = useState(false)
  const user = useUser()
  // Resolved after mount: `canAppleLogin` reads the Capacitor bridge, which the server and the
  // first client render do not have — deciding during render would be a hydration mismatch.
  const [showApple, setShowApple] = useState(false)
  useEffect(() => setShowApple(canAppleLogin()), [])

  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'OAuthAccountNotLinked') {
      setError('This email is already registered with a different provider')
    } else if (error) {
      setError('An error occurred during login')
    }
    setRedirectPath(searchParams.get('redirect'))
  }, [searchParams, t])

  const checkAndRedirect = async (userId: string | undefined) => {
    if (userId) {
      debug('User signed in:', userId)
      try {
        await signinSignupRedirect(userId, redirectPath)
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
      setIsLoading(false)
      setIsLoadingGoogle(false)
    }
  }

  useEffect(() => {
    checkAndRedirect(user?.id)
  }, [user])

  /**
   * Google and Apple, which on this page can just as easily *create* an account as sign into one —
   * App Review does exactly that, and so does anyone who taps "Sign in" out of habit.
   *
   * Delegates to `socialSigninSignup` so that is byte-for-byte the same path as pressing the same
   * button on `/register`. It used to be a near-copy that skipped `setOnboardingFlag()`, which left
   * a brand-new account in a state `auth-context` handles differently — see the comment on
   * `socialSigninSignup`. `redirectPath` still gets through, so `?redirect=` keeps working for
   * someone who already has an account.
   *
   * Only the error presentation stays local: the reason is shown inline rather than swallowed. App
   * Review rejected 1.42.0 for "got an error when trying to login with Apple login", and the generic
   * string that used to be here is why that was all they could say — `appleNativeLogin` now tags the
   * failing leg and its code, and that is only useful if it reaches the screen someone can
   * photograph.
   */
  const handleSocialSignIn = async (login: () => Promise<any>, provider: string) => {
    setIsLoading(true)
    setIsLoadingGoogle(true)
    setError(null)
    try {
      await socialSigninSignup(login, redirectPath)
    } catch (error: any) {
      console.error('Error signing in:', error)
      const reason = error?.message ? `: ${error.message}` : ''
      setError(`Failed to sign in with ${provider}${reason}`)
    } finally {
      // `finally`, not the catch: the success path navigates away, and on the rare occasion it does
      // not — an existing account whose redirect is a no-op — a spinner left running forever is
      // worse than a moment of flicker.
      setIsLoading(false)
      setIsLoadingGoogle(false)
    }
  }

  const handleGoogleSignIn = () => handleSocialSignIn(googleLogin, 'Google')
  const handleAppleSignIn = () => handleSocialSignIn(appleLogin, 'Apple')

  const handleEmailPasswordSignIn = async (email: string, password: string) => {
    try {
      const creds = await signInWithEmailAndPassword(auth, email, password)
      await checkAndRedirect(creds?.user?.uid)
      debug(creds)
    } catch (error) {
      console.error('Error signing in:', error)
      const message = t(
        'signin.failed_credentials',
        'Failed to sign in with your email and password',
      )
      setError(message)
      setIsLoading(false)
      setIsLoadingGoogle(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    try {
      event.preventDefault()
      setIsLoading(true)
      setError(null)

      const formData = new FormData(event.currentTarget)
      const email = formData.get('email') as string
      const password = formData.get('password') as string
      await handleEmailPasswordSignIn(email, password)

      // if (response?.error) {
      //   setError("Invalid email or password")
      //   setIsLoading(false)
      //   return
      // }

      // router.push("/")
      // router.refresh()
    } catch {
      setError('An error occurred during login')
      setIsLoading(false)
    }
  }

  return (
    <PageBase trackPageView={'signin'}>
      <SEO
        title={t('signin.seo.title', 'Sign in')}
        description={t('signin.seo.description', 'Sign in to your account')}
        url={`/signin`}
      />
      <AuthShell>
        {redirectPath && (
          <div className="bg-primary-100 border border-primary-200 rounded-lg p-4 flex items-center gap-3">
            <InfoIcon className="w-5 h-5 text-primary-700 flex-shrink-0" />
            <p className="text-primary-700 text-sm">
              {t(
                'signin.prompt.sign_in_to_access',
                'Please sign in to access the {redirectPath} page',
                {redirectPath: redirectPath.replace('/', '')},
              )}
            </p>
          </div>
        )}
        <AuthHeader
          title={t('signin.title', 'Sign in')}
          subtitle={t('signin.subtitle', 'Welcome back — pick up where you left off.')}
        />
        <AuthForm onSubmit={handleSubmit}>
          <AuthFieldGroup>
            <AuthInput
              id="email"
              name="email"
              type="email"
              required
              position="top"
              label="Email"
              placeholder="Email"
            />
            <AuthInput
              id="password"
              name="password"
              type="password"
              required
              position="bottom"
              label="Password"
              placeholder={t('signin.password_placeholder', 'Your password')}
              below={
                <div className="text-right mt-1 custom-link">
                  <button
                    type="button"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.preventDefault()
                      const form = e.currentTarget.closest('form')
                      if (form) {
                        const emailInput = form.querySelector(
                          'input[type="email"]',
                        ) as HTMLInputElement
                        if (emailInput?.value) {
                          sendPasswordReset(emailInput.value)
                        } else {
                          // If no email is entered, show an error
                          setError(t('signin.enter_email', 'Please enter your email first'))
                        }
                      }
                    }}
                    className="text-sm focus:outline-none"
                  >
                    {t('signin.forgot_password', 'Forgot password?')}
                  </button>
                </div>
              }
            />
          </AuthFieldGroup>

          <AuthError>{error}</AuthError>

          <div className="space-y-4">
            <AuthSubmitButton isLoading={isLoading}>
              {isLoading ? 'Signing in...' : t('signin.submit', 'Sign in with Email')}
            </AuthSubmitButton>
            <AuthDivider label={t('signin.continue', 'Or')} />
            <GoogleButton onClick={handleGoogleSignIn} isLoading={isLoading} />
            {/* App Store guideline 4.8: an app offering third-party social login must also offer
                Sign in with Apple. Shown in the iOS app (native flow) and in browsers once the
                Services ID is configured, so an account created on iOS is not locked to it. */}
            {showApple && <AppleButton onClick={handleAppleSignIn} isLoading={isLoading} />}
          </div>
        </AuthForm>
        <AuthFooter>
          {t('signin.no_account', "Don't have an account?")}{' '}
          <Link href="/register">{t('signin.link_sign_up', 'Register')}</Link>
        </AuthFooter>
      </AuthShell>
    </PageBase>
  )
}
