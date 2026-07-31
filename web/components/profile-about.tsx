import clsx from 'clsx'
import {
  INVERTED_CANNABIS_CHOICES,
  INVERTED_DIET_CHOICES,
  INVERTED_EDUCATION_CHOICES,
  INVERTED_LANGUAGE_CHOICES,
  INVERTED_MBTI_CHOICES,
  INVERTED_NEUROTYPE_CHOICES,
  INVERTED_ORIENTATION_CHOICES,
  INVERTED_POLITICAL_CHOICES,
  INVERTED_PSYCHEDELICS_CHOICES,
  INVERTED_RELATIONSHIP_STATUS_CHOICES,
  INVERTED_RELIGION_CHOICES,
  INVERTED_ROMANTIC_CHOICES,
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
import React, {ReactNode} from 'react'
import {FaHeart} from 'react-icons/fa'
import {TbBulb, TbCheck, TbMoodSad, TbUsers} from 'react-icons/tb'
import {Col} from 'web/components/layout/col'
import {CustomLink} from 'web/components/links'
import {UserHandles} from 'web/components/user/user-handles'
import {useChoicesContext} from 'web/hooks/use-choices'
import {useMeasurementSystem} from 'web/hooks/use-measurement-system'
import {useLocale, useT} from 'web/lib/locale'
import {getSeekingConnectionText} from 'web/lib/profile/seeking'
import {convertRace} from 'web/lib/util/convert-types'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'
import {fromNow} from 'web/lib/util/time'

export default function ProfileAbout(props: {
  profile: Profile
  userActivity?: UserActivity
  isCurrentUser: boolean
  /** Set when the hero already shows connection goals, so the same rows aren't repeated here. */
  omitConnectionGoals?: boolean
}) {
  const {profile, userActivity, isCurrentUser, omitConnectionGoals} = props

  return (
    <Col
      className={clsx(
        'divide-canvas-200 relative divide-y',
        // The section supplies the space under its rule and the gap to the next block, so the first
        // and last rows shed their own padding rather than doubling it.
        '[&>div:first-child]:pt-0 [&>div:last-child]:pb-0',
      )}
    >
      {/* Ordered by what decides whether someone reaches out, not by field category:
          1. Goals — whether the rest of this is even relevant.
          2. What they do — work, education, children.
          3. What they believe — politics, religion, diet. Diet sits with the values group rather than
             with the substances below it: on this platform vegan and vegetarian are far more often an
             ethical position than a dietary habit, and they read as one.
          4. Substances — real compatibility filters, but they narrow rather than describe.
          5. Orientation — sits above languages because it is closer to who someone is looking for than
             to the practical details below it.
          6. Languages — practical.
          7. Gender identity — only renders when the member wrote something of their own about it, so it
             is elaboration, not a demographic checkbox to scan.
          8. Background, then height, then activity metadata. Height sits down here rather than in
             the hero line: it is a number people filter on, not part of how anyone introduces
             themselves, and beside the name it was taking the weight of one. */}
      {!omitConnectionGoals && <SeekingAndRelationship profile={profile} />}
      <OccupationAndWork profile={profile} />
      <Education profile={profile} />
      <Children profile={profile} />
      <Politics profile={profile} />
      <Religion profile={profile} />
      <Diet profile={profile} />
      <Smoker profile={profile} />
      <Drinks profile={profile} />
      <Cannabis profile={profile} />
      <Psychedelics profile={profile} />
      <Orientation profile={profile} />
      <LanguagesSection profile={profile} />
      <GenderIdentity profile={profile} />
      <Ethnicity profile={profile} />
      <RaisedIn profile={profile} />
      <Height profile={profile} />
      {!isCurrentUser && (
        <>
          <LastOnline lastOnlineTime={userActivity?.last_online_time} />
        </>
      )}
    </Col>
  )
}

/**
 * A small qualifier attached to a value it cannot be read without — a romantic style under a
 * connection goal, an intention under a substance answer. Deliberately quiet: it is a footnote to the
 * line above it, not a peer of it.
 *
 * The louder filled variants this used to offer are gone with the interest and cause pills. Sets of
 * tags are middot-separated text now (see `TagList`); a pill in this rail means something clickable.
 */
function Chip(props: {children: ReactNode}) {
  const {children} = props
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

/**
 * One attribute as a label/value pair on a shared baseline, separated from its neighbours by a rule
 * that spans the full width.
 *
 * The 32px bordered icon tiles this used to lead with are gone. Fifteen of them stacked in a narrow
 * rail formed a column of decoration louder than the values beside it, and none of them disambiguated
 * anything — the label already says "Education" in words.
 *
 * The label column widens on a wide rail and narrows again at `3xl`, where the rail splits into two
 * sub-columns and each one is back to roughly its original width.
 */
function AboutRow(props: {
  title: ReactNode
  text?: ReactNode
  details?: ReactNode
  children?: ReactNode
  testId?: string
}) {
  const {title, text, details, children, testId} = props
  return (
    <div
      className="3xl:grid-cols-[84px_minmax(0,1fr)] 3xl:gap-x-4 2xl:grid-cols-[120px_minmax(0,1fr)] 2xl:gap-x-6 grid grid-cols-[84px_minmax(0,1fr)] gap-x-4 py-4"
      data-testid={testId}
    >
      <div className="text-ink-500" style={{fontSize: '14px', lineHeight: '1.5'}}>
        {title}
      </div>
      <div className="min-w-0">
        {text != null && text !== '' && (
          <div className="text-primary-900" style={{fontSize: '16px', lineHeight: '1.4'}}>
            {text}
          </div>
        )}
        {details && (
          <div
            className="text-ink-500"
            style={{fontSize: '14px', lineHeight: '1.55', marginTop: '4px'}}
          >
            {details}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

/**
 * Shared by the Details rail and the hero callout, so the two can't drift apart.
 * Returns null when the member has nothing to show for connection goals.
 */
export function useConnectionGoals(profile: Profile) {
  const t = useT()
  const seekingText = getCompactSeekingText(profile, t)
  const relationship_status = profile.relationship_status ?? []
  const relationshipTypes = profile.pref_relation_styles ?? []

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

  let romanticStyles: string[] | undefined
  if (relationshipTypes?.includes('relationship')) {
    romanticStyles = profile.pref_romantic_styles
      ?.map((style) => t(`profile.romantic.${style}`, INVERTED_ROMANTIC_CHOICES[style]))
      .filter(Boolean)
  }

  return {seekingText, relationshipText, romanticStyles}
}

/**
 * Connection goals for the hero — dealbreaker-class information that decides whether the rest of the
 * profile is even relevant, so it is lifted out of the Details list.
 *
 * Presented as labelled facts under a hairline rule rather than a bordered callout. A tinted box says
 * "notice this", which is the wrong instruction for the last thing in the hero: by the time the eye
 * arrives it is already reading, and a box makes it stop and re-anchor.
 */
export function ProfileConnectionGoals(props: {profile: Profile}) {
  const t = useT()
  const goals = useConnectionGoals(props.profile)

  if (!goals) return null

  const {seekingText, relationshipText, romanticStyles} = goals

  const status = [relationshipText, ...(romanticStyles ?? [])].filter(Boolean).join(DOT_SEPARATOR)

  return (
    <div
      className="border-canvas-300 mt-2 flex max-w-2xl flex-wrap gap-x-16 gap-y-6 border-t pt-6"
      data-testid="profile-connection-goals"
    >
      {/* Split back apart at render: `seekingText` is still consumed as one plain string by
          `SeekingAndRelationship`, so the builders keep returning strings. */}
      <HeroFact label={t('profile.looking_for', 'Looking for')}>
        <DottedList items={seekingText.split(DOT_SEPARATOR)} />
      </HeroFact>
      {status && (
        <HeroFact label={t('profile.status', 'Status')}>
          <DottedList items={status.split(DOT_SEPARATOR)} />
        </HeroFact>
      )}
    </div>
  )
}

export const DOT_SEPARATOR = ' · '

/**
 * A run of fragments joined by middots, with the middots stepped back from the words.
 *
 * The separator is punctuation, not content, so it should not sit at the same weight as the text it
 * divides — the eyebrow over the name has always dimmed its own slashes, and these now match.
 *
 * Carries no colour or size of its own: every caller has a different register (a hero fact, a tag
 * run, a qualifier under a rail value) and the run should inherit whichever it lands in.
 */
function DottedList(props: {items: string[]}) {
  const {items} = props
  return (
    <>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {/* The spaces around the middot are load-bearing, not decoration: they are the only
              soft-wrap opportunities in the run. Spacing the separator with padding instead leaves the
              whole list one unbreakable inline chain, which overflows any container narrower than the
              full run — the Interests block pushed the grid wide enough to scroll the page sideways. */}
          {i > 0 && (
            <>
              {' '}
              <span aria-hidden className="text-ink-500/50 select-none">
                ·
              </span>{' '}
            </>
          )}
          {item}
        </React.Fragment>
      ))}
    </>
  )
}

/**
 * Label over value, for the two facts that close the hero.
 *
 * Both lines stepped down from where they were. The label was `ink-400`, the one neutral grey in a
 * warm ramp, at 10px — 2.15:1 in light and 3.0:1 in dark, under AA either way for text that small.
 * The value was `ink-900`, which in dark (#F7F4EF) is within a percent of the name's white, so a
 * third-tier fact was rendering at the brightest value on the page. Only the name keeps that now.
 */
function HeroFact(props: {label: string; children: ReactNode}) {
  const {label, children} = props
  return (
    <div className="min-w-0">
      <div className="text-ink-500 font-microcaps" style={{marginBottom: '7px'}}>
        {label}
      </div>
      <div className="text-primary-900 font-dm-sans" style={{fontSize: '15.5px'}}>
        {children}
      </div>
    </div>
  )
}

function SeekingAndRelationship(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const goals = useConnectionGoals(profile)

  if (!goals) return null

  const {seekingText, relationshipText, romanticStyles} = goals

  // const key = relationship_status[0] as keyof typeof RELATIONSHIP_ICONS
  // const icon = RELATIONSHIP_ICONS[key] ?? FaHeart

  return (
    <AboutRow
      title={t('profile.connection_goals', 'Connection Goals')}
      text={seekingText}
      details={relationshipText}
    >
      {romanticStyles && (
        <div className="flex flex-wrap gap-2 mt-2">
          {romanticStyles!.map((r) => (
            <Chip key={r}>{r}</Chip>
          ))}
        </div>
      )}
    </AboutRow>
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

/**
 * The same facts as `getSeekingText`, as three middot-separated fragments:
 * `Relationship · men · 30-40`.
 *
 * The sentence form ("Relationship with men between 30 - 40 years old") reads fine in prose but poorly
 * as a value in a labelled column, where the label already supplies the grammar and the connecting
 * words are just length.
 */
export function getCompactSeekingText(profile: Profile, t: any) {
  const prefGender = profile.pref_gender
  const min = profile.pref_age_min
  const max = profile.pref_age_max

  const connection = capitalizeFirst(getSeekingConnectionText(profile, t, true))

  // An unconstrained preference is dropped rather than spelled out. "People" and "any age" restate the
  // absence of a filter, which every reader already assumes — printing them spends two of the three
  // slots on nothing. Capitalized when present so each fragment reads as its own fact rather than as
  // one sentence broken by dots.
  const anyGender =
    !prefGender?.length || (prefGender.includes('male') && prefGender.includes('female'))

  const genderText = anyGender
    ? null
    : prefGender
        .map((gender) =>
          capitalizeFirst(
            t(`profile.gender.plural.${gender}`, convertGenderPlural(gender as Gender)),
          ),
        )
        .join(', ')

  const noMin = (min ?? MIN_INT) <= 18
  const noMax = (max ?? MAX_INT) >= 99

  const ageText =
    noMin && noMax
      ? null
      : min == max
        ? `${min}`
        : noMax
          ? t('profile.age_min_compact', '{min}+', {min})
          : noMin
            ? t('profile.age_max_compact', 'under {max}', {max})
            : t('profile.age_range_compact', '{min}-{max}', {min, max})

  return [connection, genderText, ageText].filter(Boolean).join(DOT_SEPARATOR)
}

function capitalizeFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
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

  return <AboutRow title={t('profile.education', 'Education')} text={text} />
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

  return <AboutRow title={t('profile.work', 'Work')} text={occupationText} details={workText} />
}

function Politics(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const politicalBeliefs = profile.political_beliefs
  const politicalDetails = profile.political_details

  if (!politicalBeliefs || politicalBeliefs.length === 0) return null

  return (
    <AboutRow
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
      title={t('profile.orientation', 'Orientation')}
      text={orientationText}
      details={orientationDetails ? `"${orientationDetails}"` : undefined}
    />
  )
}

function Neurotype(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const p = profile as any
  const neurotype = p.neurotype as string[] | null | undefined
  const neurotypeDetails = p.neurotype_details as string | null | undefined

  if (!neurotype?.length && !neurotypeDetails) return null

  const neurotypeText = neurotype?.length
    ? formatChoiceList(neurotype, 'neurotype', INVERTED_NEUROTYPE_CHOICES, t)
    : null

  return (
    <AboutRow
      title={t('profile.neurotype', 'Neurotype')}
      text={neurotypeText}
      details={neurotypeDetails ? `"${neurotypeDetails}"` : undefined}
    />
  )
}

function Ethnicity(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const ethnicity = profile.ethnicity?.filter((r) => r !== 'other')

  if (!ethnicity || ethnicity.length === 0) return null

  const text = ethnicity.map((r: any) => t(`profile.race.${r}`, convertRace(r))).join(', ')

  return <AboutRow title={t('profile.ethnicity', 'Ethnicity')} text={text} />
}

function Height(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const {measurementSystem} = useMeasurementSystem()

  if (profile.height_in_inches == null) return null

  return (
    <AboutRow
      testId="profile-height"
      title={t('profile.optional.height', 'Height')}
      text={formatProfileValue('height_in_inches', profile.height_in_inches, measurementSystem, t)}
    />
  )
}

function Smoker(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const isSmoker = profile.is_smoker
  if (isSmoker == null) return null
  const text = isSmoker ? t('profile.smokes', 'Smokes') : t('profile.doesnt_smoke', "Doesn't smoke")
  return <AboutRow title={t('profile.smoking', 'Smoking')} text={text} />
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
  return <AboutRow title={t('profile.alcohol', 'Alcohol')} text={text} />
}

function Diet(props: {profile: Profile}) {
  const t = useT()
  const {profile} = props
  const diet = profile.diet

  if (!diet || diet.length === 0) return null

  return (
    <AboutRow
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
      title={t('profile.cannabis', 'Cannabis')}
      text={parts}
      details={
        showIntentions && (
          <DottedList
            items={profile.cannabis_intention!.map((i) =>
              t(`profile.substance_intention.${i}`, INVERTED_SUBSTANCE_INTENTION_CHOICES[i]),
            )}
          />
        )
      }
    >
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
      title={t('profile.psychedelics', 'Psychedelics')}
      text={parts}
      details={
        showIntentions && (
          <DottedList
            items={profile.psychedelics_intention!.map((i) =>
              t(`profile.substance_intention.${i}`, INVERTED_SUBSTANCE_INTENTION_CHOICES[i]),
            )}
          />
        )
      }
    >
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
      title={t('profile.activity', 'Activity')}
      text={t('profile.last_online', 'Active {time}', {
        time: fromNow(lastOnlineTime, true, t, locale),
      })}
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
      title={t('profile.raised_in', 'Raised In')}
      text={
        <CustomLink href={getGoogleMapsUrl(locationText)} className={'hover:text-primary-500'}>
          {locationText}
        </CustomLink>
      }
    />
  )
}

/**
 * Interests and causes are separate rail sections rather than one block with an inner heading.
 *
 * Combined, "Causes" ended up labelled rule-then-label while its neighbour "Interests" was
 * label-then-rule — two heading systems stacked against each other. Each is now a peer of Details and
 * Links, and gets that same treatment from `RailSection`.
 */
function useSortedChoices(ids: string[] | null | undefined, group: 'interests' | 'causes') {
  const choices = useChoicesContext()
  const {locale} = useLocale()
  return (ids
    ?.map((id) => choices?.[group]?.[id])
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, locale)) ?? []) as string[]
}

export function ProfileInterests(props: {profile: Profile}) {
  const interests = useSortedChoices(props.profile.interests, 'interests')
  if (!interests.length) return null
  return <TagList items={interests} />
}

export function ProfileCauses(props: {profile: Profile}) {
  const causes = useSortedChoices(props.profile.causes, 'causes')
  if (!causes.length) return null
  return <TagList items={causes} />
}

/**
 * An unordered set of taxonomy tags as one middot-separated run, matching how the Work row already
 * lists work areas — the same shape of data, so it gets the same shape of presentation.
 *
 * These were pills, which read as buttons. Nothing here is clickable, and the Links block below is,
 * so the affordance was pointing at the wrong things. Pills now mean "you can click this"; text means
 * "you can read this". Middots rather than commas because several tags carry internal punctuation
 * ("Animal welfare & rights", "Health & Medicine") that commas would blur together.
 */
function TagList(props: {items: string[]}) {
  const {items} = props
  return (
    <div className="text-primary-900" style={{fontSize: '15px', lineHeight: '1.65'}}>
      <DottedList items={items} />
    </div>
  )
}

/**
 * Whether the Personality card has anything to show. Exported so the card and its call site
 * (`profile/profile-info.tsx`) can't drift apart and render an empty card.
 */
export function hasPersonality(profile: Profile) {
  const p = profile as any
  return !!(profile.mbti || p.neurotype?.length || p.neurotype_details)
}

/** Big Five is its own rail section, so it needs its own emptiness check. */
export function hasBigFive(profile: Profile) {
  return BIG5_KEYS.some((key) => profile[key] != null)
}

const BIG5_KEYS = [
  'big5_openness',
  'big5_conscientiousness',
  'big5_extraversion',
  'big5_agreeableness',
  'big5_neuroticism',
] as const

/** Whether the Accessibility card has anything to show. Shared with its call site, as with `hasPersonality`. */
export function hasAccessibility(profile: Profile) {
  return !!(profile as any).accessibility_notes
}

/**
 * Its own card below Personality rather than a row in Details: it is practical meet-up information, not a
 * demographic attribute, and it reads as an aside when buried in a list of them.
 *
 * Rendered as the member wrote it — no choice mapping, no chips, line breaks preserved. The whole point of
 * this field being free text is that the framing belongs to them, so the UI must not restructure it.
 */
export function ProfileAccessibility(props: {profile: Profile}) {
  const {profile} = props
  const notes = (profile as any).accessibility_notes as string | null | undefined

  if (!notes) return null

  return (
    <div
      className="text-primary-900"
      style={{fontSize: '15px', lineHeight: '1.55', whiteSpace: 'pre-wrap'}}
    >
      {notes}
    </div>
  )
}

export function ProfilePersonality(props: {profile: Profile}) {
  const {profile} = props

  if (!hasPersonality(profile)) return null

  return (
    <Col className={clsx('relative gap-3 overflow-hidden rounded')}>
      {/* Grouped with MBTI rather than with orientation in the Details card: it describes how
          someone's mind works, and matters just as much for friendship and collaboration as for dating. */}
      <Neurotype profile={profile} />
      <MBTI profile={profile} />
    </Col>
  )
}

/** Big Five as a rail section of its own — see `ProfileInterests` for why the inner labels went away. */
export function ProfileBigFive(props: {profile: Profile}) {
  return <Big5Traits profile={props.profile} />
}

function MBTI(props: {profile: Profile}) {
  const {profile} = props
  const t = useT()

  if (!profile.mbti) return null

  const mbtiType = profile.mbti ? INVERTED_MBTI_CHOICES[profile.mbti] : null
  const mbtiTypeName = mbtiType ? t(`profile.mbti.${mbtiType}`, MBTI_TYPE_NAMES[mbtiType]) : null

  return (
    <div>
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
  t: ReturnType<typeof useT>,
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
      return value ? t('common.yes', 'Yes') : t('common.no', 'No')
    case 'height_in_inches':
      return formatHeight(value, measurementSystem)
    case 'pref_age_max':
    case 'pref_age_min':
      return null // handle this in a special case
    case 'wants_kids_strength':
      return renderAgreementScale(value, t)
    default:
      return value
  }
}

const renderAgreementScale = (value: number, t: ReturnType<typeof useT>) => {
  if (value == 1) return t('profile.agreement.strongly_disagree', 'Strongly disagree')
  if (value == 2) return t('profile.agreement.disagree', 'Disagree')
  if (value == 3) return t('profile.agreement.neutral', 'Neutral')
  if (value == 4) return t('profile.agreement.agree', 'Agree')
  if (value == 5) return t('profile.agreement.strongly_agree', 'Strongly agree')
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
