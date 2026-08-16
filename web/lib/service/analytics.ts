import * as Sentry from '@sentry/nextjs'
import {ENV_CONFIG} from 'common/envs/constants'
import {Json} from 'common/supabase/schema'
import {run, SupabaseClient} from 'common/supabase/utils'
import {removeUndefinedProps} from 'common/util/object'
import posthog from 'posthog-js'
import {SENTRY_REPLAY_ENABLED} from 'web/lib/sentry-config'
import {db} from 'web/lib/supabase/db'

type EventIds = {
  contractId?: string | null
  commentId?: string | null
  userId?: string | null
  adId?: string | null
}

type EventData = Record<string, Json | undefined>

/**
 * Whether `initTracking` has actually run.
 *
 * PostHog is only initialised once the visitor has said yes (see `web/lib/consent.ts`), so every call
 * into it has to be guarded — an uninitialised instance would otherwise queue events and warn on
 * every `capture`. The Supabase half of `track` below is deliberately *not* gated: it writes to our
 * own database rather than to the visitor's device, so it is a first-party server-side record rather
 * than something ePrivacy's consent rule covers.
 */
let posthogStarted = false

export async function track(name: string, properties?: EventIds & EventData) {
  const {commentId, userId, ...data} = properties || {}
  try {
    if (posthogStarted) posthog?.capture(name, data)
    await insertUserEvent(name, data, db, userId, commentId)
    // console.debug('result', result)
  } catch (e) {
    console.error('error tracking event:', e)
  }
}

/** Guarded page view, for the router hook in `_app`. */
export function trackPageView() {
  if (posthogStarted) posthog?.capture('$pageview')
}

export function isTrackingStarted() {
  return posthogStarted
}

export function initTracking() {
  if (posthogStarted) return
  posthogStarted = true
  posthog.init(ENV_CONFIG.posthogKey, {
    api_host: 'https://us.i.posthog.com',
    // ui_host: 'https://us.posthog.com',
    loaded: (posthog) => {
      posthog.debug(false)
    },
    // Below was a failed attempt to remove that error in the browser console:
    // Cookie “dmn_chk_01993ec4-8420-79ca-85d3-28fec41426c0” has been rejected for invalid domain.
    // persistence: 'cookie',
    // cross_subdomain_cookie: true,          // top-level domain cookie
    // secure_cookie: window.location.protocol === 'https:',
    // cookie_expiration: 365,
    // capture_pageview: true,
  })
}

/**
 * Turns on everything that needed permission, called the moment the banner's "Allow" is clicked.
 *
 * Sentry itself is already running by this point — error reporting is what keeps the app fixable and
 * stores nothing on the visitor's device beyond a session id — so the only thing waiting on consent
 * is the replay recorder, added here rather than at init. Safe from double-adding because the banner
 * only appears when no choice has been recorded, which is exactly the case where
 * `instrumentation-client.ts` decided not to add it.
 */
export function startConsentedTracking() {
  initTracking()
  if (SENTRY_REPLAY_ENABLED) Sentry.addIntegration(Sentry.replayIntegration())
}

// Convenience functions:

export const trackCallback = (eventName: string, eventProperties?: any) => () => {
  track(eventName, eventProperties)
}

export const withTracking =
  (f: (() => void) | (() => Promise<void>), eventName: string, eventProperties?: any) =>
  async () => {
    const promise = f()
    await promise
    track(eventName, eventProperties)
  }

function insertUserEvent(
  name: string,
  data: EventData,
  db: SupabaseClient,
  userId?: string | null,
  commentId?: string | null,
) {
  // console.debug('inserting user event', name, data, userId, commentId, db)
  return run(
    db.from('user_events').insert({
      name,
      data: removeUndefinedProps(data) as Record<string, Json>,
      user_id: userId,
      comment_id: commentId,
    }),
  )
}

export function identifyUser(userId: string | null) {
  if (!posthogStarted) return
  if (userId) posthog.identify(userId)
  else posthog.reset()
}

export async function setUserProperty(property: string, value: string) {
  if (!posthogStarted) return
  posthog.setPersonProperties({property: value})
}
