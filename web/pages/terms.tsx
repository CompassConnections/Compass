import {supportEmail} from 'common/constants'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {useT} from 'web/lib/locale'

// TODO: convert to MarkDown for better readability during modifications?
export default function TermsPage() {
  const t = useT()
  return (
    <PageBase
      trackPageView={'terms'}
      className="max-w-4xl mx-auto p-8 text-gray-800 dark:text-white col-span-8 bg-canvas-0"
    >
      <SEO
        title={t('terms.seo.title', 'Terms & Conditions')}
        description={t('terms.seo.description', 'Terms & Conditions for Compass')}
        url={`/terms`}
      />
      <h1 className="text-3xl font-semibold text-center mb-6">
        {t('terms.title', 'Terms & Conditions')}
      </h1>

      <p className="text-center text-gray-500 dark:text-white mb-12">
        {t('terms.effective_date', 'Effective Date: January 1, 2025')}
      </p>

      <section className="space-y-6 text-base leading-relaxed">
        <p>
          {t('terms.intro.prefix', 'Welcome to ')}
          <span className="font-semibold">Compass</span>
          {t(
            'terms.intro.suffix',
            ', a platform to connect, collaborate, and build meaningful interactions. By accessing or using our service, you agree to the following Terms and Conditions.',
          )}
        </p>

        <h2 className="text-xl font-semibold">{t('terms.eligibility.title', '1. Eligibility')}</h2>
        <p>
          {t(
            'terms.eligibility.text',
            'You must be at least 15 years old to create an account and use Compass. By registering, you confirm that you meet this requirement.',
          )}
        </p>

        <h2 className="text-xl font-semibold">
          {t('terms.responsibilities.title', '2. User Responsibilities')}
        </h2>
        <p>
          {t(
            'terms.responsibilities.text',
            'Users must engage with others respectfully, avoid spamming, and refrain from any behavior that disrupts the community or violates applicable laws.',
          )}
        </p>

        <h2 className="text-xl font-semibold">
          {t('terms.ip.title', '3. Intellectual Property & Licensing')}
        </h2>
        <p>
          {t(
            'terms.ip.a',
            'a. Ownership and License. Compass is developed and maintained as a free and open-source project. Unless otherwise stated, all source code, designs, and related materials (“Project Materials”) are licensed under the AGPL-3.0 License. Certain components may be licensed under permissive open-source licenses, as explicitly indicated. Subject to the applicable license terms, you are granted a worldwide, royalty-free, non-exclusive, irrevocable license to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Project Materials in accordance with the terms of the applicable license.',
          )}
        </p>
        <p>
          {t(
            'terms.ip.b',
            'b. Community Governance. Compass operates under a community-driven governance model. Any material changes to licensing, monetization (including advertisements), or governance structures shall require approval through the governance process defined by the Compass community. All governance decisions will be made publicly available.',
          )}
        </p>
        <p>
          {t(
            'terms.ip.c',
            'c. Contributions. By submitting code, designs, documentation, or other contributions (“Contributions”) to Compass, you agree that such Contributions will be licensed under the same open-source license governing the Project Materials at the time of contribution. You represent and warrant that you have the right to grant such a license and that your Contributions do not infringe on the rights of any third party.',
          )}
        </p>
        {/*<p>*/}
        {/*  d. <strong>Trademarks and Branding.</strong> The name “Compass,” logos,*/}
        {/*  and associated marks (“Marks”) are the exclusive property of the Compass*/}
        {/*  community or its designated steward. Use of the Marks is only permitted as*/}
        {/*  authorized in writing by the Compass governance body to avoid confusion*/}
        {/*  or misuse.*/}
        {/*</p>*/}
        <p>
          {t(
            'terms.ip.d',
            'd. No Proprietary Restrictions. Compass shall remain free of advertising, proprietary lock-ins, and data monetization unless explicitly approved by the community in accordance with its governance process. Users and contributors must not introduce such restrictions without prior community approval.',
          )}
        </p>

        <h2 className="text-xl font-semibold">
          {t('terms.safety.title', '4. Community Standards & Safety')}
        </h2>
        <p>
          {t(
            'terms.safety.a',
            'a. Nudity and Sexual Content. Compass does not permit public sharing of nudity or sexually explicit content. Any content that includes nudity, sexual acts, or sexually suggestive material will be removed and may lead to suspension or termination of accounts involved.',
          )}
        </p>
        <p>
          {t(
            'terms.safety.b',
            'b. Child Sexual Abuse and Exploitation (CSAE). Compass maintains a zero-tolerance policy toward any form of child sexual abuse or exploitation (“CSAE”). CSAE refers to content or behavior that sexually exploits, abuses, or endangers children — including but not limited to grooming a child for sexual exploitation, sextortion, trafficking of a child for sex, or otherwise sexually exploiting a child. Any suspected CSAE will result in immediate account termination and may be reported to law enforcement and the National Center for Missing and Exploited Children (NCMEC) as required by law.',
          )}
        </p>
        <p>
          {t(
            'terms.safety.c',
            'c. Violence and Harmful Content. Compass does not allow the sharing of real-world, graphic violence outside of a newsworthy, contextual, or educational purpose. Content that promotes or glorifies violence will be removed.',
          )}
        </p>
        <p>
          {t(
            'terms.safety.d',
            'd. Location Sharing. Compass does not share users’ precise physical location with other users without explicit consent. Any optional location-based features will clearly disclose how location data is used and shared.',
          )}
        </p>
        <p>
          {t(
            'terms.safety.e',
            'e. Digital Goods and Transactions. Compass is a completely free platform. It does not sell digital goods, offer in-app purchases, or charge for access to features. All functionality is available without payment.',
          )}
        </p>
        <p>
          {t(
            'terms.safety.f',
            'f. User Safety Controls. Compass includes built-in features that allow users to:',
          )}
        </p>
        <ul className="list-disc list-inside">
          <li>{t('terms.safety.f1', 'Block other users or specific user-generated content.')}</li>
          <li>
            {t('terms.safety.f2', 'Report users or content that violates community standards.')}
          </li>
          <li>
            {t(
              'terms.safety.f3',
              'Benefit from active chat moderation to ensure a safe and respectful environment.',
            )}
          </li>
          <li>
            {t(
              'terms.safety.f4',
              'Limit interactions to invited friends only, where supported by the app’s features.',
            )}
          </li>
        </ul>

        <h2 className="text-xl font-semibold">{t('terms.liability.title', '5. Liability')}</h2>
        <p>
          {t(
            'terms.liability.text',
            'Compass is not responsible for disputes between users or for damages arising from the use of the platform. Use the platform at your own discretion.',
          )}
        </p>

        <h2 className="text-xl font-semibold">{t('terms.changes.title', '6. Changes')}</h2>
        <p>
          {t(
            'terms.changes.text',
            'We may update these Terms periodically. Continued use of Compass after updates constitutes acceptance of the new Terms.',
          )}
        </p>

        <p className="italic mt-8">
          {t('terms.contact', 'For questions regarding these Terms, please contact us at ')}
          {supportEmail}
          {'.'}
        </p>
      </section>
    </PageBase>
  )
}
