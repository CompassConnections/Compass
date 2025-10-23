import {Fragment, useEffect, useRef, useState} from 'react'
import {Title} from 'web/components/widgets/title'
import {Col} from 'web/components/layout/col'
import clsx from 'clsx'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import {Row} from 'web/components/layout/row'
import {Input} from 'web/components/widgets/input'
import {ChoicesToggleGroup} from 'web/components/widgets/choices-toggle-group'
import {Button, IconButton} from 'web/components/buttons/button'
import {colClassName, labelClassName} from 'web/pages/signup'
import {useRouter} from 'next/router'
import {updateProfile, updateUser} from 'web/lib/api'
import {Column} from 'common/supabase/utils'
import {User} from 'common/user'
import {track} from 'web/lib/service/analytics'
import {Races} from './race'
import {Carousel} from 'web/components/widgets/carousel'
import {tryCatch} from 'common/util/try-catch'
import {ProfileRow} from 'common/profiles/profile'
import {removeNullOrUndefinedProps} from 'common/util/object'
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
import {DIET_CHOICES, POLITICAL_CHOICES, RELATIONSHIP_CHOICES, ROMANTIC_CHOICES} from "web/components/filters/choices";
import toast from "react-hot-toast";

export const OptionalProfileUserForm = (props: {
  profile: ProfileRow
  setProfile: <K extends Column<'profiles'>>(key: K, value: ProfileRow[K]) => void
  user: User
  buttonLabel?: string
  fromSignup?: boolean
  onSubmit?: () => Promise<void>
}) => {
  const {profile, user, buttonLabel, setProfile, fromSignup, onSubmit} = props

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lookingRelationship, setLookingRelationship] = useState((profile.pref_relation_styles || []).includes('relationship'))
  const router = useRouter()
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

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const {bio: _, ...otherProfileProps} = profile
    console.debug('otherProfileProps', removeNullOrUndefinedProps(otherProfileProps))
    const {error} = await tryCatch(
      updateProfile(removeNullOrUndefinedProps(otherProfileProps) as any)
    )
    if (error) {
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
    setIsSubmitting(false)
    track('submit optional profile')
    if (user)
      router.push(`/${user.username}${fromSignup ? '?fromSignup=true' : ''}`)
    else router.push('/')
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

  const [trans, setTrans] = useState<boolean | undefined>(
    profile['gender'].includes('trans')
  )

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

  useEffect(() => {
    const currentState = profile['gender']
    if (currentState === 'non-binary') {
      setTrans(undefined)
    } else if (trans && !currentState.includes('trans-')) {
      setProfile('gender', 'trans-' + currentState.replace('trans-', ''))
    } else if (!trans && currentState.includes('trans-')) {
      setProfile('gender', currentState.replace('trans-', ''))
    }
  }, [trans, profile['gender']])

  return (
    <>
      {/*<Row className={'justify-end'}>*/}
      {/*  <Button*/}
      {/*    disabled={isSubmitting}*/}
      {/*    loading={isSubmitting}*/}
      {/*    onClick={handleSubmit}*/}
      {/*  >*/}
      {/*    {buttonLabel ?? 'Next / Skip'}*/}
      {/*  </Button>*/}
      {/*</Row>*/}

      <Title>More about me</Title>
      <div className="text-ink-500 mb-6 text-lg">Optional information</div>

      <Col className={'gap-8'}>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Location</label>
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
                Change
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
          <label className={clsx(labelClassName)}>Age</label>
          <Input
            type="number"
            placeholder="Age"
            value={profile['age'] ?? undefined}
            min={18}
            max={100}
            onChange={(e) => setProfile('age', e.target.value ? Number(e.target.value) : null)}
          />
        </Col>

        <Row className={'items-center gap-2'}>
          <Col className={'gap-1'}>
            <label className={clsx(labelClassName)}>Gender</label>
            <ChoicesToggleGroup
              currentChoice={profile['gender'].replace('trans-', '')}
              choicesMap={{
                Woman: 'female',
                Man: 'male',
                Other: 'other',
              }}
              setChoice={(c) => setProfile('gender', c)}
            />
          </Col>
        </Row>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Interested in connecting with</label>
          <MultiCheckbox
            choices={{
              Women: 'female',
              Men: 'male',
              Other: 'other',
            }}
            selected={profile['pref_gender']}
            onChange={(selected) => setProfile('pref_gender', selected)}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Who are aged between</label>
          <Row className={'gap-2'}>
            <Col>
              <span>Min</span>
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
              <span>Max</span>
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
          <label className={clsx(labelClassName)}>Connection type</label>
          <MultiCheckbox
            choices={RELATIONSHIP_CHOICES}
            selected={profile['pref_relation_styles']}
            onChange={(selected) => {
              setProfile('pref_relation_styles', selected)
              setLookingRelationship((selected || []).includes('relationship'))
            }}
          />
        </Col>

        {lookingRelationship && <>
            <Col className={clsx(colClassName)}>
                <label className={clsx(labelClassName)}>Relationship style</label>
                <MultiCheckbox
                    choices={ROMANTIC_CHOICES}
                    selected={profile['pref_romantic_styles'] || []}
                    onChange={(selected) => {
                      setProfile('pref_romantic_styles', selected)
                    }}
                />
            </Col>

            <Col className={clsx(colClassName)}>
                <label className={clsx(labelClassName)}>
                    I would like to have kids
                </label>
                <RadioToggleGroup
                    className={'w-44'}
                    choicesMap={MultipleChoiceOptions}
                    setChoice={(choice) => {
                      setProfile('wants_kids_strength', choice)
                    }}
                    currentChoice={profile.wants_kids_strength ?? -1}
                />
            </Col>

            <Col className={clsx(colClassName)}>
                <label className={clsx(labelClassName)}>Current number of kids</label>
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
          <label className={clsx(labelClassName)}>Socials</label>

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
                    <div className="sr-only">Remove</div>
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
                  ? 'Username or URL'
                  : 'Site URL'
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
              <div className="sr-only">Add</div>
            </Button>
          </div>
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Political beliefs</label>
          <MultiCheckbox
            choices={POLITICAL_CHOICES}
            selected={profile['political_beliefs'] ?? []}
            onChange={(selected) => setProfile('political_beliefs', selected)}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Religious beliefs</label>
          <Input
            type="text"
            onChange={(e) => setProfile('religious_beliefs', e.target.value)}
            className={'w-full sm:w-96'}
            value={profile['religious_beliefs'] ?? undefined}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Diet</label>
          <MultiCheckbox
            choices={DIET_CHOICES}
            selected={profile['diet'] ?? []}
            onChange={(selected) => setProfile('diet', selected)}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Do you smoke?</label>
          <ChoicesToggleGroup
            currentChoice={profile['is_smoker'] ?? undefined}
            choicesMap={{
              Yes: true,
              No: false,
            }}
            setChoice={(c) => setProfile('is_smoker', c)}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            Alcoholic beverages consumed per month
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
          <label className={clsx(labelClassName)}>Height</label>
          <Row className={'gap-2'}>
            <Col>
              <span>Feet</span>
              <Input
                type="number"
                onChange={(e) => {
                  if (e.target.value === '') {
                    setHeightFeet(undefined)
                  } else {
                    setHeightFeet(Number(e.target.value))
                    const heightInInches =
                      Number(e.target.value) * 12 + (heightInches ?? 0)
                    setProfile('height_in_inches', heightInInches)
                  }
                }}
                className={'w-16'}
                value={heightFeet ?? ''}
              />
            </Col>
            <Col>
              <span>Inches</span>
              <Input
                type="number"
                onChange={(e) => {
                  if (e.target.value === '') {
                    setHeightInches(undefined)
                  } else {
                    setHeightInches(Number(e.target.value))
                    const heightInInches =
                      Number(e.target.value) + 12 * (heightFeet ?? 0)
                    setProfile('height_in_inches', heightInInches)
                  }
                }}
                className={'w-16'}
                value={heightInches ?? ''}
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
          <label className={clsx(labelClassName)}>Ethnicity/origin</label>
          <MultiCheckbox
            choices={Races}
            selected={profile['ethnicity'] ?? []}
            onChange={(selected) => setProfile('ethnicity', selected)}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            Highest completed education level
          </label>
          <Carousel className="max-w-full">
            <ChoicesToggleGroup
              currentChoice={profile['education_level'] ?? ''}
              choicesMap={{
                None: 'none',
                'High school': 'high-school',
                'Some college': 'some-college',
                Bachelors: 'bachelors',
                Masters: 'masters',
                PhD: 'doctorate',
              }}
              setChoice={(c) => setProfile('education_level', c)}
            />
          </Carousel>
        </Col>
        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>University</label>
          <Input
            type="text"
            onChange={(e) => setProfile('university', e.target.value)}
            className={'w-52'}
            value={profile['university'] ?? undefined}
          />
        </Col>
        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Company</label>
          <Input
            type="text"
            onChange={(e) => setProfile('company', e.target.value)}
            className={'w-52'}
            value={profile['company'] ?? undefined}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            Job title {profile['company'] ? 'at ' + profile['company'] : ''}
          </label>
          <Input
            type="text"
            onChange={(e) => setProfile('occupation_title', e.target.value)}
            className={'w-52'}
            value={profile['occupation_title'] ?? undefined}
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
          <label className={clsx(labelClassName)}>Photos</label>

          {/*<div className="mb-1">*/}
          {/*  A real or stylized photo of you is required.*/}
          {/*</div>*/}

          <AddPhotosWidget
            user={user}
            photo_urls={profile.photo_urls}
            pinned_url={profile.pinned_url}
            setPhotoUrls={(urls) => setProfile('photo_urls', urls)}
            setPinnedUrl={(url) => setProfile('pinned_url', url)}
          />
        </Col>


        <Row className={'justify-end'}>
          <Button
            className="fixed bottom-[90px] lg:bottom-6 right-4 z-50 text-xl"
            disabled={isSubmitting}
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {buttonLabel ?? 'Next'}
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

  const dropdownRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={'Search city...'}
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

