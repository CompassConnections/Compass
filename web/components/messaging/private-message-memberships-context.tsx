import {createContext, ReactNode, useContext} from 'react'
import {useSortedPrivateMessageMemberships} from 'web/hooks/use-private-messages'
import {useUser} from 'web/hooks/use-user'

type ChannelMembershipsValue = ReturnType<typeof useSortedPrivateMessageMemberships>

const PrivateMessageMembershipsContext = createContext<ChannelMembershipsValue>({
  channels: undefined,
  memberIdsByChannelId: undefined,
})

export const usePrivateMessageMembershipsContext = () =>
  useContext(PrivateMessageMembershipsContext)

// Fetches the current user's channel memberships once and shares them via
// context so the many SendMessageButtons on a page (one per profile card) don't
// each call get-channel-memberships.
export function PrivateMessageMembershipsProvider(props: {children: ReactNode}) {
  const {children} = props
  const currentUser = useUser()
  const channelMemberships = useSortedPrivateMessageMemberships(currentUser?.id)
  return (
    <PrivateMessageMembershipsContext.Provider value={channelMemberships}>
      {children}
    </PrivateMessageMembershipsContext.Provider>
  )
}
