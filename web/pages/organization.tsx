import {PageBase} from 'web/components/page-base'
import {GeneralButton} from "web/components/buttons/general-button";
import clsx from "clsx";
import {Col} from "web/components/layout/col";
import {SEO} from "web/components/SEO";
import {useT} from 'web/lib/locale'

export default function Organization() {
  const t = useT()

  return (
    <PageBase trackPageView={'social'}>
      <SEO
        title={t('organization.seo.title','Organization')}
        description={t('organization.seo.description','Organization')}
        url={`/organization`}
      />
      <h3 className="text-4xl font-bold text-center mt-8 mb-8">{t('organization.title','Organization')}</h3>
      <Col
        className={clsx(
          'pb-[58px] lg:pb-0', // bottom bar padding
          'text-ink-1000 mx-auto w-full grid grid-cols-1 gap-8 max-w-3xl sm:grid-cols-2 lg:min-h-0 lg:pt-4 mt-4',
        )}
      >
        <GeneralButton url={'/stats'} content={t('organization.stats','Growth & Stats')}/>
        <GeneralButton url={'/support'} content={t('organization.support','Support')}/>
        <GeneralButton url={'/help'} content={t('organization.help','Help')}/>
        <GeneralButton url={'/constitution'} content={t('organization.constitution','Constitution')}/>
        <GeneralButton url={'/vote'} content={t('organization.vote','Proposals')}/>
        <GeneralButton url={'/financials'} content={t('organization.financials','Financials')}/>
        <GeneralButton url={'/terms'} content={t('organization.terms','Terms and Conditions')}/>
        <GeneralButton url={'/privacy'} content={t('organization.privacy','Privacy Policy')}/>
        <GeneralButton url={'/security'} content={t('organization.security','Security')}/>
        <GeneralButton url={'/press'} content={t('press.title', 'Press')}/>
        <GeneralButton url={'/contact'} content={t('organization.contact','Contact')}/>
      </Col>
    </PageBase>
  )
}
