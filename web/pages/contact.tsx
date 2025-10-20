import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {ContactComponent} from "web/components/contact";


export default function ContactPage() {
  return (
    <PageBase
      trackPageView={'vote page'}
      className={'relative p-2 sm:pt-0'}
    >
      <SEO
        title={`Contact`}
        description={'Contact us'}
        url={`/contact`}
      />
      <ContactComponent/>
    </PageBase>
  )
}
