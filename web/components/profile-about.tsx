import {ClockIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {
  INVERTED_CANNABIS_CHOICES,
  INVERTED_DIET_CHOICES,
  INVERTED_EDUCATION_CHOICES,
  INVERTED_LANGUAGE_CHOICES,
  INVERTED_MBTI_CHOICES,
  INVERTED_ORIENTATION_CHOICES,
  INVERTED_POLITICAL_CHOICES,
  INVERTED_PSYCHEDELICS_CHOICES,
  INVERTED_RELATIONSHIP_STATUS_CHOICES,
  INVERTED_RELIGION_CHOICES,
  INVERTED_SUBSTANCE_INTENTION_CHOICES,
  MBTI_TYPE_NAMES,
  SUBSTANCE_PREFERENCE_ABOUT,
} from 'common/choices'
import {MAX_INT, MIN_INT} from 'common/constants'
import {convertGender, convertGenderPlural, Gender} from 'common/gender'
import {getGoogleMapsUrl, getLocationText} from 'common/geodb'
import {formatHeight, MeasurementSystem} from 'common/measurement-utils'
import {Profile} from 'common/profiles/profile'
import {Socials} from 'common/socials'
import {UserActivity} from 'common/user'
import {Home, Languages, Leaf, Salad} from 'lucide-react'
import React, {ReactNode} from 'react'
import {BiSolidDrink} from 'react-icons/bi'
import {FaHeart} from 'react-icons/fa'
import {FaChild} from 'react-icons/fa6'
import {HiOutlineGlobe} from 'react-icons/hi'
import {LuBriefcase, LuCigarette, LuCigaretteOff, LuGraduationCap} from 'react-icons/lu'
import {MdNoDrinks} from 'react-icons/md'
import {PiGenderIntersexBold, PiHandsPrayingBold, PiMagnifyingGlassBold} from 'react-icons/pi'
import {RiScales3Line} from 'react-icons/ri'
import {TbBulb, TbCheck, TbHearts, TbMoodSad, TbUsers} from 'react-icons/tb'
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

export default function ProfileAbout(props: {
  profile: Profile
  userActivity?: UserActivity
  isCurrentUser: boolean
}) {
  const {profile, userActivity, isCurrentUser} = props

  return (
    <Col className={clsx('relative gap-3 overflow-hidden rounded')}>
      <SeekingAndRelationship profile={profile} />
      <GenderIdentity profile={profile} />
      <Orientation profile={profile} />
      <Children profile={profile} />
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
      {!isCurrentUser && (
        <>
          <LastOnline lastOnlineTime={userActivity?.last_online_time} />
        </>
      )}
    </Col>
  )
}

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

function SectionLabel(props: {compact?: boolean; children: ReactNode}) {
  const {compact, children} = props
  return (
    <div
      style={{
        fontSize: compact ? '11px' : '12px',
        fontWeight: '500',
        color: 'rgb(var(--color-ink-300))',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom: compact ? '1px' : '8px',
      }}
    >
      {children}
    </div>
  )
}

function Chip(props: {variant?: 'default' | 'primary' | 'muted'; children: ReactNode}) {
  const {variant = 'default', children} = props
  if (variant === 'muted') {
    return (
      <span
        className="border-canvas-200 bg-canvas-100 text-ink-500"
        style={{
          padding: '4px 11px',
          borderRadius: '100px',
          fontSize: '12.5px',
          borderWidth: '1px',
        }}
      >
        {children}
      </span>
    )
  }
  const colorClass =
    variant === 'primary'
      ? 'border-primary-200 text-primary-700 bg-primary-50'
      : 'border-canvas-300 text-primary-700 bg-canvas-200'
  return (
    <span
      className={colorClass}
      style={{
        padding: '5px 13px',
        borderRadius: '100px',
        fontSize: '13px',
        fontWeight: '400',
        letterSpacing: '0.01em',
        borderWidth: '1px',
      }}
    >
      {children}
    </span>
  )
}

function AboutRow(props: {
  icon: ReactNode
  title: ReactNode
  text?: ReactNode
  details?: ReactNode
  children?: ReactNode
  testId?: string
  divider?: boolean
}) {
  const {icon, title, text, details, children, testId, divider = true} = props
  return (
    <>
      <Row className="items-start gap-2.5" data-testid={testId}>
        <div
          className="bg-canvas-100 border-canvas-200 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-ink-500"
          style={{width: '32px', height: '32px', marginTop: '1px'}}
        >
          {icon}
        </div>
        <Col className={'w-full'}>
          <SectionLabel compact>{title}</SectionLabel>
          {text != null && text !== '' && (
            <div style={{fontSize: '14px', color: 'rgb(var(--color-ink-900))'}}>{text}</div>
          )}
          {details && (
            <div className={'text-ink-500'} style={{fontSize: '12.5px', marginTop: '2px'}}>
              {details}
            </div>
          )}
          {children}
        </Col>
      </Row>
      {divider && <Divider />}
    </>
  )
}

function SeekingAndRelationship(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const seekingText = getSeekingText(profile, t)
  const relationship_status = profile.relationship_status ?? []

  if (relationship_status.length === 0 && !seekingText) return null

  const relationshipText =
    relationship_status.length > 0
      ? formatChoiceList(
          relationship_status,
          'relationship_status',
          INVERTED_RELATIONSHIP_STATUS_CHOICES,
          t,
        )
      : null

  // const key = relationship_status[0] as keyof typeof RELATIONSHIP_ICONS
  // const icon = RELATIONSHIP_ICONS[key] ?? FaHeart

  return (
    <AboutRow
      icon={<PiMagnifyingGlassBold className="h-5 w-5" />}
      title={t('profile.connection_goals', 'Connection Goals')}
      text={seekingText}
      details={relationshipText}
    />
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
  if (text.length === 0) return null

  return (
    <AboutRow
      icon={<LuGraduationCap className="h-5 w-5" />}
      title={t('profile.education', 'Education')}
      text={text}
    />
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

  if (!company && !occupation_title && !workAreas?.length) return null

  const occupationText = `${
    occupation_title ? capitalizeAndRemoveUnderscores(occupation_title) : ''
  }${occupation_title && company ? ` ${t('profile.at', 'at')} ` : ''}${
    company ? capitalizeAndRemoveUnderscores(company) : ''
  }`

  const workText = workAreas?.join(' · ')

  return (
    <AboutRow
      icon={<LuBriefcase className="h-5 w-5" />}
      title={t('profile.work', 'Work')}
      text={occupationText}
      details={workText}
    />
  )
}

function Politics(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const politicalBeliefs = profile.political_beliefs
  const politicalDetails = profile.political_details

  if (!politicalBeliefs || politicalBeliefs.length === 0) return null

  return (
    <AboutRow
      icon={<RiScales3Line className="h-5 w-5" />}
      title={t('profile.politics', 'Politics')}
      text={formatChoiceList(politicalBeliefs, 'political', INVERTED_POLITICAL_CHOICES, t)}
      details={politicalDetails ? `"${politicalDetails}"` : undefined}
    />
  )
}

function Religion(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const religion = profile.religion
  const religiousBeliefs = profile.religious_beliefs

  if (!religion || religion.length === 0) return null

  return (
    <AboutRow
      icon={<PiHandsPrayingBold className="h-5 w-5" />}
      title={t('profile.religion', 'Religion')}
      text={formatChoiceList(religion, 'religion', INVERTED_RELIGION_CHOICES, t)}
      details={religiousBeliefs ? `"${religiousBeliefs}"` : undefined}
    />
  )
}

function GenderIdentity(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const p = profile
  const gender = p.gender
  const genderDetails = p.gender_details

  if (!gender || !genderDetails) return null

  const text = t(`profile.gender.${gender}`, convertGender(gender as Gender))

  return (
    <AboutRow
      icon={<PiGenderIntersexBold className="h-5 w-5" />}
      title={t('profile.gender_identity', 'Gender Identity')}
      text={text}
      details={`"${genderDetails}"`}
    />
  )
}

function Orientation(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const p = profile as any
  const orientation = p.orientation as string[] | null | undefined
  const orientationDetails = p.orientation_details as string | null | undefined

  if (!orientation?.length && !orientationDetails) return null

  const orientationText = orientation?.length
    ? formatChoiceList(orientation, 'orientation', INVERTED_ORIENTATION_CHOICES, t)
    : null

  return (
    <AboutRow
      icon={<TbHearts className="h-5 w-5" />}
      title={t('profile.orientation', 'Orientation')}
      text={orientationText}
      details={orientationDetails ? `"${orientationDetails}"` : undefined}
    />
  )
}

function Ethnicity(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const ethnicity = profile.ethnicity?.filter((r) => r !== 'other')

  if (!ethnicity || ethnicity.length === 0) return null

  const text = ethnicity.map((r: any) => t(`profile.race.${r}`, convertRace(r))).join(', ')

  return (
    <AboutRow
      icon={<HiOutlineGlobe className="h-5 w-5" />}
      title={t('profile.ethnicity', 'Ethnicity')}
      text={text}
    />
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

  return <AboutRow icon={icon} title={t('profile.smoking', 'Smoking')} text={text} />
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

  return <AboutRow icon={icon} title={t('profile.alcohol', 'Alcohol')} text={text} />
}

function Diet(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const diet = profile.diet

  if (!diet || diet.length === 0) return null

  return (
    <AboutRow
      icon={<Salad className="h-5 w-5" />}
      title={t('profile.diet', 'Diet')}
      text={formatChoiceList(diet, 'diet', INVERTED_DIET_CHOICES, t)}
    />
  )
}

function LanguagesSection(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const languages = profile.languages

  if (!languages || languages.length === 0) return null

  return (
    <AboutRow
      icon={<Languages className="h-5 w-5" />}
      title={t('profile.languages', 'Languages')}
      text={formatChoiceList(languages, 'language', INVERTED_LANGUAGE_CHOICES, t)}
    />
  )
}

function Cannabis(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const cannabis = profile.cannabis
  if (!cannabis) return null

  const parts = t(`profile.cannabis.${cannabis}`, INVERTED_CANNABIS_CHOICES[cannabis])

  const showIntentions =
    cannabis !== 'never_not_interested' && (profile.cannabis_intention?.length ?? 0) > 0
  const prefText = formatPartnerPreferences(profile.cannabis_pref, t)

  return (
    <AboutRow
      icon={<Leaf className="h-5 w-5" />}
      title={t('profile.cannabis', 'Cannabis')}
      text={parts}
    >
      {showIntentions && (
        <div className="flex flex-wrap gap-2 mt-2">
          {profile.cannabis_intention!.map((i) => (
            <Chip key={i} variant="muted">
              {t(`profile.substance_intention.${i}`, INVERTED_SUBSTANCE_INTENTION_CHOICES[i])}
            </Chip>
          ))}
        </div>
      )}
      {prefText && (
        <div className={'text-ink-500 mt-2'} style={{fontSize: '12.5px'}}>
          {prefText}
        </div>
      )}
    </AboutRow>
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

  const showIntentions =
    psychedelics !== 'never_not_interested' && (profile.psychedelics_intention?.length ?? 0) > 0
  const prefText = formatPartnerPreferences(profile.psychedelics_pref, t)

  return (
    <AboutRow
      icon={<CustomMushroom className="h-5 w-5" />}
      title={t('profile.psychedelics', 'Psychedelics')}
      text={parts}
    >
      {showIntentions && (
        <div className="flex flex-wrap gap-2 mt-2">
          {profile.psychedelics_intention!.map((i) => (
            <Chip key={i} variant="muted">
              {t(`profile.substance_intention.${i}`, INVERTED_SUBSTANCE_INTENTION_CHOICES[i])}
            </Chip>
          ))}
        </div>
      )}
      {prefText && (
        <div className={'text-ink-500 mt-2'} style={{fontSize: '12.5px'}}>
          {prefText}
        </div>
      )}
    </AboutRow>
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
    <AboutRow
      testId="profile-about-last-online"
      icon={<ClockIcon className="h-5 w-5" />}
      title={t('profile.activity', 'Activity')}
      text={t('profile.last_online', 'Active {time}', {
        time: fromNow(lastOnlineTime, true, t, locale),
      })}
      divider={false}
    />
  )
}

function Children(props: {profile: Profile}) {
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
    <AboutRow
      icon={<FaChild className="h-5 w-5" />}
      title={t('profile.children', 'Children')}
      text={hasKidsText}
      details={wantsKidsText}
    />
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
  if (!locationText) return null
  return (
    <AboutRow
      icon={<Home className="h-5 w-5" />}
      title={t('profile.raised_in', 'Raised In')}
      text={
        <CustomLink href={getGoogleMapsUrl(locationText)} className={'hover:text-primary-500'}>
          {locationText}
        </CustomLink>
      }
    />
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
          {/*<SectionLabel>{t('profile.interests', 'Interests')}</SectionLabel>*/}
          <div className="flex flex-wrap gap-2">
            {interests.map((interest, i) => (
              <Chip key={i}>{interest}</Chip>
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
          <SectionLabel>{t('profile.causes', 'Causes')}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {causes.map((cause, i) => (
              <Chip key={i} variant="primary">
                {cause}
              </Chip>
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

  return (
    <Col className={clsx('relative gap-3 overflow-hidden rounded')}>
      <MBTI profile={profile} />
      <Big5Traits profile={profile} />
    </Col>
  )
}

function MBTI(props: {profile: Profile}) {
  const {profile} = props

  if (!profile.mbti) return null

  const mbtiType = profile.mbti ? INVERTED_MBTI_CHOICES[profile.mbti] : null
  const mbtiTypeName = mbtiType ? MBTI_TYPE_NAMES[mbtiType] : null

  return (
    <div style={{marginBottom: '18px'}}>
      <SectionLabel>MBTI</SectionLabel>
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
      <SectionLabel>{t('profile.big5', 'Big Five')}</SectionLabel>
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

function formatChoiceList(
  values: string[] | null | undefined,
  namespace: string,
  invertedChoices: Record<string, string>,
  t: ReturnType<typeof useT>,
): string {
  if (!values?.length) return ''
  return values.map((v) => t(`profile.${namespace}.${v}`, invertedChoices[v] ?? v)).join(', ')
}

function formatPartnerPreferences(
  prefs: string[] | null | undefined,
  t: ReturnType<typeof useT>,
): string | undefined {
  if (!prefs?.length) return undefined
  const items = prefs.map((p) =>
    t(
      `profile.substance_pref_viewer.${p}`,
      SUBSTANCE_PREFERENCE_ABOUT[p as keyof typeof SUBSTANCE_PREFERENCE_ABOUT],
    ),
  )
  const formatted =
    items.length > 1 ? `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}` : items[0]
  return `${t('profile.pref_you', 'Prefers you')} ${formatted}`
}

// export const RELATIONSHIP_ICONS = {
//   single: FiUser,
//   married: GiRing,
//   casual: FaHeart,
//   long_term: FaHeart,
//   open: FaUsers,
// } as const
