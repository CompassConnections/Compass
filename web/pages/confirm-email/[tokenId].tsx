import {LovePage} from 'web/components/love-page'
import {Col} from 'web/components/layout/col'

export default function ConfirmEmail() {
  return (
    <LovePage trackPageView={'private messages page'}>
      <Col className="items-center justify-center h-full">
        <div className="text-xl font-semibold text-center mt-8">
          Thank you for confirming your email!
        </div>
      </Col>
    </LovePage>
  )
}