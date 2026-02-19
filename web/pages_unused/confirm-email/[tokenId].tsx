import {PageBase} from 'web/components/page-base'
import {Col} from 'web/components/layout/col'
import {SEO} from 'web/components/SEO'

export default function ConfirmEmail() {
  return (
    <PageBase trackPageView={'private messages page'}>
      <SEO title={'Confirm Email'} description={'Confirm your email'} url={`/confirm-email`} />
      <Col className="items-center justify-center h-full">
        <div className="text-xl font-semibold text-center mt-8">
          Thank you for confirming your email!
        </div>
      </Col>
    </PageBase>
  )
}
