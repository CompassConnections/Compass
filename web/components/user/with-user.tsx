import {PrivateUser} from 'common/user'
import {ReactElement} from 'react'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {usePrivateUser} from 'web/hooks/use-user'

export function WithPrivateUser({children}: {children: (user: PrivateUser) => ReactElement}) {
  const privateUser = usePrivateUser()
  if (!privateUser) return <CompassLoadingIndicator />
  return children(privateUser)
}
