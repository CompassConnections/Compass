import {JSONContent} from '@tiptap/core'
import clsx from 'clsx'
import {INVERTED_DIET_CHOICES, INVERTED_LANGUAGE_CHOICES} from 'common/choices'
import {Gender} from 'common/gender'
import {CompatibilityScore} from 'common/profiles/compatibility-score'
import {Profile} from 'common/profiles/profile'
import {DisplayOptions} from 'common/profiles-rendering'
import {
  Brain,
  Briefcase,
  Calendar,
  Cigarette,
  HandHeart,
  Languages,
  Salad,
  Sparkles,
  Wine,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, {useEffect, useRef, useState} from 'react'
import {PiMagnifyingGlassBold} from 'react-icons/pi'
import GenderIcon from 'web/components/gender-icon'
import {IconWithInfo} from 'web/components/icons'
import {Row} from 'web/components/layout/row'
import {SendMessageButton} from 'web/components/messaging/send-message-button'
import {ProfileLocation} from 'web/components/profile/profile-location'
import {getSeekingText} from 'web/components/profile-about'
import {CompatibleBadge} from 'web/components/widgets/compatible-badge'
import {Content} from 'web/components/widgets/editor'
import HideProfileButton from 'web/components/widgets/hide-profile-button'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {StarButton} from 'web/components/widgets/star-button'
import {LoadMoreUntilNotVisible} from 'web/components/widgets/visibility-observer'
import {useChoicesContext} from 'web/hooks/use-choices'
import {isDark, useTheme} from 'web/hooks/use-theme'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'
import {getSeekingConnectionText} from 'web/lib/profile/seeking'
import {capitalizePure} from 'web/lib/util/time'

import {Col} from './layout/col'

export function ProfileGridSkeleton(props: {count?: number; className?: string}) {
  const {count = 6, className} = props
  return (
    <div className={clsx('grid gap-6 py-4 grid-cols-1', className)}>
      {Array.from({length: count}).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-canvas-300 bg-canvas-50 overflow-hidden animate-pulse"
        >
          <div className="flex flex-row h-full justify-between">
            <div className="flex-1 px-4 py-3 space-y-2 min-w-0">
              {/* name */}
              <div className="h-5 bg-canvas-200 rounded w-2/5" />
              {/* age / location */}
              <div className="h-3.5 bg-canvas-200 rounded w-1/3" />
              {/* headline */}
              <div className="h-3.5 bg-canvas-200 rounded w-3/5 mt-1" />
              {/* keyword pills */}
              <div className="flex gap-2 pt-1">
                <div className="h-6 bg-canvas-200 rounded-full w-16" />
                <div className="h-6 bg-canvas-200 rounded-full w-20" />
                <div className="h-6 bg-canvas-200 rounded-full w-14" />
              </div>
              {/* bio lines */}
              <div className="space-y-1.5 pt-1">
                <div className="h-3 bg-canvas-200 rounded w-full" />
                <div className="h-3 bg-canvas-200 rounded w-4/5" />
                <div className="h-3 bg-canvas-200 rounded w-3/4" />
              </div>
            </div>
            {/* photo placeholder */}
            <div className="shrink-0 w-40 min-h-24 bg-canvas-200 rounded-r-xl" />
          </div>
        </div>
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
  } = props

  const {cardSize} = displayOptions ?? {}

  const user = useUser()
  const t = useT()

  const other_profiles = profiles.filter((profile) => profile.user_id !== user?.id)

  const gridCols = {
    small: 'lg:grid-cols-2',
    medium: '',
    large: '',
  }[cardSize ?? 'medium']

  return (
    <div className="relative" data-testid="people-profile-grid">
      <div
        className={clsx(
          `grid gap-6 py-4 grid-cols-1`,
          isReloading && 'animate-pulse opacity-80',
          gridCols,
        )}
      >
        {other_profiles.map((profile) => (
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
      </div>

      <LoadMoreUntilNotVisible loadMore={loadMore} />

      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <CompassLoadingIndicator />
        </div>
      )}

      {user?.isBannedFromPosting ? (
        <div className="py-8 text-center">
          <p>You can't see profiles as you got banned.</p>
        </div>
      ) : (
        !isLoadingMore &&
        !isReloading &&
        other_profiles.length === 0 && (
          <div className="py-8 text-center">
            <p>{t('profile_grid.no_profiles', 'No profiles found.')}</p>
            <p>
              {t(
                'profile_grid.notification_cta',
                "Feel free to click on Get Notified and we'll notify you when new users match your search!",
              )}
            </p>
          </div>
        )
      )}
    </div>
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
    showLanguages,
    showHeadline,
    showKeywords,
    showCity,
    showOccupation,
    showSeeking,
    showInterests,
    showCauses,
    showDiet,
    showSmoking,
    showDrinks,
    showMBTI,
    showBio,
    cardSize,
  } = displayOptions ?? {}
  const {user} = profile
  const choicesIdsToLabels = useChoicesContext()
  const t = useT()

  const [isLoading, setIsLoading] = useState(false)
  const [showRing, setShowRing] = useState(false)
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pointerStartRef = useRef<{x: number; y: number} | null>(null)
  const hideButtonClickedRef = useRef(false)

  const {theme} = useTheme()
  const isDarkTheme = isDark(theme)

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = {x: e.clientX, y: e.clientY}
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStartRef.current) {
      const dx = Math.abs(e.clientX - pointerStartRef.current.x)
      const dy = Math.abs(e.clientY - pointerStartRef.current.y)

      // Check if opening in new tab
      const isNewTab = e.button === 1 || e.ctrlKey || e.metaKey || e.shiftKey

      // Reset hide button click flag after checking
      const wasHideButtonClicked = hideButtonClickedRef.current
      hideButtonClickedRef.current = false

      // If moved more than 10px, treat as drag/scroll - cancel loading
      // Also cancel if clicking hide button or opening in new tab
      if (dx > 10 || dy > 10 || wasHideButtonClicked || isNewTab) {
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

  // Show the bottom transparent gradient only if the text can't fit the card
  const textRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)
  useEffect(() => {
    const el = textRef.current
    if (!el) return
    const check = () => setIsOverflowing(el.scrollHeight > el.clientHeight)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const bio = profile.bio as JSONContent

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

  if (bio && bio.content) {
    const newBio = []
    let i = 0
    for (const c of bio.content) {
      if ((c?.content?.length || 0) == 0) continue
      if (c.type === 'paragraph') {
        newBio.push(c)
      } else if (['heading'].includes(c.type ?? '')) {
        newBio.push({
          type: 'paragraph',
          content: c.content,
        })
      } else if (c.type === 'image') {
        continue
      } else {
        newBio.push(c)
      }
      i += 1
      if (i >= 5) break
    }
    bio.content = newBio
  }

  const seekingText = profile.pref_relation_styles?.length
    ? cardSize === 'large'
      ? getSeekingText(profile, t, true)
      : getSeekingConnectionText(profile, t, true)
    : null

  // if (!profile.work?.length && !profile.occupation_title && !profile.interests?.length && (profile.bio_length || 0) < 100) {
  //   return null
  // }

  const isPhotoRendered = showPhotos !== false && profile.pinned_url

  const textHeightClass = {
    small: 'max-h-40',
    medium: 'max-h-60 lg:max-h-40',
    large: 'max-h-80',
  }[cardSize ?? 'medium']

  const photoSizeClass = {
    small: 'w-40 h-auto min-h-24',
    medium: 'w-40 lg:w-40 h-auto lg:h-auto min-h-20',
    large: 'w-60 lg:w-60 h-60 lg:h-auto min-h-48',
  }[cardSize ?? 'medium']

  const cardClass = {
    small: 'flex-row',
    medium: 'flex-row',
    large: 'flex-col',
  }[cardSize ?? 'medium']

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
          'border-[1.5px] border-[#E4DDD4]',
          'transition-all duration-[120ms] ease-in',
          'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[4px]',
          'before:bg-[#C17F3E] before:rounded-l-lg',
          'before:opacity-0 before:transition-opacity before:duration-[120ms]',
          'hover:before:opacity-100',
          // 'hover:bg-canvas-100',
          'hover:border-primary-300 hover:shadow-lg',
          'relative z-10 cursor-pointer group block rounded-xl overflow-hidden bg-transparent h-full border border-canvas-300',
          'text-ink-600',
          // hover,
        )}
      >
        {/* Phase 1: Dim overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-canvas-100/[0.32] rounded-xl z-20 pointer-events-none" />
        )}
        <Col className={clsx('relative w-full rounded-xl transition-all text-sm')}>
          <Row
            className={clsx(
              'absolute top-2 right-2 items-start justify-end px-2 pb-3 z-10 gap-1',
              isPhotoRendered && (cardSize === 'large' ? 'mr-0 sm:mr-60' : 'mr-40'),
            )}
          >
            {compatibilityScore && (
              <CompatibleBadge
                compatibility={compatibilityScore}
                className={clsx('pt-1 text-xs', cardSize !== 'large' && 'hidden sm:flex')}
              />
            )}
            {onHide && (
              <HideProfileButton
                hiddenUserId={profile.user_id}
                onHidden={onHide}
                className="ml-1"
                stopPropagation
                eyeOff
                onPointerDown={() => {
                  hideButtonClickedRef.current = true
                }}
              />
            )}
            {hasStar !== undefined && (
              <StarButton
                targetProfile={profile}
                isStarred={hasStar}
                refresh={refreshStars}
                size={'h-4 w-4'}
                className="h-7 w-7 !rounded-lg !p-1 hover:border-primary-400 hover:bg-primary-50"
                onPointerDown={() => {
                  hideButtonClickedRef.current = true
                }}
              />
            )}
            {user && (
              <div className={clsx(cardSize !== 'large' && 'hidden sm:flex')}>
                <SendMessageButton
                  toUser={user}
                  profile={profile}
                  size={'h-4 w-4'}
                  className={clsx('!p-1 w-7 h-7')}
                  accentIfMessaged
                  onPointerDown={() => {
                    hideButtonClickedRef.current = true
                  }}
                />
              </div>
            )}
          </Row>

          <div className={clsx('flex lg:flex-row h-full lg:justify-between', cardClass)}>
            <div
              ref={textRef}
              className={clsx(
                'relative min-w-0 px-4 py-2 overflow-hidden lg:flex-1',
                textHeightClass,
              )}
            >
              <h3
                className={clsx(
                  'main-font font-medium text-lg text-gray-900 dark:text-white truncate my-0 transition-opacity duration-75',
                  isLoading && 'opacity-50',
                )}
                data-testid="people-profile-name"
              >
                {user.name}
              </h3>
              <Row
                className={clsx(
                  'flex-wrap gap-x-2 transition-opacity duration-75',
                  isLoading && 'opacity-50',
                )}
                data-testid="people-profile-age-gender"
              >
                {showCity !== false && <ProfileLocation profile={profile} />}
                {showAge !== false && profile.age && (
                  <IconWithInfo
                    text={t('profile.header.age', '{age} years old', {age: profile.age})}
                    icon={<Calendar className="h-4 w-4 " />}
                  />
                )}
                {showGender !== false && profile.gender && (
                  <IconWithInfo
                    text={''}
                    icon={<GenderIcon gender={profile.gender as Gender} className="h-4 w-4 " />}
                  />
                )}
              </Row>
              {showHeadline !== false && profile.headline && (
                <p className="italic my-0">"{profile.headline}"</p>
              )}
              {showKeywords !== false && !!profile.keywords?.length && (
                <Row className={'gap-2 flex-wrap py-2'} data-testid="profile-keywords">
                  {profile.keywords
                    ?.slice(0, 10)
                    ?.map(capitalizePure)
                    ?.map((tag, i) => (
                      <span
                        key={i}
                        className={
                          'bg-canvas-200 text-primary-700 text-sm px-3 p-1 rounded-full border border-canvas-300'
                        }
                      >
                        {tag.trim()}
                      </span>
                    ))}
                </Row>
              )}
              {showSeeking !== false && seekingText && (
                <IconWithInfo
                  text={seekingText}
                  icon={<PiMagnifyingGlassBold className="h-4 w-4 " />}
                />
              )}
              {showOccupation !== false && profile.occupation_title && (
                <IconWithInfo
                  text={profile.occupation_title}
                  icon={<Briefcase className="h-4 w-4 " />}
                />
              )}
              {showInterests !== false && !!profile.interests?.length && (
                <IconWithInfo
                  text={profile.interests
                    ?.slice(0, 5)
                    .map((id) => choicesIdsToLabels['interests'][id])
                    .join(' • ')}
                  icon={<Sparkles className="h-4 w-4 " />}
                />
              )}
              {showCauses !== false && !!profile.causes?.length && (
                <IconWithInfo
                  text={profile.causes
                    ?.slice(0, 5)
                    .map((id) => choicesIdsToLabels['causes'][id])
                    .join(' • ')}
                  icon={<HandHeart className="h-4 w-4 " />}
                />
              )}
              <Row className={'gap-2 flex-wrap'}>
                {showDiet !== false && !!profile.diet?.length && (
                  <IconWithInfo
                    text={profile.diet
                      ?.map((e) => t(`profile.diet.${e}`, INVERTED_DIET_CHOICES[e]))
                      .join(' • ')}
                    icon={<Salad className="h-4 w-4 " />}
                  />
                )}
                {showSmoking !== false && profile.is_smoker && (
                  <IconWithInfo
                    text={t('profile.optional.smoking', 'Smokes')}
                    icon={<Cigarette className="h-4 w-4 " />}
                  />
                )}
                {showDrinks !== false &&
                  profile.drinks_per_month !== null &&
                  profile.drinks_per_month !== undefined && (
                    <IconWithInfo
                      text={`${profile.drinks_per_month} ${t('filter.drinks.per_month', 'per month')}`}
                      icon={<Wine className="h-4 w-4 " />}
                    />
                  )}
                {showMBTI !== false && profile.mbti && (
                  <IconWithInfo
                    text={profile.mbti.toUpperCase()}
                    icon={<Brain className="h-4 w-4 " />}
                  />
                )}
                {showLanguages !== false && !!profile.languages?.length && (
                  <IconWithInfo
                    text={profile.languages
                      ?.map((v) => t(`profile.language.${v}`, INVERTED_LANGUAGE_CHOICES[v]))
                      .join(' • ')}
                    icon={<Languages className="h-4 w-4 " />}
                  />
                )}
              </Row>
              {showBio !== false && bio && (
                <div className="border-l-2 border-gray-200 dark:border-gray-600 pl-3 mt-1">
                  <Content className="w-full italic text-sm" content={bio} />
                </div>
              )}
              {isOverflowing && (
                <div
                  className={clsx(
                    'absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-canvas-50 to-transparent pointer-events-none',
                    // 'group-hover:from-canvas-100 dark:group-hover:from-canvas-100',
                  )}
                />
              )}
            </div>
            {isPhotoRendered && (
              <div
                className={clsx(
                  'relative shrink-0 rounded-r-xl lg:self-stretch overflow-hidden z-1 mx-auto',
                  photoSizeClass,
                )}
              >
                <Image
                  src={profile.pinned_url!}
                  fill
                  alt=""
                  className="object-cover object-top"
                  loading="lazy"
                  priority={false}
                />
              </div>
            )}
          </div>
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
              background: `conic-gradient(from 0deg, ${isDarkTheme ? '#000000' : '#ffffff'}, ${isDarkTheme ? '#000000' : '#ffffff'}, #C17F3E)`,
              animationDuration: '1s',
            }}
          />
        </div>
      )}
    </div>
  )
}
