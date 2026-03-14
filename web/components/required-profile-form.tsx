import clsx from 'clsx'
import {APIError} from 'common/api/utils'
import {debug} from 'common/logger'
import {useState} from 'react'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {Input} from 'web/components/widgets/input'
import {LoadingIndicator} from 'web/components/widgets/loading-indicator'
import {Title} from 'web/components/widgets/title'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'
import {labelClassName} from 'web/pages/signup'

const LAST_STEP = 0

export const initialRequiredState = {
  age: undefined,
  gender: '',
  pref_gender: [],
  pref_age_min: undefined,
  pref_age_max: undefined,
  pref_relation_styles: [],
  wants_kids_strength: -1,
  looking_for_matches: true,
  visibility: 'public',
  city: '',
  pinned_url: '',
  photo_urls: [],
  languages: [],
  bio: null,
}
export type RequiredFormData = {
  name: string
  username: string
}

export const RequiredProfileUserForm = (props: {
  data: RequiredFormData
  setData: <K extends keyof RequiredFormData>(
    key: K,
    value: RequiredFormData[K] | undefined,
  ) => void
  onSubmit?: () => void
  profileCreatedAlready?: boolean
}) => {
  const {onSubmit, profileCreatedAlready, data, setData} = props

  const [step, setStep] = useState<number>(0)
  const [loadingUsername, setLoadingUsername] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorUsername, setErrorUsername] = useState<string | null>(null)
  const [displayNameError, setDisplayNameError] = useState<string | null>(null)
  const t = useT()

  const updateUsername = async () => {
    let success = true
    setLoadingUsername(true)
    try {
      const usernameForErrorMsg = data.username.length
      if (usernameForErrorMsg === 0 || (usernameForErrorMsg > 0 && usernameForErrorMsg < 3)) {
        setErrorUsername('Minimum 3 characters required for usernames')
        success = false
        setLoadingUsername(false)
        return success
      }
      const {
        valid,
        message = undefined,
        suggestedUsername,
      } = await api('validate-username', {username: data.username})
      if (valid) {
        setData('username', suggestedUsername)
      } else {
        setErrorUsername(message || 'Unknown error')
        success = false
      }
    } catch (reason) {
      setErrorUsername((reason as APIError).message)
      success = false
    }
    setLoadingUsername(false)
    debug('Username:', data.username)
    return success
  }

  return (
    <>
      {!profileCreatedAlready && <Title>{t('profile.basics.title', 'The Basics')}</Title>}
      {/*{step === 1 && !profileCreatedAlready && (*/}
      {/*  <div className="text-ink-500 mb-6 text-lg">*/}
      {/*    {t('profile.basics.subtitle', 'Write your own bio, your own way.')}*/}
      {/*  </div>*/}
      {/*)}*/}
      <Col className={'gap-8 pb-[env(safe-area-inset-bottom)] w-fit'}>
        {(step === 0 || profileCreatedAlready) && (
          <Col>
            <label className={clsx(labelClassName)}>
              {t('profile.basics.display_name', 'Display name')}
            </label>
            <Row className={'items-center gap-2'}>
              <Input
                disabled={false}
                type="text"
                minLength={3}
                placeholder="Display name"
                value={data.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value || ''
                  if (value.length === 0 || (value.length > 0 && value.length < 3)) {
                    setDisplayNameError('Minimum 3 characters for display names')
                  } else {
                    setDisplayNameError(null)
                  }
                  setData('name', value)
                }}
              />
            </Row>
            {displayNameError && <p className="text-error text-sm mt-1">{displayNameError}</p>}
          </Col>
        )}

        {!profileCreatedAlready && (
          <>
            {step === 0 && (
              <Col>
                <label className={clsx(labelClassName)}>
                  {t('profile.basics.username', 'Username')}
                </label>
                <Row className={'items-center gap-2'}>
                  <Input
                    disabled={loadingUsername}
                    type="text"
                    placeholder="Username"
                    value={data.username || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value || ''
                      if (value.length === 0 || (value.length > 0 && value.length < 3)) {
                        setErrorUsername('Minimum 3 characters required for usernames')
                      } else {
                        setErrorUsername(null)
                      }
                      setData('username', value)
                    }}
                  />
                  {loadingUsername && <LoadingIndicator className={'ml-2'} />}
                </Row>
                {
                  <span className="guidance text-sm py-4">
                    {t(
                      'profile.required.username_letters_only',
                      'Only letters and numbers are allowed for the username.',
                    )}
                  </span>
                }
                {errorUsername && <span className="text-error text-sm">{errorUsername}</span>}
              </Col>
            )}

            {/*{step === 1 && (*/}
            {/*  <Col>*/}
            {/*    <label className={clsx(labelClassName)}>{t('profile.basics.bio', 'Bio')}</label>*/}
            {/*    <SignupBio*/}
            {/*      profile={profile}*/}
            {/*      onChange={(e: Editor) => {*/}
            {/*        console.debug('bio changed', e, profile.bio)*/}
            {/*        setProfile('bio', e.getJSON())*/}
            {/*        setProfile('bio_length', e.getText().length)*/}
            {/*      }}*/}
            {/*    />*/}
            {/*  </Col>*/}
            {/*)}*/}
          </>
        )}

        {onSubmit && (
          <Row className={'justify-end'}>
            <Button
              disabled={isSubmitting}
              loading={isSubmitting}
              onClick={async () => {
                setIsSubmitting(true)
                let success = true
                if (step === 0) {
                  success = await updateUsername()
                }
                if (success) {
                  if (step === LAST_STEP) {
                    onSubmit()
                  } else {
                    setStep(step + 1)
                  }
                }
                setIsSubmitting(false)
              }}
            >
              {t('common.next', 'Next')}
            </Button>
          </Row>
        )}
      </Col>
    </>
  )
}
