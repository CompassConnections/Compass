// eslint-disable-next-line no-restricted-imports
import { ENV_CONFIG } from 'common/envs/constants'
import { db } from 'web/lib/supabase/db'
import { removeUndefinedProps } from 'common/util/object'
import { run, SupabaseClient } from 'common/supabase/utils'
import { Json } from 'common/supabase/schema'
import posthog from 'posthog-js'

type EventIds = {
  contractId?: string | null
  commentId?: string | null
  adId?: string | null
}

type EventData = Record<string, Json | undefined>

export async function track(name: string, properties?: EventIds & EventData) {
  const { commentId, ...data } = properties || {}
  try {
    posthog?.capture(name, data)
    const result = await insertUserEvent(name, data, db, null, commentId)
    console.log('result', result)
  } catch (e) {
    console.error('error tracking event:', e)
  }
}

export function initTracking() {
  posthog.init(ENV_CONFIG.posthogKey, {
    api_host: '/ingest',
    ui_host: 'https://us.posthog.com',
    loaded: (posthog) => {
      posthog.debug(false)
    },
    persistence: 'cookie',
    cross_subdomain_cookie: true,        // top-level domain cookie
    secure_cookie: window.location.protocol === 'https:',
    cookie_expiration: 365,
    capture_pageview: true,
  })
}

// Convenience functions:

export const trackCallback =
  (eventName: string, eventProperties?: any) => () => {
    track(eventName, eventProperties)
  }

export const withTracking =
  (
    f: (() => void) | (() => Promise<void>),
    eventName: string,
    eventProperties?: any
  ) =>
  async () => {
    const promise = f()
    track(eventName, eventProperties)
    await promise
  }

function insertUserEvent(
  name: string,
  data: EventData,
  db: SupabaseClient,
  userId?: string | null,
  commentId?: string | null
) {
  console.log('inserting user event', name, data, userId, commentId, db)
  return run(
    db.from('user_events').insert({
      name,
      data: removeUndefinedProps(data) as Record<string, Json>,
      // user_id: userId,
      comment_id: commentId,
    })
  )
}

export function identifyUser(userId: string | null) {
  if (userId) posthog.identify(userId)
  else posthog.reset()
}

export async function setUserProperty(property: string, value: string) {
  posthog.setPersonProperties({ property: value })
}
