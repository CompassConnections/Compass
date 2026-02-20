import {PlusIcon, XIcon} from '@heroicons/react/solid'
import {Editor} from '@tiptap/core'
import clsx from 'clsx'
import {
  DIET_CHOICES,
  EDUCATION_CHOICES,
  GENDERS,
  LANGUAGE_CHOICES,
  MBTI_CHOICES,
  POLITICAL_CHOICES,
  RACE_CHOICES,
  RELATIONSHIP_CHOICES,
  RELATIONSHIP_STATUS_CHOICES,
  RELIGION_CHOICES,
  ROMANTIC_CHOICES,
} from 'common/choices'
import {MultipleChoiceOptions} from 'common/profiles/multiple-choice'
import {getProfileRow, ProfileWithoutUser} from 'common/profiles/profile'
import {PLATFORM_LABELS, type Site, SITE_ORDER} from 'common/socials'
import {User} from 'common/user'
import {removeUndefinedProps} from 'common/util/object'
import {sleep} from 'common/util/time'
import {tryCatch} from 'common/util/try-catch'
import {isEqual, range} from 'lodash'
import {useRouter} from 'next/router'
import {Fragment, useEffect, useRef, useState} from 'react'
import toast from 'react-hot-toast'
import {AddOptionEntry} from 'web/components/add-option-entry'
import {SignupBio} from 'web/components/bio/editable-bio'
import {Button, IconButton} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import {City, CityRow, profileToCity, useCitySearch} from 'web/components/search-location'
import {Carousel} from 'web/components/widgets/carousel'
import {ChoicesToggleGroup} from 'web/components/widgets/choices-toggle-group'
import {Input} from 'web/components/widgets/input'
import {PlatformSelect} from 'web/components/widgets/platform-select'
import {RadioToggleGroup} from 'web/components/widgets/radio-toggle-group'
import {Select} from 'web/components/widgets/select'
import {Slider} from 'web/components/widgets/slider'
import {Title} from 'web/components/widgets/title'
import {fetchChoices} from 'web/hooks/use-choices'
import {useProfileDraft} from 'web/hooks/use-profile-draft'
import {api, updateProfile, updateUser} from 'web/lib/api'
import {useLocale, useT} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'
import {db} from 'web/lib/supabase/db'
import {colClassName, labelClassName} from 'web/pages/signup'

import {SocialIcon} from './user/social'
import {AddPhotosWidget} from './widgets/add-photos'

export const OptionalProfileUserForm = (props: {
  profile: ProfileWithoutUser
  setProfile: <K extends keyof ProfileWithoutUser>(key: K, value: ProfileWithoutUser[K]) => void
  user: User
  buttonLabel?: string
  bottomNavBarVisible?: boolean
  fromSignup?: boolean
  onSubmit?: () => Promise<void>
}) => {
  const {
    profile,
    user,
    buttonLabel,
    setProfile,
    fromSignup,
    onSubmit,
    bottomNavBarVisible = true,
  } = props

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lookingRelationship, setLookingRelationship] = useState(
    (profile.pref_relation_styles || []).includes('relationship'),
  )
  const [ageError, setAgeError] = useState<string | null>(null)
  const router = useRouter()
  const t = useT()
  const [heightFeet, setHeightFeet] = useState<number | undefined>(
    profile.height_in_inches ? Math.floor((profile['height_in_inches'] ?? 0) / 12) : undefined,
  )
  const [heightInches, setHeightInches] = useState<number | undefined>(
    profile.height_in_inches ? Math.floor((profile['height_in_inches'] ?? 0) % 12) : undefined,
  )

  // Keep local feet/inches inputs in sync when profile.height_in_inches updates
  // This covers cases like hydration from localStorage where setProfile is called externally
  const updateHeight = (h: any) => {
    if (h == null || Number.isNaN(h as any)) {
      setHeightFeet(undefined)
      setHeightInches(undefined)
      return
    }
    setHeightFeet(Math.floor(h / 12))
    setHeightInches(Math.round(h % 12))
  }

  const [newLinks, setNewLinks] = useState<Record<string, string | null>>(user.link)

  const [newLinkPlatform, setNewLinkPlatform] = useState('')
  const [newLinkValue, setNewLinkValue] = useState('')
  const [interestChoices, setInterestChoices] = useState({})
  const [causeChoices, setCauseChoices] = useState({})
  const [workChoices, setWorkChoices] = useState({})
  const {locale} = useLocale()

  const {clearProfileDraft} = useProfileDraft(user.id, profile, setProfile, updateHeight)

  useEffect(() => {
    fetchChoices('interests', locale).then(setInterestChoices)
    fetchChoices('causes', locale).then(setCauseChoices)
    fetchChoices('work', locale).then(setWorkChoices)
  }, [db])

  const errorToast = () => {
    toast.error(t('profile.optional.error.invalid_fields', 'Some fields are incorrect...'))
  }

  const handleSubmit = async () => {
    // Validate age before submitting
    if (profile['age'] !== null && profile['age'] !== undefined) {
      if (profile['age'] < 18) {
        setAgeError(t('profile.optional.age.error_min', 'You must be at least 18 years old'))
        setIsSubmitting(false)
        errorToast()
        return
      }
      if (profile['age'] > 100) {
        setAgeError(t('profile.optional.age.error_max', 'Please enter a valid age'))
        setIsSubmitting(false)
        errorToast()
        return
      }
    }

    setIsSubmitting(true)
    const {
      // bio: _bio,
      // bio_text: _bio_text,
      // bio_tsv: _bio_tsv,
      // bio_length: _bio_length,
      interests,
      causes,
      work,
      ...otherProfileProps
    } = profile
    console.debug('otherProfileProps', removeUndefinedProps(otherProfileProps))
    const promises: Promise<any>[] = [
      tryCatch(updateProfile(removeUndefinedProps(otherProfileProps) as any)),
    ]
    if (interests) {
      promises.push(api('update-options', {table: 'interests', values: interests}))
    }
    if (causes) {
      promises.push(api('update-options', {table: 'causes', values: causes}))
    }
    if (work) {
      promises.push(api('update-options', {table: 'work', values: work}))
    }
    try {
      await Promise.all(promises)
      // Clear profile draft from Zustand store after successful submission
      clearProfileDraft(user.id)
    } catch (error) {
      console.error(error)
      toast.error(
        `We ran into an issue saving your profile. Please try again or contact us if the issue persists.`,
      )
      setIsSubmitting(false)
      return
    }
    if (!isEqual(newLinks, user.link)) {
      const {error} = await tryCatch(updateUser({link: newLinks}))
      if (error) {
        console.error(error)
        return
      }
    }
    if (onSubmit) {
      await onSubmit()
    }
    track('submit optional profile')
    if (user) {
      let profile
      let i = 1
      const start = Date.now()
      while (Date.now() - start < 10000) {
        profile = await getProfileRow(user.id, db)
        if (profile) {
          console.log(`Found profile after ${Date.now() - start} ms, ${i} attempts`)
          break
        }
        await sleep(500)
        i++
      }
      if (profile) {
        await sleep(5000) // attempt to mitigate profile not found at /${username} upon creation
        router.push(`/${user.username}${fromSignup ? '?fromSignup=true' : ''}`)
      } else {
        console.log('Profile not found after fetching, going back home...')
        router.push('/')
      }
    } else router.push('/')
    setIsSubmitting(false)
  }

  const updateUserLink = (platform: string, value: string | null) => {
    setNewLinks((links) => ({...links, [platform]: value}))
  }

  const addNewLink = () => {
    if (newLinkPlatform && newLinkValue) {
      updateUserLink(newLinkPlatform.toLowerCase().trim(), newLinkValue.trim())
      setNewLinkPlatform('')
      setNewLinkValue('')
    }
  }

  function setProfileCity(inputCity: City | undefined) {
    if (!inputCity) {
      setProfile('geodb_city_id', null)
      setProfile('city', '')
      setProfile('region_code', null)
      setProfile('country', null)
      setProfile('city_latitude', null)
      setProfile('city_longitude', null)
    } else {
      const {
        geodb_city_id,
        city,
        region_code,
        country,
        latitude: city_latitude,
        longitude: city_longitude,
      } = inputCity
      setProfile('geodb_city_id', geodb_city_id)
      setProfile('city', city)
      setProfile('region_code', region_code)
      setProfile('country', country)
      setProfile('city_latitude', city_latitude)
      setProfile('city_longitude', city_longitude)
    }
  }

  return (
    <>
      {/*<Row className={'justify-end'}>*/}
      {/*  <Button*/}
      {/*    disabled={isSubmitting}*/}
      {/*    loading={isSubmitting}*/}
      {/*    onClick={handleSubmit}*/}
      {/*  >*/}
      {/*    {buttonLabel ?? t('common.next', 'Next')} / {t('common.skip', 'Skip')}*/}
      {/*  </Button>*/}
      {/*</Row>*/}

      <Title>{t('profile.optional.subtitle', 'Optional information')}</Title>

      <Col className={'gap-8'}>
        {!fromSignup && (
          <>
            <Category title={t('profile.basics.bio', 'Bio')} className={'mt-0'} />
            <SignupBio
              profile={profile}
              onChange={(e: Editor) => {
                console.debug('bio changed', e, profile.bio)
                setProfile('bio', e.getJSON())
                setProfile('bio_length', e.getText().length)
              }}
            />
          </>
        )}

        <Category
          title={t('profile.optional.category.personal_info', 'Personal Information')}
          className={'mt-0'}
        />

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.location', 'Location')}
          </label>
          {profile.city ? (
            <Row className="border-primary-500 w-full justify-between rounded border px-4 py-2">
              <CityRow
                city={profileToCity(profile)}
                onSelect={() => {}}
                className="pointer-events-none"
              />
              <button
                className="text-ink-700 hover:text-primary-700 text-sm underline"
                onClick={() => {
                  setProfileCity(undefined)
                }}
              >
                {t('common.change', 'Change')}
              </button>
            </Row>
          ) : (
            <CitySearchBox
              onCitySelected={(city: City | undefined) => {
                setProfileCity(city)
              }}
            />
          )}
        </Col>

        <Row className={'items-center gap-2'}>
          <Col className={'gap-1'}>
            <label className={clsx(labelClassName)}>{t('profile.optional.gender', 'Gender')}</label>
            <ChoicesToggleGroup
              currentChoice={profile['gender']}
              choicesMap={Object.fromEntries(
                Object.entries(GENDERS).map(([k, v]) => [t(`profile.gender.${v}`, k), v]),
              )}
              setChoice={(c) => setProfile('gender', c)}
            />
          </Col>
        </Row>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>{t('profile.optional.age', 'Age')}</label>
          <Input
            type="number"
            placeholder={t('profile.optional.age', 'Age')}
            value={profile['age'] ?? undefined}
            min={18}
            max={100}
            error={!!ageError}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : null
              if (value !== null && value < 18) {
                setAgeError(
                  t('profile.optional.age.error_min', 'You must be at least 18 years old'),
                )
              } else if (value !== null && value > 100) {
                setAgeError(t('profile.optional.age.error_max', 'Please enter a valid age'))
              } else {
                setAgeError(null)
              }
              setProfile('age', value)
            }}
          />
          {ageError && <p className="text-error text-sm mt-1">{ageError}</p>}
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>{t('profile.optional.height', 'Height')}</label>
          <Row className={'gap-2'}>
            <Col>
              <span>{t('profile.optional.feet', 'Feet')}</span>
              <Input
                type="number"
                data-testid="height-feet"
                onChange={(e) => {
                  if (e.target.value === '') {
                    setHeightFeet(undefined)
                  } else {
                    setHeightFeet(Number(e.target.value))
                    const heightInInches = Number(e.target.value) * 12 + (heightInches ?? 0)
                    setProfile('height_in_inches', heightInInches)
                  }
                }}
                className={'w-16'}
                value={typeof heightFeet === 'number' ? Math.floor(heightFeet) : ''}
                min={0}
              />
            </Col>
            <Col>
              <span>{t('profile.optional.inches', 'Inches')}</span>
              <Input
                type="number"
                data-testid="height-inches"
                onChange={(e) => {
                  if (e.target.value === '') {
                    setHeightInches(undefined)
                  } else {
                    setHeightInches(Number(e.target.value))
                    const heightInInches = Number(e.target.value) + 12 * (heightFeet ?? 0)
                    setProfile('height_in_inches', heightInInches)
                  }
                }}
                className={'w-16'}
                value={typeof heightInches === 'number' ? Math.floor(heightInches) : ''}
                min={0}
              />
            </Col>
            <div className="self-end mb-2 text-ink-700 mx-2">
              {t('common.or', 'OR').toUpperCase()}
            </div>
            <Col>
              <span>{t('profile.optional.centimeters', 'Centimeters')}</span>
              <Input
                type="number"
                data-testid="height-centimeters"
                onChange={(e) => {
                  if (e.target.value === '') {
                    setHeightFeet(undefined)
                    setHeightInches(undefined)
                    setProfile('height_in_inches', null)
                  } else {
                    // Convert cm to inches
                    const totalInches = Number(e.target.value) / 2.54
                    setHeightFeet(Math.floor(totalInches / 12))
                    setHeightInches(totalInches % 12)
                    setProfile('height_in_inches', totalInches)
                  }
                }}
                className={'w-20'}
                value={
                  heightFeet !== undefined && profile['height_in_inches']
                    ? Math.round(profile['height_in_inches'] * 2.54)
                    : ''
                }
                min={0}
              />
            </Col>
          </Row>
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.ethnicity', 'Ethnicity/origin')}
          </label>
          <MultiCheckbox
            choices={RACE_CHOICES}
            translationPrefix={'profile.race'}
            selected={profile['ethnicity'] ?? []}
            onChange={(selected) => setProfile('ethnicity', selected)}
          />
        </Col>

        <Category title={t('profile.optional.category.interested_in', "Who I'm looking for")} />

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.interested_in', 'Interested in connecting with')}
          </label>
          <MultiCheckbox
            choices={{
              Women: 'female',
              Men: 'male',
              Other: 'other',
            }}
            translationPrefix={'profile.gender.plural'}
            selected={profile['pref_gender'] || []}
            onChange={(selected) => setProfile('pref_gender', selected)}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.age_range', 'Who are aged between')}
          </label>
          <Row className={'gap-2'}>
            <Col>
              <span>{t('common.min', 'Min')}</span>
              <Select
                data-testid="pref-age-min"
                value={profile['pref_age_min'] ?? ''}
                onChange={(e) => {
                  const newMin = e.target.value ? Number(e.target.value) : 18
                  const currentMax = profile['pref_age_max'] ?? 100
                  setProfile('pref_age_min', Math.min(newMin, currentMax))
                }}
                className={'w-18 border-ink-300 rounded-md'}
              >
                <option key={''} value={''}></option>
                {range(18, (profile['pref_age_max'] ?? 100) + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Col>
            <Col>
              <span>{t('common.max', 'Max')}</span>
              <Select
                data-testid="pref-age-max"
                value={profile['pref_age_max'] ?? ''}
                onChange={(e) => {
                  const newMax = e.target.value ? Number(e.target.value) : 100
                  const currentMin = profile['pref_age_min'] ?? 18
                  setProfile('pref_age_max', Math.max(newMax, currentMin))
                }}
                className={'w-18 border-ink-300 rounded-md'}
              >
                <option key={''} value={''}></option>
                {range(profile['pref_age_min'] ?? 18, 100).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Col>
          </Row>
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.connection_type', 'Connection type')}
          </label>
          <MultiCheckbox
            choices={RELATIONSHIP_CHOICES}
            selected={profile['pref_relation_styles'] || []}
            translationPrefix={'profile.relationship'}
            onChange={(selected) => {
              setProfile('pref_relation_styles', selected)
              setLookingRelationship((selected || []).includes('relationship'))
            }}
          />
        </Col>

        <Category title={t('profile.optional.category.relationships', 'Relationships')} />

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.relationship_status', 'Relationship status')}
          </label>
          <MultiCheckbox
            choices={RELATIONSHIP_STATUS_CHOICES}
            translationPrefix={'profile.relationship_status'}
            selected={profile['relationship_status'] ?? []}
            onChange={(selected) => setProfile('relationship_status', selected)}
          />
        </Col>

        {lookingRelationship && (
          <>
            <Col className={clsx(colClassName)}>
              <label className={clsx(labelClassName)}>
                {t('profile.optional.relationship_style', 'Relationship style')}
              </label>
              <MultiCheckbox
                choices={ROMANTIC_CHOICES}
                translationPrefix={'profile.romantic'}
                selected={profile['pref_romantic_styles'] || []}
                onChange={(selected) => {
                  setProfile('pref_romantic_styles', selected)
                }}
              />
            </Col>

            <Category title={t('profile.optional.category.family', 'Family')} />

            <Col className={clsx(colClassName)}>
              <label className={clsx(labelClassName)}>
                {t('profile.optional.num_kids', 'Current number of kids')}
              </label>
              <Input
                data-testid="current-number-of-kids"
                type="number"
                onChange={(e) => {
                  const value = e.target.value === '' ? null : Number(e.target.value)
                  setProfile('has_kids', value)
                }}
                className={'w-20'}
                min={0}
                value={profile['has_kids'] ?? undefined}
              />
            </Col>

            <Col className={clsx(colClassName)}>
              <label className={clsx(labelClassName)}>
                {t('profile.optional.want_kids', 'I would like to have kids')}
              </label>
              <RadioToggleGroup
                className={'w-44'}
                choicesMap={Object.fromEntries(
                  Object.entries(MultipleChoiceOptions).map(([k, v]) => [
                    t(`profile.wants_kids_${v}`, k),
                    v,
                  ]),
                )}
                setChoice={(choice) => {
                  setProfile('wants_kids_strength', choice)
                }}
                currentChoice={profile.wants_kids_strength ?? -1}
              />
            </Col>
          </>
        )}

        <Category title={t('profile.optional.interests', 'Interests')} />
        <AddOptionEntry
          // title={t('profile.optional.interests', 'Interests')}
          choices={interestChoices}
          setChoices={setInterestChoices}
          profile={profile}
          setProfile={setProfile}
          label={'interests'}
        />

        <Category title={t('profile.optional.category.morality', 'Morality')} />
        <AddOptionEntry
          title={t('profile.optional.causes', 'Causes')}
          choices={causeChoices}
          setChoices={setCauseChoices}
          profile={profile}
          setProfile={setProfile}
          label={'causes'}
        />

        <Category title={t('profile.optional.category.education', 'Education')} />

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.education_level', 'Highest completed education level')}
          </label>
          <Carousel className="max-w-full">
            <ChoicesToggleGroup
              currentChoice={profile['education_level'] ?? ''}
              choicesMap={Object.fromEntries(
                Object.entries(EDUCATION_CHOICES).map(([k, v]) => [
                  t(`profile.education.${v}`, k),
                  v,
                ]),
              )}
              setChoice={(c) => setProfile('education_level', c)}
            />
          </Carousel>
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.university', 'University')}
          </label>
          <Input
            data-testid="university"
            type="text"
            onChange={(e) => setProfile('university', e.target.value)}
            className={'w-52'}
            value={profile['university'] ?? undefined}
          />
        </Col>

        <Category title={t('profile.optional.category.work', 'Work')} />

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {profile['company']
              ? t('profile.optional.job_title_at_company', 'Job title at {company}', {
                  company: profile['company'],
                })
              : t('profile.optional.job_title', 'Job title')}
          </label>
          <Input
            data-testid="job-title"
            type="text"
            onChange={(e) => setProfile('occupation_title', e.target.value)}
            className={'w-52'}
            value={profile['occupation_title'] ?? undefined}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>{t('profile.optional.company', 'Company')}</label>
          <Input
            data-testid="company"
            type="text"
            onChange={(e) => setProfile('company', e.target.value)}
            className={'w-52'}
            value={profile['company'] ?? undefined}
          />
        </Col>

        <AddOptionEntry
          title={t('profile.optional.work', 'Work Area')}
          choices={workChoices}
          setChoices={setWorkChoices}
          profile={profile}
          setProfile={setProfile}
          label={'work'}
        />

        <Category title={t('profile.optional.political_beliefs', 'Political beliefs')} />

        <Col className={clsx(colClassName)}>
          {/*<label className={clsx(labelClassName)}>*/}
          {/*  {t('profile.optional.political_beliefs', 'Political beliefs')}*/}
          {/*</label>*/}
          <MultiCheckbox
            choices={POLITICAL_CHOICES}
            selected={profile['political_beliefs'] ?? []}
            translationPrefix={'profile.political'}
            onChange={(selected) => setProfile('political_beliefs', selected)}
          />
          <p>{t('profile.optional.details', 'Details')}</p>
          <Input
            data-testid="political-belief-details"
            type="text"
            onChange={(e) => setProfile('political_details', e.target.value)}
            className={'w-full sm:w-96'}
            value={profile['political_details'] ?? undefined}
          />
        </Col>

        <Category title={t('profile.optional.religious_beliefs', 'Religious beliefs')} />

        <Col className={clsx(colClassName)}>
          {/*<label className={clsx(labelClassName)}>*/}
          {/*  {t('profile.optional.religious_beliefs', 'Religious beliefs')}*/}
          {/*</label>*/}
          <MultiCheckbox
            choices={RELIGION_CHOICES}
            selected={profile['religion'] ?? []}
            translationPrefix={'profile.religion'}
            onChange={(selected) => setProfile('religion', selected)}
          />
          <p>{t('profile.optional.details', 'Details')}</p>
          <Input
            data-testid="religious-belief-details"
            type="text"
            onChange={(e) => setProfile('religious_beliefs', e.target.value)}
            className={'w-full sm:w-96'}
            value={profile['religious_beliefs'] ?? undefined}
          />
        </Col>

        <Category title={t('profile.optional.category.psychology', 'Psychology')} />
        <Col className={clsx(colClassName, 'max-w-[550px]')}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.mbti', 'MBTI Personality Type')}
          </label>
          <ChoicesToggleGroup
            currentChoice={profile['mbti'] ?? ''}
            choicesMap={MBTI_CHOICES}
            setChoice={(c) => setProfile('mbti', c)}
            className="grid grid-cols-4 xs:grid-cols-8"
          />
        </Col>

        {/* Big Five personality traits (0–100) */}
        <Col className={clsx(colClassName, 'max-w-[550px]')}>
          <label className={clsx(labelClassName)}>
            {t('profile.big5', 'Big Five Personality Traits')}
          </label>
          <div className="space-y-4">
            <Big5Slider
              label={t('profile.big5_openness', 'Openness')}
              value={profile.big5_openness ?? 50}
              onChange={(v) => setProfile('big5_openness', v)}
            />
            <Big5Slider
              label={t('profile.big5_conscientiousness', 'Conscientiousness')}
              value={profile.big5_conscientiousness ?? 50}
              onChange={(v) => setProfile('big5_conscientiousness', v)}
            />
            <Big5Slider
              label={t('profile.big5_extraversion', 'Extraversion')}
              value={profile.big5_extraversion ?? 50}
              onChange={(v) => setProfile('big5_extraversion', v)}
            />
            <Big5Slider
              label={t('profile.big5_agreeableness', 'Agreeableness')}
              value={profile.big5_agreeableness ?? 50}
              onChange={(v) => setProfile('big5_agreeableness', v)}
            />
            <Big5Slider
              label={t('profile.big5_neuroticism', 'Neuroticism')}
              value={profile.big5_neuroticism ?? 50}
              onChange={(v) => setProfile('big5_neuroticism', v)}
            />
            <p className="text-sm text-ink-500">
              {t(
                'profile.big5_hint',
                'Drag each slider to set where you see yourself on these traits (0 = low, 100 = high).',
              )}
            </p>
          </div>
        </Col>

        <Category title={t('profile.optional.diet', 'Diet')} />

        <Col className={clsx(colClassName)}>
          {/*<label className={clsx(labelClassName)}>*/}
          {/*  {t('profile.optional.diet', 'Diet')}*/}
          {/*</label>*/}
          <MultiCheckbox
            choices={DIET_CHOICES}
            selected={profile['diet'] ?? []}
            translationPrefix={'profile.diet'}
            onChange={(selected) => setProfile('diet', selected)}
          />
        </Col>

        <Category title={t('profile.optional.category.substances', 'Substances')} />

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.smoke', 'Do you smoke?')}
          </label>
          <ChoicesToggleGroup
            currentChoice={profile['is_smoker'] ?? undefined}
            choicesMap={Object.fromEntries(
              Object.entries({
                Yes: true,
                No: false,
              }).map(([k, v]) => [t(`common.${k.toLowerCase()}`, k), v]),
            )}
            setChoice={(c) => setProfile('is_smoker', c)}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.drinks_per_month', 'Alcoholic beverages consumed per month')}
          </label>
          <Input
            data-testid="alcohol-consumed-per-month"
            type="number"
            onChange={(e) => {
              const value = e.target.value === '' ? null : Number(e.target.value)
              setProfile('drinks_per_month', value)
            }}
            className={'w-20'}
            min={0}
            value={profile['drinks_per_month'] ?? undefined}
          />
        </Col>

        <Category title={t('profile.optional.languages', 'Languages')} />

        <Col className={clsx(colClassName)}>
          {/*<label className={clsx(labelClassName)}>*/}
          {/*  {t('profile.optional.languages', 'Languages')}*/}
          {/*</label>*/}
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="col-span-full max-h-60 overflow-y-auto w-full">
                <MultiCheckbox
                  choices={LANGUAGE_CHOICES}
                  selected={profile.languages || []}
                  translationPrefix={'profile.language'}
                  onChange={(selected) => setProfile('languages', selected)}
                />
              </div>
            </div>
          </div>
        </Col>

        {/* <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Birthplace</label>
          <Input
            type="text"
            onChange={(e) => setProfileState('born_in_location', e.target.value)}
            className={'w-52'}
            value={profile['born_in_location'] ?? undefined}
          />
        </Col> */}

        {/*<Col className={clsx(colClassName)}>*/}
        {/*  <label className={clsx(labelClassName)}>Looking for a relationship?</label>*/}
        {/*  <ChoicesToggleGroup*/}
        {/*    currentChoice={lookingRelationship}*/}
        {/*    choicesMap={{Yes: true, No: false}}*/}
        {/*    setChoice={(c) => setLookingRelationship(c)}*/}
        {/*  />*/}
        {/*</Col>*/}

        <Category title={t('profile.optional.socials', 'Socials')} />

        <Col className={clsx(colClassName, 'pb-4')}>
          {/*<label className={clsx(labelClassName)}>*/}
          {/*  {t('profile.optional.socials', 'Socials')}*/}
          {/*</label>*/}

          <div className="grid w-full grid-cols-[8rem_1fr_auto] gap-2">
            {Object.entries(newLinks)
              .filter(([_, value]) => value != null)
              .map(([platform, value]) => (
                <Fragment key={platform}>
                  <div className="col-span-3 mt-2 flex items-center gap-2 self-center sm:col-span-1">
                    <SocialIcon site={platform as any} className="text-primary-700 h-4 w-4" />
                    {PLATFORM_LABELS[platform as Site] ?? platform}
                  </div>
                  <Input
                    type="text"
                    value={value!}
                    onChange={(e) => updateUserLink(platform, e.target.value)}
                    className="col-span-2 sm:col-span-1"
                  />
                  <IconButton onClick={() => updateUserLink(platform, null)}>
                    <XIcon className="h-6 w-6" />
                    <div className="sr-only">{t('common.remove', 'Remove')}</div>
                  </IconButton>
                </Fragment>
              ))}

            {/* Spacer */}
            <div className="col-span-3 h-4" />

            <PlatformSelect
              value={newLinkPlatform}
              onChange={setNewLinkPlatform}
              className="h-full !w-full"
            />
            <Input
              type="text"
              placeholder={
                SITE_ORDER.includes(newLinkPlatform as any) && newLinkPlatform != 'site'
                  ? t('profile.optional.username_or_url', 'Username or URL')
                  : t('profile.optional.site_url', 'Site URL')
              }
              value={newLinkValue}
              onChange={(e) => setNewLinkValue(e.target.value)}
              // disable password managers
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-bwignore="true"
              data-protonpass-ignore="true"
              className="w-full"
            />
            <Button
              color="gray-outline"
              onClick={addNewLink}
              disabled={!newLinkPlatform || !newLinkValue}
            >
              <PlusIcon className="h-6 w-6" />
              <div className="sr-only">{t('common.add', 'Add')}</div>
            </Button>
          </div>
        </Col>

        <Category title={t('profile.optional.photos', 'Photos')} />

        <Col className={clsx(colClassName)}>
          {/*<label className={clsx(labelClassName)}>*/}
          {/*  {t('profile.optional.photos', 'Photos')}*/}
          {/*</label>*/}

          {/*<div className="mb-1">*/}
          {/*  A real or stylized photo of you is required.*/}
          {/*</div>*/}

          <AddPhotosWidget
            user={user}
            photo_urls={profile.photo_urls}
            pinned_url={profile.pinned_url}
            setPhotoUrls={(urls) => setProfile('photo_urls', urls)}
            setPinnedUrl={(url) => setProfile('pinned_url', url)}
            setDescription={(url, description) =>
              setProfile('image_descriptions', {
                ...((profile?.image_descriptions as Record<string, string>) ?? {}),
                [url]: description,
              })
            }
            image_descriptions={profile.image_descriptions as Record<string, string>}
          />
        </Col>

        <Row className={'justify-end'}>
          <Button
            className={clsx(
              'fixed lg:bottom-6 right-4 lg:right-32 z-50 text-xl',
              bottomNavBarVisible
                ? 'bottom-[calc(90px+var(--bnh))]'
                : 'bottom-[calc(30px+var(--bnh))]',
            )}
            disabled={isSubmitting}
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {buttonLabel ?? t('common.next', 'Next')}
          </Button>
        </Row>
      </Col>
    </>
  )
}

const CitySearchBox = (props: {onCitySelected: (city: City | undefined) => void}) => {
  // search results
  const {cities, query, setQuery} = useCitySearch()
  const [focused, setFocused] = useState(false)
  const t = useT()

  const dropdownRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('profile.optional.search_city', 'Search city...')}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          // Do not hide the dropdown if clicking inside the dropdown
          if (dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget)) {
            setFocused(false)
          }
        }}
      />
      <div className="relative w-full" ref={dropdownRef}>
        <Col className="bg-canvas-50 absolute left-0 right-0 top-1 z-10 w-full overflow-hidden rounded-md">
          {focused &&
            cities.map((c) => (
              <CityRow
                key={c.geodb_city_id}
                city={c}
                onSelect={() => {
                  props.onCitySelected(c)
                  setQuery('')
                }}
                className="hover:bg-primary-200 justify-between gap-1 px-4 py-2 transition-colors"
              />
            ))}
        </Col>
      </div>
    </>
  )
}

function Category({title, className}: {title: string; className?: string}) {
  return <h3 className={clsx('text-xl font-semibold mb-[-8px]', className)}>{title}</h3>
}

const Big5Slider = (props: {label: string; value: number; onChange: (v: number) => void}) => {
  const {label, value, onChange} = props
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm text-ink-600">
        <span>{label}</span>
        <span className="font-semibold text-ink-700" data-testid={`${label.toLowerCase()}-value`}>
          {Math.round(value)}
        </span>
      </div>
      <Slider
        amount={value}
        min={0}
        max={100}
        onChange={(v) => onChange(Math.round(v))}
        marks={[
          {value: 0, label: '0'},
          {value: 25, label: '25'},
          {value: 50, label: '50'},
          {value: 75, label: '75'},
          {value: 100, label: '100'},
        ]}
      />
    </div>
  )
}
