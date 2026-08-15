import {LoggedOutHome} from 'web/components/home/home'
import {Col} from 'web/components/layout/col'
import {PageBase} from 'web/components/page-base'

export default function Home() {
  return (
    <PageBase trackPageView={'home'} className={'col-span-10'}>
      <Col className="items-center">
        <Col className={'w-full rounded px-3 py-4 sm:px-6'}>
          <LoggedOutHome />
        </Col>
      </Col>
    </PageBase>
  )
}
