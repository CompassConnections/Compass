'use client'

import {useEffect, useState} from 'react'
import {api} from 'web/lib/api'
import {useIsPageVisible} from './use-page-visible'

export type Event = {
  id: string
  created_time: string
  creator_id: string
  title: string
  description: string | null
  location_type: 'in_person' | 'online'
  location_address: string | null
  location_url: string | null
  event_start_time: string
  event_end_time: string | null
  is_public: boolean
  max_participants: number | null
  status: 'active' | 'cancelled' | 'completed'
  participants: string[]
  maybe: string[]
  creator?: {
    id: string
    name: string
    username: string
    avatar_url: string | null
  }
}

export type EventsData = {
  upcoming: Event[]
  past: Event[]
}

export const useEvents = () => {
  const [events, setEvents] = useState<EventsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const isPageVisible = useIsPageVisible()

  const fetchEvents = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      const data = await api('get-events', {})
      console.log('Fetched events', data)
      setEvents(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    // console.debug({isPageVisible})
    if (isPageVisible) {
      fetchEvents()
    }
  }, [isPageVisible])

  const refetch = () => fetchEvents(false)

  return {events, loading, error, refetch}
}
