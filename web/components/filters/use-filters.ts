import {Profile} from "common/profiles/profile";
import {useIsLooking} from "web/hooks/use-is-looking";
import {usePersistentLocalState} from "web/hooks/use-persistent-local-state";
import {useCallback, useEffect} from "react";
import {debounce, isEqual} from "lodash";
import {wantsKidsDatabase, wantsKidsDatabaseToWantsKidsFilter, wantsKidsToHasKidsFilter} from "common/wants-kids";
import {FilterFields, initialFilters, OriginLocation} from "common/filters";
import {MAX_INT, MIN_INT} from "common/constants";

export const useFilters = (you: Profile | undefined) => {
  const isLooking = useIsLooking()
  const [filters, setFilters] = usePersistentLocalState<Partial<FilterFields>>(
    isLooking ? initialFilters : {...initialFilters, orderBy: 'created_time'},
    'profile-filters-4'
  )

  // console.log('filters', filters)

  const updateFilter = (newState: Partial<FilterFields>) => {
    const updatedState = {...newState}
    // console.log('updating filters', updatedState)
    setFilters((prevState) => ({...prevState, ...updatedState}))
  }

  const clearFilters = () => {
    setFilters(
      isLooking
        ? initialFilters
        : {...initialFilters, orderBy: 'created_time'}
    )
    setLocation(undefined)
  }

  const [radius, setRadius] = usePersistentLocalState<number>(
    100,
    'search-radius'
  )

  const debouncedSetRadius = useCallback(debounce(setRadius, 200), [setRadius])

  const [location, setLocation] = usePersistentLocalState<
    OriginLocation | undefined | null
  >(undefined, 'nearby-origin-location')

  // const nearbyCities = useNearbyCities(location?.id, radius)
  //
  // useEffectCheckEquality(() => {
  //   updateFilter({geodbCityIds: nearbyCities})
  // }, [nearbyCities])

  useEffect(() => {
    if (location?.lat && location?.lon) {
      updateFilter({lat: location.lat, lon: location.lon, radius: radius})
    } else {
      updateFilter({lat: undefined, lon: undefined, radius: undefined})
    }
  }, [location?.id, radius]);

  const locationFilterProps = {
    location,
    setLocation,
    radius,
    setRadius: debouncedSetRadius,
  }

  const yourFilters: Partial<FilterFields> = {
    pref_gender: you?.gender?.length ? [you.gender] : undefined,
    genders: you?.pref_gender?.length ? you.pref_gender : undefined,
    education_levels: you?.education_level ? [you.education_level] : undefined,
    pref_age_max: (you?.pref_age_max ?? MAX_INT) < 100 ? you?.pref_age_max : undefined,
    pref_age_min: (you?.pref_age_min ?? MIN_INT) > 18 ? you?.pref_age_min : undefined,
    pref_relation_styles: you?.pref_relation_styles?.length ? you.pref_relation_styles : undefined,
    pref_romantic_styles: you?.pref_romantic_styles?.length ? you.pref_romantic_styles : undefined,
    diet: you?.diet?.length ? you.diet : undefined,
    political_beliefs: you?.political_beliefs?.length ? you.political_beliefs : undefined,
    languages: you?.languages?.length ? you.languages : undefined,
    religion: you?.religion?.length ? you.religion : undefined,
    wants_kids_strength: wantsKidsDatabaseToWantsKidsFilter(
      (you?.wants_kids_strength ?? 2) as wantsKidsDatabase
    ),
    has_kids: wantsKidsToHasKidsFilter(
      (you?.wants_kids_strength ?? 2) as wantsKidsDatabase
    ),
    is_smoker: you?.is_smoker,
  }
  console.debug(you, yourFilters)

  const isYourFilters =
    !!you
    && (!location || location.id === you.geodb_city_id)
    && isEqual(filters.genders?.length ? filters.genders : undefined, yourFilters.genders?.length ? yourFilters.genders : undefined)
    && (!you.gender && !filters.pref_gender?.length || filters.pref_gender?.length == 1 && isEqual(filters.pref_gender?.length ? filters.pref_gender[0] : undefined, you.gender))
    && (!you.education_level && !filters.education_levels?.length || filters.education_levels?.length == 1 && isEqual(filters.education_levels?.length ? filters.education_levels[0] : undefined, you.education_level))
    && isEqual(new Set(filters.pref_romantic_styles), new Set(you.pref_romantic_styles))
    && isEqual(new Set(filters.pref_relation_styles), new Set(you.pref_relation_styles))
    && isEqual(new Set(filters.diet), new Set(you.diet))
    && isEqual(new Set(filters.political_beliefs), new Set(you.political_beliefs))
    && isEqual(new Set(filters.languages), new Set(you.languages))
    && isEqual(new Set(filters.religion), new Set(you.religion))
    && filters.pref_age_max == yourFilters.pref_age_max
    && filters.pref_age_min == yourFilters.pref_age_min
    && filters.wants_kids_strength == yourFilters.wants_kids_strength
    && filters.is_smoker == yourFilters.is_smoker

  const setYourFilters = (checked: boolean) => {
    if (checked) {
      updateFilter(yourFilters)
      setRadius(100)
      debouncedSetRadius(100) // clear any pending debounced sets
      if (you?.geodb_city_id && you.city && you.city_latitude && you.city_longitude) {
        setLocation({id: you?.geodb_city_id, name: you?.city, lat: you?.city_latitude, lon: you?.city_longitude})
      }
    } else {
      clearFilters()
    }
  }

  return {
    filters,
    updateFilter,
    clearFilters,
    setYourFilters,
    isYourFilters,
    locationFilterProps,
  }
}

// const alternateWomenAndMen = (profiles: Profile[]) => {
//   const [women, nonWomen] = partition(profiles, (l) => l.gender === 'female')
//   return filterDefined(zip(women, nonWomen).flat())
// }