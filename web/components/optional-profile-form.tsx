import {Fragment, useEffect, useRef, useState} from 'react'
import {Title} from 'web/components/widgets/title'
import {Col} from 'web/components/layout/col'
import clsx from 'clsx'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import {useT} from 'web/lib/locale'
import {Row} from 'web/components/layout/row'
import {Input} from 'web/components/widgets/input'
import {ChoicesToggleGroup} from 'web/components/widgets/choices-toggle-group'
import {Button, IconButton} from 'web/components/buttons/button'
import {colClassName, labelClassName} from 'web/pages/signup'
import {useRouter} from 'next/router'
import {api, updateProfile, updateUser} from 'web/lib/api'
import {User} from 'common/user'
import {track} from 'web/lib/service/analytics'
import {Carousel} from 'web/components/widgets/carousel'
import {tryCatch} from 'common/util/try-catch'
import {getProfileRow, ProfileWithoutUser} from 'common/profiles/profile'
import {removeUndefinedProps} from 'common/util/object'
import {isEqual, range} from 'lodash'
import {PlatformSelect} from 'web/components/widgets/platform-select'
import {PLATFORM_LABELS, type Site, SITE_ORDER} from 'common/socials'
import {PlusIcon, XIcon} from '@heroicons/react/solid'
import {SocialIcon} from './user/social'
import {Select} from 'web/components/widgets/select'
import {City, CityRow, profileToCity, useCitySearch} from "web/components/search-location";
import {AddPhotosWidget} from './widgets/add-photos'
import {RadioToggleGroup} from "web/components/widgets/radio-toggle-group";
import {MultipleChoiceOptions} from "common/profiles/multiple-choice";
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
  ROMANTIC_CHOICES
} from "web/components/filters/choices";
import toast from "react-hot-toast";
import {db} from "web/lib/supabase/db";
import {fetchChoices} from "web/hooks/use-choices";
import {AddOptionEntry} from "web/components/add-option-entry";
import {sleep} from "common/util/time"


export const OptionalProfileUserForm = (props: {
  profile: ProfileWithoutUser
  setProfile: <K extends keyof ProfileWithoutUser>(key: K, value: ProfileWithoutUser[K]) => void
  user: User
  buttonLabel?: string
  fromSignup?: boolean
  onSubmit?: () => Promise<void>
}) => {
  const {profile, user, buttonLabel, setProfile, fromSignup, onSubmit} = props

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lookingRelationship, setLookingRelationship] = useState((profile.pref_relation_styles || []).includes('relationship'))
  const router = useRouter()
  const t = useT()
  const [heightFeet, setHeightFeet] = useState<number | undefined>(
    profile.height_in_inches
      ? Math.floor((profile['height_in_inches'] ?? 0) / 12)
      : undefined
  )
  const [heightInches, setHeightInches] = useState<number | undefined>(
    profile.height_in_inches
      ? Math.floor((profile['height_in_inches'] ?? 0) % 12)
      : undefined
  )

  const [newLinks, setNewLinks] = useState<Record<string, string | null>>(
    user.link
  )

  const [newLinkPlatform, setNewLinkPlatform] = useState('')
  const [newLinkValue, setNewLinkValue] = useState('')
  const [interestChoices, setInterestChoices] = useState({})
  const [causeChoices, setCauseChoices] = useState({})
  const [workChoices, setWorkChoices] = useState({})

  useEffect(() => {
    fetchChoices('interests').then(setInterestChoices)
    fetchChoices('causes').then(setCauseChoices)
    fetchChoices('work').then(setWorkChoices)
  }, [db])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const {
      bio: _bio,
      bio_text: _bio_text,
      bio_tsv: _bio_tsv,
      bio_length: _bio_length,
      interests,
      causes,
      work,
      ...otherProfileProps
    } = profile
    console.debug('otherProfileProps', removeUndefinedProps(otherProfileProps))
    const promises: Promise<any>[] = [
      tryCatch(updateProfile(removeUndefinedProps(otherProfileProps) as any))
    ]
    if (interests?.length) {
      promises.push(api('update-options', {table: 'interests', names: interests}))
    }
    if (causes?.length) {
      promises.push(api('update-options', {table: 'causes', names: causes}))
    }
    if (work?.length) {
      promises.push(api('update-options', {table: 'work', names: work}))
    }
    try {
      await Promise.all(promises)
    } catch (error) {
      console.error(error)
      toast.error(
        `We ran into an issue saving your profile. Please try again or contact us if the issue persists.`
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
    onSubmit && (await onSubmit())
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
        await sleep(5000)
        router.push(`/${user.username}${fromSignup ? '?fromSignup=true' : ''}`)
      } else {
        console.log("Profile not found after fetching, going back home...")
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

      <Title>{t('profile.optional.title', 'More about me')}</Title>
      <div className="text-ink-500 mb-6 text-lg">
        {t('profile.optional.subtitle', 'Optional information')}
      </div>

      <Col className={'gap-8'}>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.location', 'Location')}
          </label>
          {profile.city ? (
            <Row className="border-primary-500 w-full justify-between rounded border px-4 py-2">
              <CityRow
                city={profileToCity(profile)}
                onSelect={() => {
                }}
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

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.age', 'Age')}
          </label>
          <Input
            type="number"
            placeholder={t('profile.optional.age', 'Age')}
            value={profile['age'] ?? undefined}
            min={18}
            max={100}
            onChange={(e) => setProfile('age', e.target.value ? Number(e.target.value) : null)}
          />
        </Col>

        <Row className={'items-center gap-2'}>
          <Col className={'gap-1'}>
            <label className={clsx(labelClassName)}>
              {t('profile.optional.gender', 'Gender')}
            </label>
            <ChoicesToggleGroup
              currentChoice={profile['gender']}
              choicesMap={Object.fromEntries(Object.entries(GENDERS).map(([k, v]) => [t(`profile.gender.${v}`, k), v]))}
              setChoice={(c) => setProfile('gender', c)}
            />
          </Col>
        </Row>

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
                value={profile['pref_age_min'] ?? ''}
                onChange={(e) =>
                  setProfile('pref_age_min', e.target.value ? Number(e.target.value) : 18)
                }
                className={'w-18 border-ink-300 rounded-md'}
              >
                <option key={""} value={""}></option>
                {range(18, 100).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Col>
            <Col>
              <span>{t('common.max', 'Max')}</span>
              <Select
                value={profile['pref_age_max'] ?? ''}
                onChange={(e) =>
                  setProfile('pref_age_max', e.target.value ? Number(e.target.value) : 100)
                }
                className={'w-18 border-ink-300 rounded-md'}
              >
                <option key={""} value={""}></option>
                {range(18, 100).map((m) => (
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

        {lookingRelationship && <>
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

            <Col className={clsx(colClassName)}>
                <label className={clsx(labelClassName)}>
                  {t('profile.optional.want_kids', 'I would like to have kids')}
                </label>
                <RadioToggleGroup
                    className={'w-44'}
                    choicesMap={Object.fromEntries(Object.entries(MultipleChoiceOptions).map(([k, v]) => [t(`profile.wants_kids_${v}`, k), v]))}
                    setChoice={(choice) => {
                      setProfile('wants_kids_strength', choice)
                    }}
                    currentChoice={profile.wants_kids_strength ?? -1}
                />
            </Col>

            <Col className={clsx(colClassName)}>
                <label className={clsx(labelClassName)}>
                  {t('profile.optional.num_kids', 'Current number of kids')}
                </label>
                <Input
                    type="number"
                    onChange={(e) => {
                      const value =
                        e.target.value === '' ? null : Number(e.target.value)
                      setProfile('has_kids', value)
                    }}
                    className={'w-20'}
                    min={0}
                    value={profile['has_kids'] ?? undefined}
                />
            </Col>
        </>}

        <Col className={clsx(colClassName, 'pb-4')}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.socials', 'Socials')}
          </label>

          <div className="grid w-full grid-cols-[8rem_1fr_auto] gap-2">
            {Object.entries(newLinks)
              .filter(([_, value]) => value != null)
              .map(([platform, value]) => (
                <Fragment key={platform}>
                  <div className="col-span-3 mt-2 flex items-center gap-2 self-center sm:col-span-1">
                    <SocialIcon
                      site={platform as any}
                      className="text-primary-700 h-4 w-4"
                    />
                    {PLATFORM_LABELS[platform as Site] ?? platform}
                  </div>
                  <Input
                    type="text"
                    value={value!}
                    onChange={(e) => updateUserLink(platform, e.target.value)}
                    className="col-span-2 sm:col-span-1"
                  />
                  <IconButton onClick={() => updateUserLink(platform, null)}>
                    <XIcon className="h-6 w-6"/>
                    <div className="sr-only">
                      {t('common.remove', 'Remove')}
                    </div>
                  </IconButton>
                </Fragment>
              ))}

            {/* Spacer */}
            <div className="col-span-3 h-4"/>

            <PlatformSelect
              value={newLinkPlatform}
              onChange={setNewLinkPlatform}
              className="h-full !w-full"
            />
            <Input
              type="text"
              placeholder={
                SITE_ORDER.includes(newLinkPlatform as any) &&
                newLinkPlatform != 'site'
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
              <PlusIcon className="h-6 w-6"/>
              <div className="sr-only">
                {t('common.add', 'Add')}
              </div>
            </Button>
          </div>
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.languages', 'Languages')}
          </label>
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

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.political_beliefs', 'Political beliefs')}
          </label>
          <MultiCheckbox
            choices={POLITICAL_CHOICES}
            selected={profile['political_beliefs'] ?? []}
            translationPrefix={'profile.political'}
            onChange={(selected) => setProfile('political_beliefs', selected)}
          />
          <p>{t('profile.optional.details', 'Details')}</p>
          <Input
            type="text"
            onChange={(e) => setProfile('political_details', e.target.value)}
            className={'w-full sm:w-96'}
            value={profile['political_details'] ?? undefined}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.religious_beliefs', 'Religious beliefs')}
          </label>
          <MultiCheckbox
            choices={RELIGION_CHOICES}
            selected={profile['religion'] ?? []}
            translationPrefix={'profile.religion'}
            onChange={(selected) => setProfile('religion', selected)}
          />
          <Input
            type="text"
            onChange={(e) => setProfile('religious_beliefs', e.target.value)}
            className={'w-full sm:w-96'}
            value={profile['religious_beliefs'] ?? undefined}
          />
          <p>{t('profile.optional.details', 'Details')}</p>
        </Col>

        <AddOptionEntry
          title={t('profile.optional.interests', 'Interests')}
          choices={interestChoices}
          setChoices={setInterestChoices}
          profile={profile}
          setProfile={setProfile}
          label={'interests'}
        />

        <AddOptionEntry
          title={t('profile.optional.causes', 'Causes')}
          choices={causeChoices}
          setChoices={setCauseChoices}
          profile={profile}
          setProfile={setProfile}
          label={'causes'}
        />

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

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.diet', 'Diet')}
          </label>
          <MultiCheckbox
            choices={DIET_CHOICES}
            selected={profile['diet'] ?? []}
            translationPrefix={'profile.diet'}
            onChange={(selected) => setProfile('diet', selected)}
          />
        </Col>

        <AddOptionEntry
          title={t('profile.optional.work', 'Work')}
          choices={workChoices}
          setChoices={setWorkChoices}
          profile={profile}
          setProfile={setProfile}
          label={'work'}
        />

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.company', 'Company')}
          </label>
          <Input
            type="text"
            onChange={(e) => setProfile('company', e.target.value)}
            className={'w-52'}
            value={profile['company'] ?? undefined}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {profile['company']
              ? t('profile.optional.job_title_at_company', 'Job title at {company}', {company: profile['company']})
              : t('profile.optional.job_title', 'Job title')}
          </label>
          <Input
            type="text"
            onChange={(e) => setProfile('occupation_title', e.target.value)}
            className={'w-52'}
            value={profile['occupation_title'] ?? undefined}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.education_level', 'Highest completed education level')}
          </label>
          <Carousel className="max-w-full">
            <ChoicesToggleGroup
              currentChoice={profile['education_level'] ?? ''}
              choicesMap={Object.fromEntries(Object.entries(EDUCATION_CHOICES).map(([k, v]) => [t(`profile.education.${v}`, k), v]))}
              setChoice={(c) => setProfile('education_level', c)}
            />
          </Carousel>
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.university', 'University')}
          </label>
          <Input
            type="text"
            onChange={(e) => setProfile('university', e.target.value)}
            className={'w-52'}
            value={profile['university'] ?? undefined}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.smoke', 'Do you smoke?')}
          </label>
          <ChoicesToggleGroup
            currentChoice={profile['is_smoker'] ?? undefined}
            choicesMap={Object.fromEntries(Object.entries({
              Yes: true,
              No: false
            }).map(([k, v]) => [t(`common.${k.toLowerCase()}`, k), v]))}
            setChoice={(c) => setProfile('is_smoker', c)}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.drinks_per_month', 'Alcoholic beverages consumed per month')}
          </label>
          <Input
            type="number"
            onChange={(e) => {
              const value =
                e.target.value === '' ? null : Number(e.target.value)
              setProfile('drinks_per_month', value)
            }}
            className={'w-20'}
            min={0}
            value={profile['drinks_per_month'] ?? undefined}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.height', 'Height')}
          </label>
          <Row className={'gap-2'}>
            <Col>
              <span>{t('profile.optional.feet', 'Feet')}</span>
              <Input
                type="number"
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
              />
            </Col>
            <Col>
              <span>{t('profile.optional.inches', 'Inches')}</span>
              <Input
                type="number"
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
              />
            </Col>
            <div className="self-end mb-2 text-ink-700 mx-2">
              {t('common.or', 'OR').toUpperCase()}
            </div>
            <Col>
              <span>{t('profile.optional.centimeters', 'Centimeters')}</span>
              <Input
                type="number"
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
                value={heightFeet !== undefined
                  ? Math.round((heightFeet * 12 + (heightInches ?? 0)) * 2.54)
                  : ''}
              />
            </Col>
          </Row>
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

        {/*<Col className={clsx(colClassName)}>*/}
        {/*  <label className={clsx(labelClassName)}>Looking for a relationship?</label>*/}
        {/*  <ChoicesToggleGroup*/}
        {/*    currentChoice={lookingRelationship}*/}
        {/*    choicesMap={{Yes: true, No: false}}*/}
        {/*    setChoice={(c) => setLookingRelationship(c)}*/}
        {/*  />*/}
        {/*</Col>*/}

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            {t('profile.optional.photos', 'Photos')}
          </label>

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
              setProfile("image_descriptions", {
                ...(profile?.image_descriptions as Record<string, string> ?? {}),
                [url]: description,
              })
            }
            image_descriptions={profile.image_descriptions as Record<string, string>}
          />
        </Col>


        <Row className={'justify-end'}>
          <Button
            className="fixed bottom-[calc(90px+var(--bnh))] lg:bottom-6 right-4 z-50 text-xl"
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

const CitySearchBox = (props: {
  onCitySelected: (city: City | undefined) => void
}) => {
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
          if (
            dropdownRef.current &&
            !dropdownRef.current.contains(e.relatedTarget)
          ) {
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

