import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import Link from 'next/link'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'


export default function HelpPage() {
  return (
    <PageBase trackPageView={'help'} className={'relative p-2 sm:pt-0'}>
      <SEO
        title={'Help'}
        description={'Help and support for Compass'}
        url={`/help`}
      />
      <SEO title={`Help`} description={'Get help with Compass'} url={`/help`}/>
      <Col className="max-w-3xl w-full mx-auto gap-6 custom-link">
        <h1 className="text-3xl font-semibold">Help & Support</h1>
        <p className="text-ink-700">
          Run into a problem or have a question? This page lists the quickest ways to get help and find answers.
        </p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Quick links</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              Read the <Link href="/faq">FAQ</Link> for common questions
            </li>
            <li>
              Contact us via the <Link href="/contact">contact form</Link>
            </li>
            <li>
              Review our <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms"
                                                                                                    >Terms
              of Service</Link>
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Report a problem</h2>
          <p>
            If something isn’t working as expected, please include as much detail as possible (what you did, what you
            expected, what happened instead, any screenshots). The fastest way to reach us is the{' '}
            <Link href="/contact">contact form</Link>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Account and profile issues</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>Can’t sign in? Try signing out and back in, or refresh the page and try again.</li>
            <li>Profile updates not showing? Give it a few seconds and refresh. If the issue persists, let us know via
              the contact form.
            </li>
            <li>
              Want to delete your account? Go to your profile settings, click the three dots menu in the top right,
              and select "Delete Account"
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Security</h2>
          <p>
            If you believe you’ve found a security vulnerability, please report it responsibly. See our{' '}
            <Link href="/security">Security Policy</Link> for details and how to contact us.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Still need help?</h2>
          <Row className="flex-wrap gap-3">
            <Link href="/contact" className="px-3 py-2 rounded-md border border-primary-600 text-ink-700 hover:bg-primary-50">Contact
              us</Link>
            <Link href="/faq"
                  className="px-3 py-2 rounded-md border border-primary-600 text-primary-700 hover:bg-primary-50">Browse
              FAQ</Link>
          </Row>
        </section>
      </Col>
    </PageBase>
  )
}
