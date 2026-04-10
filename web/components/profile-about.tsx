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
import {getLocationText} from 'common/geodb'
import {formatHeight, MeasurementSystem} from 'common/measurement-utils'
import {Profile} from 'common/profiles/profile'
import {Socials} from 'common/socials'
import {UserActivity} from 'common/user'
import {capitalize} from 'lodash'
import {
  BarChart2,
  Brain,
  Briefcase,
  HandHeart,
  Home,
  Languages,
  Leaf,
  Salad,
  Sparkles,
} from 'lucide-react'
import React, {ReactNode} from 'react'
import {BiSolidDrink} from 'react-icons/bi'
import {FaHeart, FaUsers} from 'react-icons/fa'
import {FaChild} from 'react-icons/fa6'
import {FiUser} from 'react-icons/fi'
import {GiRing} from 'react-icons/gi'
import {HiOutlineGlobe} from 'react-icons/hi'
import {LuBriefcase, LuCigarette, LuCigaretteOff, LuGraduationCap} from 'react-icons/lu'
import {MdNoDrinks, MdOutlineChildFriendly} from 'react-icons/md'
import {PiHandsPrayingBold, PiMagnifyingGlassBold} from 'react-icons/pi'
import {RiScales3Line} from 'react-icons/ri'
import {TbBulb, TbCheck, TbMoodSad, TbUsers} from 'react-icons/tb'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {UserHandles} from 'web/components/user/user-handles'
import {useChoicesContext} from 'web/hooks/use-choices'
import {CustomMushroom} from 'web/lib/icons/mushroom'
import {useLocale, useT} from 'web/lib/locale'
import {getSeekingConnectionText} from 'web/lib/profile/seeking'
import {convertRace} from 'web/lib/util/convert-types'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'
import {fromNow} from 'web/lib/util/time'

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
    <Row className="items-start gap-2" data-testid={testId}>
      <div className="text-ink-600 w-5 mt-0.5">{icon}</div>
      <Col className={'w-full'}>
        {children}
        {suffix && <div className={'guidance'}>{capitalize(suffix)}</div>}
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
  const t = useT()
  const choices = useChoicesContext()
  const {locale} = useLocale()

  return (
    <Col className={clsx('bg-canvas-0 relative gap-3 overflow-hidden rounded px-4')}>
      <Seeking profile={profile} />
      <RelationshipStatus profile={profile} />
      <Education profile={profile} />
      <Occupation profile={profile} />
      <AboutRow
        icon={<Briefcase className="h-5 w-5" />}
        text={
          profile.work
            ?.map((id) => choices?.['work']?.[id])
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, locale)) as string[]
        }
        testId="profile-about-work-area"
      />
      <AboutRow
        icon={<RiScales3Line className="h-5 w-5" />}
        text={profile.political_beliefs?.map((belief) =>
          t(`profile.political.${belief}`, INVERTED_POLITICAL_CHOICES[belief]),
        )}
        suffix={profile.political_details && `"${profile.political_details}"`}
        testId="profile-about-political"
      />
      <AboutRow
        icon={<PiHandsPrayingBold className="h-5 w-5" />}
        text={profile.religion?.map((belief) =>
          t(`profile.religion.${belief}`, INVERTED_RELIGION_CHOICES[belief]),
        )}
        suffix={profile.religious_beliefs && `"${profile.religious_beliefs}"`}
        testId="profile-about-religious"
      />
      <AboutRow
        icon={<Sparkles className="h-5 w-5" />}
        text={
          profile.interests
            ?.map((id) => choices?.['interests']?.[id])
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, locale)) as string[]
        }
        testId="profile-about-interests"
      />
      <AboutRow
        icon={<HandHeart className="h-5 w-5" />}
        text={
          profile.causes
            ?.map((id) => choices?.['causes']?.[id])
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, locale)) as string[]
        }
        testId="profile-about-causes"
      />
      <AboutRow
        icon={<Brain className="h-5 w-5" />}
        text={profile.mbti ? INVERTED_MBTI_CHOICES[profile.mbti] : null}
        testId="profile-about-personality"
      />
      <Big5Traits profile={profile} />
      <AboutRow
        icon={<HiOutlineGlobe className="h-5 w-5" />}
        text={profile.ethnicity
          ?.filter((r) => r !== 'other')
          ?.map((r: any) => t(`profile.race.${r}`, convertRace(r)))}
        testId="profile-about-ethnicity"
      />
      <RaisedIn profile={profile} />
      <Smoker profile={profile} />
      <Drinks profile={profile} />
      <Cannabis profile={profile} />
      <Psychedelics profile={profile} />
      <AboutRow
        icon={<Salad className="h-5 w-5" />}
        text={profile.diet?.map((e) => t(`profile.diet.${e}`, INVERTED_DIET_CHOICES[e]))}
        testId="profile-about-diet"
      />
      <AboutRow
        icon={<Languages className="h-5 w-5" />}
        text={profile.languages?.map((v) =>
          t(`profile.language.${v}`, INVERTED_LANGUAGE_CHOICES[v]),
        )}
        testId="profile-about-languages"
      />
      <HasKids profile={profile} />
      <WantsKids profile={profile} />
      {!isCurrentUser && <LastOnline lastOnlineTime={userActivity?.last_online_time} />}
      <UserHandles links={(profile.links ?? {}) as Socials} />
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

function Seeking(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const text = getSeekingText(profile, t)
  return (
    <AboutRow
      icon={<PiMagnifyingGlassBold className="h-5 w-5" />}
      text={text}
      testId="profile-about-seeking"
    />
  )
}

function RelationshipStatus(props: {profile: Profile}) {
  const {profile} = props
  const t = useT()
  const relationship_status = profile.relationship_status ?? []
  if (relationship_status.length === 0) return
  const key = relationship_status[0] as keyof typeof RELATIONSHIP_ICONS
  const icon = RELATIONSHIP_ICONS[key] ?? FaHeart
  return (
    <AboutRow
      icon={icon ? React.createElement(icon, {className: 'h-5 w-5'}) : null}
      text={relationship_status?.map((v) =>
        t(`profile.relationship_status.${v}`, INVERTED_RELATIONSHIP_STATUS_CHOICES[v]),
      )}
      testId="profile-about-relationship-status"
    />
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
    <AboutRow
      icon={<LuGraduationCap className="h-5 w-5" />}
      text={text}
      testId="profile-about-education"
    />
  )
}

function Occupation(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const occupation_title = profile.occupation_title
  const company = profile.company

  if (!company && !occupation_title) {
    return <></>
  }
  const occupationText = `${
    occupation_title ? capitalizeAndRemoveUnderscores(occupation_title) : ''
  }${occupation_title && company ? ` ${t('profile.at', 'at')} ` : ''}${
    company ? capitalizeAndRemoveUnderscores(company) : ''
  }`
  return (
    <AboutRow
      icon={<LuBriefcase className="h-5 w-5" />}
      text={occupationText}
      testId="profile-about-occupation"
    />
  )
}

function Smoker(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const isSmoker = profile.is_smoker
  if (isSmoker == null) return null
  if (isSmoker) {
    return (
      <AboutRow icon={<LuCigarette className="h-5 w-5" />} text={t('profile.smokes', 'Smokes')} />
    )
  }
  return (
    <AboutRow
      icon={<LuCigaretteOff className="h-5 w-5" />}
      text={t('profile.doesnt_smoke', "Doesn't smoke")}
      testId="profile-about-smoker"
    />
  )
}

function Drinks(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const drinksPerMonth = profile.drinks_per_month
  if (drinksPerMonth == null) return null
  if (drinksPerMonth === 0) {
    return (
      <AboutRow
        icon={<MdNoDrinks className="h-5 w-5" />}
        text={t('profile.doesnt_drink', "Doesn't drink")}
        testId="profile-about-not-drink"
      />
    )
  }
  return (
    <AboutRow
      icon={<BiSolidDrink className="h-5 w-5" />}
      text={
        drinksPerMonth === 1
          ? t('profile.drinks_one', '1 drink per month')
          : t('profile.drinks_many', '{count} drinks per month', {
              count: drinksPerMonth,
            })
      }
      testId="profile-about-drinker"
    />
  )
}

function Cannabis(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const cannabis = profile.cannabis
  if (!cannabis) return null

  const parts: string[] = []

  // Name
  parts.push(t('profile.cannabis.label', 'Cannabis:'))

  // Frequency
  parts.push(t(`profile.cannabis.${cannabis}`, INVERTED_CANNABIS_CHOICES[cannabis]))

  // Intention (if not "never" and has intentions)
  if (cannabis !== 'never_not_interested' && profile.cannabis_intention?.length) {
    const intentions = profile.cannabis_intention
      .map((i) => t(`profile.substance_intention.${i}`, INVERTED_SUBSTANCE_INTENTION_CHOICES[i]))
      .join(', ')
    parts.push(`(${intentions})`)
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
    <AboutRow
      icon={<Leaf className="h-5 w-5" />}
      text={parts.join(' ')}
      testId="profile-about-cannabis"
      suffix={suffix}
    />
  )
}

function Psychedelics(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const psychedelics = profile.psychedelics
  if (!psychedelics) return null

  const parts: string[] = []

  // Name
  parts.push(t('profile.psychedelics.label', 'Psychedelics:'))

  // Frequency
  parts.push(t(`profile.psychedelics.${psychedelics}`, INVERTED_PSYCHEDELICS_CHOICES[psychedelics]))

  // Intention (if not "never" and has intentions)
  if (psychedelics !== 'never_not_interested' && profile.psychedelics_intention?.length) {
    const intentions = profile.psychedelics_intention
      .map((i) => t(`profile.substance_intention.${i}`, INVERTED_SUBSTANCE_INTENTION_CHOICES[i]))
      .join(', ')
    parts.push(`(${intentions})`)
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
    <AboutRow
      icon={<CustomMushroom className="h-5 w-5" />}
      text={parts.join(' ')}
      testId="profile-about-psychedelics"
      suffix={suffix}
    />
  )
}

function WantsKids(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const wantsKidsStrength = profile.wants_kids_strength
  if (wantsKidsStrength == null || wantsKidsStrength < 0) return null
  const wantsKidsText =
    wantsKidsStrength == 0
      ? t('profile.wants_kids_0', 'Does not want children')
      : wantsKidsStrength == 1
        ? t('profile.wants_kids_1', 'Prefers not to have children')
        : wantsKidsStrength == 2
          ? t('profile.wants_kids_2', 'Neutral or open to having children')
          : wantsKidsStrength == 3
            ? t('profile.wants_kids_3', 'Leaning towards wanting children')
            : t('profile.wants_kids_4', 'Wants children')

  return (
    <AboutRow
      icon={<MdOutlineChildFriendly className="h-5 w-5" />}
      text={wantsKidsText}
      testId="profile-about-wants-kids"
    />
  )
}

function LastOnline(props: {lastOnlineTime?: string}) {
  const t = useT()
  const {locale} = useLocale()
  const {lastOnlineTime} = props
  if (!lastOnlineTime) return null
  return (
    <AboutRow
      icon={<ClockIcon className="h-5 w-5" />}
      text={t('profile.last_online', 'Active {time}', {
        time: fromNow(lastOnlineTime, true, t, locale),
      })}
      testId="profile-about-last-online"
    />
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
    <AboutRow icon={<BarChart2 className="h-5 w-5" />}>
      <Col className="gap-2 w-full" data-testid="profile-about-big-five-personality-traits">
        <div className="text-ink-600">{t('profile.big5', 'Big Five personality traits')}</div>
        <div className="">
          {traits.map((trait) => {
            if (trait.value === null || trait.value === undefined) return null

            return (
              <Row key={trait.key} className="items-center gap-1 py-1 text-sm">
                {/*<div className="text-ink-600 w-5 shrink-0">{trait.icon}</div>*/}
                <div className="text-ink-700 w-[120px] shrink-0">{trait.label}</div>
                <div className="flex-1 max-w-32 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-200 rounded-full"
                    style={{width: `${trait.value}%`}}
                  />
                </div>
                <div className="text-ink-600 w-8 text-right shrink-0">{trait.value}</div>
              </Row>
            )
          })}
        </div>
      </Col>
    </AboutRow>
  )
}

function HasKids(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  if (typeof profile.has_kids !== 'number') return null
  const hasKidsText =
    profile.has_kids == 0
      ? t('profile.has_kids.doesnt_have_kids', 'Does not have children')
      : profile.has_kids > 1
        ? t('profile.has_kids_many', 'Has {count} kids', {
            count: profile.has_kids,
          })
        : t('profile.has_kids_one', 'Has {count} kid', {
            count: profile.has_kids,
          })
  const faChild = <FaChild className="h-5 w-5" />
  const icon =
    profile.has_kids === 0 ? (
      <div className="relative h-5 w-5">
        {faChild}
        <div className="absolute inset-0">
          {/*<div className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 rotate-45 transform bg-ink-500"/>*/}
          <div className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 -rotate-45 transform bg-ink-1000" />
        </div>
      </div>
    ) : (
      faChild
    )
  return <AboutRow icon={icon} text={hasKidsText} testId={'profile-about-has-kids'} />
}

function RaisedIn(props: {profile: Profile}) {
  const t = useT()
  const locationText = getLocationText(props.profile, 'raised_in_')
  if (!locationText) {
    return null
  }
  return (
    <AboutRow
      icon={<Home className="h-5 w-5" />}
      text={t('profile.about.raised_in', `Raised in ${locationText}`, {location: locationText})}
    />
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
