export const MINUTE_MS = 60 * 1000
export const HOUR_MS = 60 * MINUTE_MS
export const DAY_MS = 24 * HOUR_MS
export const WEEK_MS = 7 * DAY_MS
export const MONTH_MS = 30 * DAY_MS
export const YEAR_MS = 365 * DAY_MS

export const MINUTE_SECONDS = MINUTE_MS / 1000
export const HOUR_SECONDS = HOUR_MS / 1000
export const DAY_SECONDS = DAY_MS / 1000
export const WEEK_SECONDS = WEEK_MS / 1000
export const MONTH_SECONDS = MONTH_MS / 1000
export const YEAR_SECONDS = YEAR_MS / 1000

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function getCurrentUtcTime(): Date {
  const currentDate = new Date()
  const utcDate = currentDate.toISOString()
  return new Date(utcDate)
}
