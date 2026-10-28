import {IS_LOCAL} from 'common/hosting/constants'
import {debug} from 'common/logger'
import {sleep} from 'common/util/time'
import {type CreateEmailOptions, CreateEmailRequestOptions, Resend} from 'resend'
import {log} from 'shared/utils'

/*
 * typically: { subject: string, to: string | string[] } & ({ text: string } | { react: ReactNode })
 */
export const sendEmail = async (
  payload: CreateEmailOptions,
  options?: CreateEmailRequestOptions,
) => {
  const resend = getResend()
  debug(resend, payload, options)

  const skip = IS_LOCAL && process.env.SEND_EMAIL_LOCALLY !== 'true'
  if (skip) {
    console.warn('Skipping email send')
    return null
  }

  if (sendsOnlyToTestDomains(payload.to)) {
    debug(`Skipping email to reserved test domain: ${payload.to}`)
    return null
  }

  if (!resend) return null

  const {data, error} = await resend.emails.send(
    {
      replyTo: 'Compass <hello@compassmeet.com>',
      ...payload,
    },
    options,
  )
  debug('resend.emails.send', data, error)

  if (error) {
    log.error(`Failed to send email to ${payload.to} with subject ${payload.subject}`)
    log.error(error)
    return null
  }

  log(`Sent email to ${payload.to} with subject ${payload.subject}`)

  await sleep(1000) // to avoid rate limits (2 / second in resend free plan)

  return data
}

// Domains reserved for testing (RFC 2606) can never receive mail. The load tests sign up with them, so
// sending would only bounce and hurt the sender reputation.
const isTestDomainAddress = (address: string) => {
  const domain = address.trim().replace(/>$/, '').split('@').pop()?.toLowerCase() ?? ''
  return (
    ['example.com', 'example.net', 'example.org'].includes(domain) ||
    ['.example', '.test', '.invalid'].some((tld) => domain.endsWith(tld))
  )
}

const sendsOnlyToTestDomains = (to: string | string[]) => {
  const addresses = Array.isArray(to) ? to : [to]
  return addresses.length > 0 && addresses.every(isTestDomainAddress)
}

let resend: Resend | null = null
const getResend = () => {
  if (resend) return resend

  if (!process.env.RESEND_KEY) {
    debug('No RESEND_KEY, skipping email send')
    return
  }

  const apiKey = process.env.RESEND_KEY as string
  // console.debug(`RESEND_KEY: ${apiKey}`)
  resend = new Resend(apiKey)
  return resend
}
