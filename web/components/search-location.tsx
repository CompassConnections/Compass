import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { api } from 'web/lib/api'
import { countryCodeToFlag } from 'web/lib/util/location'
import { ProfileRow } from 'common/love/profile'
import {OriginLocation} from "common/filters";

export type City = {
  geodb_city_id: string
  city: string
  region_code: string
  country: string
  country_code: string
  latitude: number
  longitude: number
}

export function profileToCity(profile: ProfileRow): City {
  return {
    geodb_city_id: profile.geodb_city_id!,
    city: profile.city,
    region_code: profile.region_code!,
    country: profile.country!,
    country_code: '',
    latitude: profile.city_latitude!,
    longitude: profile.city_longitude!,
  }
}

export function originToCity(origin: OriginLocation): City {
  return {
    geodb_city_id: origin.id,
    city: origin.name,
    region_code: '',
    country: '',
    country_code: '',
    latitude: 0,
    longitude: 0,
  }
}

export function CityRow(props: {
  city: City
  onSelect: (city: City) => void
  className?: string
}) {
  const { city, onSelect, className } = props
  return (
    <button
      key={city.geodb_city_id}
      onClick={() => onSelect(city)}
      className={clsx(
        'group flex cursor-pointer flex-row flex-wrap justify-between gap-x-4',
        className
      )}
    >
      <div className="group-hover:text-ink-950 font-semibold transition-colors">
        {city.city}
        {city.region_code ? `, ${city.region_code}` : ''}
      </div>
      <div className="text-ink-400 group-hover:text-ink-700 transition-colors">
        {countryCodeToFlag(city.country_code) || city.country}
      </div>
    </button>
  )
}

export const useCitySearch = () => {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [cities, setCities] = useState<City[]>([])

  const searchCountRef = useRef(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        searchCountRef.current++
        const thisSearchCount = searchCountRef.current
        const response = await api('search-location', { term: query, limit: 5 })
        if (response.status !== 'success') {
          throw new Error(response.data)
        }
        if (thisSearchCount == searchCountRef.current) {
          setCities(
            response.data.data.map((city: any) => ({
              geodb_city_id: city.id.toString(),
              city: city.name,
              region_code: city.regionCode,
              country: city.country,
              country_code: city.countryCode,
              latitude: city.latitude,
              longitude: city.longitude,
            }))
          )
        }
      } catch (error) {
        console.error('Error fetching cities', error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(() => {
      if (query.length < 2) {
        setCities([])
        return
      }
      if (query.length >= 2) {
        fetchData()
      }
    }, 200)

    return () => {
      clearTimeout(debounce)
    }
  }, [query])

  return { query, setQuery, loading, cities }
}
