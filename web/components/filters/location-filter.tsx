import {XMarkIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {OriginLocation} from 'common/filters'
import {UNITED_STATES} from 'common/geodb'
import {formatDistance, kmToMiles, MeasurementSystem, milesToKm} from 'common/measurement-utils'
import {Profile} from 'common/profiles/profile'
import {buildArray} from 'common/util/array'
import {uniqBy} from 'lodash'
import {Globe} from 'lucide-react'
import {useEffect, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {Input} from 'web/components/widgets/input'
import {SearchableSelect} from 'web/components/widgets/searchable-select'
import {Slider} from 'web/components/widgets/slider'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useMeasurementSystem} from 'web/hooks/use-measurement-system'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {useT} from 'web/lib/locale'

import {City, CityRow, originToCity, profileToCity, useCitySearch} from '../search-location'

export function LocationFilterText(props: {
  location: OriginLocation | undefined | null
  youProfile: Profile | undefined | null
  radius: number
  /** The country filter, when this section carries one (only "Living" does). */
  country?: string | null
  highlightedClass?: string
  labelPrefix?: string
}) {
  const {location, radius, country, highlightedClass, labelPrefix} = props
  const {measurementSystem} = useMeasurementSystem()

  const t = useT()
  const locationLabel = labelPrefix
    ? t('filter.raised_in', labelPrefix)
    : t('filter.location', 'Location')
  // A country on its own reads as "Location · USA"; combined with a city it trails the city.
  const countrySuffix = country ? (
    <>
      {' · '}
      <span className={highlightedClass}>{country}</span>
    </>
  ) : null

  if (!location) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>
        {locationLabel}
        {countrySuffix}
      </span>
    )
  }

  // Nearest 10, like everywhere else a picked distance is shown: the radius comes off a fixed ladder
  // (`RADIUS_SNAP_VALUES`) or off a profile's stated maximum, and neither is measured to the mile —
  // so "3219 km" reports a precision that was never chosen.
  const formattedDistance = formatDistance(radius, measurementSystem, 10)

  return (
    <span className="font-semibold">
      <span className="">{locationLabel} </span>
      <span className="">
        <span className={clsx(highlightedClass)}>{formattedDistance}</span>
      </span>{' '}
      <span className="sm:normal-case">{t('filter.near', 'near')}</span>{' '}
      <span className={highlightedClass}>{location.name}</span>
      {countrySuffix}
    </span>
  )
}

export type LocationFilterProps = {
  location: OriginLocation | undefined | null
  setLocation: (location: OriginLocation | undefined | null) => void
  radius: number
  setRadius: (radius: number) => void
}

export type CountryFilterProps = {
  country: string | null | undefined
  setCountry: (country: string | undefined) => void
}

const DEFAULT_LAST_CITY: City = {
  geodb_city_id: '172153',
  city: 'San Francisco County',
  region_code: 'CA',
  country: UNITED_STATES,
  country_code: 'US',
  latitude: 37.778333333,
  longitude: -122.4425,
}

export function LocationFilter(props: {
  youProfile: Profile | undefined | null
  locationFilterProps: LocationFilterProps
  /**
   * Adds a country dropdown above the city search. Only the "Living" section passes it: the country
   * filter matches `profiles.country`, and there is no raised-in equivalent wired up.
   */
  countryFilterProps?: CountryFilterProps
}) {
  const {youProfile, countryFilterProps} = props

  const {location, setLocation, radius, setRadius} = props.locationFilterProps

  const youCity = youProfile && profileToCity(youProfile)

  const t = useT()

  const [lastCity, setLastCity] = usePersistentInMemoryState<City>(
    location ? originToCity(location) : youCity || DEFAULT_LAST_CITY,
    'last-used-city',
  )

  const setCity = (city: City | undefined) => {
    if (!city) {
      setLocation(undefined)
    } else {
      setLocation({
        id: city.geodb_city_id,
        name: city.city,
        lat: city.latitude,
        lon: city.longitude,
      })
      setLastCity(city)
      // City and country are two answers to the same question ("where?"), so the newer one replaces
      // the older rather than both narrowing the search at once.
      countryFilterProps?.setCountry(undefined)
    }
  }

  // search results
  const {cities, loading, query, setQuery} = useCitySearch()

  const listedCities = uniqBy(buildArray(cities, lastCity, youCity), 'geodb_city_id').filter(
    (c) => !location || location.id !== c.geodb_city_id,
  )

  return (
    <Col className={clsx('w-full gap-3')}>
      {countryFilterProps && (
        <CountrySelect
          country={countryFilterProps.country}
          setCountry={(country) => {
            countryFilterProps.setCountry(country)
            // Same either/or as in setCity: a country is a wider "where?" that supersedes the city.
            if (country) setLocation(undefined)
          }}
        />
      )}

      <Row className="items-center gap-1">
        <Input
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          placeholder={t('filter.location.search_city', 'Search city...')}
          className="h-8 w-full rounded-none border-0 bg-canvas-0 px-1 focus:border-b focus:ring-0 focus:ring-transparent"
          autoFocus
          // onBlur // TODO
          searchIcon
        />
      </Row>

      {location && <DistanceSlider radius={radius} setRadius={setRadius} />}

      <LocationResults
        showAny={!!location && query === ''}
        cities={listedCities}
        onCitySelected={(city) => {
          setCity(city)
          setQuery('')
        }}
        loading={loading}
        className="-mx-4"
      />
    </Col>
  )
}

/**
 * Searchable dropdown over the countries members actually live in (see `get-countries`), so every
 * option is a value the `country` filter can match. A country widens the search to the whole country,
 * which a circle drawn round one city cannot express however wide it is. It is either/or with the
 * city: the parent clears whichever of the two was set before.
 */
function CountrySelect(props: CountryFilterProps) {
  const {country, setCountry} = props
  const t = useT()
  const {data} = useAPIGetter('get-countries', {})

  const suggestions = (data?.countries ?? []).map((c) => ({id: c.country, label: c.country}))

  return (
    <SearchableSelect
      value={country ?? ''}
      onChange={(value) => setCountry(value || undefined)}
      suggestions={suggestions}
      placeholder={t('filter.country.any', 'Any country')}
      clearLabel={t('filter.country.any', 'Any country')}
      searchPlaceholder={t('filter.country.search', 'Search country...')}
      icon={<Globe className="h-4 w-4 flex-shrink-0 text-ink-500" />}
      parentClassName="w-full"
      // Same pill as the city search `Input` right under it, so the two read as one field group.
      triggerClassName={clsx(
        'text-ink-700 bg-canvas-50 h-12 w-full rounded-xl border border-canvas-300 px-4 shadow-sm md:text-sm',
        'transition-all duration-150 hover:border-primary-300',
        'data-[open]:border-primary-400 data-[open]:ring-2 data-[open]:ring-primary-500/25',
      )}
      panelClassName="bg-canvas-50 w-full rounded-xl border border-canvas-300 shadow-lg"
    />
  )
}

/**
 * The stops the radius slider offers, in the unit being displayed — so both systems get round
 * numbers, and only the stored value is a mileage.
 *
 * The ladder runs to the same ceiling a profile's own `pref_max_distance` can state, because the
 * "Who I'm looking for" bundle seeds this search from exactly that: capping the slider lower would
 * leave the thumb pinned past the end of the track, showing a narrower search than the one running.
 */
const RADIUS_SNAP_VALUES: Record<MeasurementSystem, number[]> = {
  imperial: [10, 50, 100, 250, 500, 1000, 2000],
  metric: [20, 100, 200, 500, 1000, 2000, 3000],
}

function DistanceSlider(props: {radius: number; setRadius: (radius: number) => void}) {
  const {radius, setRadius} = props
  const {measurementSystem} = useMeasurementSystem()

  const snapValues = RADIUS_SNAP_VALUES[measurementSystem]

  // The slider runs over stop *indexes* rather than distances. Spacing the stops by value crowded
  // 10 / 50 / 100 into the left tenth of a track the top stop stretched across the rest, which only
  // gets worse the further the ladder reaches — and every stop is equally worth picking.
  const displayed = measurementSystem === 'metric' ? milesToKm(radius) : radius
  const closestIndex = snapValues.reduce(
    (best, value, i) =>
      Math.abs(value - displayed) < Math.abs(snapValues[best] - displayed) ? i : best,
    0,
  )

  return (
    <Slider
      min={0}
      max={snapValues.length - 1}
      step={1}
      amount={closestIndex}
      onChange={(index) => {
        const snapped = snapValues[index]
        // Convert back to miles if needed for internal storage
        setRadius(measurementSystem === 'metric' ? kmToMiles(snapped) : snapped)
      }}
      className="mb-4 w-full"
      marks={snapValues.map((value, i) => ({
        value: i,
        label: value.toString(),
      }))}
    />
  )
}

function LocationResults(props: {
  showAny: boolean
  cities: City[]
  onCitySelected: (city: City | undefined) => void
  loading: boolean
  className?: string
}) {
  const {showAny, cities, onCitySelected, loading, className} = props

  // delay loading animation by 150 ms
  const [debouncedLoading, setDebouncedLoading] = useState(loading)
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => setDebouncedLoading(true), 150)
      return () => clearTimeout(timeoutId)
    } else {
      setDebouncedLoading(false)
    }
  }, [loading])

  const t = useT()
  return (
    <Col className={className}>
      {showAny && (
        <button
          onClick={() => onCitySelected(undefined)}
          className="hover:bg-primary-200 hover:text-ink-950 cursor-pointer px-4 py-2 transition-colors"
        >
          <Row className="items-center gap-2">
            <XMarkIcon className="h-4 w-4 text-ink-400" aria-label={t('common.close', 'Close')} />
            <span>{t('filter.location.set_any_city', 'Set to Any City')}</span>
          </Row>
        </button>
      )}

      {cities.map((city) => {
        return (
          <CityRow
            key={city.geodb_city_id}
            city={city}
            onSelect={onCitySelected}
            className="hover:bg-primary-200 px-4 py-2 transition-colors"
          />
        )
      })}
      {debouncedLoading && (
        <div className="flex flex-col gap-2 px-4 py-2">
          <div className="bg-ink-600 h-4 w-1/3 animate-pulse rounded-full" />
          <div className="bg-ink-400 h-4 w-2/3 animate-pulse rounded-full" />
        </div>
      )}
    </Col>
  )
}
