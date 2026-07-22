import {LOCALE_TO_LANGUAGE} from 'common/choices'
import {ProfileWithoutUser} from 'common/profiles/profile'
import {BaseUser} from 'common/user'
import {cleanDisplayName, cleanUsername} from 'common/util/clean-username'
import {removeNullOrUndefinedProps} from 'common/util/object'
import {randomString} from 'common/util/random'
import {useRouter} from 'next/router'
import {useEffect, useState} from 'react'
import toast, {Toaster} from 'react-hot-toast'
import {ensureDeviceToken} from 'web/components/auth-context'
import {BackButton} from 'web/components/back-button'
import {Col} from 'web/components/layout/col'
import {OptionalProfileUserForm} from 'web/components/optional-profile-form'
import {initialRequiredState, RequiredProfileUserForm} from 'web/components/required-profile-form'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {StepProgress} from 'web/components/widgets/step-progress'
import {useTracking} from 'web/hooks/use-tracking'
import {api} from 'web/lib/api'
import {auth, CACHED_REFERRAL_USERNAME_KEY} from 'web/lib/firebase/users'
import {useLocale, useT} from 'web/lib/locale'
import {getLocale} from 'web/lib/locale-cookie'
import {track} from 'web/lib/service/analytics'
import {safeLocalStorage} from 'web/lib/util/local'
import {clearOnboardingFlag} from 'web/lib/util/signup'

export default function SignupPage() {
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  useTracking('view signup page')

  const {locale} = useLocale()
  const language = LOCALE_TO_LANGUAGE[locale]
  const t = useT()

  const [baseUser, setBaseUser] = useState<BaseUser>(getInitialBaseUser())

  const setBaseUserState = <K extends keyof BaseUser>(key: K, value: BaseUser[K] | undefined) => {
    setBaseUser((prevState) => ({...prevState, [key]: value}))
  }

  const username = baseUser.username
  const name = baseUser.name

  const [profileForm, setProfileForm] = useState<ProfileWithoutUser>({
    ...initialRequiredState,
    languages: language ? [language] : [],
  } as any)
  const setProfileState = (key: keyof ProfileWithoutUser, value: any) => {
    setProfileForm((prevState) => ({...prevState, [key]: value}))
  }

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const historyStep = e.state?.signupStep ?? 0
      setStep(historyStep)
      scrollTo(0, 0)
    }

    window.addEventListener('popstate', handlePopState)
    // Spread the existing state so we don't clobber Next.js's own routing
    // bookkeeping (__N/key/idx). Overwriting it desyncs the history index and
    // breaks back navigation for the rest of the session (notably the native
    // Android back button, which has no fallback).
    window.history.replaceState({...window.history.state, signupStep: 0}, '')

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    if (auth.currentUser?.uid) setBaseUser(getInitialBaseUser())
  }, [auth.currentUser?.uid])

  const advanceToStep = (nextStep: number) => {
    window.history.pushState({...window.history.state, signupStep: nextStep}, '')
    setStep(nextStep)
    scrollTo(0, 0)
  }

  const handleFinalSubmit = async (finalProfile?: ProfileWithoutUser) => {
    setIsSubmitting(true)
    const referredByUsername = safeLocalStorage
      ? (safeLocalStorage.getItem(CACHED_REFERRAL_USERNAME_KEY) ?? undefined)
      : undefined

    const locale = getLocale()
    const deviceToken = ensureDeviceToken()
    try {
      const profile = removeNullOrUndefinedProps({
        ...(finalProfile ?? profileForm),
        referred_by_username: referredByUsername,
      }) as any
      const {interests, causes, work, ...otherProfileProps} = profile
      const result = await api('create-user-and-profile', {
        username,
        name,
        locale,
        deviceToken,
        profile: otherProfileProps,
        interests,
        causes,
        work,
      })
      if (!result.user) throw new Error('Failed to create user and profile')

      track('complete registration')

      clearOnboardingFlag()

      // Stash the fresh profile data so the next page can use it immediately
      safeLocalStorage?.setItem('freshSignup', JSON.stringify(result))

      // Force onIdTokenChanged to re-fire — your AuthProvider listener
      // will then re-run getUserSafe, find the record, and call onAuthLoad
      await auth.currentUser?.getIdToken(true) // true = force refresh

      router.push(`/${result.user.username}?fromSignup=true`)
    } catch (e) {
      console.error(e)
      toast.error('An error occurred during signup, try again later...')
      setIsSubmitting(false)
    }
  }

  const TOTAL_STEPS = 2

  return (
    <Col className="items-center">
      <Toaster position={'top-center'} containerClassName="!bottom-[70px]" />
      {isSubmitting ? (
        <Col className="flex-1 items-center justify-center py-20">
          <CompassLoadingIndicator />
          {/* Was `text-gray-500`, an off-palette literal that does not flip with the theme. */}
          <div className="mt-4 text-base text-ink-700">
            {t('signup.creating_profile', 'Creating your profile...')}
          </div>
        </Col>
      ) : (
        <Col className={'w-full max-w-4xl px-6 py-4'}>
          <BackButton className="-ml-2 mb-2 self-start" />
          {/* The flow had no progress indicator at all: two substantial form steps that looked alike,
              so the only way to learn there were two was to finish the first. The bar is deliberately
              the same component as /onboarding — those three screens lead directly here, and a reader
              who has just watched a 3-segment bar fill should recognise this as the next one. */}
          <StepProgress
            current={step + 1}
            total={TOTAL_STEPS}
            label={t('common.step_progress', 'Step {current} of {total}', {
              current: step + 1,
              total: TOTAL_STEPS,
            })}
            className="mb-7"
          />
          {step === 0 ? (
            <RequiredProfileUserForm
              data={baseUser}
              setData={setBaseUserState}
              onSubmit={async () => advanceToStep(1)}
            />
          ) : step === 1 ? (
            <Col className={'w-full px-2 sm:px-6 py-4 mb-2 '}>
              <OptionalProfileUserForm
                profile={profileForm}
                setProfile={setProfileState}
                user={baseUser}
                bottomNavBarVisible={false}
                onSubmit={handleFinalSubmit}
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

// Field-group and label classes shared with `optional-profile-form.tsx`.
// `gap-1.5` rather than `gap-2`: the label, its help text and the input are one unit, and at gap-2
// they sat as far apart from each other as consecutive fields did. The vertical rhythm between
// fields comes from the parent `Col`'s `gap-8`, not from here.
export const colClassName = 'items-start gap-1.5 w-full'
export const labelClassName = 'font-semibold text-md text-ink-900'

function getInitialBaseUser() {
  const emailName = auth.currentUser?.email?.replace(/@.*$/, '')
  const name = cleanDisplayName(
    auth.currentUser?.displayName || emailName || 'User' + randomString(4),
  )
  const initialState = {
    id: auth.currentUser?.uid ?? '',
    username: cleanUsername(name),
    name: name,
  }
  return initialState
}
