import {
  CreateEmailRequestOptions,
  Resend,
  type CreateEmailOptions,
} from 'resend'
import { log } from 'shared/utils'

/*
 * typically: { subject: string, to: string | string[] } & ({ text: string } | { react: ReactNode })
 */
export const sendEmail = async (
  payload: CreateEmailOptions,
  options?: CreateEmailRequestOptions
) => {
  const resend = getResend()
  console.log(resend, payload, options)
  const { data, error } = await resend.emails.send(
    { replyTo: 'Compass <no-reply@compassmeet.com>', ...payload },
    options
  )
  console.log('resend.emails.send', data, error)

  if (error) {
    log.error(
      `Failed to send email to ${payload.to} with subject ${payload.subject}`
    )
    log.error(error)
    return null
  }

  log(`Sent email to ${payload.to} with subject ${payload.subject}`)
  return data
}

let resend: Resend | null = null
const getResend = () => {
  if (resend) return resend

  const apiKey = process.env.RESEND_KEY as string
  // console.log(`RESEND_KEY: ${apiKey}`)
  resend = new Resend(apiKey)
  return resend
}
