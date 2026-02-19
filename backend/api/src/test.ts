import {sendTestEmail} from 'email/functions/helpers'

export const localSendTestEmail = async () => {
  sendTestEmail('hello@compassmeet.com')
    .then(() => console.debug('Email sent successfully!'))
    .catch((error) => console.error('Failed to send email:', error))
  return {message: 'Email sent successfully!'}
}
