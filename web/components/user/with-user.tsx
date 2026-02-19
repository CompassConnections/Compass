import {PrivateUser} from 'common/user'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {usePrivateUser} from 'web/hooks/use-user'

export function WithPrivateUser({children}: {children: (user: PrivateUser) => JSX.Element}) {
  const privateUser = usePrivateUser()
  if (!privateUser) return <CompassLoadingIndicator />
  return children(privateUser)
}
