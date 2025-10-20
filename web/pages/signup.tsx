import {useEffect, useRef, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {initialRequiredState, RequiredProfileUserForm,} from 'web/components/required-profile-form'
import {OptionalProfileUserForm} from 'web/components/optional-profile-form'
import {useUser} from 'web/hooks/use-user'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {CACHED_REFERRAL_USERNAME_KEY,} from 'web/lib/firebase/users'
import {api} from 'web/lib/api'
import {useRouter} from 'next/router'
import {useTracking} from 'web/hooks/use-tracking'
import {track} from 'web/lib/service/analytics'
import {safeLocalStorage} from 'web/lib/util/local'
import {removeNullOrUndefinedProps} from 'common/util/object'
import {useProfileByUserId} from 'web/hooks/use-profile'
import {ProfileRow} from 'common/profiles/profile'
import {PageBase} from "web/components/page-base";

export default function SignupPage() {
  const [step, setStep] = useState(0)
  const user = useUser()
  console.debug('user:', user)
  const router = useRouter()
  useTracking('viewsignup page')

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
    return () => {
      // no-op
    }
  }, [user, holdLoading])

  // Omit the id, created_time?
  const [profileForm, setProfileForm] = useState<ProfileRow>({
    ...initialRequiredState,
  } as any)
  const setProfileState = (key: keyof ProfileRow, value: any) => {
    setProfileForm((prevState) => ({...prevState, [key]: value}))
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const existingProfile = useProfileByUserId(user?.id)
  useEffect(() => {
    if (existingProfile) {
      setProfileForm(existingProfile)
      setStep(1)
    }
  }, [existingProfile])

  if (step === 1 && user) {
    return <PageBase trackPageView={'register'}>
      <Col className={'w-full px-6 py-4'}>
        <OptionalProfileUserForm
          setProfile={setProfileState}
          profile={profileForm}
          user={user}
          fromSignup
        />
      </Col>
    </PageBase>
  }

  if (user === null && !holdLoading) {
    console.log('user === null && !holdLoading')
    return <CompassLoadingIndicator/>
  }

  return (
    <Col className="items-center">
      {!user ? (
        <CompassLoadingIndicator/>
      ) : (
        <Col className={'w-full max-w-2xl px-6 py-4'}>
          {step === 0 ? (
            <RequiredProfileUserForm
              user={user}
              setProfile={setProfileState}
              profile={profileForm}
              isSubmitting={isSubmitting}
              onSubmit={async () => {
                if (!profileForm.looking_for_matches) {
                  router.push('/')
                  return
                }
                const referredByUsername = safeLocalStorage
                  ? safeLocalStorage.getItem(CACHED_REFERRAL_USERNAME_KEY) ??
                  undefined
                  : undefined

                setIsSubmitting(true)
                console.debug('profileForm', profileForm)
                const profile = await api(
                  'create-profile',
                  removeNullOrUndefinedProps({
                    ...profileForm,
                    referred_by_username: referredByUsername,
                  }) as any
                ).catch((e: unknown) => {
                  console.error(e)
                  return null
                })
                setIsSubmitting(false)
                if (profile) {
                  setProfileForm(profile)
                  setStep(1)
                  scrollTo(0, 0)
                  track('submitrequired profile')
                }
              }}
            />
          ) : step === 1 ? (
            <CompassLoadingIndicator/>
          ) : (
            <CompassLoadingIndicator/>
          )}
        </Col>
      )}
    </Col>
  )
}
export const colClassName = 'items-start gap-2'
export const labelClassName = 'font-semibold text-lg'
