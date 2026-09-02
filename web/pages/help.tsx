import Link from 'next/link'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {useT} from 'web/lib/locale'

export default function HelpPage() {
  const t = useT()

  return (
    <PageBase trackPageView={'help'} className={'relative p-2 sm:pt-0'}>
      <SEO
        title={t('help.seo.title', 'Help')}
        description={t('help.seo.description', 'Help and support for Compass')}
        url={`/help`}
      />
      <SEO
        title={t('help.seo.title', 'Help')}
        description={t('help.seo.description', 'Get help for Compass')}
        url={`/help`}
      />
      <Col className="max-w-3xl w-full mx-auto gap-6 custom-link mb-4">
        <h1 className="text-3xl font-semibold">{t('help.title', 'Help & support')}</h1>
        <p className="text-ink-700">
          {t(
            'help.intro',
            'Having trouble or have questions? This page lists the fastest ways to get help and find answers.',
          )}
        </p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('help.links.title', 'Quick links')}</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              {t('help.links.read_prefix', 'Read the ')}
              <Link href="/faq">{t('nav.faq', 'FAQ')}</Link>
              {t('help.links.read_suffix', ' for common questions')}
            </li>
            <li>
              {t('help.links.contact_prefix', 'Contact us via the ')}
              <Link href="/contact">{t('security.how.contact_form', 'contact form')}</Link>
            </li>
            <li>
              {t('help.links.safety_prefix', 'Read the ')}
              <Link href="/safety">{t('safety.title', 'safety guide')}</Link>
              {t('help.links.safety_suffix', ' before meeting someone you have met here')}
            </li>
            <li>
              {t('help.links.consult_prefix', 'See our ')}
              <Link href="/privacy">{t('privacy.title', 'Privacy Policy')}</Link>
              {t('help.links.consult_and', ' and ')}
              <Link href="/terms">{t('terms.title', 'Terms of service')}</Link>
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('help.report.title', 'Report a problem')}</h2>
          <p>
            {t(
              'help.report.paragraph_prefix',
              "If something isn't working as expected, please include as many details as possible (what you did, what you expected, what happened, screenshots). The fastest way to reach us is the ",
            )}
            <Link href="/contact">{t('security.how.contact_form', 'contact form')}</Link>
            {t('help.report.paragraph_suffix', '.')}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">
            {t('help.account.title', 'Account & profile issues')}
          </h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              {t(
                'help.account.login_issue',
                "Can't sign in? Try signing out and signing back in, or refresh the page and try again.",
              )}
            </li>
            <li>
              {t(
                'help.account.profile_update',
                'Profile updates not appearing? Wait a few seconds and refresh. If the problem persists, report it via the contact form.',
              )}
            </li>
            <li>
              {t(
                'help.account.delete_instructions',
                "Want to delete your account? Go to Settings → General and click 'Delete account' at the bottom. You can also go straight to /delete-account.",
              )}
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">
            {t('help.safety.title', 'Staying safe with other members')}
          </h2>
          <p>
            {t(
              'help.safety.paragraph',
              'Romance scams, fake profiles and pressure to move off the platform follow a small number of predictable patterns, and they are easy to spot once you have seen them written down.',
            )}
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              {t(
                'help.safety.item1',
                'Stay on Compass until you trust someone, and get on a video call before you meet.',
              )}
            </li>
            <li>
              {t(
                'help.safety.item2',
                'Never send money, crypto or gift cards to someone you have not met in person.',
              )}
            </li>
            <li>
              {t(
                'help.safety.item3',
                'Meet in public, arrange your own transport, and tell a friend where you are going.',
              )}
            </li>
          </ul>
          <p>
            {t(
              'help.safety.read_prefix',
              'The full guide — including how to check that someone is real, and what to do if something has already gone wrong — is here: ',
            )}
            <Link href="/safety">{t('safety.title', 'safety guide')}</Link>
            {t('help.safety.read_suffix', '.')}
          </p>
          <p>
            {t(
              'help.safety.report',
              'To report or block someone, open their profile and use the ⋯ menu at the top. Reports are private — the other person is never told.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          {/* Note this is the *vulnerability disclosure* page, not member safety — the two are one
              word apart and people land on the wrong one, hence the section above. */}
          <h2 className="text-xl font-semibold">{t('security.title', 'Security')}</h2>
          <p>
            {t(
              'help.security.paragraph_prefix',
              "If you believe you've discovered a security vulnerability, please report it responsibly. See our ",
            )}
            <Link href="/security">{t('security.title', 'Security')}</Link>
            {t('help.security.paragraph_suffix', ' for details and ways to contact us.')}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('help.need_help.title', 'Need help?')}</h2>
          <Row className="flex-wrap gap-3">
            <Link
              href="/contact"
              className="px-3 py-2 rounded-md border border-primary-600 text-ink-700 hover:bg-primary-50"
            >
              {t('help.actions.contact_button', 'Contact us')}
            </Link>
            <Link
              href="/faq"
              className="px-3 py-2 rounded-md border border-primary-600 text-primary-700 hover:bg-primary-50"
            >
              {t('help.actions.faq_button', 'View FAQ')}
            </Link>
            <Link
              href="/safety"
              className="px-3 py-2 rounded-md border border-primary-600 text-primary-700 hover:bg-primary-50"
            >
              {t('help.actions.safety_button', 'Safety guide')}
            </Link>
          </Row>
        </section>
      </Col>
    </PageBase>
  )
}
