import {PageBase} from 'web/components/page-base'
import {Col} from 'web/components/layout/col'
import {SEO} from 'web/components/SEO'
import {useUser} from 'web/hooks/use-user'
import {CompassLoadingIndicator} from "web/components/widgets/loading-indicator";
import {VoteComponent} from "web/components/votes/vote-info";


export default function VotePage() {
  const user = useUser()

  // console.log('user:', user)

  return (
    <PageBase
      trackPageView={'vote page'}
      className={'relative p-2 sm:pt-0'}
    >
      <SEO
        title={`Votes`}
        description={'A place to vote on decisions'}
        url={`/vote`}
      />
      {user === undefined ? (
        <CompassLoadingIndicator/>
      ) : (
        <Col className={'gap-4'}>
          <VoteComponent/>
        </Col>
      )}
    </PageBase>
  )
}
