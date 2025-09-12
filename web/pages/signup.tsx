import {useEffect, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {initialRequiredState, RequiredLoveUserForm,} from 'web/components/required-lover-form'
import {OptionalLoveUserForm} from 'web/components/optional-lover-form'
import {useUser} from 'web/hooks/use-user'
import {LoadingIndicator} from 'web/components/widgets/loading-indicator'
import {CACHED_REFERRAL_USERNAME_KEY,} from 'web/lib/firebase/users'
import {api} from 'web/lib/api'
import Router, {useRouter} from 'next/router'
import SiteLogo from 'web/components/site-logo'
import {useTracking} from 'web/hooks/use-tracking'
import {track} from 'web/lib/service/analytics'
import {safeLocalStorage} from 'web/lib/util/local'
import {removeUndefinedProps} from 'common/util/object'
import {useLoverByUserId} from 'web/hooks/use-lover'
import {LoverRow} from 'common/love/lover'
import {LovePage} from "web/components/love-page";
import {Button} from "web/components/buttons/button";

export default function SignupPage() {
  const [step, setStep] = useState(0)
  const user = useUser()
  console.log('user:', user)
  const router = useRouter()
  useTracking('view love signup page')

  // Omit the id, created_time?
  const [loverForm, setLoverForm] = useState<LoverRow>({
    ...initialRequiredState,
  } as any)
  const setLoverState = (key: keyof LoverRow, value: any) => {
    setLoverForm((prevState) => ({...prevState, [key]: value}))
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const existingLover = useLoverByUserId(user?.id)
  useEffect(() => {
    if (existingLover) {
      setLoverForm(existingLover)
      setStep(1)
    }
  }, [existingLover])

  if (step === 1 && user) {
    return <LovePage trackPageView={'register'}>
      <Col className={'w-full px-6 py-4'}>
        <OptionalLoveUserForm
          setLover={setLoverState}
          lover={loverForm}
          user={user}
          fromSignup
        />
      </Col>
    </LovePage>
  }

  return (
    <Col className="items-center">
      {user === undefined ? (
        <div/>
      ) : user === null ? (
        <Col className={'items-center justify-around gap-4 pt-[20vh]'}>
          <SiteLogo/>
          <Button
            color={'gray-outline'}
            size={'2xl'}
            className={''}
            onClick={() => {
              Router.push('register')
            }}>
            Sign up
          </Button>
        </Col>
      ) : (
        <Col className={'w-full max-w-2xl px-6 py-4'}>
          {step === 0 ? (
            <RequiredLoveUserForm
              user={user}
              setLover={setLoverState}
              lover={loverForm}
              isSubmitting={isSubmitting}
              onSubmit={async () => {
                if (!loverForm.looking_for_matches) {
                  router.push('/')
                  return
                }
                const referredByUsername = safeLocalStorage
                  ? safeLocalStorage.getItem(CACHED_REFERRAL_USERNAME_KEY) ??
                  undefined
                  : undefined

                setIsSubmitting(true)
                console.log('loverForm', loverForm)
                const lover = await api(
                  'create-lover',
                  removeUndefinedProps({
                    ...loverForm,
                    referred_by_username: referredByUsername,
                  }) as any
                ).catch((e: unknown) => {
                  console.error(e)
                  return null
                })
                setIsSubmitting(false)
                if (lover) {
                  setLoverForm(lover)
                  setStep(1)
                  scrollTo(0, 0)
                  track('submit love required profile')
                }
              }}
            />
          ) : step === 1 ? (
            <></>
          ) : (
            <LoadingIndicator/>
          )}
        </Col>
      )}
    </Col>
  )
}
export const colClassName = 'items-start gap-2'
export const labelClassName = 'font-semibold text-lg'
