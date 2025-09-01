import {Lover} from 'common/love/lover'
import {removeNullOrUndefinedProps} from 'common/util/object'
import {Search} from 'web/components/filters/search'
import {LovePage} from 'web/components/love-page'
import {SignUpAsMatchmaker} from 'web/components/nav/love-sidebar'
import {useLover} from 'web/hooks/use-lover'
import {useCompatibleLovers} from 'web/hooks/use-lovers'
import {getStars} from 'web/lib/supabase/stars'
import {signupThenMaybeRedirectToSignup} from 'web/lib/util/signup'
import Router from 'next/router'
import {useCallback, useEffect, useRef, useState} from 'react'
import {Button} from 'web/components/buttons/button'
import {orderLovers, useFilters} from 'web/components/filters/use-filters'
import {Col} from 'web/components/layout/col'
import {ProfileGrid} from 'web/components/profile-grid'
import {LoadingIndicator} from 'web/components/widgets/loading-indicator'
import {Title} from 'web/components/widgets/title'
import {useGetter} from 'web/hooks/use-getter'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {useSaveReferral} from 'web/hooks/use-save-referral'
import {useTracking} from 'web/hooks/use-tracking'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {debounce, omit} from 'lodash'
import {PREF_AGE_MAX, PREF_AGE_MIN,} from 'web/components/filters/location-filter'

export default function ProfilesPage() {
  const you = useLover()

  const {
    filters,
    updateFilter,
    clearFilters,
    setYourFilters,
    isYourFilters,
    locationFilterProps,
  } = useFilters(you ?? undefined)

  // Store all loaded lovers
  const [lovers, setLovers] = usePersistentInMemoryState<Lover[] | undefined>(
    undefined,
    'profile-lovers'
  )

  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isReloading, setIsReloading] = useState(false)

  // Refresh lovers when filters change

  // debounce age filter
  const [debouncedAgeRange, setRawAgeRange] = useState({
    min: filters.pref_age_min ?? PREF_AGE_MIN,
    max: filters.pref_age_max ?? PREF_AGE_MAX,
  })

  const debouncedSetAge = useCallback(
    debounce(
      (state: { min: number; max: number }) => setRawAgeRange(state),
      50
    ),
    []
  )

  const user = useUser()

  useEffect(() => {
    if (!user) return
    debouncedSetAge({
      min: filters.pref_age_min ?? PREF_AGE_MIN,
      max: filters.pref_age_max ?? PREF_AGE_MAX,
    })
  }, [filters.pref_age_min, filters.pref_age_max])

  const id = useRef(0)
  useEffect(() => {
    if (!user) return
    setIsReloading(true)
    const current = ++id.current
    api(
      'get-lovers',
      removeNullOrUndefinedProps({
        limit: 20,
        compatibleWithUserId: user?.id,
        ...filters,
      }) as any
    )
      .then(({lovers}) => {
        if (current === id.current) {
          setLovers(lovers)
        }
      })
      .finally(() => {
        if (current === id.current) {
          setIsReloading(false)
        }
      })
  }, [
    JSON.stringify(omit(filters, ['pref_age_min', 'pref_age_max'])),
    debouncedAgeRange.min,
    debouncedAgeRange.max,
  ])

  useTracking('view love profiles')
  useSaveReferral(user)
  const lover = useLover()
  const {data: starredUserIds, refresh: refreshStars} = useGetter(
    'star',
    user?.id,
    getStars
  )

  const compatibleLovers = useCompatibleLovers(user ? user.id : user)
  const loadMore = useCallback(async () => {
    if (!lovers || isLoadingMore) return false

    try {
      setIsLoadingMore(true)

      // Get the last lover's ID as the after parameter
      const lastLover = lovers[lovers.length - 1]

      console.log('fetching lovers after', lastLover?.id)

      const result = await api(
        'get-lovers',
        removeNullOrUndefinedProps({
          limit: 20,
          compatibleWithUserId: user?.id,
          after: lastLover?.id.toString(),
          ...filters,
        } as any)
      )

      if (result.lovers.length === 0) {
        return false
      }

      // Append new lovers to existing array
      setLovers((prevLovers) => {
        if (!prevLovers) return result.lovers

        // Create a new array with all existing lovers plus new ones
        return [...prevLovers, ...result.lovers]
      })

      return true
    } catch (err) {
      console.error('Failed to load more lovers', err)
      return false
    } finally {
      setIsLoadingMore(false)
    }
  }, [lovers, filters, isLoadingMore, setLovers])

  const displayLovers = lovers && orderLovers(lovers, starredUserIds)

  useEffect(() => {
    const text = "Search.";
    const typewriter = document.getElementById("typewriter");
    let i = 0;
    let timeoutId: any;
    if (typewriter) typewriter.textContent = ""

    function typeWriter() {
      if (i < text.length && typewriter) {
        typewriter.textContent = text.substring(0, i + 1);
        i++;
        timeoutId = setTimeout(typeWriter, 150);
      }
    }

    const intervalId = setTimeout(() => typeWriter(), 500);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(intervalId);
      if (typewriter) typewriter.textContent = "Search."
    };
  }, []);

  if (user === undefined) return <div/>

  return (
    <LovePage trackPageView={'user profiles'}>
      <Col className="items-center">
        <Col className={'bg-canvas-0 w-full rounded px-3 py-4 sm:px-6'}>
          {user && lovers && !lover && (
            <Button
              className="mb-4 lg:hidden"
              onClick={() => Router.push('signup')}
            >
              Create a profile
            </Button>
          )}
          {user === null && (
            <Col className="mb-4 gap-2 lg:hidden">
              <Button
                className="flex-1"
                color="gradient"
                size="xl"
                onClick={signupThenMaybeRedirectToSignup}
              >
                Sign up
              </Button>
              <SignUpAsMatchmaker className="flex-1"/>
            </Col>
          )}
          {!user && <>
            <h1
              className="pt-12 pb-2 text-7xl md:text-8xl xs:text-6xl font-extrabold max-w-4xl leading-tight xl:whitespace-nowrap md:whitespace-nowrap ">
              Don't Swipe.<br/><span id="typewriter"></span><span id="cursor" className="animate-pulse">|</span>
            </h1>
            <div className="w-full bg-gray-50 dark:bg-gray-900 py-8 mt-20">
              <div className="max-w-6xl mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">Radically Transparent</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      No algorithms. Every profile searchable.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">Built for Depth</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Filter by any keyword and what matters most.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">Community Owned</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Free forever. Built by users, for users.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>}
          {user &&
              <>
                  <Title className="!mb-2 text-3xl">Profiles</Title>
                  <Search
                      youLover={you}
                      starredUserIds={starredUserIds ?? []}
                      filters={filters}
                      updateFilter={updateFilter}
                      clearFilters={clearFilters}
                      setYourFilters={setYourFilters}
                      isYourFilters={isYourFilters}
                      locationFilterProps={locationFilterProps}
                  />

                {displayLovers === undefined || compatibleLovers === undefined ? (
                  <LoadingIndicator/>
                ) : (
                  <ProfileGrid
                    lovers={displayLovers}
                    loadMore={loadMore}
                    isLoadingMore={isLoadingMore}
                    isReloading={isReloading}
                    compatibilityScores={compatibleLovers?.loverCompatibilityScores}
                    starredUserIds={starredUserIds}
                    refreshStars={refreshStars}
                  />)
                }
              </>
          }
        </Col>
      </Col>
    </LovePage>
  )
}
