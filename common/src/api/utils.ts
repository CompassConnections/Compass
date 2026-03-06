import {BACKEND_DOMAIN} from 'common/envs/constants'
import {IS_LOCAL} from 'common/hosting/constants'

/**
 * Standard HTTP error codes used throughout the API
 */
export type ErrorCode =
  | 400 // Bad Request - client input error
  | 401 // Unauthorized - authentication required
  | 403 // Forbidden - insufficient permissions
  | 404 // Not Found - resource doesn't exist
  | 409 // Conflict - resource conflict
  | 422 // Unprocessable Entity - validation failed
  | 429 // Too Many Requests - rate limiting
  | 500 // Internal Server Error - unexpected server error
  | 503 // Service Unavailable - temporarily unavailable

/**
 * Extended error details for better error reporting
 */
export interface ErrorDetails {
  /** Field name that caused the error (for validation errors) */
  field?: string
  /** Additional context about the error */
  context?: string
  /** Original error if available */
  originalError?: string
  /** Suggested resolution or next steps */
  resolution?: string
}

/**
 * Comprehensive API error class with standardized error responses
 */
export class APIError extends Error {
  /** HTTP status code */
  code: ErrorCode
  /** Additional error details */
  details?: ErrorDetails | ErrorDetails[]
  /** Timestamp when error occurred */
  timestamp: string
  /** Unique error identifier for tracking */
  errorId?: string

  constructor(
    code: ErrorCode,
    message: string,
    details?: ErrorDetails | ErrorDetails[],
    errorId?: string,
  ) {
    super(message)
    this.code = code
    this.name = 'APIError'
    this.details = details
    this.timestamp = new Date().toISOString()
    this.errorId = errorId
  }

  /**
   * Convert error to a standardized JSON response
   */
  toJSON(): APIErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
        errorId: this.errorId,
      },
    }
  }
}

/**
 * Standardized API error response format
 */
export interface APIErrorResponse {
  error: {
    /** HTTP status code */
    code: number
    /** Human-readable error message */
    message: string
    /** Additional error details */
    details?: ErrorDetails | ErrorDetails[]
    /** Timestamp when error occurred */
    timestamp: string
    /** Unique error identifier for tracking */
    errorId?: string
  }
}

/**
 * Common API error factory functions for consistent error messages
 */
export class APIErrors {
  static badRequest(message: string, details?: ErrorDetails): APIError {
    return new APIError(400, message, details)
  }

  static unauthorized(
    message: string = 'Authentication required',
    details?: ErrorDetails,
  ): APIError {
    return new APIError(401, message, details)
  }

  static forbidden(message: string = 'Insufficient permissions', details?: ErrorDetails): APIError {
    return new APIError(403, message, details)
  }

  static notFound(message: string = 'Resource not found', details?: ErrorDetails): APIError {
    return new APIError(404, message, details)
  }

  static conflict(message: string, details?: ErrorDetails): APIError {
    return new APIError(409, message, details)
  }

  static validationFailed(details?: ErrorDetails | ErrorDetails[]): APIError {
    return new APIError(422, 'Validation failed', details)
  }

  static rateLimitExceeded(
    message: string = 'Rate limit exceeded',
    details?: ErrorDetails,
  ): APIError {
    return new APIError(429, message, details)
  }

  static internalServerError(
    message: string = 'Internal server error',
    details?: ErrorDetails,
    errorId?: string,
  ): APIError {
    return new APIError(500, message, details, errorId)
  }

  static serviceUnavailable(
    message: string = 'Service temporarily unavailable',
    details?: ErrorDetails,
  ): APIError {
    return new APIError(503, message, details)
  }
}

const prefix = ''

export function pathWithPrefix(path: string) {
  return `${prefix}${path}`
}

export function getWebsocketUrl() {
  const protocol = IS_LOCAL ? 'ws' : 'wss'
  return `${protocol}://${BACKEND_DOMAIN}/ws`
}

export function getApiUrl(path: string) {
  const protocol = IS_LOCAL ? 'http' : 'https'
  return `${protocol}://${BACKEND_DOMAIN}${prefix}/${path}`
}
