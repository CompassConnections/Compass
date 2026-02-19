'use client'

import {useEffect, useState} from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {Modal, MODAL_CLASS, SCROLLABLE_MODAL_CLASS} from 'web/components/layout/modal'
import {api} from 'web/lib/api'
import {APIError} from 'common/api/utils'
import clsx from 'clsx'
import {Col} from 'web/components/layout/col'
import {useLocale, useT} from 'web/lib/locale'

import {Event} from 'web/hooks/use-events'

export function CreateEventModal(props: {
  open: boolean
  setOpen: (open: boolean) => void
  onClose: () => void
  onSuccess: () => void
  event?: Event | null | undefined
}) {
  const {open, setOpen, onClose, onSuccess, event} = props
  const isEditing = !!event
  const t = useT()
  const {locale} = useLocale()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    locationType: 'in_person' as 'in_person' | 'online',
    locationAddress: '',
    locationUrl: '',
    eventStartTime: null as Date | null,
    eventEndTime: null as Date | null,
    maxParticipants: '',
  })

  // Update form data when event prop changes (for editing)
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        locationType: event.location_type || ('in_person' as 'in_person' | 'online'),
        locationAddress: event.location_address || '',
        locationUrl: event.location_url || '',
        eventStartTime: event.event_start_time ? new Date(event.event_start_time) : null,
        eventEndTime: event.event_end_time ? new Date(event.event_end_time) : null,
        maxParticipants: event.max_participants?.toString() || '',
      })
    } else {
      // Reset form for create mode
      setFormData({
        title: '',
        description: '',
        locationType: 'in_person' as 'in_person' | 'online',
        locationAddress: '',
        locationUrl: '',
        eventStartTime: null,
        eventEndTime: null,
        maxParticipants: '',
      })
    }
  }, [event])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isEditing && event) {
        await api('update-event', {
          eventId: event.id,
          title: formData.title,
          description: formData.description || undefined,
          locationType: formData.locationType,
          locationAddress:
            (formData.locationType === 'in_person' && formData.locationAddress) || undefined,
          locationUrl: (formData.locationType === 'online' && formData.locationUrl) || undefined,
          eventStartTime: formData.eventStartTime!.toISOString(),
          eventEndTime: formData.eventEndTime ? formData.eventEndTime.toISOString() : undefined,
          maxParticipants: formData.maxParticipants
            ? parseInt(formData.maxParticipants)
            : undefined,
        })
      } else {
        await api('create-event', {
          title: formData.title,
          description: formData.description || undefined,
          locationType: formData.locationType,
          locationAddress:
            (formData.locationType === 'in_person' && formData.locationAddress) || undefined,
          locationUrl: (formData.locationType === 'online' && formData.locationUrl) || undefined,
          eventStartTime: formData.eventStartTime!.toISOString(),
          eventEndTime: formData.eventEndTime ? formData.eventEndTime.toISOString() : undefined,
          maxParticipants: formData.maxParticipants
            ? parseInt(formData.maxParticipants)
            : undefined,
        })
      }

      onSuccess()
      onClose()
      // Reset form only for create, not edit
      if (!isEditing) {
        setFormData({
          title: '',
          description: '',
          locationType: 'in_person',
          locationAddress: '',
          locationUrl: '',
          eventStartTime: null,
          eventEndTime: null,
          maxParticipants: '',
        })
      }
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message)
      } else {
        setError(t('events.failed_create_event', 'Failed to save event. Please try again.'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const {name, value} = e.target
    setFormData((prev) => ({...prev, [name]: value}))
  }

  const dateFormat = locale === 'en' ? 'MMM d, yyyy h:mm aa' : 'dd MMM yyyy, HH:mm'
  const timeFormat = 'HH:mm'

  return (
    <Modal open={open} setOpen={setOpen} onClose={onClose} size="lg">
      <Col className={clsx('', MODAL_CLASS)}>
        <form onSubmit={handleSubmit} className={clsx('space-y-4 pr-4', SCROLLABLE_MODAL_CLASS)}>
          <h3>
            {isEditing
              ? t('events.edit_event', 'Edit Event')
              : t('events.create_new_event', 'Create New Event')}
          </h3>
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium min-w-[300px]">
              {t('events.event_title', 'Event Title')} *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              maxLength={200}
              value={formData.title}
              onChange={handleChange}
              className="bg-canvas-50 border-canvas-300 focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border px-3 py-2"
              placeholder={t('events.event_title_placeholder', 'Enter event title')}
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium">
              {t('events.description', 'Description')}
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={2000}
              value={formData.description}
              onChange={handleChange}
              className="bg-canvas-50 border-canvas-300 focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border px-3 py-2"
              placeholder={t('events.description_placeholder', 'Describe your event...')}
            />
          </div>

          <div>
            <label htmlFor="locationType" className="mb-1 block text-sm font-medium">
              {t('events.location_type', 'Location Type')} *
            </label>
            <select
              id="locationType"
              name="locationType"
              required
              value={formData.locationType}
              onChange={handleChange}
              className="bg-canvas-50 border-canvas-300 focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border px-3 py-2"
            >
              <option value="in_person">{t('events.in_person', 'In Person')}</option>
              <option value="online">{t('events.online', 'Online')}</option>
            </select>
          </div>

          {formData.locationType === 'in_person' ? (
            <div>
              <label htmlFor="locationAddress" className="mb-1 block text-sm font-medium">
                {t('events.location_address', 'Address')} *
              </label>
              <input
                type="text"
                id="locationAddress"
                name="locationAddress"
                required={formData.locationType === 'in_person'}
                maxLength={500}
                value={formData.locationAddress}
                onChange={handleChange}
                className="bg-canvas-50 border-canvas-300 focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border px-3 py-2"
                placeholder={t('events.location_address_placeholder', 'Enter event address')}
              />
            </div>
          ) : (
            <div>
              <label htmlFor="locationUrl" className="mb-1 block text-sm font-medium">
                {t('events.location_url', 'Online Link (URL')} *
              </label>
              <input
                type="url"
                id="locationUrl"
                name="locationUrl"
                required={formData.locationType === 'online'}
                maxLength={500}
                value={formData.locationUrl}
                onChange={handleChange}
                className="bg-canvas-50 border-canvas-300 focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border px-3 py-2"
                placeholder={t('events.location_url_placeholder', 'Enter event URL')}
              />
            </div>
          )}

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t('events.start_time', 'Start')} *
              </label>
              <DatePicker
                selected={formData.eventStartTime}
                locale={locale}
                onChange={(date: Date | null) => {
                  if (!date) return
                  setFormData((prev) => {
                    const newEndTime =
                      !prev.eventEndTime || prev.eventEndTime < date
                        ? new Date(date.getTime() + 60 * 60 * 1000)
                        : prev.eventEndTime
                    return {
                      ...prev,
                      eventStartTime: date,
                      eventEndTime: newEndTime,
                    }
                  })
                }}
                showTimeSelect
                timeFormat={timeFormat}
                timeIntervals={15}
                dateFormat={dateFormat}
                minDate={new Date()}
                required
                placeholderText={t('events.select_start_datetime', 'Select date and time')}
                className="bg-canvas-50 border-canvas-300 focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t('events.end_time', 'End')}
              </label>
              <DatePicker
                selected={formData.eventEndTime}
                locale={locale}
                onChange={(date: Date | null) => {
                  setFormData((prev) => {
                    const startTime = prev.eventStartTime
                    if (startTime && date && date <= startTime) {
                      // If end time is before or equal to start, set start to 1 hour before end
                      return {
                        ...prev,
                        eventStartTime: new Date(date.getTime() - 60 * 60 * 1000),
                        eventEndTime: date,
                      }
                    }
                    return {...prev, eventEndTime: date}
                  })
                }}
                showTimeSelect
                timeFormat={timeFormat}
                timeIntervals={15}
                dateFormat={dateFormat}
                minDate={formData.eventStartTime || new Date()}
                placeholderText={t('events.select_end_datetime', 'Select end time (optional)')}
                className="bg-canvas-50 border-canvas-300 focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label htmlFor="maxParticipants" className="mb-1 block text-sm font-medium">
              {t('events.max_participants', 'Max Participants (optional)')}
            </label>
            <input
              type="number"
              id="maxParticipants"
              name="maxParticipants"
              min={1}
              value={formData.maxParticipants}
              onChange={handleChange}
              className="bg-canvas-50 border-canvas-300 focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border px-3 py-2"
              placeholder={t('events.leave_empty', 'Leave empty for unlimited')}
            />
          </div>

          {error && <div className="text-red-800 rounded-md p-3 text-sm">{error}</div>}

          <div className="flex justify-end gap-3 pt-4 pb-4">
            <button
              type="button"
              onClick={onClose}
              className="text-ink-700 bg-canvas-100 hover:bg-canvas-200 rounded-md px-4 py-2 text-sm font-medium"
            >
              {t('events.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-500 hover:bg-primary-600 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {loading
                ? isEditing
                  ? t('events.updating', 'Updating...')
                  : t('events.creating', 'Creating...')
                : isEditing
                  ? t('events.update_event', 'Update Event')
                  : t('events.create_event', 'Create Event')}
            </button>
          </div>
        </form>
      </Col>
    </Modal>
  )
}
