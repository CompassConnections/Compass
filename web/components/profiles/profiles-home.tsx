import {XMarkIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {debug} from 'common/logger'
import {Profile} from 'common/profiles/profile'
import {removeNullOrUndefinedProps} from 'common/util/object'
import {DAY_MS} from 'common/util/time'
import {isEqual} from 'lodash'
import {Compass as CompassIcon, TrendingUp} from 'lucide-react'
import {useRouter} from 'next/router'
import {ReactNode, useCallback, useEffect, useRef, useState} from 'react'
import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {FiltersElement, getActiveFilterCount} from 'web/components/filters/filters'
import {Search} from 'web/components/filters/search'
import {useFilters} from 'web/components/filters/use-filters'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {ProfileGrid, ProfileGridSkeleton} from 'web/components/profile-grid'
import {Title} from 'web/components/widgets/title'
import {useBookmarkedSearches} from 'web/hooks/use-bookmarked-searches'
import {useDisplayOptions} from 'web/hooks/use-display-options'
import {useGetter} from 'web/hooks/use-getter'
import {useHiddenProfiles} from 'web/hooks/use-hidden-profiles'
import {useIsClearedFilters} from 'web/hooks/use-is-cleared-filters'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'
import {useProfile} from 'web/hooks/use-profile'
import {useCompatibleProfiles} from 'web/hooks/use-profiles'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useLocale, useT} from 'web/lib/locale'
import {getStars} from 'web/lib/supabase/stars'

function ProfileBanner(props: {
  icon: ReactNode
  onDismiss: () => void
  dismissLabel: string
  children: ReactNode
}) {
  const {icon, onDismiss, dismissLabel, children} = props
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-primary-200/60 bg-gradient-to-br from-primary-50 via-canvas-50 to-canvas-50 px-4 py-4 shadow-sm dark:border-primary-800/30 dark:from-primary-950/30 dark:via-canvas-50 dark:to-canvas-50 sm:px-5">
      <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-primary-200/40 blur-3xl dark:bg-primary-700/20" />
      <button
        onClick={onDismiss}
        aria-label={dismissLabel}
        className="absolute right-2 top-2 rounded-full p-1.5 text-ink-400 transition-colors hover:bg-canvas-100 hover:text-ink-700"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
      <Row className="items-start gap-3 pr-7">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-300">
          {icon}
        </div>
        <Col className="min-w-0 items-start gap-2 text-left">{children}</Col>
      </Row>
    </div>
  )
}

export function ProfilesHome() {
  const user = useUser()
  const you = useProfile()
  const router = useRouter()
  const {query} = router
  const fromSignup = query.fromSignup === 'true'

  const {
    filters,
    updateFilter,
    clearFilters,
    setLookingForFilters,
    isLookingForFilters,
    locationFilterProps,
    raisedInLocationFilterProps,
  } = useFilters(you ?? undefined, fromSignup)

  const {displayOptions, updateDisplayOptions} = useDisplayOptions()

  const [profiles, setProfiles] = usePersistentInMemoryState<Profile[] | undefined>(
    undefined,
    'profiles',
  )
  const [getProfilesArgs, setGetProfilesArgs] = usePersistentInMemoryState<any>(
    undefined,
    'get-profiles-args',
  )
  const [profileCount, setProfileCount] = usePersistentInMemoryState<number | undefined>(
    undefined,
    'profile-count',
  )
  const {bookmarkedSearches, refreshBookmarkedSearches} = useBookmarkedSearches(user?.id)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isReloading, setIsReloading] = useState(false)
  const [showSignupBanner, setShowSignupBanner] = useState(fromSignup)
  const [showEarlyBanner, setShowEarlyBanner] = usePersistentLocalState<boolean>(
    true,
    'profiles-home-show-early-banner',
    7 * DAY_MS,
  )
  const [highlightFilters, setHighlightFilters] = useState(false)
  const [highlightSort, setHighlightSort] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const t = useT()
  const {locale} = useLocale()
  const isClearedFilters = useIsClearedFilters(filters)
  // Tracked separately from mobile (640px) since the docked filters column only replaces
  // the slide-over once there's room beside the grid, at the `lg` (1024px) breakpoint.
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    const update = () => setIsDesktop(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])
  // Remembered across visits so people who browse with the filters open get them back.
  // Desktop only: on mobile the panel is a full-screen slide-over, and restoring that on
  // load would hide the grid behind a modal, so there it stays session state.
  const [openDockedFilters, setOpenDockedFilters] = usePersistentLocalState<boolean>(
    false,
    'profiles-filters-open',
  )
  const [openFiltersSlideOver, setOpenFiltersSlideOver] = useState(false)
  const openFiltersModal = isDesktop ? openDockedFilters : openFiltersSlideOver
  const setOpenFiltersModal = isDesktop ? setOpenDockedFilters : setOpenFiltersSlideOver
  const [sendScrollWarning, setSendScrollWarning] = useState(true)
  const [recentlyHiddenIds, setRecentlyHiddenIds] = useState<string[]>([])
  const {refreshHiddenProfiles} = useHiddenProfiles()

  // const [debouncedAgeRange, setRawAgeRange] = useState({
  //   min: filters.pref_age_min ?? PREF_AGE_MIN,
  //   max: filters.pref_age_max ?? PREF_AGE_MAX,
  // })
  //
  // const debouncedSetAge = useCallback(debounce((state) => setRawAgeRange(state), 50), [])
  //
  // useEffect(() => {
  //   if (!user) return
  //   debouncedSetAge({min: filters.pref_age_min ?? PREF_AGE_MIN, max: filters.pref_age_max ?? PREF_AGE_MAX})
  // }, [filters.pref_age_min, filters.pref_age_max])

  const id = useRef(0)
  useEffect(() => {
    if (!user) return
    if (user.isBannedFromPosting) {
      setProfiles([])
      setProfileCount(0)
      return
    }
    const args = removeNullOrUndefinedProps({
      limit: 20,
      compatibleWithUserId: user?.id,
      locale,
      // The grid only renders a card per profile; the full row is several times the size.
      projection: 'card',
      ...filters,
    })
    if (!!profiles?.length && isEqual(getProfilesArgs, args)) {
      return
    }
    setIsReloading(true)
    const current = ++id.current
    debug('Refreshing profiles. Filters:', args)
    api('get-profiles', args as any)
      .then(({profiles, count}) => {
        if (current === id.current) {
          setProfiles(profiles)
          setGetProfilesArgs(args)
          setProfileCount(count)
        }
      })
      .finally(() => {
        if (current === id.current) setIsReloading(false)
      })
  }, [filters])

  const {data: starredUsers, refresh: refreshStars} = useGetter('star', user?.id, getStars)
  const starredUserIds = starredUsers?.map((u) => u.id)

  const compatibleProfiles = useCompatibleProfiles(user?.id)
  // const displayProfiles = profiles && orderProfiles(profiles, starredUserIds)
  const displayProfiles = profiles

  const limit = 20

  const loadMore = useCallback(async () => {
    if (!user) return false
    if (user.isBannedFromPosting) {
      setProfiles([])
      setProfileCount(0)
      return false
    }
    if (!profiles || isLoadingMore) return false
    debug('Loading more profiles. Current:', profiles.length)
    if (fromSignup && isClearedFilters && sendScrollWarning) {
      setSendScrollWarning(false)
      toast(
        t(
          'profiles.search_tip',
          'Tip: Searching first helps you find better matches. Scrolling endlessly reduces relevance.',
        ),
        {
          icon: '⚠️',
          style: {
            // background: 'rgba(128,128,128,0.15)', // light gray bg, adjust for dark mode
            // color: 'rgba(0,0,0,0.75)',           // dark text for light mode
            padding: '8px 8px',
            borderRadius: '8px',
            // fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
          },
          duration: 10000,
        },
      )
    }
    try {
      setIsLoadingMore(true)
      const lastProfile = profiles[profiles.length - 1]
      const result = await api(
        'get-profiles',
        removeNullOrUndefinedProps({
          limit,
          compatibleWithUserId: user?.id,
          after: lastProfile?.id.toString(),
          locale,
          projection: 'card',
          ...filters,
        }) as any,
      )
      if (result.profiles.length === 0) return false
      setProfiles((prev) => (prev ? [...prev, ...result.profiles] : result.profiles))
      return true
    } catch (err) {
      console.error('Failed to load more profiles', err)
      return false
    } finally {
      setIsLoadingMore(false)
    }
  }, [profiles, filters, isLoadingMore, setProfiles])

  const onHide = useCallback((userId: string) => {
    // Do not remove the profile from the list; mark as recently hidden to show placeholder with Undo.
    setRecentlyHiddenIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]))
  }, [])

  const onUndoHidden = useCallback(
    async (userId: string) => {
      try {
        await api('unhide-profile', {hiddenUserId: userId})
      } catch (e) {
        console.error('Failed to unhide profile', e)
      } finally {
        // Remove from local hidden ids regardless; server state is best-effort and will refresh.
        setRecentlyHiddenIds((prev) => prev.filter((id) => id !== userId))
        refreshHiddenProfiles()
      }
    },
    [refreshHiddenProfiles],
  )

  const filtersElement = (
    <FiltersElement
      filters={filters}
      youProfile={you}
      updateFilter={updateFilter}
      clearFilters={clearFilters}
      setLookingForFilters={setLookingForFilters}
      isLookingForFilters={isLookingForFilters}
      locationFilterProps={locationFilterProps}
      raisedInLocationFilterProps={raisedInLocationFilterProps}
      displayOptions={displayOptions}
      updateDisplayOptions={updateDisplayOptions}
    />
  )

  const showDockedFilters = isDesktop && openFiltersModal

  const activeFilterCount = getActiveFilterCount(
    filters,
    locationFilterProps,
    raisedInLocationFilterProps,
  )

  return (
    <div className={clsx(showDockedFilters && 'lg:grid lg:grid-cols-12 lg:gap-4')}>
      <Col className={clsx(showDockedFilters && 'lg:col-span-9')}>
        {showSignupBanner && user && (
          <ProfileBanner
            icon={<CompassIcon className="h-5 w-5" />}
            onDismiss={() => setShowSignupBanner(false)}
            dismissLabel={t('profiles.dismiss', 'Dismiss')}
          >
            <p className="text-sm font-medium text-ink-900 sm:text-[15px]">
              {t(
                'profiles.search_intention',
                'Compass works best when you search with intention. Try using keywords or filters instead of scrolling.',
              )}
            </p>
            <Row className="flex-wrap gap-2">
              <Button
                size="sm"
                color="gray-white"
                className="border border-canvas-300 bg-canvas-0 !text-ink-700 !rounded-full transition-colors hover:!border-primary-300 hover:!bg-primary-50 hover:!text-primary-700 dark:bg-canvas-100"
                onClick={() => {
                  searchInputRef.current?.focus()
                }}
              >
                {t('profiles.try_keyword_search', 'Try a keyword search')}
              </Button>
              <Button
                size="sm"
                color={'gray-white'}
                className="border border-canvas-300 bg-canvas-0 !text-ink-700 !rounded-full transition-colors hover:!border-primary-300 hover:!bg-primary-50 hover:!text-primary-700 dark:bg-canvas-100"
                onClick={() => {
                  setHighlightFilters(true)
                  setTimeout(() => {
                    setHighlightFilters(false)
                    setOpenFiltersModal(true)
                  }, 500)
                }}
              >
                {t('profiles.show_filters', 'Show me the filters')}
              </Button>
              <Button
                size="sm"
                color={'gray-white'}
                className="border border-canvas-300 bg-canvas-0 !text-ink-700 !rounded-full transition-colors hover:!border-primary-300 hover:!bg-primary-50 hover:!text-primary-700 dark:bg-canvas-100"
                onClick={() => {
                  setHighlightSort(true)
                  setTimeout(() => {
                    setHighlightSort(false)
                  }, 500)
                }}
              >
                {t('profiles.sort_differently', 'Sort differently')}
              </Button>
            </Row>
            <p className="text-xs text-ink-500">
              {t(
                'profiles.interactive_profiles',
                'Profiles are interactive — click any card to learn more and reach out.',
              )}
            </p>
          </ProfileBanner>
        )}
        {showEarlyBanner && !showSignupBanner && (
          <ProfileBanner
            icon={<TrendingUp className="h-5 w-5" />}
            onDismiss={() => setShowEarlyBanner(false)}
            dismissLabel={t('profiles.dismiss', 'Dismiss')}
          >
            <p className="text-sm font-medium text-ink-900 sm:text-[15px]">
              {t(
                'profiles.early_growth',
                `Compass is in its early growth phase — 700+ members and ~100 new people joining every month. Build a strong profile now and be visible as the community expands.`,
              )}
            </p>
          </ProfileBanner>
        )}
        {/*{user && !profile && <Button className="mb-4 lg:hidden" onClick={() => Router.push('signup')}>Create a profile</Button>}*/}
        <Title className="!mb-2 text-3xl">{t('profiles.title', 'People')}</Title>
        <Search
          ref={searchInputRef}
          openFilters={() => setOpenFiltersModal((open) => !open)}
          openFiltersModal={openFiltersModal}
          setOpenFiltersModal={setOpenFiltersModal}
          suppressFiltersModal={isDesktop}
          highlightFilters={highlightFilters}
          highlightSort={highlightSort}
          youProfile={you}
          starredUsers={starredUsers ?? []}
          refreshStars={refreshStars}
          filters={filters}
          updateFilter={updateFilter}
          locationFilterProps={locationFilterProps}
          bookmarkedSearches={bookmarkedSearches}
          refreshBookmarkedSearches={refreshBookmarkedSearches}
          profileCount={profileCount}
          activeFilterCount={activeFilterCount}
          filtersElement={filtersElement}
        />
        {displayProfiles === undefined || compatibleProfiles === undefined ? (
          <ProfileGridSkeleton cardSize={displayOptions.cardSize} />
        ) : (
          <>
            {fromSignup && isClearedFilters && (
              <p className={'guidance'}>
                {t(
                  'profiles.seeing_all_profiles',
                  'You are seeing all profiles. Use search or filters to narrow it down.',
                )}
              </p>
            )}
            <ProfileGrid
              profiles={displayProfiles}
              loadMore={loadMore}
              isLoadingMore={isLoadingMore}
              isReloading={isReloading}
              compatibilityScores={compatibleProfiles?.profileCompatibilityScores}
              starredUserIds={starredUserIds}
              refreshStars={refreshStars}
              onHide={onHide}
              hiddenUserIds={recentlyHiddenIds}
              onUndoHidden={onUndoHidden}
              displayOptions={displayOptions}
              filters={filters}
              locationFilterProps={locationFilterProps}
              bookmarkedSearches={bookmarkedSearches}
              refreshBookmarkedSearches={refreshBookmarkedSearches}
            />
          </>
        )}
      </Col>
      {showDockedFilters && (
        <div className="hidden lg:flex lg:flex-col lg:col-span-3 lg:sticky lg:top-4 lg:h-fit text-sm bg-canvas-50 rounded-xl max-h-[calc(100vh-2rem)] overflow-y-auto">
          <Row className="items-center justify-between px-3 pt-3">
            <span className="font-medium text-ink-900">{t('search.filters', 'Filters')}</span>
            <Button
              size="2xs"
              color="gray-white"
              onClick={() => setOpenFiltersModal(false)}
              aria-label={t('common.close', 'Close')}
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </Row>
          {filtersElement}
        </div>
      )}
    </div>
  )
}
