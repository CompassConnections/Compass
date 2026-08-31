'use client'

import {debug} from 'common/logger'
import {createUserWithEmailAndPassword} from 'firebase/auth'
import Link from 'next/link'
import {useSearchParams} from 'next/navigation'
import React, {Suspense, useEffect, useState} from 'react'
import toast from 'react-hot-toast'
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
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {NewTabLink} from 'web/components/widgets/new-tab-link'
import {auth, canAppleLogin} from 'web/lib/firebase/users'
import {useT} from 'web/lib/locale'
import {
  appleSigninSignup,
  googleSigninSignup,
  setOnboardingFlag,
  signinSignupRedirect,
} from 'web/lib/util/signup'

export default function RegisterPage() {
  return (
    <Suspense fallback={<div></div>}>
      <RegisterComponent />
    </Suspense>
  )
}

// const href = '/signup'

function RegisterComponent() {
  const t = useT()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(searchParams.get('error'))
  const [isLoading, setIsLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registeredEmail, _] = useState('')
  // Resolved after mount: `canAppleLogin` reads the Capacitor bridge, which the server and the
  // first client render do not have — deciding during render would be a hydration mismatch.
  const [showApple, setShowApple] = useState(false)
  useEffect(() => setShowApple(canAppleLogin()), [])
  /**
   * The terms checkbox is **disabled for now** — it is a suspect in the guideline 2.1 rejection of
   * 1.42.0, "got an error when trying to login with Apple login".
   *
   * The gate blocked all three sign-up routes, and the message it set renders in `AuthError`, which
   * sits *above* the buttons. On a phone the tap lands at the bottom of the screen and the
   * explanation appears a couple of hundred pixels north of the thumb, with no Apple sheet in
   * between — from a reviewer's seat, indistinguishable from the Apple button erroring. Nothing
   * proves that is what happened, which is exactly why it is worth removing from the path: it is the
   * one candidate that can be eliminated for free, and with it gone a repeat of the same rejection
   * points squarely at the native flow instead.
   *
   * Nothing about Apple's rules requires it back. Guideline 1.2 asks a UGC app for content
   * filtering, reporting, blocking and published contact details, and says nothing about an
   * affirmative tick for terms; an earlier version of this comment claimed otherwise and was wrong.
   * The real argument for it is legal rather than Apple's: an explicit tick is clickwrap, which US
   * courts enforce far more reliably than the "by signing up you agree" line that now carries the
   * weight in `AuthFooter`. That is a trade worth making deliberately once the store build is
   * unblocked, not while it is the thing under investigation.
   *
   * Kept whole, and kept together with the JSX below, so restoring it is one uncomment in each of
   * three places: here, the `handleSubmit` guard, and the checkbox itself.
   */
  // const [agreedToTerms, setAgreedToTerms] = useState(false)
  // const termsRef = useRef<HTMLInputElement>(null)
  //
  // /**
  //  * What happens when someone taps a sign-up button without having ticked the box.
  //  *
  //  * The failure points at the control that caused it: the message is repeated as a toast, which
  //  * appears near the tap rather than above the fold, and the checkbox is scrolled to, focused and
  //  * outlined. `scrollIntoView` is guarded because jsdom does not implement it.
  //  */
  // const flagMissingAgreement = () => {
  //   const message = t(
  //     'register.error.terms_required',
  //     'Please accept the Terms and Conditions and Privacy Policy to continue.',
  //   )
  //   setError(message)
  //   toast.error(message)
  //   termsRef.current?.focus()
  //   termsRef.current?.scrollIntoView?.({block: 'center', behavior: 'smooth'})
  // }
  //
  // /** True once a blocked attempt has happened and the box is still unticked. */
  // const termsMissing = !!error && !agreedToTerms

  /**
   * A pass-through while the gate above is off. The call sites keep wrapping their handlers in it,
   * so turning the checkbox back on means uncommenting the body rather than rewiring three buttons.
   */
  const requireAgreement = (signUp: () => void) => () => {
    // if (!agreedToTerms) {
    //   flagMissingAgreement()
    //   return
    // }
    signUp()
  }

  // function redirect() {
  //   // Redirect to complete profile page
  //   window.location.href = href
  // }

  const checkProfileAndRedirect = async (creds: any) => {
    await signinSignupRedirect(creds?.user?.uid)
    setIsLoading(false)
  }

  const handleEmailPasswordSignUp = async (email: string, password: string) => {
    try {
      setOnboardingFlag()
      const creds = await createUserWithEmailAndPassword(auth, email, password)
      debug('User signed up:', creds.user)
      await checkProfileAndRedirect(creds)
    } catch (error: any) {
      console.error('Error signing up:', error)
      toast.error(t('register.toast.signup_failed', 'Failed to sign up: ') + (error?.message ?? ''))
      setError(error?.message ?? t('register.error.unknown', 'Registration failed'))
      setIsLoading(false)
      if (error instanceof Error && error.message.includes('email-already-in-use')) {
        throw new Error(t('register.error.email_in_use', 'This email is already registered'))
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    function handleError(error: unknown) {
      console.error('Registration error:', error)
      setError(
        error instanceof Error
          ? error.message
          : String(error ?? t('register.error.unknown', 'Registration failed')),
      )
    }

    try {
      event.preventDefault()
      setIsLoading(true)
      setError(null)

      const formData = new FormData(event.currentTarget)
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      // Basic validation
      if (!email || !password) {
        handleError(t('register.error.all_fields_required', 'All fields are required'))
        setIsLoading(false)
        return
      }

      // Off with the checkbox — see the block near the top of this component.
      // if (!agreedToTerms) {
      //   // Same treatment as the social buttons — see `flagMissingAgreement`.
      //   flagMissingAgreement()
      //   setIsLoading(false)
      //   return
      // }

      await handleEmailPasswordSignUp(email, password)

      // Show a success message with email verification notice
      // setRegistrationSuccess(true)
      // setRegisteredEmail(email)

      // Sign in after successful registration
      // ...

      // if (response?.error) {
      //   handleError("Failed to sign in after registration")
      // }

      // redirect()
    } catch (error) {
      handleError(error)
      setIsLoading(false)
    }
  }

  return (
    <PageBase trackPageView={'register'}>
      <SEO
        title={t('register.seo.title', 'Register')}
        description={t('register.seo.description', 'Register for a new account')}
        url={`/register`}
      />
      <AuthShell>
        {registrationSuccess ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold ">
              {t('register.check_email.title', 'Check your email')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('register.check_email.sent_prefix', 'We have sent a verification link to ')}
              <span className="font-medium">{registeredEmail}</span>
              {t('register.check_email.sent_suffix', '.')}
            </p>
            <p className="mt-4 text-sm text-gray-500">
              {t(
                'register.check_email.help_prefix',
                'Did not receive the email? Check your spam folder or ',
              )}
              <button
                type="button"
                className="font-medium text-blue-600 hover:text-blue-500"
                onClick={() => setRegistrationSuccess(false)}
              >
                {t('register.check_email.try_again', 'try again')}
              </button>
              {t('register.check_email.help_suffix', '.')}
            </p>
            <div className="mt-6">
              <Link
                href="/signin"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium  bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {t('register.back_to_login', 'Back to Login')}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <AuthHeader
              title={t('register.get_started', 'Get Started')}
              subtitle={t('register.subtitle', 'Create your free account — no algorithms, no ads.')}
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
                  placeholder={t('register.password_placeholder', 'Password')}
                />
              </AuthFieldGroup>

              {/* Disabled for now — see the block near the top of this component for why, and for
                  what has to come back with it. The links to /terms and /privacy have not gone
                  anywhere: `AuthFooter` below carries them, which is what keeps 5.1.1(i) satisfied
                  and leaves the agreement implied rather than absent.

              <label className="mt-2 flex items-start gap-2 text-sm text-ink-600 custom-link cursor-pointer">
                <input
                  ref={termsRef}
                  type="checkbox"
                  name="terms"
                  data-testid="register-terms"
                  checked={agreedToTerms}
                  aria-invalid={termsMissing}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked)
                    if (e.target.checked) setError(null)
                  }}
                  className={clsx(
                    'mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-primary-500 focus:ring-primary-500',
                    // Only after a blocked attempt: an unticked box is the normal starting state and
                    // has done nothing wrong until someone tries to get past it.
                    termsMissing && 'ring-2 ring-red-500 ring-offset-2',
                  )}
                />
                <span>
                  {t('register.agreement.checkbox_prefix', 'I agree to the ')}
                  <NewTabLink href="/terms">
                    {t('register.terms', 'Terms and Conditions')}
                  </NewTabLink>
                  {t('register.agreement.and', ' and ')}
                  <NewTabLink href="/privacy">{t('register.privacy', 'Privacy Policy')}</NewTabLink>
                  {t('register.agreement.suffix', '.')}
                </span>
              </label>
              */}

              {/* Sign-in wrap: assent is implied by using the button, so the sentence has to be
                  about the act rather than a first-person claim with nothing behind it. The
                  checkbox wording lives on under `register.agreement.checkbox_prefix`, which the
                  commented-out clickwrap above still uses. */}
              <div>
                <span className={'custom-link'}>
                  {t('register.agreement.prefix', 'By signing up, you agree to the ')}
                  <NewTabLink href="/terms">
                    {t('register.terms', 'Terms and Conditions')}
                  </NewTabLink>
                  {t('register.agreement.and', ' and ')}
                  <NewTabLink href="/privacy">{t('register.privacy', 'Privacy Policy')}</NewTabLink>
                  {t('register.agreement.suffix', '.')}
                </span>
              </div>

              <AuthError>{error}</AuthError>

              <div className="space-y-4">
                <AuthSubmitButton isLoading={isLoading}>
                  {isLoading
                    ? t('register.button.creating', 'Creating account...')
                    : t('register.button.email', 'Sign up with Email')}
                </AuthSubmitButton>
                <AuthDivider label={t('register.or_sign_up_with', 'Or')} />
                <GoogleButton
                  onClick={requireAgreement(googleSigninSignup)}
                  isLoading={isLoading}
                  label="Sign up with Google"
                />
                {/* App Store guideline 4.8 — see the same block in signin.tsx. */}
                {showApple && (
                  <AppleButton
                    onClick={requireAgreement(appleSigninSignup)}
                    isLoading={isLoading}
                    // "Sign up with Apple" rather than the default "Sign in with Apple": both are
                    // Apple's own permitted strings, and this page creates an account.
                    label="Sign up with Apple"
                  />
                )}
              </div>
            </AuthForm>
            <AuthFooter>
              {t('register.already_account', 'Already have an account?')}{' '}
              <Link href="/signin">{t('register.link_signin', 'Sign in')}</Link>
            </AuthFooter>
          </>
        )}
      </AuthShell>
    </PageBase>
  )
}
