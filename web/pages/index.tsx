import {debug} from 'common/logger'
import {useEffect, useState} from 'react'
import {LoggedOutHome} from 'web/components/home/home'
import {Col} from 'web/components/layout/col'
import {PageBase} from 'web/components/page-base'
import {ProfilesHome} from 'web/components/profiles/profiles-home'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
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
  const [slowLoad, setSlowLoad] = useState(false)

  useEffect(() => {
    if (user !== undefined) return
    const timer = setTimeout(() => setSlowLoad(true), 5000)
    return () => clearTimeout(timer)
  }, [user])

  if (user === undefined) {
    return (
      <PageBase trackPageView={'loading'}>
        <Col className="items-center gap-8 px-4 py-8">
          <Col className="items-center gap-3 text-center pt-8">
            <CompassLoadingIndicator />
            <h2 className="text-2xl font-semibold">
              {t('profiles.loading_dashboard', 'Loading dashboard…')}
            </h2>
            <p className="text-ink-500 max-w-sm text-sm">
              {slowLoad
                ? t('profiles.loading_slow', 'Still starting up — almost there…')
                : t('profiles.loading_dashboard_desc', 'The server is waking up, hang tight.')}
            </p>
          </Col>
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
