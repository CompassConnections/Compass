import {PageBase} from 'web/components/page-base'
import {GeneralButton} from 'web/components/buttons/general-button'
import {SEO} from 'web/components/SEO'
import {useT} from 'web/lib/locale'
import {Row} from 'web/components/layout/row'

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="max-w-3xl mb-8 mx-4 sm:mx-16 min-w-[200px]">
      <h4 className="text-2xl font-bold mb-2">{title}</h4>
      <p className="text-ink-600 mb-6">{description}</p>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}

export default function Organization() {
  const t = useT()

  return (
    <PageBase trackPageView={'social'}>
      <SEO
        title={t('organization.seo.title', 'Organization')}
        description={t('organization.seo.description', 'Organization')}
        url={`/organization`}
      />

      <h3 className="text-4xl font-bold text-center mt-8 mb-8">
        {t('organization.title', 'Organization')}
      </h3>

      {/* ABOUT */}
      <Section
        title={t('organization.about.title', 'About us')}
        description={t(
          'organization.about.desc',
          'Who we are, our mission, and how the organization works.',
        )}
      >
        <Row className={'flex-wrap'}>
          <GeneralButton url={'/about'} content={t('about.seo.description', 'About Compass')} />
          <GeneralButton
            url={'/constitution'}
            content={t('organization.constitution', 'Our constitution')}
          />
        </Row>
      </Section>

      {/* PROOF */}
      <Section
        title={t('organization.proof.title', 'Proof & transparency')}
        description={t(
          'organization.proof.desc',
          'Key numbers, progress, and what others say about us.',
        )}
      >
        <Row className={'flex-wrap'}>
          <GeneralButton url={'/stats'} content={t('organization.stats', 'Key metrics & growth')} />
          <GeneralButton url={'/press'} content={t('press.title', 'Press')} />
          <GeneralButton
            url={'/financials'}
            content={t('organization.financials', 'Financial transparency')}
          />
        </Row>
      </Section>

      {/* CONTACT */}
      <Section
        title={t('organization.contactSection.title', 'Contact & support')}
        description={t(
          'organization.contactSection.desc',
          'Need help or want to reach us? Start here.',
        )}
      >
        <Row className={'flex-wrap'}>
          <GeneralButton url={'/contact'} content={t('organization.contact', 'Contact us')} />
          <GeneralButton url={'/help'} content={t('organization.help', 'Help & support center')} />
        </Row>
      </Section>

      {/* TRUST / LEGAL */}
      <Section
        title={t('organization.trust.title', 'Trust & legal')}
        description={t(
          'organization.trust.desc',
          'How we protect your data and the rules that govern the platform.',
        )}
      >
        <Row className={'flex-wrap'}>
          <GeneralButton url={'/security'} content={t('organization.security', 'Security')} />
          <GeneralButton url={'/terms'} content={t('organization.terms', 'Terms and conditions')} />
          <GeneralButton url={'/privacy'} content={t('organization.privacy', 'Privacy policy')} />
        </Row>
      </Section>
    </PageBase>
  )
}
