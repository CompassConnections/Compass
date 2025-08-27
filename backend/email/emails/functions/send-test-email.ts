import { sendTestEmail } from './helpers'

if (require.main === module) {
  const email = process.argv[2]
  if (!email) {
    console.error('Please provide an email address')
    console.log('Usage: ts-node send-test-email.ts your@email.com')
    process.exit(1)
  }

  sendTestEmail(email)
    .then(() => console.log('Email sent successfully!'))
    .catch((error) => console.error('Failed to send email:', error))
}