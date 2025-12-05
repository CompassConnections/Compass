import * as admin from 'firebase-admin'
import {z} from 'zod'
import {NextFunction, Request, Response} from 'express'

import {PrivateUser} from 'common/user'
import {APIError} from 'common/api/utils'
import {API, APIPath, APIResponseOptionalContinue, APISchema, ValidatedAPIParams,} from 'common/api/schema'
import {getPrivateUserByKey, log} from 'shared/utils'

export {APIError} from 'common/api/utils'

// export type Json = Record<string, unknown> | Json[]
// export type JsonHandler<T extends Json> = (
//   req: Request,
//   res: Response
// ) => Promise<T>
// export type AuthedHandler<T extends Json> = (
//   req: Request,
//   user: AuthedUser,
//   res: Response
// ) => Promise<T>
// export type MaybeAuthedHandler<T extends Json> = (
//   req: Request,
//   user: AuthedUser | undefined,
//   res: Response
// ) => Promise<T>

export type AuthedUser = {
  uid: string
  creds: JwtCredentials | (KeyCredentials & { privateUser: PrivateUser })
}
type JwtCredentials = { kind: 'jwt'; data: admin.auth.DecodedIdToken }
type KeyCredentials = { kind: 'key'; data: string }
type Credentials = JwtCredentials | KeyCredentials

// export async function verifyIdToken(payload: string): Promise<DecodedIdToken> {
// TODO: make local dev work without firebase admin SDK setup.
// if (IS_LOCAL) {
//   // Skip real verification locally (to avoid needing to set up admin service account).
//   return {
//     aud: "",
//     auth_time: 0,
//     email_verified: false,
//     exp: 0,
//     firebase: {identities: {}, sign_in_provider: ""},
//     iat: 0,
//     iss: "",
//     phone_number: "",
//     picture: "",
//     sub: "",
//     uid: 'dev-user',
//     user_id: 'dev-user',
//     email: 'dev-user@example.com'
//   };
// }
//   return await admin.auth().verifyIdToken(payload);
// }

export const parseCredentials = async (req: Request): Promise<Credentials> => {
  const auth = admin.auth()
  const authHeader = req.get('Authorization')
  if (!authHeader) {
    throw new APIError(401, 'Missing Authorization header.')
  }
  const authParts = authHeader.split(' ')
  if (authParts.length !== 2) {
    throw new APIError(401, 'Invalid Authorization header.')
  }

  const [scheme, payload] = authParts
  switch (scheme) {
    case 'Bearer':
      if (payload === 'undefined') {
        throw new APIError(401, 'Firebase JWT payload undefined.')
      }
      try {
        return {kind: 'jwt', data: await auth.verifyIdToken(payload)}
      } catch (err) {
        const raw = payload.split(".")[0];
        console.log("JWT header:", JSON.parse(Buffer.from(raw, "base64").toString()));
        // This is somewhat suspicious, so get it into the firebase console
        console.error('Error verifying Firebase JWT: ', err, scheme, payload)
        throw new APIError(500, 'Error validating token.')
      }
    case 'Key':
      return {kind: 'key', data: payload}
    default:
      throw new APIError(401, 'Invalid auth scheme; must be "Key" or "Bearer".')
  }
}

export const lookupUser = async (creds: Credentials): Promise<AuthedUser> => {
  switch (creds.kind) {
    case 'jwt': {
      if (typeof creds.data.user_id !== 'string') {
        throw new APIError(401, 'JWT must contain user ID.')
      }
      return {uid: creds.data.user_id, creds}
    }
    case 'key': {
      const key = creds.data
      const privateUser = await getPrivateUserByKey(key)
      if (!privateUser) {
        throw new APIError(401, `No private user exists with API key ${key}.`)
      }
      return {uid: privateUser.id, creds: {privateUser, ...creds}}
    }
    default:
      throw new APIError(401, 'Invalid credential type.')
  }
}

export const validate = <T extends z.ZodTypeAny>(schema: T, val: unknown) => {
  const result = schema.safeParse(val)
  if (!result.success) {
    const issues = result.error.issues.map((i) => {
      return {
        field: i.path.join('.') || null,
        error: i.message,
      }
    })
    if (issues.length > 0) {
      log.error(issues.map((i) => `${i.field}: ${i.error}`).join('\n'))
    }
    throw new APIError(400, 'Error validating request.', issues)
  } else {
    return result.data as z.infer<T>
  }
}

// export const jsonEndpoint = <T extends Json>(fn: JsonHandler<T>) => {
//   return async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       res.status(200).json(await fn(req, res))
//     } catch (e) {
//       next(e)
//     }
//   }
// }
//
// export const authEndpoint = <T extends Json>(fn: AuthedHandler<T>) => {
//   return async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const authedUser = await lookupUser(await parseCredentials(req))
//       res.status(200).json(await fn(req, authedUser, res))
//     } catch (e) {
//       next(e)
//     }
//   }
// }
//
// export const MaybeAuthedEndpoint = <T extends Json>(
//   fn: MaybeAuthedHandler<T>
// ) => {
//   return async (req: Request, res: Response, next: NextFunction) => {
//     let authUser: AuthedUser | undefined = undefined
//     try {
//       authUser = await lookupUser(await parseCredentials(req))
//     } catch {
//       // it's treated as an anon request
//     }
//
//     try {
//       res.status(200).json(await fn(req, authUser, res))
//     } catch (e) {
//       next(e)
//     }
//   }
// }

export type APIHandler<N extends APIPath> = (
  props: ValidatedAPIParams<N>,
  auth: APISchema<N> extends { authed: true }
    ? AuthedUser
    : AuthedUser | undefined,
  req: Request
) => Promise<APIResponseOptionalContinue<N>>

// Simple in-memory fixed-window rate limiter keyed by auth uid (or IP if unauthenticated)
// Not suitable for multi-instance deployments without a shared store, but provides basic protection.
// Limits are configurable via env:
//   API_RATE_LIMIT_PER_MIN_AUTHED
//   API_RATE_LIMIT_PER_MIN_UNAUTHED
// Endpoints can be exempted by adding their name to RATE_LIMIT_EXEMPT (comma-separated)
const __rateLimitState: Map<string, { windowStart: number; count: number }> = new Map()

function getRateLimitConfig() {
  const authed = Number(process.env.API_RATE_LIMIT_PER_MIN_AUTHED ?? 120)
  const unAuthed = Number(process.env.API_RATE_LIMIT_PER_MIN_UNAUTHED ?? 120)
  return {authedLimit: authed, unAuthLimit: unAuthed}
}

function rateLimitKey(name: string, req: Request, auth?: AuthedUser) {
  if (auth) return `uid:${auth.uid}`
  // fallback to IP for unauthenticated requests
  return `ip:${req.ip}`
}

function checkRateLimit(name: string, req: Request, res: Response, auth?: AuthedUser) {
  const {authedLimit, unAuthLimit} = getRateLimitConfig()

  const key = rateLimitKey(name, req, auth)
  const limit = auth ? authedLimit : unAuthLimit
  const now = Date.now()
  const windowMs = 60_000
  const windowStart = Math.floor(now / windowMs) * windowMs

  let state = __rateLimitState.get(key)
  if (!state || state.windowStart !== windowStart) {
    state = {windowStart, count: 0}
    __rateLimitState.set(key, state)
  }
  state.count += 1

  const remaining = Math.max(0, limit - state.count)
  const reset = Math.ceil((state.windowStart + windowMs - now) / 1000)

  // Set standard-ish rate limit headers
  res.setHeader('X-RateLimit-Limit', String(limit))
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining)))
  res.setHeader('X-RateLimit-Reset', String(reset))

  // console.log(`Rate limit check for ${key} on ${name}: ${state.count}/${limit} (remaining: ${remaining}, resets in ${reset}s)`)

  if (state.count > limit) {
    res.setHeader('Retry-After', String(reset))
    throw new APIError(429, 'Too Many Requests: rate limit exceeded.')
  }
}

export const typedEndpoint = <N extends APIPath>(
  name: N,
  handler: APIHandler<N>
) => {
  const {props: propSchema, authed: authRequired, rateLimited = false, method} = API[name] as APISchema<N>

  return async (req: Request, res: Response, next: NextFunction) => {
    let authUser: AuthedUser | undefined = undefined
    try {
      authUser = await lookupUser(await parseCredentials(req))
    } catch (e) {
      if (authRequired) return next(e)
    }

    // Apply rate limiting before invoking the handler
    if (rateLimited) {
      try {
        checkRateLimit(String(name), req, res, authUser)
      } catch (e) {
        return next(e)
      }
    }

    const props = {
      ...(method === 'GET' ? req.query : req.body),
      ...req.params,
    }

    try {
      const resultOptionalContinue = await handler(
        validate(propSchema, props),
        authUser as AuthedUser,
        req
      )

      const hasContinue =
        resultOptionalContinue &&
        'continue' in resultOptionalContinue &&
        'result' in resultOptionalContinue
      const result = hasContinue
        ? resultOptionalContinue.result
        : resultOptionalContinue

      if (!res.headersSent) {
        // Convert bigint to number, b/c JSON doesn't support bigint.
        const convertedResult = deepConvertBigIntToNumber(result)
        // console.debug('API result', convertedResult)
        res.status(200).json(convertedResult ?? {success: true})
      }

      if (hasContinue) {
        await resultOptionalContinue.continue()
      }
    } catch (error) {
      next(error)
    }
  }
}

const deepConvertBigIntToNumber = (obj: any): any => {
  if (typeof obj === 'bigint') {
    return Number(obj)
  } else if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      obj[key] = deepConvertBigIntToNumber(value)
    }
  }
  return obj
}
