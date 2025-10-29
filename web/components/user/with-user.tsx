import {usePrivateUser} from "web/hooks/use-user";
import {PrivateUser} from "common/user";
import {CompassLoadingIndicator} from "web/components/widgets/loading-indicator";


export function WithPrivateUser({children}: { children: (user: PrivateUser) => JSX.Element }) {
  const privateUser = usePrivateUser()
  if (!privateUser) return <CompassLoadingIndicator/>
  return children(privateUser)
}