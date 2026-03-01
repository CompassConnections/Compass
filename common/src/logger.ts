import {IS_PROD} from 'common/envs/constants'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  endpoint?: string
  userId?: string
  [key: string]: unknown
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel()]
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const contextStr = context ? ` ${JSON.stringify(context)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, context))
    }
  },

  info(message: string, context?: LogContext): void {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, context))
    }
  },

  warn(message: string, context?: LogContext): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, context))
    }
  },

  error(message: string, error?: Error, context?: LogContext): void {
    if (shouldLog('error')) {
      const errorContext = error
        ? {...context, error: {message: error.message, stack: error.stack}}
        : context
      console.error(formatMessage('error', message, errorContext))
    }
  },
}

export function logApiError(endpoint: string, error: Error | unknown, extra?: LogContext): void {
  const errorMessage = error instanceof Error ? error.message : String(error)
  logger.error(
    `API Error in ${endpoint}`,
    error instanceof Error ? error : new Error(errorMessage),
    {
      endpoint,
      ...extra,
    },
  )
}

export function logPageView(path: string): void {
  logger.info('Page view', {path})
}

const currentLevel = (): LogLevel => {
  if (IS_PROD) return 'info'
  return 'debug'
}

export const debug = (...args: unknown[]) => {
  if (currentLevel() === 'debug') {
    console.debug(...args)
  }
}
