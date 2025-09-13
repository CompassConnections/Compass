import { Lover } from 'common/love/lover'
import { filterDefined } from 'common/util/array'
import { cloneDeep, debounce, isEqual } from 'lodash'
import { useCallback } from 'react'
import { useEffectCheckEquality } from 'web/hooks/use-effect-check-equality'
import { useIsLooking } from 'web/hooks/use-is-looking'
import { useNearbyCities } from 'web/hooks/use-nearby-locations'
import { usePersistentLocalState } from 'web/hooks/use-persistent-local-state'
import { OriginLocation } from './location-filter'
import { FilterFields } from './search'
import {
  wantsKidsDatabaseToWantsKidsFilter,
  wantsKidsDatabase,
  wantsKidsToHasKidsFilter,
} from './wants-kids-filter'

export const orderLovers = (
  lovers: Lover[],
  starredUserIds: string[] | undefined
) => {
  if (!lovers) return

  let s = cloneDeep(lovers)

  if (starredUserIds) {
    s = filterDefined([
      ...starredUserIds.map((id) => s.find((l) => l.user_id === id)),
      ...s.filter((l) => !starredUserIds.includes(l.user_id)),
    ])
  }

  // s = alternateWomenAndMen(s)

  return s
}

// const alternateWomenAndMen = (lovers: Lover[]) => {
//   const [women, nonWomen] = partition(lovers, (l) => l.gender === 'female')
//   return filterDefined(zip(women, nonWomen).flat())
// }

export const initialFilters: Partial<FilterFields> = {
  geodbCityIds: undefined,
  name: undefined,
  genders: undefined,
  pref_age_max: undefined,
  pref_age_min: undefined,
  has_kids: -1,
  wants_kids_strength: -1,
  is_smoker: undefined,
  pref_relation_styles: undefined,
  pref_gender: undefined,
  orderBy: 'created_time',
}

export const useFilters = (you: Lover | undefined) => {
  const isLooking = useIsLooking()
  const [filters, setFilters] = usePersistentLocalState<Partial<FilterFields>>(
    isLooking ? initialFilters : { ...initialFilters, orderBy: 'created_time' },
    'profile-filters-2'
  )

  const updateFilter = (newState: Partial<FilterFields>) => {
    setFilters((prevState) => ({ ...prevState, ...newState }))
  }

  const clearFilters = () => {
    setFilters(
      isLooking
        ? initialFilters
        : { ...initialFilters, orderBy: 'created_time' }
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
    updateFilter({ geodbCityIds: nearbyCities })
  }, [nearbyCities])

  const locationFilterProps = {
    location,
    setLocation,
    radius,
    setRadius: debouncedSetRadius,
  }

  const yourFilters: Partial<FilterFields> = {
    genders: you?.pref_gender,
    pref_gender: you ? [you.gender] : undefined,
    pref_age_max: you?.pref_age_max,
    pref_age_min: you?.pref_age_min,
    pref_relation_styles: you?.pref_relation_styles,
    wants_kids_strength: wantsKidsDatabaseToWantsKidsFilter(
      (you?.wants_kids_strength ?? 2) as wantsKidsDatabase
    ),
    has_kids: wantsKidsToHasKidsFilter(
      (you?.wants_kids_strength ?? 2) as wantsKidsDatabase
    ),
  }

  const isYourFilters =
    !!you &&
    !!location &&
    location.id === you.geodb_city_id &&
    isEqual(filters.genders, yourFilters.genders) &&
    !!filters.pref_gender &&
    filters.pref_gender.length == 1 &&
    filters.pref_gender[0] == you.gender &&
    filters.pref_age_max == yourFilters.pref_age_max &&
    filters.pref_age_min == yourFilters.pref_age_min &&
    filters.wants_kids_strength == yourFilters.wants_kids_strength

  const setYourFilters = (checked: boolean) => {
    if (checked) {
      updateFilter(yourFilters)
      setRadius(100)
      debouncedSetRadius(100) // clear any pending debounced sets
      if (you?.geodb_city_id && you.city) {
        setLocation({ id: you?.geodb_city_id, name: you?.city })
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
