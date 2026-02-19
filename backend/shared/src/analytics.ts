import {Request} from 'express'
import {trackAuditEvent} from 'shared/audit-events'
import {PostHog} from 'posthog-node'
import {log} from 'shared/utils'
import {ENV_CONFIG} from 'common/envs/constants'

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

export const getIp = (req: Request) => {
  const xForwarded = req.headers['x-forwarded-for']
  const xForwardedIp = Array.isArray(xForwarded) ? xForwarded[0] : xForwarded
  const ip = xForwardedIp ?? req.socket.remoteAddress ?? req.ip
  if (ip?.includes(',')) {
    return ip.split(',')[0].trim()
  }
  return ip ?? ''
}
