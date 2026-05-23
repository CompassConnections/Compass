import {debug} from 'common/logger'
import {LoggedOutHome} from 'web/components/home/home'
import {Col} from 'web/components/layout/col'
import {PageBase} from 'web/components/page-base'
import {ProfilesHome} from 'web/components/profiles/profiles-home'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'

// To simulate downtime, you need the error to happen at runtime, not at build time.
// That means the page must be server-rendered, not statically generated.
// export async function getServerSideProps() {
//   throw new Error('500 - Test downtime');
// }

export default function ProfilesPage() {
  const user = useUser()
  const t = useT()

  if (user === undefined) {
    return (
      <PageBase trackPageView={'loading'}>
        <Col className="items-center justify-center min-h-[60vh] gap-6 text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary-500 border-t-transparent" />
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold">
              {t('profiles.loading_dashboard', 'Loading dashboard…')}
            </h2>
            {/*<p className="text-ink-500 max-w-sm">*/}
            {/*  {t('profiles.loading_dashboard_desc', 'Hang tight while we set things up for you.')}*/}
            {/*</p>*/}
          </div>
        </Col>
      </PageBase>
    )
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
