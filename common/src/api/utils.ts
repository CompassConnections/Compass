import {BACKEND_DOMAIN, IS_LOCAL} from 'common/envs/constants'

type ErrorCode =
  | 400 // your input is bad (like zod is mad)
  | 401 // you aren't logged in / your account doesn't exist
  | 403 // you aren't allowed to do it
  | 404 // we can't find it
  | 429 // you're too much for us
  | 500 // we fucked up

export class APIError extends Error {
  code: ErrorCode
  details?: unknown

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.code = code
    this.name = 'APIError'
    this.details = details
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
