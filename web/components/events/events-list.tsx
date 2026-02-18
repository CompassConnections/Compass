import {Event} from 'web/hooks/use-events'
import {EventCard} from './event-card'

export function EventsList(props: {
  events: Event[]
  title: string
  emptyMessage: string
  onRsvp?: (eventId: string, status: 'going' | 'maybe' | 'not_going') => void
  onCancelRsvp?: (eventId: string) => void
  onCancelEvent?: (eventId: string) => void
  onEdit?: (event: Event) => void
  className?: string
}) {
  const {events, title, emptyMessage, onRsvp, onCancelRsvp, onCancelEvent, onEdit, className} = props

  return (
    <div className={className}>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {events.length === 0 ? (
        <p className="text-ink-500 italic">{emptyMessage}</p>
      ) : (
        <div className="grid gap-4 grid-cols-1">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onRsvp={onRsvp}
              onCancelRsvp={onCancelRsvp}
              onCancelEvent={onCancelEvent}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
