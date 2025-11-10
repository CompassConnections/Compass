import {PageBase} from 'web/components/page-base'
import {Col} from 'web/components/layout/col'
import {LoggedOutHome} from "web/components/home/home";

export const TEST_DOWNTIME = true

export default function Home() {
  if (TEST_DOWNTIME) {
    throw new Error('500 - This is a test error')
  }
  return (
    <PageBase trackPageView={'home'}>
      <Col className="items-center">
        <Col className={'w-full rounded px-3 py-4 sm:px-6'}>
          <LoggedOutHome/>
        </Col>
      </Col>
    </PageBase>
  )
}
