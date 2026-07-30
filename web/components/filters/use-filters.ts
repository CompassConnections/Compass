import {LOCALE_TO_LANGUAGE} from 'common/choices'
import {MAX_INT, MIN_INT} from 'common/constants'
import {FilterFields, initialFilters, OriginLocation} from 'common/filters'
import {debug} from 'common/logger'
import {kmToMiles} from 'common/measurement-utils'
import {Profile} from 'common/profiles/profile'
import {removeNullOrUndefinedProps} from 'common/util/object'
import {debounce, isEqual, mapValues, omitBy} from 'lodash'
import {useCallback, useEffect, useRef} from 'react'
import {useIsLooking} from 'web/hooks/use-is-looking'
import {useMeasurementSystem} from 'web/hooks/use-measurement-system'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'
import {getLocale} from 'web/lib/locale-cookie'
import {safeLocalStorage} from 'web/lib/util/local'

// Set once we've seeded a browser's filters from the profile; see the seeding effect below.
const SEEDED_FILTERS_KEY = 'profile-filters-seeded'

// Comparable form of a filter set: unset values, emptied multi-selects and the sort order all drop out,
// and multi-selects compare regardless of the order the user picked them in.
const normalize = (f: Partial<FilterFields>) =>
  mapValues(
    omitBy(
      removeNullOrUndefinedProps({...f, orderBy: undefined}),
      (v) => Array.isArray(v) && v.length === 0,
    ),
    (v) => (Array.isArray(v) ? [...v].sort() : v),
  )

export const useFilters = (you: Profile | undefined, fromSignup?: boolean) => {
  const isLooking = useIsLooking()
  const baseFilters = isLooking
    ? initialFilters
    : {...initialFilters, orderBy: 'created_time' as const}

  const getInitialFilters = (): Partial<FilterFields> => {
    return {
      ...baseFilters,
      languages: fromSignup ? [LOCALE_TO_LANGUAGE[getLocale()]] : undefined,
    }
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
    setFilters(baseFilters)
    setLocation(undefined)
    setRaisedInLocation(undefined)
  }

  const {measurementSystem} = useMeasurementSystem()

  const defaultRadius = measurementSystem === 'imperial' ? 100 : kmToMiles(100)

  const [radius, setRadius] = usePersistentLocalState<number>(defaultRadius, 'search-radius')

  const debouncedSetRadius = useCallback(debounce(setRadius, 200), [setRadius])

  const [location, setLocation] = usePersistentLocalState<OriginLocation | undefined | null>(
    undefined,
    'nearby-origin-location',
  )

  const [raisedInRadius, setRaisedInRadius] = usePersistentLocalState<number>(
    defaultRadius,
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

  // Mirrors the "Who I'm looking for" section of the profile only — age, gender and connection type.
  // The rest of the profile describes who you are, not who you want to see, so copying it into the
  // search (diet, religion, politics, interests, ...) narrowed the results to people just like you.
  const lookingForFilters: Partial<FilterFields> = {
    genders: you?.pref_gender?.length ? you.pref_gender : undefined,
    pref_age_max: (you?.pref_age_max ?? MAX_INT) < 100 ? you?.pref_age_max : undefined,
    pref_age_min: (you?.pref_age_min ?? MIN_INT) > 18 ? you?.pref_age_min : undefined,
    pref_relation_styles: you?.pref_relation_styles?.length ? you.pref_relation_styles : undefined,
  }
  debug(you, lookingForFilters)

  // Checked only when the search is *exactly* the looking-for preferences and nothing else — adding any
  // other filter (education, location, a search term, ...) unchecks the chip, since the results are no
  // longer just "who I'm looking for". Order within a multi-select doesn't matter, and an emptied
  // multi-select ([]) counts the same as an untouched one.
  const isLookingForFilters =
    !!you && isEqual(normalize(filters), normalize({...initialFilters, ...lookingForFilters}))

  // Checking the chip *replaces* the search rather than merging into it: it means "show me only who I'm
  // looking for", so anything else already selected (a relationship status, a city, ...) has to go —
  // otherwise the chip would light up next to filters it doesn't stand for.
  //
  // One setFilters call, not clearFilters() + updateFilter(): usePersistentLocalState resolves updater
  // functions against a ref that's only refreshed on render, so a second call in the same handler still
  // sees the pre-click filters. Worse, it drops out entirely when its result deep-equals them — which is
  // exactly the case here whenever the extra filter was added *on top of* the looking-for ones, leaving
  // only the clear behind.
  const setLookingForFilters = (checked: boolean) => {
    setFilters({...baseFilters, ...(checked ? lookingForFilters : {})})
    setLocation(undefined)
    setRaisedInLocation(undefined)
  }

  // First visit on this browser (fresh account, or localStorage cleared): start from the "who I'm
  // looking for" filters rather than an empty search, so the first page of profiles is already someone
  // you could match with.
  // The flag is read straight out of localStorage on the first render instead of through
  // usePersistentLocalState, because the decision has to be made before that hook's own hydration
  // effect has run — and before the location effects above write the filters key.
  const hasSeededFilters = useRef<boolean | undefined>(undefined)
  if (hasSeededFilters.current === undefined) {
    hasSeededFilters.current = safeLocalStorage?.getItem(SEEDED_FILTERS_KEY) === 'true'
  }

  useEffect(() => {
    if (hasSeededFilters.current || !you) return
    hasSeededFilters.current = true
    safeLocalStorage?.setItem(SEEDED_FILTERS_KEY, 'true')
    updateFilter(lookingForFilters)
  }, [you])

  return {
    filters,
    updateFilter,
    clearFilters,
    setLookingForFilters,
    isLookingForFilters,
    locationFilterProps,
    raisedInLocationFilterProps,
  }
}

// const alternateWomenAndMen = (profiles: Profile[]) => {
//   const [women, nonWomen] = partition(profiles, (l) => l.gender === 'female')
//   return filterDefined(zip(women, nonWomen).flat())
// }
