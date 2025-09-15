import {Lover} from 'common/love/lover'
import {removeNullOrUndefinedProps} from 'common/util/object'
import {Search} from 'web/components/filters/search'
import {useLover} from 'web/hooks/use-lover'
import {useCompatibleLovers} from 'web/hooks/use-lovers'
import {getStars} from 'web/lib/supabase/stars'
import Router from 'next/router'
import {useCallback, useEffect, useRef, useState} from 'react'
import {Button} from 'web/components/buttons/button'
import {orderLovers, useFilters} from 'web/components/filters/use-filters'
import {ProfileGrid} from 'web/components/profile-grid'
import {LoadingIndicator} from 'web/components/widgets/loading-indicator'
import {Title} from 'web/components/widgets/title'
import {useGetter} from 'web/hooks/use-getter'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useBookmarkedSearches} from "web/hooks/use-bookmarked-searches";

export function ProfilesHome() {
  const user = useUser();
  const lover = useLover();
  const you = lover;

  const {
    filters,
    updateFilter,
    clearFilters,
    setYourFilters,
    isYourFilters,
    locationFilterProps,
  } = useFilters(you ?? undefined);

  const [lovers, setLovers] = usePersistentInMemoryState<Lover[] | undefined>(undefined, 'profile-lovers');
  const {bookmarkedSearches, refreshBookmarkedSearches} = useBookmarkedSearches(user?.id)
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  // const [debouncedAgeRange, setRawAgeRange] = useState({
  //   min: filters.pref_age_min ?? PREF_AGE_MIN,
  //   max: filters.pref_age_max ?? PREF_AGE_MAX,
  // });
  //
  // const debouncedSetAge = useCallback(debounce((state) => setRawAgeRange(state), 50), []);
  //
  // useEffect(() => {
  //   if (!user) return;
  //   debouncedSetAge({min: filters.pref_age_min ?? PREF_AGE_MIN, max: filters.pref_age_max ?? PREF_AGE_MAX});
  // }, [filters.pref_age_min, filters.pref_age_max]);

  const id = useRef(0);
  useEffect(() => {
    if (!user) return;
    setIsReloading(true);
    const current = ++id.current;
    api('get-profiles', removeNullOrUndefinedProps({
      limit: 20,
      compatibleWithUserId: user?.id,
      ...filters
    }) as any)
      .then(({lovers}) => {
        if (current === id.current) setLovers(lovers);
      })
      .finally(() => {
        if (current === id.current) setIsReloading(false);
      });
  }, [filters]);

  const {data: starredUserIds, refresh: refreshStars} = useGetter('star', user?.id, getStars);
  const compatibleLovers = useCompatibleLovers(user?.id);
  const displayLovers = lovers && orderLovers(lovers, starredUserIds);

  const loadMore = useCallback(async () => {
    if (!lovers || isLoadingMore) return false;
    try {
      setIsLoadingMore(true);
      const lastLover = lovers[lovers.length - 1];
      const result = await api('get-profiles', removeNullOrUndefinedProps({
        limit: 20,
        compatibleWithUserId: user?.id,
        after: lastLover?.id.toString(),
        ...filters
      }) as any);
      if (result.lovers.length === 0) return false;
      setLovers((prev) => (prev ? [...prev, ...result.lovers] : result.lovers));
      return true;
    } catch (err) {
      console.error('Failed to load more lovers', err);
      return false;
    } finally {
      setIsLoadingMore(false);
    }
  }, [lovers, filters, isLoadingMore, setLovers]);

  return (
    <>
      {!lover && <Button className="mb-4 lg:hidden" onClick={() => Router.push('signup')}>Create a profile</Button>}
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
        bookmarkedSearches={bookmarkedSearches}
        refreshBookmarkedSearches={refreshBookmarkedSearches}
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
        />
      )}
    </>
  );
}
