import {IS_PROD} from 'common/envs/constants'

/**
 * Log level severity types
 * Controls which messages are output based on environment and configuration
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Context object for enriched logging
 * Provides additional metadata to include with log messages
 */
interface LogContext {
  /** API endpoint or route associated with the log */
  endpoint?: string
  /** User ID associated with the action */
  userId?: string
  /** Additional arbitrary context data */
  [key: string]: unknown
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel()]
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const contextStr = context ? ` ${JSON.stringify(context)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
}

/**
 * Centralized logging utility for the Compass application
 * Provides structured logging with different severity levels and context support
 *
 * Usage:
 * ```typescript
 * logger.info('User login successful', { userId: 'user123', endpoint: '/login' })
 * logger.error('Database connection failed', new Error('Connection timeout'), { service: 'database' })
 * ```
 */
export const logger = {
  /**
   * Log debug-level messages
   * Only shown in development environments
   * @param message - Log message content
   * @param context - Optional context data
   */
  debug(message: string, context?: LogContext): void {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, context))
    }
  },

  /**
   * Log informational messages
   * General operational information
   * @param message - Log message content
   * @param context - Optional context data
   */
  info(message: string, context?: LogContext): void {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, context))
    }
  },

  /**
   * Log warning messages
   * Potentially harmful situations that don't halt execution
   * @param message - Log message content
   * @param context - Optional context data
   */
  warn(message: string, context?: LogContext): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, context))
    }
  },

  /**
   * Log error messages
   * Error events that might still allow the application to continue running
   * @param message - Log message content
   * @param error - Optional Error object for stack trace
   * @param context - Optional context data
   */
  error(message: string, error?: Error, context?: LogContext): void {
    if (shouldLog('error')) {
      const errorContext = error
        ? {...context, error: {message: error.message, stack: error.stack}}
        : context
      console.error(formatMessage('error', message, errorContext))
    }
  },
}

/**
 * Log API errors with standardized formatting
 *
 * Specialized function for consistently logging API-related errors with
 * endpoint information and error details
 *
 * @param endpoint - API endpoint where error occurred
 * @param error - Error object or unknown error data
 * @param extra - Additional context information
 *
 * @example
 * ```typescript
 * try {
 *   await apiCall()
 * } catch (err) {
 *   logApiError('/api/users', err, { userId: 'user123' })
 * }
 * ```
 */
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

/**
 * Log page view events for analytics and monitoring
 *
 * Tracks user navigation and page engagement metrics
 *
 * @param path - URL path of the viewed page
 */
export function logPageView(path: string): void {
  logger.info('Page view', {path})
}

/**
 * Determine current logging level based on environment
 *
 * In production environments, only info level and above are logged
 * In development environments, debug level messages are also shown
 *
 * @returns Current log level threshold
 */
const currentLevel = (): LogLevel => {
  const envLogLevel = process.env.NEXT_PUBLIC_LOG_LEVEL?.toLowerCase()
  if (envLogLevel) {
    if (envLogLevel in LOG_LEVELS) return envLogLevel as LogLevel
    console.warn(`Invalid NEXT_PUBLIC_LOG_LEVEL: ${envLogLevel}`)
  }
  if (IS_PROD || process.env.NODE_ENV == 'production') return 'info'
  return 'debug'
}

/**
 * Simple debug logging function
 *
 * Direct console.debug wrapper that respects current log level
 * Useful for quick debugging without context
 *
 * @param args - Arguments to pass to console.debug
 */
export const debug = (...args: unknown[]) => {
  if (currentLevel() === 'debug') {
    console.debug(...args)
  }
}
