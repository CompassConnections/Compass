import dayjs from 'dayjs'
import 'web/lib/dayjs'


export function fromNow(time: number | string | Date, privacy: boolean = false, t: any = undefined, locale: string | null = null) {
  let date = dayjs(time)
  if (locale) date = date.locale(locale)
  if (privacy && dayjs().diff(date, 'hour') < 24) {
    const defaultPastDay = 'in the past day';
    return t ? t('common.from-now.past_day', defaultPastDay) : defaultPastDay
  }
  return date.fromNow();
}

const FORMATTER = new Intl.DateTimeFormat('default', {
  dateStyle: 'medium',
  timeStyle: 'medium',
})

export const formatTime = FORMATTER.format

export function formatTimeShort(time: number) {
  return dayjs(time).format('MMM D, h:mma')
}

export function formatJustTime(time: number) {
  return dayjs(time).format('h:mma')
}

export const getCountdownString = (endDate: Date) => {
  const remainingTimeMs = endDate.getTime() - Date.now()
  const isPast = remainingTimeMs < 0

  const seconds = Math.floor(Math.abs(remainingTimeMs) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const hoursStr = `${hours % 24}h`
  const minutesStr = `${minutes % 60}m`
  const daysStr = `${days}d`

  return `${isPast ? '-' : ''}${daysStr} ${hoursStr} ${minutesStr}`
}

export const getCountdownStringHoursMinutes = (endDate: Date) => {
  const remainingTimeMs = endDate.getTime() - Date.now()
  const isPast = remainingTimeMs < 0

  const seconds = Math.floor(Math.abs(remainingTimeMs) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  const hoursStr = `${hours % 24}h`
  const minutesStr = `${minutes % 60}m`

  return `${isPast ? '-' : ''} ${hoursStr} ${minutesStr}`
}
