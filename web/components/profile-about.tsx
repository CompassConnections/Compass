import clsx from 'clsx'
import {convertRace, convertRelationshipType, type RelationshipType,} from 'web/lib/util/convert-types'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'
import {ReactNode} from 'react'
import {
  INVERTED_DIET_CHOICES,
  INVERTED_EDUCATION_CHOICES,
  INVERTED_LANGUAGE_CHOICES,
  INVERTED_MBTI_CHOICES,
  INVERTED_POLITICAL_CHOICES,
  INVERTED_RELATIONSHIP_STATUS_CHOICES,
  INVERTED_RELIGION_CHOICES,
  INVERTED_ROMANTIC_CHOICES
} from 'web/components/filters/choices'
import {BiSolidDrink} from 'react-icons/bi'
import {BsPersonHeart, BsPersonVcard} from 'react-icons/bs'
import {FaChild} from 'react-icons/fa6'
import {LuBriefcase, LuCigarette, LuCigaretteOff, LuGraduationCap,} from 'react-icons/lu'
import {MdLanguage, MdNoDrinks, MdOutlineChildFriendly} from 'react-icons/md'
import {PiHandsPrayingBold, PiMagnifyingGlassBold,} from 'react-icons/pi'
import {RiScales3Line} from 'react-icons/ri'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {fromNow} from 'web/lib/util/time'
import {convertGenderPlural, Gender} from 'common/gender'
import {HiOutlineGlobe} from 'react-icons/hi'
import {UserHandles} from 'web/components/user/user-handles'
import {Profile} from 'common/profiles/profile'
import {UserActivity} from "common/user";
import {ClockIcon} from "@heroicons/react/solid";
import {MAX_INT, MIN_INT} from "common/constants";
import {GiFruitBowl} from "react-icons/gi";
import {FaBriefcase, FaHandsHelping, FaStar} from "react-icons/fa";

export function AboutRow(props: {
  icon: ReactNode
  text?: string | null | string[]
  preText?: string
  suffix?: string | null
}) {
  const {icon, text, preText, suffix} = props
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
    })
  }
  if (suffix) {
    formattedText += formattedText ? ` (${suffix})` : suffix
  }
  return (
    <Row className="items-center gap-2">
      <div className="text-ink-600 w-5">{icon}</div>
      <div>
        {formattedText}
      </div>
    </Row>
  )
}

export default function ProfileAbout(props: {
  profile: Profile,
  userActivity?: UserActivity,
  isCurrentUser: boolean,
}) {
  const {profile, userActivity, isCurrentUser} = props
  return (
    <Col
      className={clsx('bg-canvas-0 relative gap-3 overflow-hidden rounded p-4')}
    >
      <Seeking profile={profile}/>
      <RelationshipType profile={profile}/>
      <AboutRow
        icon={<BsPersonHeart className="h-5 w-5"/>}
        text={profile.relationship_status?.map(v => INVERTED_RELATIONSHIP_STATUS_CHOICES[v])}
      />
      <Education profile={profile}/>
      <Occupation profile={profile}/>
      <AboutRow
        icon={<FaBriefcase className="h-5 w-5"/>}
        text={profile.work}
      />
      <AboutRow
        icon={<RiScales3Line className="h-5 w-5"/>}
        text={profile.political_beliefs?.map(belief => INVERTED_POLITICAL_CHOICES[belief])}
        suffix={profile.political_details}
      />
      <AboutRow
        icon={<PiHandsPrayingBold className="h-5 w-5"/>}
        text={profile.religion?.map(belief => INVERTED_RELIGION_CHOICES[belief])}
        suffix={profile.religious_beliefs}
      />
      <AboutRow
        icon={<FaStar className="h-5 w-5"/>}
        text={profile.interests}
      />
      <AboutRow
        icon={<FaHandsHelping className="h-5 w-5"/>}
        text={profile.causes}
      />
      <AboutRow
        icon={<BsPersonVcard className="h-5 w-5"/>}
        text={profile.mbti ? INVERTED_MBTI_CHOICES[profile.mbti] : null}
      />
      <AboutRow
        icon={<HiOutlineGlobe className="h-5 w-5"/>}
        text={profile.ethnicity
          ?.filter((r) => r !== 'other')
          ?.map((r: any) => convertRace(r))}
      />
      <Smoker profile={profile}/>
      <Drinks profile={profile}/>
      <AboutRow
        icon={<GiFruitBowl className="h-5 w-5"/>}
        text={profile.diet?.map(e => INVERTED_DIET_CHOICES[e])}
      />
      <AboutRow
        icon={<MdLanguage className="h-5 w-5"/>}
        text={profile.languages?.map(v => INVERTED_LANGUAGE_CHOICES[v])}
      />
      <HasKids profile={profile}/>
      <WantsKids profile={profile}/>
      {!isCurrentUser && <LastOnline lastOnlineTime={userActivity?.last_online_time}/>}
      <UserHandles links={profile.user.link}/>
    </Col>
  )
}

function Seeking(props: { profile: Profile }) {
  const {profile} = props
  const prefGender = profile.pref_gender
  const min = profile.pref_age_min
  const max = profile.pref_age_max
  const seekingGenderText = stringOrStringArrayToText({
    text:
      prefGender?.length == 5
        ? ['people']
        : prefGender?.map((gender) => convertGenderPlural(gender as Gender)),
    preText: 'Interested in',
    asSentence: true,
    capitalizeFirstLetterOption: false,
  })

  const noMin = (min ?? MIN_INT) <= 18
  const noMax = (max ?? MAX_INT) >= 99

  const ageRangeText =
    noMin && noMax
      ? 'of any age'
      : min == max
        ? `exactly ${min} years old`
        : noMax
          ? `older than ${min}`
          : noMin
            ? `younger than ${max}`
            : `between ${min} - ${max} years old`

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
  const {profile} = props
  const relationshipTypes = profile.pref_relation_styles
  let seekingGenderText = stringOrStringArrayToText({
    text: relationshipTypes?.map((rel) =>
      convertRelationshipType(rel as RelationshipType).toLowerCase()
    ).sort(),
    preText: 'Seeking',
    // postText:
    //   relationshipTypes.length == 1 && relationshipTypes[0] == 'mono'
    //     ? 'relationship'
    //     : 'relationships',
    asSentence: true,
    capitalizeFirstLetterOption: false,
  })
  if (relationshipTypes?.includes('relationship')) {
    const romanticStyles = profile.pref_romantic_styles
      ?.map((style) => INVERTED_ROMANTIC_CHOICES[style].toLowerCase())
      .filter(Boolean)
    if (romanticStyles && romanticStyles.length > 0) {
      seekingGenderText += ` (${romanticStyles.join(', ')})`
    }

  }
  return (
    <AboutRow
      icon={<BsPersonHeart className="h-5 w-5"/>}
      text={seekingGenderText}
    />
  )
}

function Education(props: { profile: Profile }) {
  const {profile} = props
  const educationLevel = profile.education_level
  const university = profile.university

  let text = ''

  if (educationLevel) {
    text += capitalizeAndRemoveUnderscores(INVERTED_EDUCATION_CHOICES[educationLevel])
  }
  if (university) {
    if (educationLevel) text += ' at '
    text += capitalizeAndRemoveUnderscores(university)
  }
  if (text.length === 0) {
    return <></>
  }
  return (
    <AboutRow
      icon={<LuGraduationCap className="h-5 w-5"/>}
      text={text}
    />
  )
}

function Occupation(props: { profile: Profile }) {
  const {profile} = props
  const occupation_title = profile.occupation_title
  const company = profile.company

  if (!company && !occupation_title) {
    return <></>
  }
  const occupationText = `${
    occupation_title ? capitalizeAndRemoveUnderscores(occupation_title) : ''
  }${occupation_title && company ? ' at ' : ''}${
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
  const {profile} = props
  const isSmoker = profile.is_smoker
  if (isSmoker == null) return null
  if (isSmoker) {
    return (
      <AboutRow icon={<LuCigarette className="h-5 w-5"/>} text={'Smokes'}/>
    )
  }
  return (
    <AboutRow
      icon={<LuCigaretteOff className="h-5 w-5"/>}
      text={`Doesn't smoke`}
    />
  )
}

function Drinks(props: { profile: Profile }) {
  const {profile} = props
  const drinksPerMonth = profile.drinks_per_month
  if (drinksPerMonth == null) return null
  if (drinksPerMonth === 0) {
    return (
      <AboutRow
        icon={<MdNoDrinks className="h-5 w-5"/>}
        text={`Doesn't drink`}
      />
    )
  }
  return (
    <AboutRow
      icon={<BiSolidDrink className="h-5 w-5"/>}
      text={`${drinksPerMonth} ${
        drinksPerMonth == 1 ? 'drink' : 'drinks'
      } per month`}
    />
  )
}

function WantsKids(props: { profile: Profile }) {
  const {profile} = props
  const wantsKidsStrength = profile.wants_kids_strength
  if (wantsKidsStrength == null || wantsKidsStrength < 0) return null
  const wantsKidsText =
    wantsKidsStrength == 0
      ? 'Does not want children'
      : wantsKidsStrength == 1
        ? 'Prefers not to have children'
        : wantsKidsStrength == 2
          ? 'Neutral or open to having children'
          : wantsKidsStrength == 3
            ? 'Leaning towards wanting children'
            : 'Wants children'

  return (
    <AboutRow
      icon={<MdOutlineChildFriendly className="h-5 w-5"/>}
      text={wantsKidsText}
    />
  )
}

function LastOnline(props: { lastOnlineTime?: string }) {
  const {lastOnlineTime} = props
  if (!lastOnlineTime) return null
  return (
    <AboutRow
      icon={<ClockIcon className="h-5 w-5"/>}
      text={'Last online ' + fromNow(lastOnlineTime, true)}
    />
  )
}

function HasKids(props: { profile: Profile }) {
  const {profile} = props
  const hasKidsText =
    profile.has_kids && profile.has_kids > 0
      ? `Has ${profile.has_kids} ${profile.has_kids > 1 ? 'kids' : 'kid'}`
      : null
  return <AboutRow icon={<FaChild className="h-5 w-5"/>} text={hasKidsText}/>
}

export const formatProfileValue = (key: string, value: any) => {
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
      return `${Math.floor(value / 12)}' ${value % 12}"`
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
