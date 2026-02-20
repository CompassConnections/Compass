import {Col} from 'web/components/layout/col'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {VoteComponent} from 'web/components/votes/vote-info'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'

export default function VotePage() {
  const t = useT()
  const user = useUser()

  // console.log('user:', user)

  return (
    <PageBase trackPageView={'vote page'} className={'relative p-2 sm:pt-0'}>
      <SEO
        title={t('vote.seo.title', 'Proposals')}
        description={t('vote.seo.description', 'A place to vote on decisions')}
        url={`/vote`}
      />
      {user === undefined ? (
        <CompassLoadingIndicator />
      ) : (
        <Col className={'gap-4'}>
          <VoteComponent />
        </Col>
      )}
    </PageBase>
  )
}
