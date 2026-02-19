import clsx from 'clsx'
import {convertRace, type RelationshipType} from 'web/lib/util/convert-types'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'
import React, {ReactNode} from 'react'
import {
  INVERTED_DIET_CHOICES,
  INVERTED_EDUCATION_CHOICES,
  INVERTED_LANGUAGE_CHOICES,
  INVERTED_MBTI_CHOICES,
  INVERTED_POLITICAL_CHOICES,
  INVERTED_RELATIONSHIP_STATUS_CHOICES,
  INVERTED_RELIGION_CHOICES,
} from 'common/choices'
import {BiSolidDrink} from 'react-icons/bi'
import {BsPersonHeart, BsPersonVcard} from 'react-icons/bs'
import {FaChild} from 'react-icons/fa6'
import {LuBriefcase, LuCigarette, LuCigaretteOff, LuGraduationCap,} from 'react-icons/lu'
import {MdLanguage, MdNoDrinks, MdOutlineChildFriendly} from 'react-icons/md'
import {PiHandsPrayingBold, PiMagnifyingGlassBold} from 'react-icons/pi'
import {RiScales3Line} from 'react-icons/ri'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {fromNow} from 'web/lib/util/time'
import {convertGenderPlural, Gender} from 'common/gender'
import {HiOutlineGlobe} from 'react-icons/hi'
import {UserHandles} from 'web/components/user/user-handles'
import {Profile} from 'common/profiles/profile'
import {UserActivity} from 'common/user'
import {ClockIcon} from '@heroicons/react/solid'
import {formatHeight, MeasurementSystem} from 'common/measurement-utils'
import {MAX_INT, MIN_INT} from 'common/constants'
import {GiFruitBowl, GiRing} from 'react-icons/gi'
import {FaBriefcase, FaHandsHelping, FaHeart, FaStar, FaUsers} from 'react-icons/fa'
import {useLocale, useT} from 'web/lib/locale'
import {useChoices} from 'web/hooks/use-choices'
import {getSeekingGenderText} from 'web/lib/profile/seeking'
import {TbBulb, TbCheck, TbMoodSad, TbUsers} from 'react-icons/tb'
import {FiUser} from "react-icons/fi"

export function AboutRow(props: {
  icon: ReactNode
  text?: string | null | string[]
  preText?: string
  suffix?: string | null
}) {
  const {icon, text, preText, suffix} = props
  const t = useT()
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
  if (suffix) {
    formattedText += formattedText ? ` (${suffix})` : suffix
  }
  return (
    <Row className="items-center gap-2">
      <div className="text-ink-600 w-5">{icon}</div>
      <div>{formattedText}</div>
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
  const {choices: interestsById} = useChoices('interests')
  const {choices: causesById} = useChoices('causes')
  const {choices: workById} = useChoices('work')
  const {locale} = useLocale()

  return (
    <Col
      className={clsx('bg-canvas-0 relative gap-3 overflow-hidden rounded p-4')}
    >
      <Seeking profile={profile}/>
      <RelationshipType profile={profile}/>
      <RelationshipStatus profile={profile}/>
      <Education profile={profile}/>
      <Occupation profile={profile}/>
      <AboutRow
        icon={<FaBriefcase className="h-5 w-5"/>}
        text={
          profile.work
            ?.map((id) => workById[id])
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, locale)) as string[]
        }
      />
      <AboutRow
        icon={<RiScales3Line className="h-5 w-5"/>}
        text={profile.political_beliefs?.map((belief) =>
          t(`profile.political.${belief}`, INVERTED_POLITICAL_CHOICES[belief])
        )}
        suffix={profile.political_details}
      />
      <AboutRow
        icon={<PiHandsPrayingBold className="h-5 w-5"/>}
        text={profile.religion?.map((belief) =>
          t(`profile.religion.${belief}`, INVERTED_RELIGION_CHOICES[belief])
        )}
        suffix={profile.religious_beliefs}
      />
      <AboutRow
        icon={<FaStar className="h-5 w-5"/>}
        text={
          profile.interests
            ?.map((id) => interestsById[id])
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, locale)) as string[]
        }
      />
      <AboutRow
        icon={<FaHandsHelping className="h-5 w-5"/>}
        text={
          profile.causes
            ?.map((id) => causesById[id])
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, locale)) as string[]
        }
      />
      <AboutRow
        icon={<BsPersonVcard className="h-5 w-5"/>}
        text={profile.mbti ? INVERTED_MBTI_CHOICES[profile.mbti] : null}
      />
      <Big5Traits profile={profile}/>
      <AboutRow
        icon={<HiOutlineGlobe className="h-5 w-5"/>}
        text={profile.ethnicity
          ?.filter((r) => r !== 'other')
          ?.map((r: any) => t(`profile.race.${r}`, convertRace(r)))}
      />
      <Smoker profile={profile}/>
      <Drinks profile={profile}/>
      <AboutRow
        icon={<GiFruitBowl className="h-5 w-5"/>}
        text={profile.diet?.map((e) =>
          t(`profile.diet.${e}`, INVERTED_DIET_CHOICES[e])
        )}
      />
      <AboutRow
        icon={<MdLanguage className="h-5 w-5"/>}
        text={profile.languages?.map((v) =>
          t(`profile.language.${v}`, INVERTED_LANGUAGE_CHOICES[v])
        )}
      />
      <HasKids profile={profile}/>
      <WantsKids profile={profile}/>
      {!isCurrentUser && (
        <LastOnline lastOnlineTime={userActivity?.last_online_time}/>
      )}
      <UserHandles links={profile.user.link}/>
    </Col>
  )
}

function Seeking(props: { profile: Profile }) {
  const t = useT()
  const {profile} = props
  const prefGender = profile.pref_gender
  const min = profile.pref_age_min
  const max = profile.pref_age_max
  const seekingGenderText = stringOrStringArrayToText({
    text:
      prefGender?.length == 5
        ? ['people']
        : prefGender?.map((gender) =>
          t(
            `profile.gender.plural.${gender}`,
            convertGenderPlural(gender as Gender)
          ).toLowerCase()
        ),
    preText: t('profile.interested_in', 'Interested in'),
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

  if (!prefGender || prefGender.length < 1) {
    return <></>
  }
  return (
    <AboutRow
      icon={<PiMagnifyingGlassBold className="h-5 w-5"/>}
      text={`${seekingGenderText} ${ageRangeText}`}
    />
  )
}

function RelationshipType(props: { profile: Profile }) {
  const t = useT()
  const {profile} = props
  const seekingGenderText = getSeekingGenderText(profile, t)
  return (
    <AboutRow
      icon={<BsPersonHeart className="h-5 w-5"/>}
      text={seekingGenderText}
    />
  )
}

function RelationshipStatus(props: { profile: Profile }) {
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
        t(
          `profile.relationship_status.${v}`,
          INVERTED_RELATIONSHIP_STATUS_CHOICES[v]
        )
      )}
    />
  )
}

function Education(props: { profile: Profile }) {
  const t = useT()
  const {profile} = props
  const educationLevel = profile.education_level
  const university = profile.university

  let text = ''

  if (educationLevel) {
    text += capitalizeAndRemoveUnderscores(
      t(
        `profile.education.${educationLevel}`,
        INVERTED_EDUCATION_CHOICES[educationLevel]
      )
    )
  }
  if (university) {
    if (educationLevel) text += ` ${t('profile.at', 'at')} `
    text += capitalizeAndRemoveUnderscores(university)
  }
  if (text.length === 0) {
    return <></>
  }
  return <AboutRow icon={<LuGraduationCap className="h-5 w-5"/>} text={text}/>
}

function Occupation(props: { profile: Profile }) {
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
      icon={<LuBriefcase className="h-5 w-5"/>}
      text={occupationText}
    />
  )
}

function Smoker(props: { profile: Profile }) {
  const t = useT()
  const {profile} = props
  const isSmoker = profile.is_smoker
  if (isSmoker == null) return null
  if (isSmoker) {
    return (
      <AboutRow
        icon={<LuCigarette className="h-5 w-5"/>}
        text={t('profile.smokes', 'Smokes')}
      />
    )
  }
  return (
    <AboutRow
      icon={<LuCigaretteOff className="h-5 w-5"/>}
      text={t('profile.doesnt_smoke', "Doesn't smoke")}
    />
  )
}

function Drinks(props: { profile: Profile }) {
  const t = useT()
  const {profile} = props
  const drinksPerMonth = profile.drinks_per_month
  if (drinksPerMonth == null) return null
  if (drinksPerMonth === 0) {
    return (
      <AboutRow
        icon={<MdNoDrinks className="h-5 w-5"/>}
        text={t('profile.doesnt_drink', "Doesn't drink")}
      />
    )
  }
  return (
    <AboutRow
      icon={<BiSolidDrink className="h-5 w-5"/>}
      text={
        drinksPerMonth === 1
          ? t('profile.drinks_one', '1 drink per month')
          : t('profile.drinks_many', '{count} drinks per month', {
            count: drinksPerMonth,
          })
      }
    />
  )
}

function WantsKids(props: { profile: Profile }) {
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
      icon={<MdOutlineChildFriendly className="h-5 w-5"/>}
      text={wantsKidsText}
    />
  )
}

function LastOnline(props: { lastOnlineTime?: string }) {
  const t = useT()
  const {locale} = useLocale()
  const {lastOnlineTime} = props
  if (!lastOnlineTime) return null
  return (
    <AboutRow
      icon={<ClockIcon className="h-5 w-5"/>}
      text={t('profile.last_online', 'Active {time}', {
        time: fromNow(lastOnlineTime, true, t, locale),
      })}
    />
  )
}

function Big5Traits(props: { profile: Profile }) {
  const t = useT()
  const {profile} = props

  const traits = [
    {
      key: 'big5_openness',
      icon: <TbBulb className="h-5 w-5"/>,
      label: t('profile.big5_openness', 'Openness'),
      value: profile.big5_openness,
    },
    {
      key: 'big5_conscientiousness',
      icon: <TbCheck className="h-5 w-5"/>,
      label: t('profile.big5_conscientiousness', 'Conscientiousness'),
      value: profile.big5_conscientiousness,
    },
    {
      key: 'big5_extraversion',
      icon: <TbUsers className="h-5 w-5"/>,
      label: t('profile.big5_extraversion', 'Extraversion'),
      value: profile.big5_extraversion,
    },
    {
      key: 'big5_agreeableness',
      icon: <FaHeart className="h-5 w-5"/>,
      label: t('profile.big5_agreeableness', 'Agreeableness'),
      value: profile.big5_agreeableness,
    },
    {
      key: 'big5_neuroticism',
      icon: <TbMoodSad className="h-5 w-5"/>,
      label: t('profile.big5_neuroticism', 'Neuroticism'),
      value: profile.big5_neuroticism,
    },
  ]

  const hasAnyTraits = traits.some(
    (trait) => trait.value !== null && trait.value !== undefined
  )

  if (!hasAnyTraits) {
    return <></>
  }

  return (
    <Col className="gap-2">
      <div className="text-ink-600 font-medium">
        {t('profile.big5', 'Big Five personality traits')}:
      </div>
      <div className="ml-6">
        {traits.map((trait) => {
          if (trait.value === null || trait.value === undefined) return null

          let levelText: string
          if (trait.value <= 20) {
            levelText = t('profile.big5_very_low', 'Very low')
          } else if (trait.value <= 40) {
            levelText = t('profile.big5_low', 'Low')
          } else if (trait.value <= 60) {
            levelText = t('profile.big5_average', 'Average')
          } else if (trait.value <= 80) {
            levelText = t('profile.big5_high', 'High')
          } else {
            levelText = t('profile.big5_very_high', 'Very high')
          }

          return (
            <Row key={trait.key} className="items-center gap-2">
              <div className="text-ink-600 w-5">{trait.icon}</div>
              <div>
                {trait.label}: {levelText} ({trait.value})
              </div>
            </Row>
          )
        })}
      </div>
    </Col>
  )
}

function HasKids(props: { profile: Profile }) {
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
  const faChild = <FaChild className="h-5 w-5"/>
  const icon =
    profile.has_kids === 0 ? (
      <div className="relative h-5 w-5">
        {faChild}
        <div className="absolute inset-0">
          {/*<div className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 rotate-45 transform bg-ink-500"/>*/}
          <div className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 -rotate-45 transform bg-ink-1000"/>
        </div>
      </div>
    ) : (
      faChild
    )
  return <AboutRow icon={icon} text={hasKidsText}/>
}

export const formatProfileValue = (
  key: string,
  value: any,
  measurementSystem: MeasurementSystem = 'imperial'
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