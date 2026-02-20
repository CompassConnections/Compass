import clsx from 'clsx'
import {HOUR_MS} from 'common/util/time'
import dayjs from 'dayjs'
import {capitalize} from 'lodash'
import Link from 'next/link'
import {Event} from 'web/hooks/use-events'
import {useUser} from 'web/hooks/use-user'
import {useLocale, useT} from 'web/lib/locale'
import {formatTimeShort, fromNow} from 'web/lib/util/time'

import {UserLink, UserLinkFromId} from './user-link'

export function EventCard(props: {
  event: Event
  onRsvp?: (eventId: string, status: 'going' | 'maybe' | 'not_going') => void
  onCancelRsvp?: (eventId: string) => void
  onCancelEvent?: (eventId: string) => void
  onEdit?: (event: Event) => void
  className?: string
}) {
  const {event, onRsvp, onCancelRsvp, onCancelEvent, onEdit, className} = props
  const user = useUser()
  const t = useT()
  const {locale} = useLocale()

  const isRsvped = user && event.participants.includes(user.id)
  const isMaybe = user && event.maybe.includes(user.id)
  const isCreator = user && event.creator_id === user.id
  const isPast = new Date(event.event_start_time) < new Date()

  const formattedDate = formatTimeShort(event.event_start_time, locale)
  const formattedEnd =
    event.event_end_time &&
    formatTimeShort(
      event.event_end_time,
      locale,
      dayjs(event.event_end_time).isSame(event.event_start_time, 'day'),
    )
  let timeAgo = fromNow(event.event_start_time, false, t, locale)
  const assumedEnd = new Date(
    event.event_end_time ?? new Date(event.event_start_time).getTime() + 24 * HOUR_MS,
  )
  if (isPast && assumedEnd > new Date())
    timeAgo = t('events.started', 'Started {time}', {time: timeAgo})

  return (
    <div
      className={clsx('bg-canvas-0 border-canvas-200 rounded-lg border p-4 shadow-sm', className)}
    >
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold mt-0">{event.title}</h3>
        {event.creator && (
          <div className="text-ink-500 mt-1 flex items-center gap-2 text-sm">
            <span>{t('events.organized_by', 'Organized by')}</span>
            <UserLink user={event.creator} />
          </div>
        )}
      </div>

      {/* Date & Time */}
      <div className="mb-3">
        <p className="text-ink-700 font-medium">
          {formattedDate} - {formattedEnd}
        </p>
        <p className="text-ink-500 text-sm">{capitalize(timeAgo)}</p>
      </div>

      {/* Description */}
      {event.description && (
        <div className="text-ink-600 mb-3">
          {event.description.split('\n').map((line, index) => (
            <p key={index} className={index > 0 ? 'mt-2' : ''}>
              {line}
            </p>
          ))}
        </div>
      )}

      {/* Location */}
      <div className="mb-3">
        {event.location_type === 'in_person' && event.location_address ? (
          <div className="text-ink-600 flex items-start gap-2">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{event.location_address}</span>
          </div>
        ) : event.location_type === 'online' && event.location_url ? (
          <a
            href={event.location_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>{t('events.online_event_join_link', 'Online Event - Join Link')}</span>
          </a>
        ) : null}
      </div>

      {/* Participants */}
      <div className="mb-3">
        <p className="text-ink-500 text-sm">
          {t('events.participants_count', '{count} going', {
            count: event.participants.length,
          })}
          {event.max_participants &&
            t('events.participants_max', ' / {max} max', {
              max: event.max_participants,
            })}
          {event.maybe.length > 0 &&
            t('events.maybe_count', ' ({count} maybe)', {
              count: event.maybe.length,
            })}
        </p>
        {event.participants.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {event.participants.map((participantId: string) => (
              <span
                key={participantId}
                className="bg-canvas-100 text-ink-700 px-2 py-1 rounded text-xs"
              >
                <UserLinkFromId userId={participantId} />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Status badge */}
      {event.status !== 'active' && (
        <div className="mb-3">
          <span
            className={clsx(
              'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
              event.status === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800',
            )}
          >
            {event.status === 'cancelled'
              ? t('events.cancelled', 'Cancelled')
              : t('events.completed', 'Completed')}
          </span>
        </div>
      )}

      {/* Actions */}
      {user && !isPast && event.status === 'active' && (
        <div className="flex items-center gap-2">
          {isRsvped && (
            <>
              <span className="text-green-600 flex items-center gap-1 text-sm font-medium">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {t('events.going', 'Going')}
              </span>
              <button
                onClick={() => onCancelRsvp?.(event.id)}
                className="text-ink-500 hover:text-ink-700 text-sm"
              >
                {t('events.cancel_rsvp', 'Cancel RSVP')}
              </button>
            </>
          )}
          {isMaybe && (
            <>
              <span className="text-yellow-600 flex items-center gap-1 text-sm font-medium">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                {t('events.maybe', 'Maybe')}
              </span>
              <button
                onClick={() => onCancelRsvp?.(event.id)}
                className="text-ink-500 hover:text-ink-700 text-sm"
              >
                {t('events.not_going', 'Not going')}
              </button>
            </>
          )}
          {(!isRsvped || !isMaybe) && (
            <div className="flex items-center gap-2">
              {!isRsvped && (
                <button
                  onClick={() => onRsvp?.(event.id, 'going')}
                  className="bg-primary-500 hover:bg-primary-600 text-white rounded-md px-3 py-1.5 text-sm font-medium"
                >
                  {t('events.going', 'Going')}
                </button>
              )}
              {!isMaybe && (
                <button
                  onClick={() => onRsvp?.(event.id, 'maybe')}
                  className="bg-canvas-100 hover:bg-canvas-200 text-ink-700 rounded-md px-3 py-1.5 text-sm font-medium"
                >
                  {t('events.maybe', 'Maybe')}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cancel Event Button for Creators */}
      {user && isCreator && event.status === 'active' && (
        <div className="mt-3 pt-3 border-t border-canvas-200 flex gap-2">
          <button
            onClick={() => {
              if (
                confirm(
                  t(
                    'events.cancel_event_confirmation',
                    'Are you sure you want to cancel this event? This action cannot be undone.',
                  ),
                )
              ) {
                onCancelEvent?.(event.id)
              }
            }}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            {t('events.cancel_event', 'Cancel Event')}
          </button>
          <button
            onClick={() => onEdit?.(event)}
            className="text-ink-500 hover:text-ink-700 text-sm"
          >
            {t('events.edit_event', 'Edit Event')}
          </button>
        </div>
      )}

      {/* Login prompt for non-users */}
      {!user && !isPast && event.status === 'active' && (
        <Link
          href="/signin"
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          {t('events.login_to_rsvp', 'Log in to RSVP')}
        </Link>
      )}
    </div>
  )
}
