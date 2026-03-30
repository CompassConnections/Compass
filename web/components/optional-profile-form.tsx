import {Editor} from '@tiptap/react'
import clsx from 'clsx'
import {
  CANNABIS_CHOICES,
  DIET_CHOICES,
  EDUCATION_CHOICES,
  GENDERS,
  LANGUAGE_CHOICES,
  MBTI_CHOICES,
  POLITICAL_CHOICES,
  PSYCHEDELICS_CHOICES,
  RACE_CHOICES,
  RELATIONSHIP_CHOICES,
  RELATIONSHIP_STATUS_CHOICES,
  RELIGION_CHOICES,
  ROMANTIC_CHOICES,
  SUBSTANCE_INTENTION_CHOICES,
  SUBSTANCE_PREFERENCE_CHOICES,
} from 'common/choices'
import {debug} from 'common/logger'
import {isUrl} from 'common/parsing'
import {MultipleChoiceOptions} from 'common/profiles/multiple-choice'
import {Profile, ProfileWithoutUser} from 'common/profiles/profile'
import {BaseUser} from 'common/user'
import {removeNullOrUndefinedProps} from 'common/util/object'
import {urlize} from 'common/util/string'
import {invert, range} from 'lodash'
import {useRef, useState} from 'react'
import Textarea from 'react-expanding-textarea'
import toast from 'react-hot-toast'
import {AddOptionEntry} from 'web/components/add-option-entry'
import {SignupBio} from 'web/components/bio/editable-bio'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {CustomLink} from 'web/components/links'
import {LLMExtractSection} from 'web/components/llm-extract-section'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import {City, CityRow, profileToCity, useCitySearch} from 'web/components/search-location'
import {SocialLinksSection} from 'web/components/social-links-section'
import {Carousel} from 'web/components/widgets/carousel'
import {ChoicesToggleGroup} from 'web/components/widgets/choices-toggle-group'
import {Input} from 'web/components/widgets/input'
import {RadioToggleGroup} from 'web/components/widgets/radio-toggle-group'
import {Select} from 'web/components/widgets/select'
import {Slider} from 'web/components/widgets/slider'
import {Title} from 'web/components/widgets/title'
import {useChoicesContext} from 'web/hooks/use-choices'
import {api} from 'web/lib/api'
import {useLocale, useT} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'
import {colClassName, labelClassName} from 'web/pages/signup'

import {AddPhotosWidget} from './widgets/add-photos'

export const OptionalProfileUserForm = (props: {
  profile: ProfileWithoutUser
  setProfile: <K extends keyof ProfileWithoutUser>(key: K, value: ProfileWithoutUser[K]) => void
  user: BaseUser
  buttonLabel?: string
  bottomNavBarVisible?: boolean
  onSubmit: () => Promise<void>
}) => {
  const {profile, user, buttonLabel, setProfile, onSubmit, bottomNavBarVisible = true} = props

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [ageError, setAgeError] = useState<string | null>(null)
  const t = useT()
  const {locale} = useLocale()

  const choices = useChoicesContext()
  const [interestChoices, setInterestChoices] = useState(choices.interests)
  const [causeChoices, setCauseChoices] = useState(choices.causes)
  const [workChoices, setWorkChoices] = useState(choices.work)

  const [keywordsString, setKeywordsString] = useState<string>(profile.keywords?.join(', ') || '')

  const lookingRelationship = (profile.pref_relation_styles || []).includes('relationship')

  const heightFeet =
    typeof profile.height_in_inches === 'number'
      ? Math.floor(profile.height_in_inches / 12)
      : undefined

  const heightInches =
    typeof profile.height_in_inches === 'number' ? profile.height_in_inches % 12 : undefined

  const [isExtracting, setIsExtracting] = useState(false)
  const [parsingEditor, setParsingEditor] = useState<any>(null)

  const handleLLMExtract = async () => {
    const llmContent = parsingEditor?.getText?.() ?? ''
    if (!llmContent) {
      toast.error(t('profile.llm.extract.error_empty', 'Please enter content to extract from'))
      return
    }
    setIsExtracting(true)
    try {
      const isInputUrl = isUrl(llmContent)
      const payload = {
        locale,
        ...(isInputUrl ? {url: urlize(llmContent).trim()} : {content: llmContent.trim()}),
      }

      const extracted = await api('llm-extract-profile', payload)
      for (const data of Object.entries(removeNullOrUndefinedProps(extracted))) {
        const key = data[0]
        let value = data[1]
        let choices, setChoices: any
        if (key === 'interests') {
          choices = interestChoices
          setChoices = setInterestChoices
        } else if (key === 'causes') {
          choices = causeChoices
          setChoices = setCauseChoices
        } else if (key === 'work') {
          choices = workChoices
          setChoices = setWorkChoices
        }
        if (choices && setChoices) {
          const newFields: string[] = []
          const converter = invert(choices)
          value = (value as string[]).map((interest: string) => {
            if (!converter[interest]) newFields.push(interest)
            return converter[interest] ?? interest
          })
          if (newFields.length) {
            setChoices((prev: any) => ({
              ...prev,
              ...Object.fromEntries(newFields.map((e) => [e, e])),
            }))
          }
          debug({value, converter})
        } else if (key === 'keywords') setKeywordsString((value as string[]).join(', '))
        setProfile(
          key as keyof ProfileWithoutUser,
          value as ProfileWithoutUser[keyof ProfileWithoutUser],
        )
      }
      if (!isInputUrl) setProfile('bio', parsingEditor?.getJSON?.())
      debug({text: parsingEditor?.getText?.(), json: parsingEditor?.getJSON?.(), extracted})

      parsingEditor?.commands?.clearContent?.()

      toast.success(
        t('profile.llm.extract.success', 'Profile data extracted! Please review below.'),
      )
    } catch (error) {
      console.error(error)
      toast.error(t('profile.llm.extract.error', 'Failed to extract profile data'))
    } finally {
      setIsExtracting(false)
    }
  }

  const errorToast = () => {
    toast.error(t('profile.optional.error.invalid_fields', 'Some fields are incorrect...'))
  }

  const handleSubmit = async () => {
    if (parsingEditor?.getText?.()?.trim()) {
      await handleLLMExtract()
    }

    // Validate age before submitting
    if (typeof profile['age'] === 'number') {
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

    track('submit optional profile')

    await onSubmit()

    choices.refreshInterests()
    choices.refreshCauses()
    choices.refreshWork()

    setIsSubmitting(false)
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

  function profileToRaisedInCity(profile: Profile): City | undefined {
    if (profile.raised_in_geodb_city_id && profile.raised_in_lat && profile.raised_in_lon) {
      return {
        geodb_city_id: profile.raised_in_geodb_city_id,
        city: profile.raised_in_city ?? null,
        region_code: profile.raised_in_region_code ?? '',
        country: profile.raised_in_country ?? '',
        country_code: '',
        latitude: profile.raised_in_lat,
        longitude: profile.raised_in_lon,
      }
    }
    return undefined
  }

  function setProfileRaisedInCity(inputCity: City | undefined) {
    if (!inputCity) {
      setProfile('raised_in_geodb_city_id', null)
      setProfile('raised_in_city', null)
      setProfile('raised_in_region_code', null)
      setProfile('raised_in_country', null)
      setProfile('raised_in_lat', null)
      setProfile('raised_in_lon', null)
    } else {
      const {geodb_city_id, city, region_code, country, latitude, longitude} = inputCity
      setProfile('raised_in_geodb_city_id', geodb_city_id)
      setProfile('raised_in_city', city)
      setProfile('raised_in_region_code', region_code)
      setProfile('raised_in_country', country)
      setProfile('raised_in_lat', latitude)
      setProfile('raised_in_lon', longitude)
    }
  }

  return (
    <>
      <Title>{t('profile.optional.subtitle', 'Optional information')}</Title>

      <Col className={'gap-8'}>
        <Category title={t('profile.llm.extract.title', 'Auto-fill')} className={'mt-0'} />
        <LLMExtractSection
          parsingEditor={parsingEditor}
          setParsingEditor={setParsingEditor}
          isExtracting={isExtracting}
          isSubmitting={isSubmitting}
          onExtract={handleLLMExtract}
        />

        <hr className="border border-b my-4" />

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
              choicesMap={
                Object.fromEntries(
                  Object.entries(GENDERS).map(([k, v]) => [t(`profile.gender.${v}`, k), v]),
                ) as any
              }
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const heightInInches = Number(e.target.value || 0) * 12 + (heightInches ?? 0)
                  setProfile('height_in_inches', heightInInches)
                }}
                className={'w-20'}
                value={typeof heightFeet === 'number' && heightFeet ? Math.floor(heightFeet) : ''}
                min={0}
              />
            </Col>
            <Col>
              <span>{t('profile.optional.inches', 'Inches')}</span>
              <Input
                type="number"
                data-testid="height-inches"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const heightInInches = Number(e.target.value || 0) + 12 * (heightFeet ?? 0)
                  setProfile('height_in_inches', heightInInches)
                }}
                className={'w-20'}
                value={
                  typeof heightInches === 'number' && heightInches ? Math.floor(heightInches) : ''
                }
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.value === '') {
                    setProfile('height_in_inches', null)
                  } else {
                    // Convert cm to inches
                    const totalInches = Number(e.target.value) / 2.54
                    setProfile('height_in_inches', totalInches)
                  }
                }}
                className={'w-24'}
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

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.raised_in', 'Place you grew up')}
          </label>
          <label className={clsx('guidance')}>
            {t(
              'profile.optional.raised_in_hint',
              'Especially useful if you grew up in a different country than where you live now—and if it reflects your cultural references, values, and life experiences.',
            )}
          </label>
          {profile.raised_in_geodb_city_id ? (
            <Row className="border-primary-500 w-full justify-between rounded border px-4 py-2">
              <CityRow
                city={profileToRaisedInCity(profile as Profile)!}
                onSelect={() => {}}
                className="pointer-events-none"
              />
              <button
                className="text-ink-700 hover:text-primary-700 text-sm underline"
                onClick={() => {
                  setProfileRaisedInCity(undefined)
                }}
              >
                {t('common.change', 'Change')}
              </button>
            </Row>
          ) : (
            <CitySearchBox
              onCitySelected={(city: City | undefined) => {
                setProfileRaisedInCity(city)
              }}
            />
          )}
        </Col>

        <Category title={t('profile.optional.og_card', 'Profile Card')} className={'mt-0'} />

        <label className={clsx('guidance')}>
          {t(
            'profile.optional.headline_description',
            'What will appear on your profile card when others view it.',
          )}
        </label>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.headline', 'Headline')}
          </label>
          <label className={clsx('guidance')}>
            {t(
              'profile.optional.headline_hint',
              "2-3 sentences that describe you and what you are looking for (max 250 characters). You'll be able to create a long document later in the profile bio.",
            )}
          </label>
          <Textarea
            data-testid="headline"
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setProfile('headline', e.target.value)
            }
            className={'w-full md:w-[700px] bg-canvas-0 border rounded-md p-2'}
            value={profile['headline'] ?? undefined}
            maxLength={250}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.keywords', 'Keywords')}
          </label>
          <label className={clsx('guidance')}>
            {t(
              'profile.optional.keywords_hint',
              'Add 3-5 main keywords separated by commas that will be very visible on your profile (identity, interests, causes, politics, etc.). You can add more keywords later in the interests, causes and work sections.',
            )}
          </label>
          <Input
            data-testid="keywords"
            type="text"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setKeywordsString(e.target.value)
              const keywords = e.target.value
                .split(',')
                .map((k) => k.trim())
                .filter(Boolean)
              setProfile('keywords', keywords)
            }}
            className={'w-full sm:w-[600px]'}
            value={keywordsString}
            placeholder={t(
              'profile.optional.keywords_placeholder',
              'e.g., hiking, climate, progressive',
            )}
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
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
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
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
              currentChoice={profile['education_level']}
              choicesMap={Object.fromEntries(
                Object.entries(EDUCATION_CHOICES).map(([k, v]) => [
                  t(`profile.education.${v}`, k),
                  v,
                ]) as any,
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setProfile('university', e.target.value)
            }
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setProfile('occupation_title', e.target.value)
            }
            className={'w-52'}
            value={profile['occupation_title'] ?? undefined}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>{t('profile.optional.company', 'Company')}</label>
          <Input
            data-testid="company"
            type="text"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setProfile('company', e.target.value)
            }
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setProfile('political_details', e.target.value)
            }
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setProfile('religious_beliefs', e.target.value)
            }
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
        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.big5', 'Big Five Personality Traits')}
          </label>
          <p className="guidance custom-link">
            {t(
              'profile.big5_guidance',
              'The Big Five personality trait model is a scientific model that groups variation in personality into five separate factors (',
            )}
            <CustomLink href={'https://en.wikipedia.org/wiki/Big_Five_personality_traits'}>
              {t('profile.big5_wikipedia_link', 'Wikipedia article')}
            </CustomLink>
            {t(
              'profile.big5_guidance_suffix',
              '). You can take a well-cited public-domain approximate test ',
            )}
            <CustomLink href={'https://emilywilloughby.com/research/bfas'}>
              {t('profile.big5_test_link', 'here')}
            </CustomLink>
            {t('profile.big5_guidance_end', '.')}
          </p>
          <div className={clsx('space-y-4', 'w-full max-w-[550px]')}>
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
          </div>
          <p className="text-sm text-ink-500">
            {t(
              'profile.big5_hint',
              'Drag each slider to set where you see yourself on these traits (0 = low, 100 = high).',
            )}
          </p>
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value === '' ? null : Number(e.target.value)
              setProfile('drinks_per_month', value)
            }}
            className={'w-20'}
            min={0}
            value={profile['drinks_per_month'] ?? undefined}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.psychedelics', 'Psychedelics / plant medicine')}
          </label>
          <Select
            value={profile['psychedelics'] ?? ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setProfile('psychedelics', e.target.value || null)
            }
            className={'w-full sm:w-80'}
          >
            <option value=""></option>
            {Object.entries(PSYCHEDELICS_CHOICES).map(([label, value]) => (
              <option key={value} value={value}>
                {t(`profile.psychedelics.${value}`, label)}
              </option>
            ))}
          </Select>
        </Col>

        {profile['psychedelics'] && profile['psychedelics'] !== 'never_not_interested' && (
          <Col className={clsx(colClassName)}>
            <label className={clsx(labelClassName)}>
              {t('profile.optional.psychedelics_intention', 'Intention (psychedelics)')}
            </label>
            <MultiCheckbox
              choices={SUBSTANCE_INTENTION_CHOICES}
              selected={profile['psychedelics_intention'] ?? []}
              translationPrefix={'profile.substance_intention'}
              onChange={(selected) => setProfile('psychedelics_intention', selected)}
            />
          </Col>
        )}

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.psychedelics_pref', 'Preference for partner (psychedelics)')}
          </label>
          <MultiCheckbox
            choices={SUBSTANCE_PREFERENCE_CHOICES}
            selected={profile['psychedelics_pref'] ?? []}
            translationPrefix={'profile.substance_pref'}
            onChange={(selected) => setProfile('psychedelics_pref', selected)}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.cannabis', 'Cannabis')}
          </label>
          <Select
            value={profile['cannabis'] ?? ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setProfile('cannabis', e.target.value || null)
            }
            className={'w-full sm:w-80'}
          >
            <option value=""></option>
            {Object.entries(CANNABIS_CHOICES).map(([label, value]) => (
              <option key={value} value={value}>
                {t(`profile.cannabis.${value}`, label)}
              </option>
            ))}
          </Select>
        </Col>

        {profile['cannabis'] && profile['cannabis'] !== 'never_not_interested' && (
          <Col className={clsx(colClassName)}>
            <label className={clsx(labelClassName)}>
              {t('profile.optional.cannabis_intention', 'Intention (cannabis)')}
            </label>
            <MultiCheckbox
              choices={SUBSTANCE_INTENTION_CHOICES}
              selected={profile['cannabis_intention'] ?? []}
              translationPrefix={'profile.substance_intention'}
              onChange={(selected) => setProfile('cannabis_intention', selected)}
            />
          </Col>
        )}

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.cannabis_pref', 'Preference for partner (cannabis)')}
          </label>
          <MultiCheckbox
            choices={SUBSTANCE_PREFERENCE_CHOICES}
            selected={profile['cannabis_pref'] ?? []}
            translationPrefix={'profile.substance_pref'}
            onChange={(selected) => setProfile('cannabis_pref', selected)}
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileState('born_in_location', e.target.value)}
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

        <SocialLinksSection profile={profile} setProfile={setProfile} />

        <Category title={t('profile.basics.bio', 'Bio')} className={'mt-0'} />
        <label className={clsx('guidance')}>
          {t(
            'profile.optional.bio_description',
            'Here you can write a long document about who you are and what you are looking for. It includes nice formatting like headers, bold, italic, lists, links, embedded images, and more.',
          )}
        </label>
        <SignupBio
          profile={profile}
          onChange={(e: Editor) => {
            debug('bio changed', e, profile.bio)
            setProfile('bio', e.getJSON())
            setProfile('bio_length', e.getText().length)
          }}
        />

        <Category title={t('profile.optional.photos', 'Photos')} />

        <Col className={clsx(colClassName)}>
          {/*<label className={clsx(labelClassName)}>*/}
          {/*  {t('profile.optional.photos', 'Photos')}*/}
          {/*</label>*/}

          {/*<div className="mb-1">*/}
          {/*  A real or stylized photo of you is required.*/}
          {/*</div>*/}

          <AddPhotosWidget
            username={user.username}
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
            onUpload={(uploading) => setUploadingImages(uploading)}
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
            disabled={isSubmitting || uploadingImages}
            loading={isSubmitting}
            onClick={handleSubmit}
            color={'gray'}
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
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
        placeholder={t('profile.optional.search_city', 'Search city...')}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          // Do not hide the dropdown if clicking inside the dropdown
          if (dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget)) {
            setFocused(false)
          }
          // Set to the best guess (first city) if no option selected
          if (cities.length > 0) props.onCitySelected(cities[0])
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
