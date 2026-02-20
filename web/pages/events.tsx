'use client'

import {APIError} from 'common/api/utils'
import {useState} from 'react'
import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {CreateEventModal} from 'web/components/events/create-event-modal'
import {EventsList} from 'web/components/events/events-list'
import {Col} from 'web/components/layout/col'
import {PageBase} from 'web/components/page-base'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {Event, useEvents} from 'web/hooks/use-events'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'

export default function EventsPage() {
  const user = useUser()
  const {events, loading, error, refetch} = useEvents()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [_rsvpLoading, setRsvpLoading] = usePersistentInMemoryState<Record<string, boolean>>(
    {},
    'rsvp-loading',
  )
  const t = useT()

  const handleRsvp = async (eventId: string, status: 'going' | 'maybe' | 'not_going') => {
    if (!user) return

    setRsvpLoading((prev) => ({...prev, [eventId]: true}))
    try {
      await api('rsvp-event', {eventId, status})
      refetch()
      console.log('RSVPed to event', eventId)
    } catch (err) {
      if (err instanceof APIError) {
        toast.error(err.message)
      } else {
        toast.error(t('events.failed_rsvp', 'Failed to RSVP. Please try again.'))
      }
    } finally {
      setRsvpLoading((prev) => ({...prev, [eventId]: false}))
    }
  }

  const handleCancelRsvp = async (eventId: string) => {
    if (!user) return

    setRsvpLoading((prev) => ({...prev, [eventId]: true}))
    try {
      await api('cancel-rsvp', {eventId})
      refetch()
      console.log('Cancelled RSVP to event', eventId)
    } catch (err) {
      if (err instanceof APIError) {
        toast.error(err.message)
      } else {
        toast.error(t('events.failed_cancel_rsvp', 'Failed to cancel RSVP. Please try again.'))
      }
    } finally {
      setRsvpLoading((prev) => ({...prev, [eventId]: false}))
    }
  }

  const handleCancelEvent = async (eventId: string) => {
    if (!user) return

    setRsvpLoading((prev) => ({...prev, [eventId]: true}))
    try {
      await api('cancel-event', {eventId})
      refetch()
      toast.success(t('events.event_cancelled', 'Event cancelled successfully!'))
      console.log('Cancelled event', eventId)
    } catch (err) {
      if (err instanceof APIError) {
        toast.error(err.message)
      } else {
        toast.error(t('events.failed_cancel_event', 'Failed to cancel event. Please try again.'))
      }
    } finally {
      setRsvpLoading((prev) => ({...prev, [eventId]: false}))
    }
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setShowCreateModal(true)
  }

  return (
    <PageBase trackPageView={'events'}>
      <Col className=" sm:mx-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <div>
            <h1 className="text-3xl font-bold">{t('events.title', 'Events')}</h1>
            <p className="text-ink-500 mt-1">
              {t(
                'events.subtitle',
                'Discover and join community events — or create your own to bring people together',
              )}
            </p>
          </div>

          {/* Event Ideas Section */}
          <div className="mt-6 bg-canvas-100 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2 mt-0">
              {t('events.why_organize', 'Why organize events?')}
            </h2>
            <p className="text-ink-600 text-sm mb-3">
              {t(
                'events.why_description',
                'Events are the heart of meaningful connection. Whether online or in-person, they create space for deeper conversations, shared experiences, and lasting relationships.',
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-canvas-0 text-ink-700 px-3 py-1 rounded-full text-xs">
                📚 {t('events.book_clubs', 'Book clubs')}
              </span>
              <span className="bg-canvas-0 text-ink-700 px-3 py-1 rounded-full text-xs">
                🎮 {t('events.game_nights', 'Game nights')}
              </span>
              <span className="bg-canvas-0 text-ink-700 px-3 py-1 rounded-full text-xs">
                🚶 {t('events.walking_groups', 'Walking groups')}
              </span>
              <span className="bg-canvas-0 text-ink-700 px-3 py-1 rounded-full text-xs">
                ☕ {t('events.coffee_chats', 'Coffee chats')}
              </span>
              <span className="bg-canvas-0 text-ink-700 px-3 py-1 rounded-full text-xs">
                🎨 {t('events.creative_workshops', 'Creative workshops')}
              </span>
              <span className="bg-canvas-0 text-ink-700 px-3 py-1 rounded-full text-xs">
                🤔 {t('events.philosophy_discussions', 'Philosophy discussions')}
              </span>
              <span className="bg-canvas-0 text-ink-700 px-3 py-1 rounded-full text-xs">
                🌱 {t('events.sustainability_meetups', 'Sustainability meetups')}
              </span>
              <span className="bg-canvas-0 text-ink-700 px-3 py-1 rounded-full text-xs">
                🎯 {t('events.hobby_exchanges', 'Hobby exchanges')}
              </span>
            </div>
          </div>

          {user && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-md px-4 py-2 mt-4"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t('events.create_event', 'Create Event')}
            </Button>
          )}
        </div>

        {/* Loading State */}
        {loading && <CompassLoadingIndicator />}

        {/* Error State */}
        {error && !loading && (
          <div className="text-red-800 rounded-md p-4">
            <p>{t('events.failed_to_load', 'Failed to load events. Please try again later.')}</p>
            <button
              onClick={refetch}
              className="text-red-600 hover:text-red-800 mt-2 text-sm font-medium underline"
            >
              {t('events.try_again', 'Retry')}
            </button>
          </div>
        )}

        {/* Events Content */}
        {!loading && !error && events && (
          <div className="space-y-10">
            {/* Upcoming Events */}
            <EventsList
              events={events.upcoming}
              title={t('events.upcoming_events', 'Upcoming Events')}
              emptyMessage={t(
                'events.no_upcoming',
                'No upcoming events. Check back soon or create your own!',
              )}
              onRsvp={handleRsvp}
              onCancelRsvp={handleCancelRsvp}
              onCancelEvent={handleCancelEvent}
              onEdit={handleEdit}
            />

            {/* Past Events */}
            {events.past.length > 0 && (
              <EventsList
                events={events.past}
                title={t('events.past_events', 'Past Events')}
                emptyMessage=""
                onRsvp={handleRsvp}
                onCancelRsvp={handleCancelRsvp}
                onCancelEvent={handleCancelEvent}
                onEdit={handleEdit}
              />
            )}
          </div>
        )}

        {/* {t('events.create_event', 'Create Event')} Modal */}
        <CreateEventModal
          open={showCreateModal}
          setOpen={setShowCreateModal}
          event={editingEvent}
          onClose={() => {
            setShowCreateModal(false)
            setEditingEvent(null)
          }}
          onSuccess={() => {
            refetch()
            toast.success(
              editingEvent
                ? t('events.event_updated', 'Event updated successfully!')
                : t('events.event_created', 'Event created successfully!'),
            )
            setShowCreateModal(false)
            setEditingEvent(null)
          }}
        />
      </Col>
    </PageBase>
  )
}
