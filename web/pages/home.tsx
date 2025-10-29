import {PageBase} from 'web/components/page-base'
import {Col} from 'web/components/layout/col'
import {LoggedOutHome} from "web/components/home/home";


export default function ProfilesPage() {
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
