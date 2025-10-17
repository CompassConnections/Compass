import {LovePage} from 'web/components/love-page'
import {Col} from 'web/components/layout/col'
import {SEO} from 'web/components/SEO'
import {useUser} from 'web/hooks/use-user'
import {BackButton} from 'web/components/back-button'
import {CompassLoadingIndicator} from "web/components/widgets/loading-indicator";
import {VoteComponent} from "web/components/votes/vote-info";


export default function VotePage() {
  const user = useUser()

  // console.log('user:', user)

  return (
    <LovePage
      trackPageView={'vote page'}
      className={'relative p-2 sm:pt-0'}
    >
      <SEO
        title={`Votes`}
        description={'A place to vote on decisions'}
        url={`/vote`}
      />
      <BackButton className="-ml-2 mb-2 self-start"/>

      {user === undefined ? (
        <CompassLoadingIndicator/>
      ) : (
        <Col className={'gap-4'}>
          <VoteComponent/>
        </Col>
      )}
    </LovePage>
  )
}
