import clsx from 'clsx'
import {PrivateMessageChannel} from 'common/supabase/private-messages'
import {PrivateUser} from 'common/user'
import {getNotificationDestinationsForUser} from 'common/user-notification-preferences'
import {usePathname} from 'next/navigation'
import {createContext, ReactNode, useContext} from 'react'
import {BiEnvelope, BiSolidEnvelope} from 'react-icons/bi'
import {Row} from 'web/components/layout/row'
import {useUnseenPrivateMessageChannels} from 'web/hooks/use-private-messages'
import {usePrivateUser} from 'web/hooks/use-user'

// Shared unseen-channels state so the desktop sidebar icon and the mobile
// bottom-nav icon (both mounted at once) consume a single fetch instead of each
// running their own `useUnseenPrivateMessageChannels`.
const UnseenMessageChannelsContext = createContext<PrivateMessageChannel[]>([])

export function UnseenMessageChannelsProvider(props: {children: ReactNode}) {
  const {children} = props
  const privateUser = usePrivateUser()
  // The hook is always called (no conditional hooks); `enabled` gates the fetch
  // so signed-out users don't hit the authed endpoint.
  const {unseenChannels} = useUnseenPrivateMessageChannels(false, !!privateUser)
  return (
    <UnseenMessageChannelsContext.Provider value={unseenChannels}>
      {children}
    </UnseenMessageChannelsContext.Provider>
  )
}

export function UnseenMessagesBubble(props: {className?: string}) {
  const {className} = props
  const privateUser = usePrivateUser()

  if (!privateUser) {
    return null
  }
  return <InternalUnseenMessagesBubble className={className} privateUser={privateUser} />
}

export function PrivateMessagesIcon(props: {
  className?: string
  bubbleClassName?: string
  solid?: boolean
}) {
  const {solid, className, bubbleClassName} = props
  const privateUser = usePrivateUser()
  const Icon = solid ? BiSolidEnvelope : BiEnvelope
  return (
    // Sized to the icon itself so the count badge can anchor to its top-right corner instead of
    // being centered on top of the envelope.
    <Row className="relative flex-shrink-0">
      <Icon className={className} />
      {privateUser && (
        <InternalUnseenMessagesBubble
          className={clsx('absolute -right-1.5 -top-1.5', bubbleClassName)}
          privateUser={privateUser}
        />
      )}
    </Row>
  )
}

function InternalUnseenMessagesBubble(props: {privateUser: PrivateUser; className?: string}) {
  const {privateUser, className} = props

  const unseenChannels = useContext(UnseenMessageChannelsContext)
  const pathName = usePathname()

  const {sendToBrowser} = getNotificationDestinationsForUser(privateUser, 'new_message')

  if (unseenChannels.length === 0 || !sendToBrowser || pathName === '/messages') return null

  return (
    <div
      className={clsx(
        'text-ink-0 bg-primary-500 pointer-events-none flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none',
        className,
      )}
    >
      {unseenChannels.length > 9 ? '9+' : unseenChannels.length}
    </div>
  )
}
