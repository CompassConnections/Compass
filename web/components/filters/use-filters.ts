import {Lover} from "common/love/lover";
import {useIsLooking} from "web/hooks/use-is-looking";
import {usePersistentLocalState} from "web/hooks/use-persistent-local-state";
import {useCallback} from "react";
import {debounce, isEqual} from "lodash";
import {useNearbyCities} from "web/hooks/use-nearby-locations";
import {useEffectCheckEquality} from "web/hooks/use-effect-check-equality";
import {wantsKidsDatabase, wantsKidsDatabaseToWantsKidsFilter, wantsKidsToHasKidsFilter} from "common/wants-kids";
import {FilterFields, initialFilters, OriginLocation} from "common/filters";
import {MAX_INT, MIN_INT} from "common/constants";

export const useFilters = (you: Lover | undefined) => {
  const isLooking = useIsLooking()
  const [filters, setFilters] = usePersistentLocalState<Partial<FilterFields>>(
    isLooking ? initialFilters : {...initialFilters, orderBy: 'created_time'},
    'profile-filters-2'
  )

  const updateFilter = (newState: Partial<FilterFields>) => {
    const updatedState = {...newState}

    if ('pref_age_min' in updatedState && updatedState.pref_age_min !== undefined) {
      if (updatedState.pref_age_min != null && updatedState.pref_age_min <= 18) {
        updatedState.pref_age_min = undefined
      }
    }

    if ('pref_age_max' in updatedState && updatedState.pref_age_max !== undefined) {
      if (updatedState.pref_age_max != null && updatedState.pref_age_max >= 100) {
        updatedState.pref_age_max = undefined
      }
    }

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

  const nearbyCities = useNearbyCities(location?.id, radius)

  useEffectCheckEquality(() => {
    updateFilter({geodbCityIds: nearbyCities})
  }, [nearbyCities])

  const locationFilterProps = {
    location,
    setLocation,
    radius,
    setRadius: debouncedSetRadius,
  }

  const yourFilters: Partial<FilterFields> = {
    genders: you?.pref_gender?.length ? you.pref_gender : undefined,
    pref_gender: you?.gender?.length ? [you.gender] : undefined,
    pref_age_max: (you?.pref_age_max ?? MAX_INT) < 100 ? you?.pref_age_max : undefined,
    pref_age_min: (you?.pref_age_min ?? MIN_INT) > 18 ? you?.pref_age_min : undefined,
    pref_relation_styles: you?.pref_relation_styles.length ? you.pref_relation_styles : undefined,
    wants_kids_strength: wantsKidsDatabaseToWantsKidsFilter(
      (you?.wants_kids_strength ?? 2) as wantsKidsDatabase
    ),
    has_kids: wantsKidsToHasKidsFilter(
      (you?.wants_kids_strength ?? 2) as wantsKidsDatabase
    ),
  }
  console.log(you, yourFilters)

  const isYourFilters =
    !!you &&
    (!location || location.id === you.geodb_city_id) &&
    isEqual(filters.genders?.length ? filters.genders : undefined, yourFilters.genders?.length ? yourFilters.genders : undefined) &&
    // isEqual(filters.pref_gender?.length ? filters.pref_gender[0] : undefined, you.gender) &&
    // you?.pref_gender.length &&
    // filters.pref_gender.length == 1 &&
    // filters.pref_gender[0] == you.gender &&
    filters.pref_age_max == yourFilters.pref_age_max &&
    filters.pref_age_min == yourFilters.pref_age_min &&
    filters.wants_kids_strength == yourFilters.wants_kids_strength

  const setYourFilters = (checked: boolean) => {
    if (checked) {
      updateFilter(yourFilters)
      setRadius(100)
      debouncedSetRadius(100) // clear any pending debounced sets
      if (you?.geodb_city_id && you.city) {
        setLocation({id: you?.geodb_city_id, name: you?.city})
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

// const alternateWomenAndMen = (profiles: Lover[]) => {
//   const [women, nonWomen] = partition(profiles, (l) => l.gender === 'female')
//   return filterDefined(zip(women, nonWomen).flat())
// }