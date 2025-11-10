import {PageBase} from 'web/components/page-base'
import {Col} from 'web/components/layout/col'
import {useUser} from 'web/hooks/use-user'
import {LoggedOutHome} from "web/components/home/home";
import {ProfilesHome} from "web/components/profiles/profiles-home";

export const TEST_DOWNTIME = true

// To simulate downtime, you need the error to happen at runtime, not at build time.
// That means the page must be server-rendered, not statically generated.
export async function getServerSideProps() {
  if (TEST_DOWNTIME) {
    // This will cause Next.js to return a 500 *at runtime*
    throw new Error('500 - Test downtime');
  }

  return { props: {} };
}

export default function ProfilesPage() {
  const user = useUser();
  console.debug('user:', user)

  if (user === undefined) {
    return <PageBase trackPageView={'loading'}/>
  }

  return (
    <PageBase trackPageView={'user profiles'}>
      <Col className="items-center">
        <Col className={'w-full rounded px-3 py-4 sm:px-6'}>
          {/*<ProfilesHome/>*/}
          {user ? <ProfilesHome/> : <LoggedOutHome/>}
        </Col>
      </Col>
    </PageBase>
  )
}
