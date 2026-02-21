import {Profile} from 'common/profiles/profile'
import {removeNullOrUndefinedProps} from 'common/util/object'
import {useRouter} from 'next/router'
import {useCallback, useEffect, useRef, useState} from 'react'
import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {Search} from 'web/components/filters/search'
import {useFilters} from 'web/components/filters/use-filters'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {ProfileGrid} from 'web/components/profile-grid'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {Title} from 'web/components/widgets/title'
import {useBookmarkedSearches} from 'web/hooks/use-bookmarked-searches'
import {useGetter} from 'web/hooks/use-getter'
import {useHiddenProfiles} from 'web/hooks/use-hidden-profiles'
import {useIsClearedFilters} from 'web/hooks/use-is-cleared-filters'
import {useIsMobile} from 'web/hooks/use-is-mobile'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {useProfile} from 'web/hooks/use-profile'
import {useCompatibleProfiles} from 'web/hooks/use-profiles'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useLocale, useT} from 'web/lib/locale'
import {getStars} from 'web/lib/supabase/stars'

export function ProfilesHome() {
  const user = useUser()
  const you = useProfile()

  const {
    filters,
    updateFilter,
    clearFilters,
    setYourFilters,
    isYourFilters,
    locationFilterProps,
    raisedInLocationFilterProps,
  } = useFilters(you ?? undefined)

  const [profiles, setProfiles] = usePersistentInMemoryState<Profile[] | undefined>(
    undefined,
    'profiles',
  )
  const [profileCount, setProfileCount] = usePersistentInMemoryState<number | undefined>(
    undefined,
    'profile-count',
  )
  const {bookmarkedSearches, refreshBookmarkedSearches} = useBookmarkedSearches(user?.id)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isReloading, setIsReloading] = useState(false)
  const [showBanner, setShowBanner] = useState(true)
  const [openFiltersModal, setOpenFiltersModal] = useState(false)
  const [highlightFilters, setHighlightFilters] = useState(false)
  const [highlightSort, setHighlightSort] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const t = useT()
  const {locale} = useLocale()
  const isClearedFilters = useIsClearedFilters(filters)
  const router = useRouter()
  const {query} = router
  const fromSignup = query.fromSignup === 'true'
  const isMobile = useIsMobile()
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
    setIsReloading(true)
    const current = ++id.current
    const args = removeNullOrUndefinedProps({
      limit: 20,
      compatibleWithUserId: user?.id,
      locale,
      ...filters,
    })
    console.debug('Refreshing profiles, filters:', args)
    api('get-profiles', args as any)
      .then(({profiles, count}) => {
        if (current === id.current) {
          setProfiles(profiles)
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
    if (!profiles || isLoadingMore) return false
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

  return (
    <>
      {showBanner && fromSignup && (
        <div className="lg:col-span-12 w-full bg-canvas-100 rounded text-center py-3 px-3 relative">
          <Col className="items-center justify-center gap-2">
            <span className={'mb-2'}>
              {t(
                'profiles.search_intention',
                'Compass works best when you search with intention. Try using keywords or filters instead of scrolling.',
              )}
            </span>
            <Row className="gap-2 mb-2">
              <Button
                size="sm"
                color="gray-white"
                className={'border'}
                onClick={() => {
                  searchInputRef.current?.focus()
                }}
              >
                {t('profiles.try_keyword_search', 'Try a keyword search')}
              </Button>
              {isMobile && (
                <Button
                  size="sm"
                  color={'gray-white'}
                  className={'border'}
                  onClick={() => {
                    if (!isMobile) return
                    setHighlightFilters(true)
                    setTimeout(() => {
                      setHighlightFilters(false)
                      setOpenFiltersModal(true)
                    }, 500)
                  }}
                >
                  {t('profiles.show_filters', 'Show me the filters')}
                </Button>
              )}
              <Button
                size="sm"
                color={'gray-white'}
                className={'border'}
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
            <Row className="gap-2 mb-6 sm:mb-2">
              <p>
                {t(
                  'profiles.interactive_profiles',
                  'Profiles are interactive — click any card to learn more and reach out.',
                )}
              </p>
            </Row>
          </Col>
          <Button
            size="2xs"
            color="gray-white"
            onClick={() => setShowBanner(false)}
            className="absolute bottom-1 right-1"
          >
            {t('profiles.dismiss', 'Dismiss')}
          </Button>
        </div>
      )}
      {/*{user && !profile && <Button className="mb-4 lg:hidden" onClick={() => Router.push('signup')}>Create a profile</Button>}*/}
      <Title className="!mb-2 text-3xl">{t('profiles.title', 'People')}</Title>
      <Search
        ref={searchInputRef}
        openFilters={() => setOpenFiltersModal(true)}
        openFiltersModal={openFiltersModal}
        setOpenFiltersModal={setOpenFiltersModal}
        highlightFilters={highlightFilters}
        highlightSort={highlightSort}
        youProfile={you}
        starredUsers={starredUsers ?? []}
        refreshStars={refreshStars}
        filters={filters}
        updateFilter={updateFilter}
        clearFilters={clearFilters}
        setYourFilters={setYourFilters}
        isYourFilters={isYourFilters}
        locationFilterProps={locationFilterProps}
        raisedInLocationFilterProps={raisedInLocationFilterProps}
        bookmarkedSearches={bookmarkedSearches}
        refreshBookmarkedSearches={refreshBookmarkedSearches}
        profileCount={profileCount}
      />
      {displayProfiles === undefined || compatibleProfiles === undefined ? (
        <CompassLoadingIndicator />
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
          />
        </>
      )}
    </>
  )
}
