import {
  CreateEmailRequestOptions,
  Resend,
  type CreateEmailOptions,
} from 'resend'
import { log } from 'shared/utils'
import {sleep} from "common/util/time";


/*
 * typically: { subject: string, to: string | string[] } & ({ text: string } | { react: ReactNode })
 */
export const sendEmail = async (
  payload: CreateEmailOptions,
  options?: CreateEmailRequestOptions
) => {
  const resend = getResend()
  console.debug(resend, payload, options)

  if (!resend) return null

  const { data, error } = await resend.emails.send(
    { replyTo: 'Compass <hello@compassmeet.com>', ...payload },
    options
  )
  console.debug('resend.emails.send', data, error)

  if (error) {
    log.error(
      `Failed to send email to ${payload.to} with subject ${payload.subject}`
    )
    log.error(error)
    return null
  }

  log(`Sent email to ${payload.to} with subject ${payload.subject}`)

  await sleep(1000) // to avoid rate limits (2 / second in resend free plan)

  return data
}

let resend: Resend | null = null
const getResend = () => {
  if (resend) return resend

  if (!process.env.RESEND_KEY) {
    console.debug('No RESEND_KEY, skipping email send')
    return
  }

  const apiKey = process.env.RESEND_KEY as string
  // console.debug(`RESEND_KEY: ${apiKey}`)
  resend = new Resend(apiKey)
  return resend
}
