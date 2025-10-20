import {LovePage} from 'web/components/love-page'
import {SEO} from 'web/components/SEO'
import Link from 'next/link'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'

export default function SecurityPage() {
  const email = 'hello@compassmeet.com'
  const mailto = `mailto:${email}?subject=${encodeURIComponent('Security vulnerability report')}`

  return (
    <LovePage trackPageView={'security'} className={'relative p-2 sm:pt-0'}>
      <SEO
        title={`Security`}
        description={'Report security vulnerabilities to the Compass team'}
        url={`/security`}
      />
      <Col className="max-w-3xl w-full mx-auto gap-6 custom-link">
        <h1 className="text-3xl font-semibold">Security</h1>
        <p className="text-ink-700">
          We take the security of our community seriously. If you believe you have found a vulnerability
          or security issue, please report it responsibly so we can investigate and fix it quickly.
        </p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">How to report</h2>
          <p>
            Please do not open public GitHub issues for security reports. Instead, contact us directly via one of the following:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              Use the <Link href="/contact">contact form</Link> and choose the security category if available.
            </li>
            <li>
              Email us at <a href={mailto}>{email}</a>.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">What to include</h2>
          <p>
            To help us triage and resolve the issue quickly, please include:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>A clear description of the issue and potential impact</li>
            <li>Steps to reproduce (URLs, test accounts, exact requests/responses if applicable)</li>
            <li>Any screenshots, videos, or proof-of-concept code</li>
            <li>Your operating system, browser, and environment details</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Our response</h2>
          <p>
            We aim to acknowledge new security reports within a few business days and will keep you updated as we investigate and remediate.
            Timeframes may vary based on severity and complexity.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Out of scope</h2>
          <p>
            Please avoid tests that could degrade service for other users (e.g., denial of service) or that involve accessing another user’s data without explicit permission.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Get in touch</h2>
          <Row className="flex-wrap gap-3">
            <Link href="/contact" className="px-3 py-2 rounded-md border border-primary-600 text-ink-700 hover:bg-primary-50">Contact form</Link>
            <a href={mailto} className="px-3 py-2 rounded-md border border-primary-600 text-ink-700 hover:bg-primary-50">Email {email}</a>
          </Row>
        </section>
      </Col>
    </LovePage>
  )
}
