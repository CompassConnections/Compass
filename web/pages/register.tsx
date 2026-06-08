'use client'

import {debug} from 'common/logger'
import {createUserWithEmailAndPassword} from 'firebase/auth'
import Link from 'next/link'
import {useSearchParams} from 'next/navigation'
import React, {Suspense, useState} from 'react'
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
import {GoogleButton} from 'web/components/buttons/sign-up-button'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {NewTabLink} from 'web/components/widgets/new-tab-link'
import {auth} from 'web/lib/firebase/users'
import {useT} from 'web/lib/locale'
import {googleSigninSignup, setOnboardingFlag, signinSignupRedirect} from 'web/lib/util/signup'

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

              <p className="text-sm mt-2 text-center text-ink-600 custom-link">
                {t('register.agreement.prefix', 'By signing up, I agree to the ')}
                <NewTabLink href="/terms">{t('register.terms', 'Terms and Conditions')}</NewTabLink>
                {t('register.agreement.and', ' and ')}
                <NewTabLink href="/privacy">{t('register.privacy', 'Privacy Policy')}</NewTabLink>
                {t('register.agreement.suffix', '.')}
              </p>

              <AuthError>{error}</AuthError>

              <div className="space-y-4">
                <AuthSubmitButton isLoading={isLoading}>
                  {isLoading
                    ? t('register.button.creating', 'Creating account...')
                    : t('register.button.email', 'Sign up with Email')}
                </AuthSubmitButton>
                <AuthDivider label={t('register.or_sign_up_with', 'Or sign up with')} />
                <GoogleButton onClick={googleSigninSignup} isLoading={isLoading} />
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
