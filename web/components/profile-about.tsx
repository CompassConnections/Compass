import {ClockIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {
  INVERTED_CANNABIS_CHOICES,
  INVERTED_DIET_CHOICES,
  INVERTED_EDUCATION_CHOICES,
  INVERTED_LANGUAGE_CHOICES,
  INVERTED_MBTI_CHOICES,
  INVERTED_POLITICAL_CHOICES,
  INVERTED_PSYCHEDELICS_CHOICES,
  INVERTED_RELATIONSHIP_STATUS_CHOICES,
  INVERTED_RELIGION_CHOICES,
  INVERTED_SUBSTANCE_INTENTION_CHOICES,
  SUBSTANCE_PREFERENCE_ABOUT,
} from 'common/choices'
import {MAX_INT, MIN_INT} from 'common/constants'
import {convertGenderPlural, Gender} from 'common/gender'
import {getGoogleMapsUrl, getLocationText} from 'common/geodb'
import {formatHeight, MeasurementSystem} from 'common/measurement-utils'
import {Profile} from 'common/profiles/profile'
import {Socials} from 'common/socials'
import {UserActivity} from 'common/user'
import {Home, Languages, Leaf, Salad} from 'lucide-react'
import React, {ReactNode} from 'react'
import {BiSolidDrink} from 'react-icons/bi'
import {FaHeart, FaUsers} from 'react-icons/fa'
import {FaChild} from 'react-icons/fa6'
import {FiUser} from 'react-icons/fi'
import {GiRing} from 'react-icons/gi'
import {HiOutlineGlobe} from 'react-icons/hi'
import {LuBriefcase, LuCigarette, LuCigaretteOff, LuGraduationCap} from 'react-icons/lu'
import {MdNoDrinks} from 'react-icons/md'
import {PiHandsPrayingBold, PiMagnifyingGlassBold} from 'react-icons/pi'
import {RiScales3Line} from 'react-icons/ri'
import {TbBulb, TbCheck, TbMoodSad, TbUsers} from 'react-icons/tb'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {CustomLink} from 'web/components/links'
import {UserHandles} from 'web/components/user/user-handles'
import {useChoicesContext} from 'web/hooks/use-choices'
import {CustomMushroom} from 'web/lib/icons/mushroom'
import {useLocale, useT} from 'web/lib/locale'
import {getSeekingConnectionText} from 'web/lib/profile/seeking'
import {convertRace} from 'web/lib/util/convert-types'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'
import {fromNow} from 'web/lib/util/time'

function Divider() {
  return (
    <div
      className="w-full"
      style={{
        height: '1px',
        background: 'rgb(var(--color-canvas-200))',
        margin: '12px 0',
      }}
    />
  )
}

export function AboutRow(props: {
  icon: ReactNode
  text?: string | null | string[]
  preText?: string
  suffix?: string | null
  testId?: string
  children?: ReactNode
}) {
  const {icon, text, preText, suffix, testId} = props
  const t = useT()
  let children = props.children
  if (!children) {
    if (!text?.length && !preText && !suffix) {
      return <></>
    }
    let formattedText = ''
    if (preText) {
      formattedText += preText
    }
    if (text?.length) {
      formattedText += stringOrStringArrayToText({
        text: text,
        preText: preText,
        asSentence: false,
        capitalizeFirstLetterOption: true,
        t: t,
      })
    }
    children = <div>{formattedText}</div>
  }

  return (
    <Row className="items-start gap-2.5" data-testid={testId}>
      <div
        className="bg-canvas-100 border-canvas-200 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-ink-500"
        style={{width: '32px', height: '32px', marginTop: '1px'}}
      >
        {icon}
      </div>
      <Col className={'w-full'}>
        {children}
        {suffix && (
          <div className={'text-ink-500'} style={{fontSize: '12.5px', marginTop: '2px'}}>
            {suffix}
          </div>
        )}
      </Col>
    </Row>
  )
}

export default function ProfileAbout(props: {
  profile: Profile
  userActivity?: UserActivity
  isCurrentUser: boolean
}) {
  const {profile, userActivity, isCurrentUser} = props

  return (
    <Col className={clsx('relative gap-3 overflow-hidden rounded')}>
      <SeekingAndRelationship profile={profile} />
      <Education profile={profile} />
      <OccupationAndWork profile={profile} />
      <Politics profile={profile} />
      <Religion profile={profile} />
      <Ethnicity profile={profile} />
      <RaisedIn profile={profile} />
      <Smoker profile={profile} />
      <Drinks profile={profile} />
      <Cannabis profile={profile} />
      <Psychedelics profile={profile} />
      <Diet profile={profile} />
      <LanguagesSection profile={profile} />
      <CombinedChildren profile={profile} />
      {!isCurrentUser && (
        <>
          <LastOnline lastOnlineTime={userActivity?.last_online_time} />
        </>
      )}
    </Col>
  )
}

export function ProfileInterestsAndCauses(props: {profile: Profile}) {
  const {profile} = props
  const t = useT()
  const choices = useChoicesContext()
  const {locale} = useLocale()

  const interests = profile.interests
    ?.map((id) => choices?.['interests']?.[id])
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, locale)) as string[]

  const causes = profile.causes
    ?.map((id) => choices?.['causes']?.[id])
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, locale)) as string[]

  if (!interests?.length && !causes?.length) return null

  return (
    <Col className={clsx('relative gap-3 overflow-hidden rounded')}>
      {interests && interests.length > 0 && (
        <>
          {/*<div*/}
          {/*  style={{*/}
          {/*    fontSize: '12px',*/}
          {/*    color: 'rgb(var(--color-ink-300))',*/}
          {/*    textTransform: 'uppercase',*/}
          {/*    letterSpacing: '0.07em',*/}
          {/*    fontWeight: '500',*/}
          {/*    marginBottom: '8px',*/}
          {/*  }}*/}
          {/*>*/}
          {/*  {t('profile.interests', 'Interests')}*/}
          {/*</div>*/}
          <div className="flex flex-wrap gap-2">
            {interests.map((interest, i) => (
              <span
                key={i}
                className="border-canvas-300 text-primary-700 bg-canvas-200"
                style={{
                  padding: '5px 13px',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: '400',
                  letterSpacing: '0.01em',
                  borderWidth: '1px',
                }}
              >
                {interest}
              </span>
            ))}
          </div>
        </>
      )}
      {causes && causes.length > 0 && (
        <>
          {interests && interests.length > 0 && (
            <div
              className="border-canvas-200"
              style={{borderBottomWidth: '1px', margin: '12px 0'}}
            />
          )}
          <div
            style={{
              fontSize: '12px',
              color: 'rgb(var(--color-ink-300))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              fontWeight: '500',
              marginBottom: '8px',
            }}
          >
            {t('profile.causes', 'Causes')}
          </div>
          <div className="flex flex-wrap gap-2">
            {causes.map((cause, i) => (
              <span
                key={i}
                className="border-primary-200 text-primary-700 bg-primary-50"
                style={{
                  padding: '5px 13px',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: '400',
                  letterSpacing: '0.01em',
                  borderWidth: '1px',
                }}
              >
                {cause}
              </span>
            ))}
          </div>
        </>
      )}
    </Col>
  )
}

export function ProfilePersonality(props: {profile: Profile}) {
  const {profile} = props

  if (!profile.mbti && !profile.big5_agreeableness) return null

  // MBTI type name mapping
  const MBTI_TYPE_NAMES: Record<string, string> = {
    INTJ: 'Architect',
    INTP: 'Logician',
    ENTJ: 'Commander',
    ENTP: 'Debater',
    INFJ: 'Advocate',
    INFP: 'Mediator',
    ENFJ: 'Protagonist',
    ENFP: 'Campaigner',
    ISTJ: 'Logistician',
    ISFJ: 'Defender',
    ESTJ: 'Executive',
    ESFJ: 'Consul',
    ISTP: 'Virtuoso',
    ISFP: 'Adventurer',
    ESTP: 'Entrepreneur',
    ESFP: 'Entertainer',
  }

  const mbtiType = profile.mbti ? INVERTED_MBTI_CHOICES[profile.mbti] : null
  const mbtiTypeName = mbtiType ? MBTI_TYPE_NAMES[mbtiType] : null

  return (
    <Col className={clsx('relative gap-3 overflow-hidden rounded')}>
      {profile.mbti && (
        <div style={{marginBottom: '18px'}}>
          <div
            style={{
              fontSize: '12px',
              color: 'rgb(var(--color-ink-300))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              fontWeight: '500',
              marginBottom: '8px',
            }}
          >
            MBTI
          </div>
          <div
            className="border-canvas-200 bg-canvas-100 inline-flex items-center gap-2 rounded-lg border px-4 py-2"
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '20px',
              fontWeight: '600',
              color: 'rgb(var(--color-ink-900))',
              letterSpacing: '0.08em',
            }}
          >
            {mbtiType}
            {mbtiTypeName && (
              <span
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '11px',
                  color: 'rgb(var(--color-ink-500))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: '400',
                  marginLeft: '2px',
                  verticalAlign: 'middle',
                }}
              >
                {mbtiTypeName}
              </span>
            )}
          </div>
        </div>
      )}
      <Big5Traits profile={profile} />
    </Col>
  )
}

export function ProfileLinks(props: {profile: Profile}) {
  const {profile} = props
  const links = (profile.links ?? {}) as Socials

  if (!links || Object.keys(links).length === 0) return null

  return (
    <Col className={clsx('relative gap-3 overflow-hidden rounded')}>
      <UserHandles links={links} />
    </Col>
  )
}

export function getSeekingText(profile: Profile, t: any, short?: boolean | undefined) {
  const prefGender = profile.pref_gender
  const min = profile.pref_age_min
  const max = profile.pref_age_max
  const seekingGenderText = stringOrStringArrayToText({
    text:
      !prefGender?.length || (prefGender?.includes('male') && prefGender?.includes('female'))
        ? [t('profile.gender.plural.people', 'people')]
        : prefGender?.map((gender) =>
            t(
              `profile.gender.plural.${gender}`,
              convertGenderPlural(gender as Gender),
            ).toLowerCase(),
          ),
    preText: t('common.with', 'with'),
    asSentence: true,
    capitalizeFirstLetterOption: false,
    t: t,
  })

  const noMin = (min ?? MIN_INT) <= 18
  const noMax = (max ?? MAX_INT) >= 99

  const ageRangeText =
    noMin && noMax
      ? t('profile.age_any', 'of any age')
      : min == max
        ? t('profile.age_exact', 'exactly {min} years old', {min})
        : noMax
          ? t('profile.age_older_than', 'older than {min}', {min})
          : noMin
            ? t('profile.age_younger_than', 'younger than {max}', {max})
            : t('profile.age_between', 'between {min} - {max} years old', {
                min,
                max,
              })

  return `${getSeekingConnectionText(profile, t, short)} ${seekingGenderText} ${ageRangeText}`
}

function SeekingAndRelationship(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const seekingText = getSeekingText(profile, t)
  const relationship_status = profile.relationship_status ?? []

  if (relationship_status.length === 0 && !seekingText) return null

  const relationshipText =
    relationship_status.length > 0
      ? relationship_status
          ?.map((v) =>
            t(`profile.relationship_status.${v}`, INVERTED_RELATIONSHIP_STATUS_CHOICES[v]),
          )
          .join(', ')
      : null

  // const key = relationship_status[0] as keyof typeof RELATIONSHIP_ICONS
  const icon = null // RELATIONSHIP_ICONS[key] ?? FaHeart

  return (
    <>
      <Row className="items-start gap-2.5">
        <div
          className="bg-canvas-100 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-500"
          style={{width: '32px', height: '32px', marginTop: '1px'}}
        >
          {icon ? (
            React.createElement(icon, {className: 'h-5 w-5'})
          ) : (
            <PiMagnifyingGlassBold className="h-5 w-5" />
          )}
        </div>
        <Col className={'w-full'}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: 'rgb(var(--color-ink-300))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: '1px',
            }}
          >
            {t('profile.connection_goals', 'Connection Goals')}
          </div>
          <div style={{fontSize: '14px', color: 'rgb(var(--color-ink-900))'}}>{seekingText}</div>
          {relationshipText && (
            <div className={'text-ink-500'} style={{fontSize: '12.5px', marginTop: '2px'}}>
              {relationshipText}
            </div>
          )}
        </Col>
      </Row>
      <Divider />
    </>
  )
}

function Education(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const educationLevel = profile.education_level
  const university = profile.university

  let text = ''

  if (educationLevel) {
    text += capitalizeAndRemoveUnderscores(
      t(`profile.education.${educationLevel}`, INVERTED_EDUCATION_CHOICES[educationLevel]),
    )
  }
  if (university) {
    if (educationLevel) text += ` ${t('profile.at', 'at')} `
    text += capitalizeAndRemoveUnderscores(university)
  }
  if (text.length === 0) {
    return <></>
  }

  return (
    <>
      <Row className="items-start gap-2.5">
        <div
          className="bg-canvas-100 border-canvas-200 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-ink-500"
          style={{width: '32px', height: '32px', marginTop: '1px'}}
        >
          <LuGraduationCap className="h-5 w-5" />
        </div>
        <Col className={'w-full'}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: 'rgb(var(--color-ink-300))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: '1px',
            }}
          >
            {t('profile.education', 'Education')}
          </div>
          <div style={{fontSize: '14px', color: 'rgb(var(--color-ink-900))'}}>{text}</div>
        </Col>
      </Row>
      <Divider />
    </>
  )
}

function OccupationAndWork(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const choices = useChoicesContext()
  const {locale} = useLocale()

  const occupation_title = profile.occupation_title
  const company = profile.company
  const workAreas = profile.work
    ?.map((id) => choices?.['work']?.[id])
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, locale)) as string[]

  if (!company && !occupation_title && !workAreas?.length) {
    return <></>
  }

  const occupationText = `${
    occupation_title ? capitalizeAndRemoveUnderscores(occupation_title) : ''
  }${occupation_title && company ? ` ${t('profile.at', 'at')} ` : ''}${
    company ? capitalizeAndRemoveUnderscores(company) : ''
  }`

  const workText = workAreas?.join(' · ')

  return (
    <>
      <Row className="items-start gap-2.5">
        <div
          className="bg-canvas-100 border-canvas-200 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-ink-500"
          style={{width: '32px', height: '32px', marginTop: '1px'}}
        >
          <LuBriefcase className="h-5 w-5" />
        </div>
        <Col className={'w-full'}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: 'rgb(var(--color-ink-300))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: '1px',
            }}
          >
            {t('profile.work', 'Work')}
          </div>
          <div style={{fontSize: '14px', color: 'rgb(var(--color-ink-900))'}}>{occupationText}</div>
          {workText && (
            <div className={'text-ink-500'} style={{fontSize: '12.5px', marginTop: '2px'}}>
              {workText}
            </div>
          )}
        </Col>
      </Row>
      <Divider />
    </>
  )
}

function Politics(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const politicalBeliefs = profile.political_beliefs
  const politicalDetails = profile.political_details

  if (!politicalBeliefs || politicalBeliefs.length === 0) return null

  const text = politicalBeliefs
    .map((belief) => t(`profile.political.${belief}`, INVERTED_POLITICAL_CHOICES[belief]))
    .join(', ')

  return (
    <>
      <Row className="items-start gap-2.5">
        <div
          className="bg-canvas-100 border-canvas-200 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-ink-500"
          style={{width: '32px', height: '32px', marginTop: '1px'}}
        >
          <RiScales3Line className="h-5 w-5" />
        </div>
        <Col className={'w-full'}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: 'rgb(var(--color-ink-300))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: '1px',
            }}
          >
            {t('profile.politics', 'Politics')}
          </div>
          <div style={{fontSize: '14px', color: 'rgb(var(--color-ink-900))'}}>{text}</div>
          {politicalDetails && (
            <div className={'text-ink-500'} style={{fontSize: '12.5px', marginTop: '2px'}}>
              "{politicalDetails}"
            </div>
          )}
        </Col>
      </Row>
      <Divider />
    </>
  )
}

function Religion(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const religion = profile.religion
  const religiousBeliefs = profile.religious_beliefs

  if (!religion || religion.length === 0) return null

  const text = religion
    .map((belief) => t(`profile.religion.${belief}`, INVERTED_RELIGION_CHOICES[belief]))
    .join(', ')

  return (
    <>
      <Row className="items-start gap-2.5">
        <div
          className="bg-canvas-100 border-canvas-200 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-ink-500"
          style={{width: '32px', height: '32px', marginTop: '1px'}}
        >
          <PiHandsPrayingBold className="h-5 w-5" />
        </div>
        <Col className={'w-full'}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: 'rgb(var(--color-ink-300))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: '1px',
            }}
          >
            {t('profile.religion', 'Religion')}
          </div>
          <div style={{fontSize: '14px', color: 'rgb(var(--color-ink-900))'}}>{text}</div>
          {religiousBeliefs && (
            <div className={'text-ink-500'} style={{fontSize: '12.5px', marginTop: '2px'}}>
              "{religiousBeliefs}"
            </div>
          )}
        </Col>
      </Row>
      <Divider />
    </>
  )
}

function Ethnicity(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const ethnicity = profile.ethnicity?.filter((r) => r !== 'other')

  if (!ethnicity || ethnicity.length === 0) return null

  const text = ethnicity.map((r: any) => t(`profile.race.${r}`, convertRace(r))).join(', ')

  return (
    <>
      <Row className="items-start gap-2.5">
        <div
          className="bg-canvas-100 border-canvas-200 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-ink-500"
          style={{width: '32px', height: '32px', marginTop: '1px'}}
        >
          <HiOutlineGlobe className="h-5 w-5" />
        </div>
        <Col className={'w-full'}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: 'rgb(var(--color-ink-300))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: '1px',
            }}
          >
            {t('profile.ethnicity', 'Ethnicity')}
          </div>
          <div style={{fontSize: '14px', color: 'rgb(var(--color-ink-900))'}}>{text}</div>
        </Col>
      </Row>
      <Divider />
    </>
  )
}

function Smoker(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const isSmoker = profile.is_smoker
  if (isSmoker == null) return null
  const text = isSmoker ? t('profile.smokes', 'Smokes') : t('profile.doesnt_smoke', "Doesn't smoke")
  const icon = isSmoker ? (
    <LuCigarette className="h-5 w-5" />
  ) : (
    <LuCigaretteOff className="h-5 w-5" />
  )

  return (
    <>
      <Row className="items-start gap-2.5">
        <div
          className="bg-canvas-100 border-canvas-200 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-ink-500"
          style={{width: '32px', height: '32px', marginTop: '1px'}}
        >
          {icon}
        </div>
        <Col className={'w-full'}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: 'rgb(var(--color-ink-300))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: '1px',
            }}
          >
            {t('profile.smoking', 'Smoking')}
          </div>
          <div style={{fontSize: '14px', color: 'rgb(var(--color-ink-900))'}}>{text}</div>
        </Col>
      </Row>
      <Divider />
    </>
  )
}

function Drinks(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const drinksPerMonth = profile.drinks_per_month
  if (drinksPerMonth == null) return null

  const text =
    drinksPerMonth === 0
      ? t('profile.doesnt_drink', "Doesn't drink")
      : drinksPerMonth === 1
        ? t('profile.drinks_one', '1 drink per month')
        : t('profile.drinks_many', '{count} drinks per month', {
            count: drinksPerMonth,
          })
  const icon =
    drinksPerMonth === 0 ? <MdNoDrinks className="h-5 w-5" /> : <BiSolidDrink className="h-5 w-5" />

  return (
    <>
      <Row className="items-start gap-2.5">
        <div
          className="bg-canvas-100 border-canvas-200 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-ink-500"
          style={{width: '32px', height: '32px', marginTop: '1px'}}
        >
          {icon}
        </div>
        <Col className={'w-full'}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: 'rgb(var(--color-ink-300))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: '1px',
            }}
          >
            {t('profile.alcohol', 'Alcohol')}
          </div>
          <div style={{fontSize: '14px', color: 'rgb(var(--color-ink-900))'}}>{text}</div>
        </Col>
      </Row>
      <Divider />
    </>
  )
}

function Diet(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const diet = profile.diet

  if (!diet || diet.length === 0) return null

  const text = diet.map((e) => t(`profile.diet.${e}`, INVERTED_DIET_CHOICES[e])).join(', ')

  return (
    <>
      <Row className="items-start gap-2.5">
        <div
          className="bg-canvas-100 border-canvas-200 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-ink-500"
          style={{width: '32px', height: '32px', marginTop: '1px'}}
        >
          <Salad className="h-5 w-5" />
        </div>
        <Col className={'w-full'}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: 'rgb(var(--color-ink-300))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: '1px',
            }}
          >
            {t('profile.diet', 'Diet')}
          </div>
          <div style={{fontSize: '14px', color: 'rgb(var(--color-ink-900))'}}>{text}</div>
        </Col>
      </Row>
      <Divider />
    </>
  )
}

function LanguagesSection(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const languages = profile.languages

  if (!languages || languages.length === 0) return null

  const text = languages
    .map((v) => t(`profile.language.${v}`, INVERTED_LANGUAGE_CHOICES[v]))
    .join(', ')

  return (
    <>
      <Row className="items-start gap-2.5">
        <div
          className="bg-canvas-100 border-canvas-200 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-ink-500"
          style={{width: '32px', height: '32px', marginTop: '1px'}}
        >
          <Languages className="h-5 w-5" />
        </div>
        <Col className={'w-full'}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: 'rgb(var(--color-ink-300))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: '1px',
            }}
          >
            {t('profile.languages', 'Languages')}
          </div>
          <div style={{fontSize: '14px', color: 'rgb(var(--color-ink-900))'}}>{text}</div>
        </Col>
      </Row>
      <Divider />
    </>
  )
}

function Cannabis(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const cannabis = profile.cannabis
  if (!cannabis) return null

  const parts = t(`profile.cannabis.${cannabis}`, INVERTED_CANNABIS_CHOICES[cannabis])

  // Intention chips (if not "never" and has intentions)
  let intentionChips: React.ReactNode | null = null
  if (cannabis !== 'never_not_interested' && profile.cannabis_intention?.length) {
    intentionChips = (
      <div className="flex flex-wrap gap-2 mt-2">
        {profile.cannabis_intention.map((i) => (
          <span
            key={i}
            className="border-canvas-200 bg-canvas-100 text-ink-500 rounded-full border px-2.5 py-1 text-xs"
            style={{
              padding: '4px 11px',
              borderRadius: '100px',
              fontSize: '12.5px',
              backgroundColor: 'rgb(var(--color-canvas-100))',
              color: 'rgb(var(--color-ink-500))',
              border: '1px solid rgb(var(--color-canvas-200))',
            }}
          >
            {t(`profile.substance_intention.${i}`, INVERTED_SUBSTANCE_INTENTION_CHOICES[i])}
          </span>
        ))}
      </div>
    )
  }

  // Preference for partner
  let suffix: string | undefined
  if (profile.cannabis_pref?.length) {
    const prefs = profile.cannabis_pref.map((p) =>
      t(
        `profile.substance_pref_viewer.${p}`,
        SUBSTANCE_PREFERENCE_ABOUT[p as keyof typeof SUBSTANCE_PREFERENCE_ABOUT],
      ),
    )
    const formatted =
      prefs.length > 1 ? `${prefs.slice(0, -1).join(', ')} or ${prefs[prefs.length - 1]}` : prefs[0]
    suffix = `${t('profile.pref_you', 'Prefers you')} ${formatted}`
  }

  return (
    <>
      <Row className="items-start gap-2.5">
        <div
          className="bg-canvas-100 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-500"
          style={{width: '32px', height: '32px', marginTop: '1px'}}
        >
          <Leaf className="h-5 w-5" />
        </div>
        <Col className={'w-full'}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: 'rgb(var(--color-ink-300))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: '1px',
            }}
          >
            {t('profile.cannabis', 'Cannabis')}
          </div>
          <div style={{fontSize: '14px', color: 'rgb(var(--color-ink-900))'}}>{parts}</div>
          {intentionChips}
          {suffix && (
            <div className={'text-ink-500 mt-2'} style={{fontSize: '12.5px'}}>
              {suffix}
            </div>
          )}
        </Col>
      </Row>
      <Divider />
    </>
  )
}

function Psychedelics(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const psychedelics = profile.psychedelics
  if (!psychedelics) return null

  const parts = t(
    `profile.psychedelics.${psychedelics}`,
    INVERTED_PSYCHEDELICS_CHOICES[psychedelics],
  )

  // Intention chips (if not "never" and has intentions)
  let intentionChips: React.ReactNode | null = null
  if (psychedelics !== 'never_not_interested' && profile.psychedelics_intention?.length) {
    intentionChips = (
      <div className="flex flex-wrap gap-2 mt-2">
        {profile.psychedelics_intention.map((i) => (
          <span
            key={i}
            className="border-canvas-200 bg-canvas-100 text-ink-500 rounded-full border px-2.5 py-1 text-xs"
            style={{
              padding: '4px 11px',
              borderRadius: '100px',
              fontSize: '12.5px',
              backgroundColor: 'rgb(var(--color-canvas-100))',
              color: 'rgb(var(--color-ink-500))',
              border: '1px solid rgb(var(--color-canvas-200))',
            }}
          >
            {t(`profile.substance_intention.${i}`, INVERTED_SUBSTANCE_INTENTION_CHOICES[i])}
          </span>
        ))}
      </div>
    )
  }

  // Preference for partner
  let suffix: string | undefined
  if (profile.psychedelics_pref?.length) {
    const prefs = profile.psychedelics_pref.map((p) =>
      t(
        `profile.substance_pref_viewer.${p}`,
        SUBSTANCE_PREFERENCE_ABOUT[p as keyof typeof SUBSTANCE_PREFERENCE_ABOUT],
      ),
    )
    const formatted =
      prefs.length > 1 ? `${prefs.slice(0, -1).join(', ')} or ${prefs[prefs.length - 1]}` : prefs[0]
    suffix = `${t('profile.pref_you', 'Prefers you')} ${formatted}`
  }

  return (
    <>
      <Row className="items-start gap-2.5">
        <div
          className="bg-canvas-100 border-canvas-200 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-ink-500"
          style={{width: '32px', height: '32px', marginTop: '1px'}}
        >
          <CustomMushroom className="h-5 w-5" />
        </div>
        <Col className={'w-full'}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: 'rgb(var(--color-ink-300))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: '1px',
            }}
          >
            {t('profile.psychedelics', 'Psychedelics')}
          </div>
          <div style={{fontSize: '14px', color: 'rgb(var(--color-ink-900))'}}>{parts}</div>
          {intentionChips}
          {suffix && (
            <div className={'text-ink-500 mt-2'} style={{fontSize: '12.5px'}}>
              {suffix}
            </div>
          )}
        </Col>
      </Row>
      <Divider />
    </>
  )
}

// function WantsKids(props: {profile: Profile}) {
//   const t = useT()
//   const {profile} = props
//   const wantsKidsStrength = profile.wants_kids_strength
//   if (wantsKidsStrength == null || wantsKidsStrength < 0) return null
//   const wantsKidsText =
//     wantsKidsStrength == 0
//       ? t('profile.wants_kids_0', 'Does not want children')
//       : wantsKidsStrength == 1
//         ? t('profile.wants_kids_1', 'Prefers not to have children')
//         : wantsKidsStrength == 2
//           ? t('profile.wants_kids_2', 'Neutral or open to having children')
//           : wantsKidsStrength == 3
//             ? t('profile.wants_kids_3', 'Leaning towards wanting children')
//             : t('profile.wants_kids_4', 'Wants children')
//
//   return (
//     <AboutRow
//       icon={<MdOutlineChildFriendly className="h-5 w-5" />}
//       text={wantsKidsText}
//       testId="profile-about-wants-kids"
//     />
//   )
// }

function LastOnline(props: {lastOnlineTime?: string}) {
  const t = useT()
  const {locale} = useLocale()
  const {lastOnlineTime} = props
  if (!lastOnlineTime) return null
  return (
    <>
      <Row className="items-start gap-2.5" data-testid="profile-about-last-online">
        <div
          className="bg-canvas-100 border-canvas-200 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-ink-500"
          style={{width: '32px', height: '32px', marginTop: '1px'}}
        >
          <ClockIcon className="h-5 w-5" />
        </div>
        <Col className={'w-full'}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: 'rgb(var(--color-ink-300))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: '1px',
            }}
          >
            {t('profile.activity', 'Activity')}
          </div>
          <div style={{fontSize: '14px', color: 'rgb(var(--color-ink-900))'}}>
            {t('profile.last_online', 'Active {time}', {
              time: fromNow(lastOnlineTime, true, t, locale),
            })}
          </div>
        </Col>
      </Row>
    </>
  )
}

function Big5Traits(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props

  const traits = [
    {
      key: 'big5_openness',
      icon: <TbBulb className="h-5 w-5" />,
      label: t('profile.big5_openness', 'Openness'),
      value: profile.big5_openness,
    },
    {
      key: 'big5_conscientiousness',
      icon: <TbCheck className="h-5 w-5" />,
      label: t('profile.big5_conscientiousness', 'Conscientiousness'),
      value: profile.big5_conscientiousness,
    },
    {
      key: 'big5_extraversion',
      icon: <TbUsers className="h-5 w-5" />,
      label: t('profile.big5_extraversion', 'Extraversion'),
      value: profile.big5_extraversion,
    },
    {
      key: 'big5_agreeableness',
      icon: <FaHeart className="h-5 w-5" />,
      label: t('profile.big5_agreeableness', 'Agreeableness'),
      value: profile.big5_agreeableness,
    },
    {
      key: 'big5_neuroticism',
      icon: <TbMoodSad className="h-5 w-5" />,
      label: t('profile.big5_neuroticism', 'Neuroticism'),
      value: profile.big5_neuroticism,
    },
  ]

  const hasAnyTraits = traits.some((trait) => trait.value !== null && trait.value !== undefined)

  if (!hasAnyTraits) {
    return <></>
  }

  return (
    <Col className="gap-3 w-full" data-testid="profile-about-big-five-personality-traits">
      <div
        className="text-ink-600"
        style={{
          fontSize: '12px',
          color: 'rgb(var(--color-ink-300))',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          fontWeight: '500',
          marginBottom: '8px',
        }}
      >
        {t('profile.big5', 'Big Five')}
      </div>
      <div className="flex flex-col gap-3">
        {traits.map((trait) => {
          if (trait.value === null || trait.value === undefined) return null

          const isHigh = trait.value >= 70
          const isLow = trait.value <= 30

          return (
            <div key={trait.key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-900 font-normal">{trait.label}</span>
                <span
                  className="text-sm text-ink-500"
                  style={{fontFamily: 'Cormorant Garamond, serif', fontSize: '15px'}}
                >
                  {trait.value}
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden bg-canvas-200"
                style={{height: '6px'}}
              >
                <div
                  className="h-full rounded-full transition-all duration-600"
                  style={{
                    width: `${trait.value}%`,
                    backgroundColor: isHigh
                      ? 'rgb(var(--color-primary-500))'
                      : isLow
                        ? 'rgb(var(--color-canvas-300))'
                        : 'rgb(var(--color-primary-400))',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Col>
  )
}

function CombinedChildren(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props

  const hasKidsText =
    typeof profile.has_kids === 'number'
      ? profile.has_kids == 0
        ? t('profile.has_kids.doesnt_have_kids', 'Does not have children')
        : profile.has_kids > 1
          ? t('profile.has_kids_many', 'Has {count} kids', {
              count: profile.has_kids,
            })
          : t('profile.has_kids_one', 'Has {count} kid', {
              count: profile.has_kids,
            })
      : null

  const wantsKidsStrength = profile.wants_kids_strength
  const wantsKidsText =
    wantsKidsStrength != null && wantsKidsStrength >= 0
      ? wantsKidsStrength == 0
        ? t('profile.wants_kids_0', 'Does not want children')
        : wantsKidsStrength == 1
          ? t('profile.wants_kids_1', 'Prefers not to have children')
          : wantsKidsStrength == 2
            ? t('profile.wants_kids_2', 'Neutral or open to having children')
            : wantsKidsStrength == 3
              ? t('profile.wants_kids_3', 'Leaning towards wanting children')
              : t('profile.wants_kids_4', 'Wants children')
      : null

  if (!hasKidsText && !wantsKidsText) return null

  return (
    <>
      <Row className="items-start gap-2.5">
        <div
          className="bg-canvas-100 border-canvas-200 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-ink-500"
          style={{width: '32px', height: '32px', marginTop: '1px'}}
        >
          <FaChild className="h-5 w-5" />
        </div>
        <Col className={'w-full'}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: 'rgb(var(--color-ink-300))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: '1px',
            }}
          >
            {t('profile.children', 'Children')}
          </div>
          <div style={{fontSize: '14px', color: 'rgb(var(--color-ink-900))'}}>{hasKidsText}</div>
          {wantsKidsText && (
            <div className={'text-ink-500'} style={{fontSize: '12.5px', marginTop: '2px'}}>
              {wantsKidsText}
            </div>
          )}
        </Col>
      </Row>

      <Divider />
    </>
  )
}

// function HasKids(props: {profile: Profile}) {
//   const t = useT()
//   const {profile} = props
//   if (typeof profile.has_kids !== 'number') return null
//   const hasKidsText =
//     profile.has_kids == 0
//       ? t('profile.has_kids.doesnt_have_kids', 'Does not have children')
//       : profile.has_kids > 1
//         ? t('profile.has_kids_many', 'Has {count} kids', {
//             count: profile.has_kids,
//           })
//         : t('profile.has_kids_one', 'Has {count} kid', {
//             count: profile.has_kids,
//           })
//   const faChild = <FaChild className="h-5 w-5" />
//   const icon =
//     profile.has_kids === 0 ? (
//       <div className="relative h-5 w-5">
//         {faChild}
//         <div className="absolute inset-0">
//           {/*<div className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 rotate-45 transform bg-ink-500"/>*/}
//           <div className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 -rotate-45 transform bg-ink-1000" />
//         </div>
//       </div>
//     ) : (
//       faChild
//     )
//   return <AboutRow icon={icon} text={hasKidsText} testId={'profile-about-has-kids'} />
// }

function RaisedIn(props: {profile: Profile}) {
  const t = useT()
  const locationText = getLocationText(props.profile, 'raised_in_')
  if (!locationText) {
    return null
  }
  return (
    <>
      <Row className="items-start gap-2.5">
        <div
          className="bg-canvas-100 border-canvas-200 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-ink-500"
          style={{width: '32px', height: '32px', marginTop: '1px'}}
        >
          <Home className="h-5 w-5" />
        </div>
        <Col className={'w-full'}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: 'rgb(var(--color-ink-300))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: '1px',
            }}
          >
            {t('profile.raised_in', 'Raised In')}
          </div>
          <div style={{fontSize: '14px', color: 'rgb(var(--color-ink-900))'}}>
            <CustomLink href={getGoogleMapsUrl(locationText)} className={'hover:text-primary-500'}>
              {locationText}
            </CustomLink>
          </div>
        </Col>
      </Row>
      <Divider />
    </>
  )
}

export const formatProfileValue = (
  key: string,
  value: any,
  measurementSystem: MeasurementSystem = 'imperial',
) => {
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  switch (key) {
    case 'created_time':
    case 'last_online_time':
      return fromNow(new Date(value).valueOf())
    case 'is_smoker':
    case 'diet':
    case 'has_pets':
      return value ? 'Yes' : 'No'
    case 'height_in_inches':
      return formatHeight(value, measurementSystem)
    case 'pref_age_max':
    case 'pref_age_min':
      return null // handle this in a special case
    case 'wants_kids_strength':
      return renderAgreementScale(value)
    default:
      return value
  }
}

const renderAgreementScale = (value: number) => {
  if (value == 1) return 'Strongly disagree'
  if (value == 2) return 'Disagree'
  if (value == 3) return 'Neutral'
  if (value == 4) return 'Agree'
  if (value == 5) return 'Strongly agree'
  return ''
}

const capitalizeAndRemoveUnderscores = (str: string) => {
  const withSpaces = str.replace(/_/g, ' ')
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1)
}

export const RELATIONSHIP_ICONS = {
  single: FiUser,
  married: GiRing,
  casual: FaHeart,
  long_term: FaHeart,
  open: FaUsers,
} as const
