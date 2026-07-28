import clsx from 'clsx'
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
import {ProfileFormNav, ProfileFormSectionBar} from 'web/components/profile-form-nav'
import {initialRequiredState, RequiredProfileUserForm} from 'web/components/required-profile-form'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {StepProgress} from 'web/components/widgets/step-progress'
import {surface} from 'web/components/widgets/surface'
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
        // Width is set per step rather than on the shared column. Step 1 is the eighteen-section form
        // plus its index, and inside a 4xl column the index left it about 550px wide — narrower than
        // the same form gets on /profile, with the page's whole right half empty.
        <Col className={'w-full px-6 py-4'}>
          <div className="mx-auto w-full max-w-4xl">
            {/* No negative margin: the chevron lines up with the column's left edge, like every
                other thing on the page. Pulled out by 2 it hung into the page gutter. */}
            <BackButton className="mb-2 self-start" />
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
              // Step 2 puts the section bar directly under this. `mb-7` plus the form row's own top
              // padding left 44px of empty page between the two, which read as the bar belonging to
              // the form below rather than to the header above it.
              className={step === 1 ? 'mb-4' : 'mb-7'}
            />
          </div>
          {step === 0 ? (
            // Card + centered, matching the /onboarding screens that lead directly here — two short
            // fields floating left in a wide column read as unfinished, not deliberate.
            <div className={clsx(surface, 'mx-auto w-full max-w-md p-6 sm:p-10')}>
              <RequiredProfileUserForm
                data={baseUser}
                setData={setBaseUserState}
                onSubmit={async () => advanceToStep(1)}
              />
            </div>
          ) : step === 1 ? (
            // Same index as /profile: this is the same eighteen-section form, and it is longer here
            // because nothing is filled in yet. Hidden below `xl`, where there is no gutter to put it
            // in without pushing a list of links above the first field.
            <div className={'mx-auto mb-2 flex w-full max-w-6xl gap-10 pb-4'}>
              <ProfileFormNav className="sticky top-8 hidden h-fit w-52 shrink-0 xl:flex" />
              <Col className={'w-full min-w-0 max-w-3xl'}>
                <ProfileFormSectionBar className="mb-4 xl:hidden" />
                <OptionalProfileUserForm
                  profile={profileForm}
                  setProfile={setProfileState}
                  user={baseUser}
                  bottomNavBarVisible={false}
                  onSubmit={handleFinalSubmit}
                />
              </Col>
            </div>
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
// Quiet, not bold. A form label names the field; the input is the thing with content in it, and
// `font-semibold text-ink-900` gave the two equal weight down a fifty-field page.
export const labelClassName = 'text-ink-500 text-sm font-normal'

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
