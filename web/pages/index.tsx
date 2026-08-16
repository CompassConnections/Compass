import {debug} from 'common/logger'
import {User} from 'common/user'
import {LoggedOutHome} from 'web/components/home/home'
import {HomeLoadingAnimation} from 'web/components/home/home-loading-animation'
import {Col} from 'web/components/layout/col'
import {OrganizationJsonLd} from 'web/components/organization-json-ld'
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

  return (
    <>
      {/* Outside the auth branch on purpose. `useUser()` is `undefined` until Firebase resolves, which
          on the server is always — so anything rendered only in the resolved branch is absent from the
          served HTML, and this is the one thing on the page that exists for a crawler. It describes
          Compass rather than the visitor, so it is the same markup either way. */}
      <OrganizationJsonLd />
      {user === undefined ? <LoadingHome /> : <ResolvedHome user={user} />}
    </>
  )
}

function LoadingHome() {
  return (
    <PageBase trackPageView={'loading'} className={'col-span-10 lg:!mt-0 xl:!px-0'}>
      <HomeLoadingAnimation />
    </PageBase>
  )
}

function ResolvedHome({user}: {user: User | null}) {
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
