import {debug} from 'common/logger'
import {LoggedOutHome} from 'web/components/home/home'
import {Col} from 'web/components/layout/col'
import {PageBase} from 'web/components/page-base'
import {ProfilesHome} from 'web/components/profiles/profiles-home'
import {useUser} from 'web/hooks/use-user'

// To simulate downtime, you need the error to happen at runtime, not at build time.
// That means the page must be server-rendered, not statically generated.
// export async function getServerSideProps() {
//   throw new Error('500 - Test downtime');
// }

export default function ProfilesPage() {
  const user = useUser()

  if (user === undefined) {
    return <PageBase trackPageView={'loading'} />
  }

  debug('user:', user)

  return (
    <PageBase trackPageView={'user profiles'} className={'col-span-10'}>
      <Col className="items-center">
        <Col className={'w-full rounded px-3 sm:px-4'}>
          {user ? <ProfilesHome /> : <LoggedOutHome />}
        </Col>
      </Col>
    </PageBase>
  )
}
