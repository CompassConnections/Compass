import {LOCALE_TO_LANGUAGE} from 'common/choices'
import {MAX_INT, MIN_INT} from 'common/constants'
import {FilterFields, initialFilters, OriginLocation} from 'common/filters'
import {logger} from 'common/logging'
import {Profile} from 'common/profiles/profile'
import {
  wantsKidsDatabase,
  wantsKidsDatabaseToWantsKidsFilter,
  wantsKidsToHasKidsFilter,
} from 'common/wants-kids'
import {debounce, isEqual} from 'lodash'
import {useCallback, useEffect} from 'react'
import {useIsLooking} from 'web/hooks/use-is-looking'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'
import {getLocale} from 'web/lib/locale-cookie'

export const useFilters = (you: Profile | undefined, fromSignup?: boolean) => {
  const isLooking = useIsLooking()

  const getInitialFilters = (): Partial<FilterFields> => {
    const baseFilters = isLooking
      ? initialFilters
      : {...initialFilters, orderBy: 'created_time' as const}
    if (fromSignup) {
      baseFilters.languages = [LOCALE_TO_LANGUAGE[getLocale()]]
    }
    return baseFilters
  }

  const [filters, setFilters] = usePersistentLocalState<Partial<FilterFields>>(
    getInitialFilters(),
    'profile-filters-4',
  )

  // logger.log('filters', filters)

  const updateFilter = (newState: Partial<FilterFields>) => {
    const updatedState = {...newState}
    // logger.log('updating filters', updatedState)
    setFilters((prevState) => ({...prevState, ...updatedState}))
  }

  const clearFilters = () => {
    setFilters(isLooking ? initialFilters : {...initialFilters, orderBy: 'created_time'})
    setLocation(undefined)
    setRaisedInLocation(undefined)
  }

  const [radius, setRadius] = usePersistentLocalState<number>(100, 'search-radius')

  const debouncedSetRadius = useCallback(debounce(setRadius, 200), [setRadius])

  const [location, setLocation] = usePersistentLocalState<OriginLocation | undefined | null>(
    undefined,
    'nearby-origin-location',
  )

  const [raisedInRadius, setRaisedInRadius] = usePersistentLocalState<number>(
    100,
    'raised-in-radius',
  )

  const debouncedSetRaisedInRadius = useCallback(debounce(setRaisedInRadius, 200), [
    setRaisedInRadius,
  ])

  const [raisedInLocation, setRaisedInLocation] = usePersistentLocalState<
    OriginLocation | undefined | null
  >(undefined, 'raised-in-location')

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
  }, [location?.id, radius])

  useEffect(() => {
    if (raisedInLocation?.lat && raisedInLocation?.lon) {
      updateFilter({
        raised_in_lat: raisedInLocation.lat,
        raised_in_lon: raisedInLocation.lon,
        raised_in_radius: raisedInRadius,
      })
    } else {
      updateFilter({
        raised_in_lat: undefined,
        raised_in_lon: undefined,
        raised_in_radius: undefined,
      })
    }
  }, [raisedInLocation?.id, raisedInRadius])

  const locationFilterProps = {
    location,
    setLocation,
    radius,
    setRadius: debouncedSetRadius,
  }

  const raisedInLocationFilterProps = {
    location: raisedInLocation,
    setLocation: setRaisedInLocation,
    radius: raisedInRadius,
    setRadius: debouncedSetRaisedInRadius,
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
    interests: you?.interests?.length ? you.interests : undefined,
    work: you?.work?.length ? you.work : undefined,
    causes: you?.causes?.length ? you.causes : undefined,
    mbti: you?.mbti ? [you.mbti] : undefined,
    relationship_status: you?.relationship_status?.length ? you.relationship_status : undefined,
    languages: you?.languages?.length ? you.languages : undefined,
    religion: you?.religion?.length ? you.religion : undefined,
    wants_kids_strength: wantsKidsDatabaseToWantsKidsFilter(
      (you?.wants_kids_strength ?? 2) as wantsKidsDatabase,
    ),
    has_kids: wantsKidsToHasKidsFilter((you?.wants_kids_strength ?? 2) as wantsKidsDatabase),
    is_smoker: you?.is_smoker,
  }
  logger.debug(you, yourFilters)

  const isYourFilters =
    !!you &&
    (!location || location.id === you.geodb_city_id) &&
    isEqual(
      filters.genders?.length ? filters.genders : undefined,
      yourFilters.genders?.length ? yourFilters.genders : undefined,
    ) &&
    ((!you.gender && !filters.pref_gender?.length) ||
      (filters.pref_gender?.length == 1 &&
        isEqual(filters.pref_gender?.length ? filters.pref_gender[0] : undefined, you.gender))) &&
    ((!you.education_level && !filters.education_levels?.length) ||
      (filters.education_levels?.length == 1 &&
        isEqual(
          filters.education_levels?.length ? filters.education_levels[0] : undefined,
          you.education_level,
        ))) &&
    ((!you.mbti && !filters.mbti?.length) ||
      (filters.mbti?.length == 1 &&
        isEqual(filters.mbti?.length ? filters.mbti[0] : undefined, you.mbti))) &&
    isEqual(new Set(filters.pref_romantic_styles), new Set(you.pref_romantic_styles)) &&
    isEqual(new Set(filters.pref_relation_styles), new Set(you.pref_relation_styles)) &&
    isEqual(new Set(filters.diet), new Set(you.diet)) &&
    isEqual(new Set(filters.political_beliefs), new Set(you.political_beliefs)) &&
    isEqual(new Set(filters.interests), new Set(you.interests)) &&
    isEqual(new Set(filters.causes), new Set(you.causes)) &&
    isEqual(new Set(filters.work), new Set(you.work)) &&
    isEqual(new Set(filters.relationship_status), new Set(you.relationship_status)) &&
    isEqual(new Set(filters.languages), new Set(you.languages)) &&
    isEqual(new Set(filters.religion), new Set(you.religion)) &&
    filters.pref_age_max == yourFilters.pref_age_max &&
    filters.pref_age_min == yourFilters.pref_age_min &&
    filters.wants_kids_strength == yourFilters.wants_kids_strength &&
    filters.is_smoker == yourFilters.is_smoker

  const setYourFilters = (checked: boolean) => {
    if (checked) {
      updateFilter(yourFilters)
      setRadius(100)
      debouncedSetRadius(100) // clear any pending debounced sets
      if (you?.geodb_city_id && you.city && you.city_latitude && you.city_longitude) {
        setLocation({
          id: you?.geodb_city_id,
          name: you?.city,
          lat: you?.city_latitude,
          lon: you?.city_longitude,
        })
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
    raisedInLocationFilterProps,
  }
}

// const alternateWomenAndMen = (profiles: Profile[]) => {
//   const [women, nonWomen] = partition(profiles, (l) => l.gender === 'female')
//   return filterDefined(zip(women, nonWomen).flat())
// }
