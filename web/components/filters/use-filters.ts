import {LOCALE_TO_LANGUAGE} from 'common/choices'
import {MAX_INT, MIN_INT} from 'common/constants'
import {FilterFields, initialFilters, OriginLocation, pickKnownFilters} from 'common/filters'
import {debug} from 'common/logger'
import {kmToMiles} from 'common/measurement-utils'
import {Profile, ProfileRow} from 'common/profiles/profile'
import {removeNullOrUndefinedProps} from 'common/util/object'
import {getWantsKidsRange} from 'common/wants-kids'
import {debounce, isEqual, mapValues, omit, omitBy} from 'lodash'
import {useCallback, useEffect, useMemo, useRef} from 'react'
import {useIsLooking} from 'web/hooks/use-is-looking'
import {useMeasurementSystem} from 'web/hooks/use-measurement-system'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'
import {getLocale} from 'web/lib/locale-cookie'
import {safeLocalStorage} from 'web/lib/util/local'

// Set once we've seeded a browser's filters from the profile; see the seeding effect below.
const SEEDED_FILTERS_KEY = 'profile-filters-seeded'

// Comparable form of a filter set: unset values, emptied multi-selects, the sort order and the
// two-way flag all drop out, and multi-selects compare regardless of the order the user picked them
// in.
//
// `twoWay` is dropped for the same reason as `orderBy`: neither says anything about *who* you are
// looking for. Two-way search is a mode laid over whatever search is running — it asks the other
// side's criteria of every candidate — so turning it on next to the looking-for preferences leaves
// them exactly as they were, and the chip has no business unticking itself.
const normalize = (f: Partial<FilterFields>) =>
  mapValues(
    omitBy(
      removeNullOrUndefinedProps({...f, orderBy: undefined, twoWay: undefined}),
      (v) => Array.isArray(v) && v.length === 0,
    ),
    (v) => (Array.isArray(v) ? [...v].sort() : v),
  )

/**
 * The "lives near" search a profile's own stated maximum distance amounts to: their city, at the
 * radius they said they were willing to consider (`pref_max_distance`).
 *
 * Undefined unless they set a maximum — no limit is the default, and turning that into a radius
 * would invent a constraint they declined to state. Undefined too without a `geodb_city_id`: the
 * "Living" section searches and re-renders cities by that id, so a location without one lands in the
 * filter as a point the UI can't show or edit.
 *
 * Separate from `getLookingForFilters` because a location is not a filter field but its own piece of
 * state — the `location`/`radius` pair the "Living" section owns, which an effect then writes into
 * the filters as `lat`/`lon`/`radius`.
 */
export const getLookingForLocation = (
  profile: ProfileRow | undefined | null,
): {location: OriginLocation; radius: number} | undefined => {
  const radius = profile?.pref_max_distance
  if (!radius || !profile?.geodb_city_id) return undefined
  if (profile.city_latitude == null || profile.city_longitude == null) return undefined

  return {
    location: {
      id: profile.geodb_city_id,
      name: profile.city,
      lat: profile.city_latitude,
      lon: profile.city_longitude,
    },
    radius,
  }
}

// Mirrors the "Who I'm looking for" section of the profile only — age, gender, connection type, kid
// desire and the maximum distance — plus the language the app is being read in. The rest of the
// profile describes who you are, not who you want to see, so copying it into the search (diet,
// religion, politics, interests, ...) narrowed the results to people just like you.
// Takes any profile, not just your own, so admins can run the search as another member sees it.
export const getLookingForFilters = (
  profile: ProfileRow | undefined | null,
): Partial<FilterFields> => {
  // Kid desire is the one entry here that isn't a stated preference but an answer about yourself:
  // nobody fills in "which answers to the kids question I'll accept", so it is derived from their
  // own answer as a band around it. Undefined when they never answered, or when their answer sits
  // centrally enough that the band would exclude nobody.
  const wantsKidsRange = getWantsKidsRange(profile?.wants_kids_strength)
  // Carried here as well as in the location state so that `isLookingForFilters` compares against the
  // same shape the location effect writes; whoever applies these has to set the location too, or the
  // effect will clear the three keys straight back out again.
  const lookingForLocation = getLookingForLocation(profile)
  // The one entry not read off the profile at all: whichever language the app is being read in is
  // the one the member can hold a conversation in, and a profile they cannot talk to is not a match
  // however well the rest of it lines up. Same value the signup path already seeds.
  const localeLanguage = LOCALE_TO_LANGUAGE[getLocale()]

  return {
    genders: profile?.pref_gender?.length ? profile.pref_gender : undefined,
    pref_age_max: (profile?.pref_age_max ?? MAX_INT) < 100 ? profile?.pref_age_max : undefined,
    pref_age_min: (profile?.pref_age_min ?? MIN_INT) > 18 ? profile?.pref_age_min : undefined,
    pref_relation_styles: profile?.pref_relation_styles?.length
      ? profile.pref_relation_styles
      : undefined,
    wants_kids_range_min: wantsKidsRange?.min,
    wants_kids_range_max: wantsKidsRange?.max,
    lat: lookingForLocation?.location.lat,
    lon: lookingForLocation?.location.lon,
    radius: lookingForLocation?.radius,
    languages: localeLanguage && profile ? [localeLanguage] : undefined,
  }
}

export const useFilters = (you: Profile | undefined) => {
  const isLooking = useIsLooking()
  const baseFilters = isLooking
    ? initialFilters
    : {...initialFilters, orderBy: 'created_time' as const}

  const getInitialFilters = (): Partial<FilterFields> => {
    return {
      ...baseFilters,
      // languages: fromSignup ? [LOCALE_TO_LANGUAGE[getLocale()]] : undefined,
    }
  }

  const [storedFilters, setFilters] = usePersistentLocalState<Partial<FilterFields>>(
    getInitialFilters(),
    'profile-filters-4',
  )

  // What comes back out of localStorage was written by whichever release the browser last ran, and a
  // bookmarked search can be older still. `get-profiles` validates its props strictly, so a filter
  // that has since been removed from the app (the old single-value `wants_kids_strength`, say) would
  // fail every search outright instead of being ignored. Memoized because this object is a `useEffect`
  // dependency in the grid.
  const filters = useMemo(() => pickKnownFilters(storedFilters), [storedFilters])

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

  const lookingForFilters = getLookingForFilters(you)
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
  const applyLookingForFilters = (profile: ProfileRow | undefined | null) => {
    const lookingForLocation = getLookingForLocation(profile)
    // Everything else here is replaced, but `twoWay` is carried across: it is a mode rather than a
    // criterion (see `normalize`), so wiping it would switch off a toggle the member left on, at the
    // one moment they were reaching for a *different* control.
    setFilters({...baseFilters, ...getLookingForFilters(profile), twoWay: filters.twoWay})
    // The "Living" section owns the location, and its effect overwrites lat/lon/radius from it on the
    // next render — so setting the filter keys above without setting this would clear them again.
    // `setRadius`, not the debounced one: this is a single deliberate write, not a slider drag.
    setLocation(lookingForLocation?.location)
    if (lookingForLocation) setRadius(lookingForLocation.radius)
    setRaisedInLocation(undefined)
  }

  // Loads a bookmarked search back into the grid. Like applyLookingForFilters this *replaces* the
  // current search rather than merging into it — a saved search stands for the whole set of criteria
  // that was saved, so leftovers from the current one would silently narrow it.
  // Same single-setFilters-call constraint as applyLookingForFilters (see the comment there).
  // The saved row only stores the "lives near" location object, not the "grew up near" one, so the
  // raised_in_* coordinates are dropped instead of being applied as an unlabeled filter that the
  // raised-in effect would clear on the next mount anyway.
  const applySavedSearch = (
    savedFilters: Partial<FilterFields>,
    savedLocation: {location?: OriginLocation | null; radius?: number} | null | undefined,
  ) => {
    setFilters({
      ...baseFilters,
      ...omit(savedFilters, ['raised_in_lat', 'raised_in_lon', 'raised_in_radius']),
    })
    setRaisedInLocation(undefined)
    setLocation(savedLocation?.location ?? undefined)
    if (savedLocation?.radius) setRadius(savedLocation.radius)
  }

  const setLookingForFilters = (checked: boolean) => {
    applyLookingForFilters(checked ? you : undefined)
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
    // Two-way on by default alongside them: a first page of people who cannot match back is the
    // worst possible first impression, and someone who has just filled in a profile has said enough
    // about themselves for the other side's criteria to be worth asking. It is a mode rather than a
    // criterion, so this does not affect whether the looking-for chip reads as ticked (see
    // `normalize`), and one click in the panel turns it off.
    updateFilter({...lookingForFilters, twoWay: true})
    // Merged into the search rather than replacing it, unlike applyLookingForFilters — but the
    // location still has to go through its own state for the same reason as there.
    const lookingForLocation = getLookingForLocation(you)
    if (lookingForLocation) {
      setLocation(lookingForLocation.location)
      setRadius(lookingForLocation.radius)
    }
  }, [you])

  return {
    filters,
    updateFilter,
    clearFilters,
    setLookingForFilters,
    applyLookingForFilters,
    applySavedSearch,
    isLookingForFilters,
    locationFilterProps,
    raisedInLocationFilterProps,
  }
}

// const alternateWomenAndMen = (profiles: Profile[]) => {
//   const [women, nonWomen] = partition(profiles, (l) => l.gender === 'female')
//   return filterDefined(zip(women, nonWomen).flat())
// }
