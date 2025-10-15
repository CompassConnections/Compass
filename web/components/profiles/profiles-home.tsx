import {Profile} from 'common/love/profile'
import {removeNullOrUndefinedProps} from 'common/util/object'
import {Search} from 'web/components/filters/search'
import {useProfile} from 'web/hooks/use-profile'
import {useCompatibleProfiles} from 'web/hooks/use-profiles'
import {getStars} from 'web/lib/supabase/stars'
import {useCallback, useEffect, useRef, useState} from 'react'
import {ProfileGrid} from 'web/components/profile-grid'
import {LoadingIndicator} from 'web/components/widgets/loading-indicator'
import {Title} from 'web/components/widgets/title'
import {useGetter} from 'web/hooks/use-getter'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useBookmarkedSearches} from "web/hooks/use-bookmarked-searches";
import {useFilters} from "web/components/filters/use-filters";

export function ProfilesHome() {
  const user = useUser();
  const you = useProfile();

  const {
    filters,
    updateFilter,
    clearFilters,
    setYourFilters,
    isYourFilters,
    locationFilterProps,
  } = useFilters(you ?? undefined);

  const [profiles, setProfiles] = usePersistentInMemoryState<Profile[] | undefined>(undefined, 'profile-profiles');
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
      .then(({profiles}) => {
        if (current === id.current) setProfiles(profiles);
      })
      .finally(() => {
        if (current === id.current) setIsReloading(false);
      });
  }, [filters]);

  const {data: starredUsers, refresh: refreshStars} = useGetter('star', user?.id, getStars)
  const starredUserIds = starredUsers?.map((u) => u.id)

  const compatibleProfiles = useCompatibleProfiles(user?.id)
  // const displayProfiles = profiles && orderProfiles(profiles, starredUserIds);
  const displayProfiles = profiles

  const loadMore = useCallback(async () => {
    if (!profiles || isLoadingMore) return false;
    try {
      setIsLoadingMore(true);
      const lastProfile = profiles[profiles.length - 1];
      const result = await api('get-profiles', removeNullOrUndefinedProps({
        limit: 20,
        compatibleWithUserId: user?.id,
        after: lastProfile?.id.toString(),
        ...filters
      }) as any);
      if (result.profiles.length === 0) return false;
      setProfiles((prev) => (prev ? [...prev, ...result.profiles] : result.profiles));
      return true;
    } catch (err) {
      console.error('Failed to load more profiles', err);
      return false;
    } finally {
      setIsLoadingMore(false);
    }
  }, [profiles, filters, isLoadingMore, setProfiles]);

  return (
    <>
      {/*{user && !profile && <Button className="mb-4 lg:hidden" onClick={() => Router.push('signup')}>Create a profile</Button>}*/}
      <Title className="!mb-2 text-3xl">Profiles</Title>
      <Search
        youProfile={you}
        starredUsers={starredUsers ?? []}
        refreshStars={refreshStars}
        filters={filters}
        updateFilter={updateFilter}
        clearFilters={clearFilters}
        setYourFilters={setYourFilters}
        isYourFilters={isYourFilters}
        locationFilterProps={locationFilterProps}
        bookmarkedSearches={bookmarkedSearches}
        refreshBookmarkedSearches={refreshBookmarkedSearches}
      />
      {displayProfiles === undefined || compatibleProfiles === undefined ? (
        <LoadingIndicator/>
      ) : (
        <ProfileGrid
          profiles={displayProfiles}
          loadMore={loadMore}
          isLoadingMore={isLoadingMore}
          isReloading={isReloading}
          compatibilityScores={compatibleProfiles?.profileCompatibilityScores}
          starredUserIds={starredUserIds}
          refreshStars={refreshStars}
        />
      )}
    </>
  );
}
