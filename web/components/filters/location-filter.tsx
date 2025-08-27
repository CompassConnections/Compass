import clsx from 'clsx'
import { Col } from 'web/components/layout/col'
import { Slider } from 'web/components/widgets/slider'
import { usePersistentInMemoryState } from 'web/hooks/use-persistent-in-memory-state'
import { Row } from 'web/components/layout/row'
import {
  originToCity,
  City,
  CityRow,
  useCitySearch,
  loverToCity,
} from '../search-location'
import { Lover } from 'common/love/lover'
import { useEffect, useState } from 'react'
import { Input } from 'web/components/widgets/input'
import { XIcon } from '@heroicons/react/solid'
import { uniqBy } from 'lodash'
import { buildArray } from 'common/util/array'

export const PREF_AGE_MIN = 18
export const PREF_AGE_MAX = 100

export type OriginLocation = { id: string; name: string }

export function LocationFilterText(props: {
  location: OriginLocation | undefined | null
  youLover: Lover | undefined | null
  radius: number
  highlightedClass?: string
}) {
  const { location, youLover, radius, highlightedClass } = props

  if (!location) {
    return (
      <span>
        <span className={clsx('text-semibold', highlightedClass)}>Any</span>
        <span className="hidden sm:inline"> location</span>
      </span>
    )
  }
  return (
    <span className="font-semibold">
      <span className="hidden sm:inline">
        <span className={clsx(highlightedClass)}>{radius}</span> miles
      </span>{' '}
      <span className="capitalize sm:normal-case">near</span>{' '}
      <span className={highlightedClass}>{location.name}</span>
    </span>
  )
}

export type LocationFilterProps = {
  location: OriginLocation | undefined | null
  setLocation: (location: OriginLocation | undefined | null) => void
  radius: number
  setRadius: (radius: number) => void
}

const DEFAULT_LAST_CITY: City = {
  geodb_city_id: '172153',
  city: 'San Francisco County',
  region_code: 'CA',
  country: 'United States of America',
  country_code: 'US',
  latitude: 37.778333333,
  longitude: -122.4425,
}

export function LocationFilter(props: {
  youLover: Lover | undefined | null
  locationFilterProps: LocationFilterProps
}) {
  const { youLover } = props

  const { location, setLocation, radius, setRadius } = props.locationFilterProps

  const youCity = youLover && loverToCity(youLover)

  const [lastCity, setLastCity] = usePersistentInMemoryState<City>(
    location ? originToCity(location) : youCity || DEFAULT_LAST_CITY,
    'last-used-city'
  )

  const setCity = (city: City | undefined) => {
    if (!city) {
      setLocation(undefined)
    } else {
      setLocation({ id: city.geodb_city_id, name: city.city })
      setLastCity(city)
    }
  }

  // search results
  const { cities, loading, query, setQuery } = useCitySearch()

  const listedCities = uniqBy(
    buildArray(cities, lastCity, youCity),
    'geodb_city_id'
  ).filter((c) => !location || location.id !== c.geodb_city_id)

  return (
    <Col className={clsx('w-full gap-3')}>
      <Row className="items-center gap-1">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={'Search city...'}
          className="h-8 w-full rounded-none border-0 bg-transparent px-1 focus:border-b focus:ring-0 focus:ring-transparent"
          autoFocus
          // onBlur // TODO
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

function DistanceSlider(props: {
  radius: number
  setRadius: (radius: number) => void
}) {
  const { radius, setRadius } = props

  const snapValues = [10, 50, 100, 200, 300]

  const snapToValue = (value: number) => {
    const closest = snapValues.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    )
    setRadius(closest)
  }

  const min = snapValues[0]
  const max = snapValues[snapValues.length - 1]
  return (
    <Slider
      min={min}
      max={max}
      amount={radius}
      onChange={snapToValue}
      className="mb-4 w-full"
      marks={snapValues.map((value) => ({
        value: value - min,
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
  const { showAny, cities, onCitySelected, loading, className } = props

  // delay loading animation by 150ms
  const [debouncedLoading, setDebouncedLoading] = useState(loading)
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => setDebouncedLoading(true), 150)
      return () => clearTimeout(timeoutId)
    } else {
      setDebouncedLoading(false)
    }
  }, [loading])

  return (
    <Col className={className}>
      {showAny && (
        <button
          onClick={() => onCitySelected(undefined)}
          className="hover:bg-primary-200 hover:text-ink-950 cursor-pointer px-4 py-2 transition-colors"
        >
          <Row className="items-center gap-2">
            <XIcon className="h-4 w-4" />
            <span>Set to Any City</span>
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
