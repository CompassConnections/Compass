import {ContactComponent} from 'web/components/contact'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {useT} from 'web/lib/locale'

export default function ContactPage() {
  const t = useT()
  return (
    <PageBase trackPageView={'contact page'} className={'relative p-2 sm:pt-0'}>
      <SEO
        title={t('contact.seo.title', 'Contact')}
        description={t('contact.seo.description', 'Contact us')}
        url={`/contact`}
      />
      <ContactComponent />
    </PageBase>
  )
}
