import {LOCALE_TO_LANGUAGE} from 'common/choices'
import {debug} from 'common/logger'
import {ProfileWithoutUser} from 'common/profiles/profile'
import {removeNullOrUndefinedProps} from 'common/util/object'
import {useRouter} from 'next/router'
import {useEffect, useRef, useState} from 'react'
import {Toaster} from 'react-hot-toast'
import {Col} from 'web/components/layout/col'
import {OptionalProfileUserForm} from 'web/components/optional-profile-form'
import {initialRequiredState, RequiredProfileUserForm} from 'web/components/required-profile-form'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {useProfileByUserId} from 'web/hooks/use-profile'
import {useTracking} from 'web/hooks/use-tracking'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {CACHED_REFERRAL_USERNAME_KEY} from 'web/lib/firebase/users'
import {useLocale} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'
import {safeLocalStorage} from 'web/lib/util/local'

export default function SignupPage() {
  const [step, setStep] = useState(0)
  const user = useUser()
  // console.debug('user:', user)
  const router = useRouter()
  useTracking('view signup page')

  // Hold loading indicator for 5s when user transitions from undefined -> null
  const prevUserRef = useRef<ReturnType<typeof useUser>>()
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [holdLoading, setHoldLoading] = useState(true)

  useEffect(() => {
    const prev = prevUserRef.current
    // Transition: undefined -> null
    if (prev === undefined && user === null) {
      setHoldLoading(true)
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = setTimeout(() => {
        setHoldLoading(false)
        holdTimeoutRef.current = null
      }, 10000)
    }
    // If user becomes defined, stop holding immediately
    if (user && holdLoading) {
      setHoldLoading(false)
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current)
        holdTimeoutRef.current = null
      }
    }
    prevUserRef.current = user
  }, [user, holdLoading])

  const {locale} = useLocale()
  const language = LOCALE_TO_LANGUAGE[locale]

  // Omit the id, created_time?
  const [profileForm, setProfileForm] = useState<ProfileWithoutUser>({
    ...initialRequiredState,
    languages: language ? [language] : [],
  } as any)
  const setProfileState = (key: keyof ProfileWithoutUser, value: any) => {
    setProfileForm((prevState) => ({...prevState, [key]: value}))
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  // When a profile already exists (e.g. user pressed browser back after submitting),
  // lock the username and display name fields so they can't be changed.
  const [isLocked, setIsLocked] = useState(false)

  const existingProfile = useProfileByUserId(user?.id)
  useEffect(() => {
    if (existingProfile) {
      setProfileForm(existingProfile)
      setIsLocked(true)
    }
  }, [existingProfile])

  // if (step === 1 && user) {
  //   return <PageBase trackPageView={'register'}>
  //     <SEO
  //       title={t('signup.seo.title','Sign up')}
  //       description={t('signup.seo.description','Create a new account')}
  //       url={`/signup`}
  //     />
  //     <Col className={'w-full px-6 py-4'}>
  //       <OptionalProfileUserForm
  //         setProfile={setProfileState}
  //         profile={profileForm}
  //         user={user}
  //         fromSignup
  //       />
  //     </Col>
  //   </PageBase>
  // }

  // Sync the step with browser history so the back button works within the flow.
  // When we advance to step 1, push a new history entry. When the user presses
  // back, popstate fires and we move back to step 0 rather than leaving the page.
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const historyStep = e.state?.signupStep ?? 0
      setStep(historyStep)
      scrollTo(0, 0)
      setIsLocked(true)
    }

    window.addEventListener('popstate', handlePopState)
    // Record step 0 in history on mount so there's always a baseline entry.
    window.history.replaceState({signupStep: 0}, '')

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const advanceToStep = (nextStep: number) => {
    window.history.pushState({signupStep: nextStep}, '')
    setStep(nextStep)
    scrollTo(0, 0)
  }

  if (user === null && !holdLoading) {
    console.log('user === null && !holdLoading')
    return <CompassLoadingIndicator />
  }

  return (
    <Col className="items-center">
      <Toaster position={'top-center'} containerClassName="!bottom-[70px]" />
      {!user ? (
        <CompassLoadingIndicator />
      ) : (
        <Col className={'w-full max-w-4xl px-6 py-4'}>
          {step === 0 ? (
            <RequiredProfileUserForm
              user={user}
              setProfile={setProfileState}
              profile={profileForm}
              isSubmitting={isSubmitting}
              // Lock username and display name if the profile was already created.
              // This handles the case where the user pressed browser back after
              // submitting — they can review and continue, but not re-set these fields.
              isLocked={isLocked}
              onSubmit={async () => {
                if (!profileForm.looking_for_matches) {
                  router.push('/')
                  return
                }

                // If the profile already exists (back-navigation case), skip the
                // API call and just advance to the next step.
                if (isLocked) {
                  advanceToStep(1)
                  console.log('resume signup after back navigation')
                  return
                }

                const referredByUsername = safeLocalStorage
                  ? (safeLocalStorage.getItem(CACHED_REFERRAL_USERNAME_KEY) ?? undefined)
                  : undefined

                setIsSubmitting(true)
                debug('profileForm', profileForm)
                const profile = await api(
                  'create-profile',
                  removeNullOrUndefinedProps({
                    ...profileForm,
                    referred_by_username: referredByUsername,
                  }) as any,
                ).catch((e: unknown) => {
                  console.error(e)
                  return null
                })
                setIsSubmitting(false)
                if (profile) {
                  setProfileForm(profile)
                  advanceToStep(1)
                  track('submit required profile')
                }
              }}
            />
          ) : step === 1 ? (
            <Col className={'w-full px-2 sm:px-6 py-4 mb-2'}>
              <OptionalProfileUserForm
                setProfile={setProfileState}
                profile={profileForm}
                user={user}
                fromSignup
                bottomNavBarVisible={false}
              />
            </Col>
          ) : (
            <CompassLoadingIndicator />
          )}
        </Col>
      )}
    </Col>
  )
}

export const colClassName = 'items-start gap-2'
export const labelClassName = 'font-semibold text-md'
