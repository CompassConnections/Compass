import {ENV_CONFIG} from 'common/envs/constants'
import {Request} from 'express'
import {PostHog} from 'posthog-node'
import {trackAuditEvent} from 'shared/audit-events'
import {log} from 'shared/utils'

const key = ENV_CONFIG.posthogKey

const client = new PostHog(key, {
  host: 'https://us.i.posthog.com',
  flushAt: 1,
  flushInterval: 0,
})

export const track = async (userId: string, eventName: string, properties?: any) => {
  try {
    client.capture({
      distinctId: userId,
      event: eventName,
      properties,
    })
  } catch (e) {
    log.error(e)
  }
}

export const trackPublicEvent = async (userId: string, eventName: string, properties?: any) => {
  const allProperties = Object.assign(properties ?? {}, {})
  const {commentId, ...data} = allProperties
  try {
    client.capture({
      distinctId: userId,
      event: eventName,
      properties,
    })
    await trackAuditEvent(userId, eventName, commentId, data)
  } catch (e) {
    log.error(e)
  }
}

/**
 * The client's address as Cloud Run saw it.
 *
 * The rightmost X-Forwarded-For entry, not the leftmost: Google's front end appends the address it
 * received the connection from, and everything to the left of it is whatever the client chose to
 * send. Reading the first entry let anyone pick their own IP with a header — enough to walk straight
 * past an IP ban. (The API is reached through a Cloud Run domain mapping, with no load balancer in
 * front adding a second hop; one would make the real client the second entry from the right.)
 */
export const getIp = (req: Request) => {
  const xForwarded = [req.headers['x-forwarded-for'] ?? []]
    .flat()
    .join(',')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return xForwarded.at(-1) ?? req.socket.remoteAddress ?? req.ip ?? ''
}
