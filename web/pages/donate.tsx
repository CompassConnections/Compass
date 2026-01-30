import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {Col} from 'web/components/layout/col'
import {useT} from 'web/lib/locale'

export default function DonatePage() {
  const t = useT()

  return (
    <PageBase trackPageView={'donate'} className={'relative p-2 sm:pt-0'}>
      <SEO
        title={t('donate.seo.title','Donate')}
        description={t('donate.seo.description','Donate to support Compass')}
        url={`/donate`}
      />
      <Col className="max-w-3xl w-full mx-auto gap-6 custom-link">
        <h1 className="text-3xl font-semibold">{t('donate.title','Donate')}</h1>
        <iframe src="https://opencollective.com/embed/compass-connection/donate?hideFAQ=true"
                style={{width: '100%', minHeight: '100dvh'}}></iframe>
      </Col>
    </PageBase>
  )
}
