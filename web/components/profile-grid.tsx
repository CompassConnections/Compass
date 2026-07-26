import {JSONContent} from '@tiptap/core'
import clsx from 'clsx'
import {INVERTED_DIET_CHOICES, INVERTED_LANGUAGE_CHOICES} from 'common/choices'
import {FilterFields} from 'common/filters'
import {Gender} from 'common/gender'
import {CompatibilityScore} from 'common/profiles/compatibility-score'
import {Profile} from 'common/profiles/profile'
import {CardSize, DisplayOptions} from 'common/profiles-rendering'
import {parseJsonContentToText} from 'common/util/parse'
import {clamp} from 'lodash'
import {
  Brain,
  Briefcase,
  Cigarette,
  HandHeart,
  Languages,
  Salad,
  SearchX,
  Sparkles,
  Wine,
} from 'lucide-react'
import Link from 'next/link'
import React, {useMemo, useRef, useState} from 'react'
import {PiMagnifyingGlassBold} from 'react-icons/pi'
import {LocationFilterProps} from 'web/components/filters/location-filter'
import GenderIcon from 'web/components/gender-icon'
import {IconWithInfo} from 'web/components/icons'
import {Row} from 'web/components/layout/row'
import {SendMessageButton} from 'web/components/messaging/send-message-button'
import {ProfileAvatar} from 'web/components/profile/profile-avatar'
import {ProfileLocation} from 'web/components/profile/profile-location'
import {getSeekingText} from 'web/components/profile-about'
import {GetNotifiedButton} from 'web/components/searches/get-notified-button'
import {CompatibilityRing} from 'web/components/widgets/compatible-badge'
import HideProfileButton from 'web/components/widgets/hide-profile-button'
import {StarButton} from 'web/components/widgets/star-button'
import {LoadMoreUntilNotVisible} from 'web/components/widgets/visibility-observer'
import {BookmarkedSearchesType} from 'web/hooks/use-bookmarked-searches'
import {useChoicesContext} from 'web/hooks/use-choices'
import {ColumnCountOptions, useColumnCount} from 'web/hooks/use-column-count'
import {isDark, useTheme} from 'web/hooks/use-theme'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'
import {capitalizePure} from 'web/lib/util/time'

import {Col} from './layout/col'

/**
 * Per-card-size tuning. Cards are text-first: the photo is a round avatar rather than a panel, so
 * the headline and bio get the width and the visual weight.
 *
 * `headlineCharsPerLine` is a rough average for the rendered column width at that size — it only feeds
 * the line budget below, so being a few characters off just shifts a clamp by one line.
 */
type CardSizeConfig = {
  /** Feeds the masonry column count — see `useColumnCount`. */
  columns: ColumnCountOptions
  avatarPx: number
  ringPx: number
  padding: string
  gap: string
  nameClass: string
  metaClass: string
  headlineClass: string
  bioClass: string
  keywordClass: string
  /** Caps the reading measure on wide cards — full-width lines get unreadable past ~90 chars. */
  textWidthClass: string
  /**
   * Wide cards would otherwise be medium's content with a void beside it. Instead they get a rail
   * of the detail fields the compact sizes leave to the profile page — that's the reason to pick
   * this size: depth per person rather than people per screen.
   */
  detailRail: boolean
  /** Rough characters per rendered line for the headline, used to size the line budget. */
  headlineCharsPerLine: number
  /** Headline + bio lines a card aims for, so cards with a long headline show less bio. */
  totalTextLines: number
  maxHeadlineLines: number
  maxBioLines: number
  maxKeywords: number
}

const MIN_BIO_LINES = 2

const CARD_SIZE_CONFIG: Record<CardSize, CardSizeConfig> = {
  small: {
    columns: {minCardWidth: 300, maxColumns: 4},
    avatarPx: 44,
    ringPx: 30,
    padding: 'px-3.5 py-3',
    gap: 'gap-2',
    nameClass: 'text-base',
    metaClass: 'text-xs',
    headlineClass: 'text-sm',
    bioClass: 'text-[13px]',
    keywordClass: 'text-[11px] px-2 py-0.5',
    textWidthClass: '',
    detailRail: false,
    headlineCharsPerLine: 52,
    totalTextLines: 6,
    maxHeadlineLines: 3,
    maxBioLines: 5,
    maxKeywords: 4,
  },
  medium: {
    columns: {minCardWidth: 380, maxColumns: 3},
    avatarPx: 52,
    ringPx: 34,
    padding: 'px-4 py-3.5',
    gap: 'gap-2.5',
    nameClass: 'text-lg',
    metaClass: 'text-sm',
    headlineClass: 'text-base',
    bioClass: 'text-sm',
    keywordClass: 'text-xs px-2.5 py-0.5',
    textWidthClass: '',
    detailRail: false,
    headlineCharsPerLine: 66,
    totalTextLines: 6,
    maxHeadlineLines: 3,
    maxBioLines: 5,
    maxKeywords: 5,
  },
  large: {
    columns: {maxColumns: 1, minCardWidth: 0},
    avatarPx: 80,
    ringPx: 42,
    padding: 'px-5 py-4',
    gap: 'gap-3',
    nameClass: 'text-xl',
    metaClass: 'text-sm',
    headlineClass: 'text-lg',
    bioClass: 'text-base',
    keywordClass: 'text-sm px-3 py-1',
    textWidthClass: 'max-w-3xl',
    detailRail: true,
    headlineCharsPerLine: 78,
    totalTextLines: 6,
    maxHeadlineLines: 3,
    maxBioLines: 5,
    maxKeywords: 8,
  },
}

// Tailwind needs the full class name in the source, so the clamp can't be interpolated.
const LINE_CLAMP_CLASS: Record<number, string> = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
}

export function ProfileGridSkeleton(props: {
  count?: number
  className?: string
  cardSize?: CardSize
}) {
  const {count = 20, className, cardSize} = props
  const config = CARD_SIZE_CONFIG[cardSize ?? 'medium']

  // Same measured-width masonry as the real grid, so the layout doesn't reflow when profiles land.
  const gridRef = useRef<HTMLDivElement>(null)
  const columnCount = useColumnCount(gridRef, config.columns)

  // Varied heights so the skeleton previews the masonry rather than a uniform grid.
  const bioLines = [3, 2, 4, 2, 3, 3]

  return (
    <div ref={gridRef} className={clsx('flex items-start gap-4 py-4', className)}>
      {Array.from({length: columnCount}).map((_, columnIndex) => (
        <Col key={columnIndex} className="min-w-0 flex-1 gap-4">
          {Array.from({length: count})
            .map((_, i) => i)
            .filter((i) => i % columnCount === columnIndex)
            .map((i) => (
              <div
                key={i}
                className={clsx(
                  'rounded-xl border border-canvas-300 bg-canvas-50 animate-pulse space-y-3',
                  config.padding,
                )}
              >
                <div className="flex flex-row items-center gap-3">
                  <div
                    className="shrink-0 rounded-full bg-canvas-200"
                    style={{height: config.avatarPx, width: config.avatarPx}}
                  />
                  <div className="flex-1 space-y-2">
                    {/* name */}
                    <div className="h-4 bg-canvas-200 rounded w-2/5" />
                    {/* location */}
                    <div className="h-3 bg-canvas-200 rounded w-1/3" />
                  </div>
                  {/* compatibility ring */}
                  <div
                    className="shrink-0 rounded-full bg-canvas-200"
                    style={{height: config.ringPx, width: config.ringPx}}
                  />
                </div>
                {/* headline */}
                <div className="h-4 bg-canvas-200 rounded w-4/5" />
                {/* bio lines */}
                <div className="space-y-1.5">
                  {Array.from({length: bioLines[i % bioLines.length]}).map((_, j) => (
                    <div
                      key={j}
                      className="h-3 bg-canvas-200 rounded"
                      style={{width: `${95 - j * 12}%`}}
                    />
                  ))}
                </div>
                {/* keyword pills */}
                <div className="flex gap-2 pt-1">
                  <div className="h-6 bg-canvas-200 rounded-full w-16" />
                  <div className="h-6 bg-canvas-200 rounded-full w-20" />
                  <div className="h-6 bg-canvas-200 rounded-full w-14" />
                </div>
              </div>
            ))}
        </Col>
      ))}
    </div>
  )
}

export const ProfileGrid = (props: {
  profiles: Profile[]
  loadMore: () => Promise<boolean>
  isLoadingMore: boolean
  isReloading: boolean
  compatibilityScores: Record<string, CompatibilityScore> | undefined
  starredUserIds: string[] | undefined
  refreshStars: () => Promise<void>
  onHide?: (userId: string) => void
  hiddenUserIds?: string[]
  onUndoHidden?: (userId: string) => void
  displayOptions?: Partial<DisplayOptions>
  filters: Partial<FilterFields>
  locationFilterProps: LocationFilterProps
  bookmarkedSearches: BookmarkedSearchesType[]
  refreshBookmarkedSearches: () => void
}) => {
  const {
    profiles,
    loadMore,
    isLoadingMore,
    isReloading,
    compatibilityScores,
    starredUserIds,
    refreshStars,
    onHide,
    hiddenUserIds,
    onUndoHidden,
    displayOptions,
    filters,
    locationFilterProps,
    bookmarkedSearches,
    refreshBookmarkedSearches,
  } = props

  const {cardSize} = displayOptions ?? {}
  const config = CARD_SIZE_CONFIG[cardSize ?? 'medium']

  const user = useUser()
  const t = useT()

  const other_profiles = profiles.filter((profile) => profile.user_id !== user?.id)

  // Masonry: cards are only as tall as their content, so a sparse profile stays short instead of
  // padding itself out with empty space. Round-robin (rather than CSS `columns`, which fills the
  // first column top to bottom) keeps the sort order reading left to right across each row.
  const gridRef = useRef<HTMLDivElement>(null)
  const columnCount = useColumnCount(gridRef, config.columns)
  const columns = useMemo(() => {
    const cols: Profile[][] = Array.from({length: columnCount}, () => [])
    other_profiles.forEach((profile, i) => cols[i % columnCount].push(profile))
    return cols
  }, [other_profiles, columnCount])

  return (
    <div className="relative" data-testid="people-profile-grid">
      <div
        ref={gridRef}
        className={clsx('flex items-start gap-4 py-4', isReloading && 'animate-pulse opacity-80')}
      >
        {columns.map((column, columnIndex) => (
          <Col key={columnIndex} className="min-w-0 flex-1 gap-4">
            {column.map((profile) => (
              <ProfilePreview
                key={profile.id}
                profile={profile}
                compatibilityScore={compatibilityScores?.[profile.user_id]}
                hasStar={starredUserIds?.includes(profile.user_id) ?? false}
                refreshStars={refreshStars}
                onHide={onHide}
                isHidden={hiddenUserIds?.includes(profile.user_id) ?? false}
                onUndoHidden={onUndoHidden}
                displayOptions={displayOptions}
              />
            ))}
          </Col>
        ))}
      </div>

      <LoadMoreUntilNotVisible loadMore={loadMore} />

      {isLoadingMore && <ProfileGridSkeleton count={columnCount} cardSize={cardSize} />}

      {user?.isBannedFromPosting ? (
        <div className="py-8 text-center">
          <p>You can't see profiles as you got banned.</p>
        </div>
      ) : (
        !isLoadingMore &&
        !isReloading &&
        other_profiles.length === 0 && (
          <Col className="items-center gap-3 py-16 px-4 text-center">
            <div className="rounded-full bg-canvas-200 p-4">
              <SearchX className="h-7 w-7 text-ink-400" />
            </div>
            <p className="text-lg font-medium text-ink-900">
              {t('profile_grid.no_profiles', 'No profiles found')}
            </p>
            <p className="max-w-sm text-ink-500">
              {t(
                'profile_grid.notification_cta',
                "We'll notify you as soon as someone new matches your search.",
              )}
            </p>
            <GetNotifiedButton
              filters={filters}
              locationFilterProps={locationFilterProps}
              bookmarkedSearches={bookmarkedSearches}
              refreshBookmarkedSearches={refreshBookmarkedSearches}
              color="cta"
              size="lg"
              className="mt-1"
            />
          </Col>
        )
      )}
    </div>
  )
}

/**
 * The detail fields the compact card sizes leave to the profile page. Deliberately not gated on
 * the `show*` display toggles: those toggles only cover the compact card, and picking the wide
 * size *is* the request to see this.
 */
function ProfileDetailRail(props: {profile: Profile; className?: string}) {
  const {profile, className} = props
  const choicesIdsToLabels = useChoicesContext()
  const t = useT()

  const seekingText = profile.pref_relation_styles?.length ? getSeekingText(profile, t, true) : null

  const rows = [
    seekingText && {
      key: 'seeking',
      testid: 'people-profile-seeking',
      icon: <PiMagnifyingGlassBold className="h-4 w-4" />,
      text: seekingText,
    },
    profile.occupation_title && {
      key: 'occupation',
      icon: <Briefcase className="h-4 w-4" />,
      text: profile.occupation_title,
    },
    !!profile.interests?.length && {
      key: 'interests',
      icon: <Sparkles className="h-4 w-4" />,
      text: profile.interests
        .slice(0, 5)
        .map((id) => choicesIdsToLabels['interests'][id])
        .join(' • '),
    },
    !!profile.causes?.length && {
      key: 'causes',
      icon: <HandHeart className="h-4 w-4" />,
      text: profile.causes
        .slice(0, 5)
        .map((id) => choicesIdsToLabels['causes'][id])
        .join(' • '),
    },
    !!profile.diet?.length && {
      key: 'diet',
      icon: <Salad className="h-4 w-4" />,
      text: profile.diet.map((e) => t(`profile.diet.${e}`, INVERTED_DIET_CHOICES[e])).join(' • '),
    },
    profile.is_smoker && {
      key: 'smoking',
      icon: <Cigarette className="h-4 w-4" />,
      text: t('profile.optional.smoking', 'Smokes'),
    },
    profile.drinks_per_month !== null &&
      profile.drinks_per_month !== undefined && {
        key: 'drinks',
        icon: <Wine className="h-4 w-4" />,
        text: `${profile.drinks_per_month} ${t('filter.drinks.per_month', 'per month')}`,
      },
    profile.mbti && {
      key: 'mbti',
      icon: <Brain className="h-4 w-4" />,
      text: profile.mbti.toUpperCase(),
    },
    !!profile.languages?.length && {
      key: 'languages',
      icon: <Languages className="h-4 w-4" />,
      text: profile.languages
        .map((v) => t(`profile.language.${v}`, INVERTED_LANGUAGE_CHOICES[v]))
        .join(' • '),
    },
  ].filter(Boolean) as Array<{key: string; testid?: string; icon: React.ReactNode; text: string}>

  // A profile with none of these would otherwise leave a bordered empty column.
  if (!rows.length) return null

  return (
    <Col
      className={clsx('gap-1.5 border-l border-canvas-300 pl-5 text-ink-500', className)}
      data-testid="profile-detail-rail"
    >
      {rows.map((row) => (
        <IconWithInfo key={row.key} testid={row.testid} icon={row.icon} text={row.text} />
      ))}
    </Col>
  )
}

function ProfilePreview(props: {
  profile: Profile
  compatibilityScore: CompatibilityScore | undefined
  hasStar: boolean
  refreshStars: () => Promise<void>
  onHide?: (userId: string) => void
  isHidden?: boolean
  onUndoHidden?: (userId: string) => void
  displayOptions?: Partial<DisplayOptions>
}) {
  const {
    profile,
    compatibilityScore,
    onHide,
    isHidden,
    onUndoHidden,
    displayOptions,
    hasStar,
    refreshStars,
  } = props

  const {
    showPhotos,
    showAge,
    showGender,
    showHeadline,
    showKeywords,
    showCity,
    showBio,
    cardSize,
    // Fields no longer shown on the card — they live on the profile page. Toggles are still in
    // `DisplayOptions` (and commented out in `field-toggles.tsx`) in case we bring them back.
    // showLanguages,
    // showOccupation,
    // showSeeking,
    // showInterests,
    // showCauses,
    // showDiet,
    // showSmoking,
    // showDrinks,
    // showMBTI,
  } = displayOptions ?? {}
  const {user} = profile
  // const choicesIdsToLabels = useChoicesContext()
  const t = useT()

  const config = CARD_SIZE_CONFIG[cardSize ?? 'medium']

  const [isLoading, setIsLoading] = useState(false)
  const [showRing, setShowRing] = useState(false)
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pointerStartRef = useRef<{x: number; y: number} | null>(null)

  const {theme} = useTheme()
  const isDarkTheme = isDark(theme)

  const headline = showHeadline !== false ? profile.headline?.trim() : undefined
  const bioText = useMemo(() => {
    if (showBio === false) return ''
    return parseJsonContentToText(profile.bio as JSONContent)
      .replace(/\s+/g, ' ')
      .trim()
  }, [profile.bio, showBio])

  // Keep the total amount of text roughly constant per card: the longer the headline, the fewer
  // bio lines we show. A card with no headline gives the whole budget to the bio, and vice versa.
  const estimatedHeadlineLines = headline
    ? Math.ceil(headline.length / config.headlineCharsPerLine)
    : 0
  const headlineLines = clamp(
    estimatedHeadlineLines,
    headline ? 1 : 0,
    bioText ? config.maxHeadlineLines : config.maxHeadlineLines + 1,
  )
  const bioLines = bioText
    ? clamp(config.totalTextLines - headlineLines, MIN_BIO_LINES, config.maxBioLines)
    : 0

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only a press on the card itself arms the press feedback. Two things to keep out:
    // the card's own controls (message, star, hide), and anything in a modal one of them opens —
    // Headless UI renders those in a portal, so React still bubbles their events up to this card
    // even though the DOM node lives outside it.
    const card = e.currentTarget as HTMLElement
    const target = e.target as HTMLElement | null
    if (!target || !card.contains(target) || target.closest('button, [role="button"]')) {
      pointerStartRef.current = null
      return
    }
    pointerStartRef.current = {x: e.clientX, y: e.clientY}
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStartRef.current) {
      const dx = Math.abs(e.clientX - pointerStartRef.current.x)
      const dy = Math.abs(e.clientY - pointerStartRef.current.y)

      // Check if opening in new tab
      const isNewTab = e.button === 1 || e.ctrlKey || e.metaKey || e.shiftKey

      // If moved more than 10px, treat as drag/scroll - cancel loading
      // Also cancel if opening in new tab
      if (dx > 10 || dy > 10 || isNewTab) {
        setIsLoading(false)
        setShowRing(false)
        if (ringTimeoutRef.current) {
          clearTimeout(ringTimeoutRef.current)
          ringTimeoutRef.current = null
        }
      } else {
        setIsLoading(true)
        ringTimeoutRef.current = setTimeout(() => {
          setShowRing(true)
        }, 500)
      }
    }
    pointerStartRef.current = null
  }

  const handleClick = () => {}

  // If this profile was just hidden, render a compact placeholder with Undo action.
  if (isHidden) {
    return (
      <div className="block rounded-xl border border-canvas-300 bg-canvas-50 dark:bg-gray-800/50 p-3 text-sm">
        <Row className="items-center justify-between gap-2">
          <span className="text-ink-700 dark:text-ink-300">
            {t(
              'profile_grid.profile_hidden_short',
              "You won't see {name} in your search results anymore.",
              {name: user?.name},
            )}
          </span>
          <button
            className="text-primary-500 hover:text-primary-700 underline"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault()
              e.stopPropagation()
              onUndoHidden?.(profile.user_id)
            }}
          >
            {t('profile_grid.undo', 'Undo')}
          </button>
        </Row>
      </div>
    )
  }

  // const seekingText = profile.pref_relation_styles?.length
  //   ? cardSize === 'large'
  //     ? getSeekingText(profile, t, true)
  //     : getSeekingConnectionText(profile, t, true)
  //   : null

  // if (!profile.work?.length && !profile.occupation_title && !profile.interests?.length && (profile.bio_length || 0) < 100) {
  //   return null
  // }

  const keywords = showKeywords !== false ? (profile.keywords ?? []) : []
  const visibleKeywords = keywords.slice(0, config.maxKeywords)
  const hiddenKeywordCount = keywords.length - visibleKeywords.length

  const textBlock = (
    <>
      {headline && (
        <p
          className={clsx(
            'main-font my-0 italic text-ink-900',
            config.headlineClass,
            config.textWidthClass,
            LINE_CLAMP_CLASS[headlineLines],
          )}
          data-testid="people-profile-headline"
        >
          “{headline}”
        </p>
      )}

      {!!bioLines && (
        <p
          className={clsx(
            'my-0',
            // Without a headline the bio *is* the card's voice, so give it more contrast.
            headline ? 'text-ink-500' : 'text-ink-600',
            config.bioClass,
            config.textWidthClass,
            LINE_CLAMP_CLASS[bioLines],
          )}
          data-testid="people-profile-bio"
        >
          {bioText}
        </p>
      )}

      {!!visibleKeywords.length && (
        <Row className="flex-wrap gap-1.5 pt-0.5" data-testid="profile-keywords">
          {visibleKeywords.map(capitalizePure).map((tag, i) => (
            <span
              key={i}
              className={clsx(
                'rounded-full border border-canvas-300 bg-canvas-100 text-ink-700 transition-colors group-hover:border-primary-200',
                config.keywordClass,
              )}
            >
              {tag.trim()}
            </span>
          ))}
          {hiddenKeywordCount > 0 && (
            <span className={clsx('rounded-full text-ink-400', config.keywordClass)}>
              +{hiddenKeywordCount}
            </span>
          )}
        </Row>
      )}
    </>
  )

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-xl bg-canvas-50',
        isLoading && 'scale-[0.94] transition-transform duration-[80ms] ease-out',
        !isLoading && 'transition-transform duration-[120ms] ease-in',
      )}
      data-testid="people-profile-results"
    >
      <Link
        href={`/${user.username}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        className={clsx(
          'relative overflow-hidden rounded-xl bg-canvas-50 person-card',
          !showRing && 'border border-canvas-300',
          'transition-all duration-[120ms] ease-in',
          'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[4px]',
          'before:bg-[#C17F3E] before:rounded-l-lg',
          'before:opacity-0 before:transition-opacity before:duration-[120ms]',
          'hover:before:opacity-100',
          'hover:border-primary-300 hover:shadow-lg',
          'relative z-10 cursor-pointer group block rounded-xl overflow-hidden bg-transparent h-full',
          'text-ink-600',
        )}
      >
        {/* Phase 1: Dim overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-canvas-100/[0.32] rounded-xl z-20 pointer-events-none" />
        )}
        <Col
          className={clsx(
            'relative w-full rounded-xl transition-opacity duration-75',
            config.padding,
            config.gap,
            isLoading && 'opacity-50',
          )}
        >
          <Row className="items-start gap-3">
            <ProfileAvatar
              profile={profile}
              sizePx={config.avatarPx}
              hidePhoto={showPhotos === false}
            />
            {/* Stretch to the avatar's height and center: without a location, the name would
                otherwise sit at the top with a void beneath it. */}
            <Col className="min-w-0 flex-1 justify-center gap-0.5 self-stretch">
              <Row className="min-w-0 items-baseline gap-2">
                <h3
                  className={clsx(
                    'main-font my-0 truncate font-medium text-gray-900 dark:text-white',
                    config.nameClass,
                  )}
                  data-testid="people-profile-name"
                >
                  {user.name}
                </h3>
                <Row
                  className={clsx('shrink-0 items-center gap-1 text-ink-500', config.metaClass)}
                  data-testid="people-profile-age-gender"
                >
                  {showAge !== false && !!profile.age && <span>{profile.age}</span>}
                  {showGender !== false && profile.gender && (
                    <GenderIcon gender={profile.gender as Gender} className="h-3.5 w-3.5" />
                  )}
                </Row>
              </Row>
              {showCity !== false && (
                <ProfileLocation
                  profile={profile}
                  hideIcon
                  className={clsx('text-ink-500', config.metaClass)}
                />
              )}
            </Col>
            {/* The score owns the top-right corner; the actions slot in to its left (with a wider
                gap than sits between the actions themselves). With no score the actions take the
                corner themselves. */}
            <Row className="shrink-0 items-center gap-2.5">
              <Row
                className={clsx(
                  'items-center gap-1 transition-opacity',
                  'lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100',
                )}
              >
                {onHide && (
                  <HideProfileButton
                    hiddenUserId={profile.user_id}
                    onHidden={onHide}
                    stopPropagation
                    eyeOff
                  />
                )}
                {hasStar !== undefined && (
                  <StarButton
                    targetProfile={profile}
                    isStarred={hasStar}
                    refresh={refreshStars}
                    size={'h-4 w-4'}
                    className="h-7 w-7 !rounded-lg !p-1 hover:border-primary-400 hover:bg-primary-50"
                  />
                )}
                {user && (
                  <div data-testid="message-profile-button">
                    <SendMessageButton
                      toUser={user}
                      profile={profile}
                      size={'h-4 w-4'}
                      className={clsx('!p-1 w-7 h-7')}
                      accentIfMessaged
                    />
                  </div>
                )}
              </Row>
              {compatibilityScore && (
                <CompatibilityRing compatibility={compatibilityScore} sizePx={config.ringPx} />
              )}
            </Row>
          </Row>

          {/* 2:1 split rather than a fixed-width rail: the text column is capped at its reading
              measure, so a rail pinned to the card's right edge would leave all the slack as a
              gutter down the middle. */}
          {config.detailRail ? (
            <Row className="gap-6">
              <Col className={clsx('min-w-0 flex-[2]', config.gap)}>{textBlock}</Col>
              {/* Below lg the card is too narrow to split — the rail would squeeze both columns. */}
              <ProfileDetailRail profile={profile} className="hidden min-w-0 flex-1 lg:flex" />
            </Row>
          ) : (
            textBlock
          )}
        </Col>
      </Link>

      {/* Phase 2: Animated ring - appears after 200ms */}
      {isLoading && showRing && (
        <div
          className="absolute inset-0 z-20 pointer-events-none rounded-xl overflow-hidden"
          style={{
            padding: '4px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        >
          <div
            className="absolute -inset-[200%] animate-spin"
            style={{
              background: `conic-gradient(from 0deg, ${isDarkTheme ? '#1f1c17' : '#f3f0ea'}, ${isDarkTheme ? '#1f1c17' : '#f3f0ea'}, #C17F3E)`,
              animationDuration: '1s',
            }}
          />
        </div>
      )}
    </div>
  )
}
