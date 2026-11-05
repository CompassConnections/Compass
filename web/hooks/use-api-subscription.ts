import {getWebsocketUrl} from 'common/api/utils'
import {APIRealtimeClient} from 'common/api/websocket-client'
import {ServerMessage} from 'common/api/websockets'
import {onAuthStateChanged} from 'firebase/auth'
import {useEffect} from 'react'
import {useEvent} from 'web/hooks/use-event'
import {auth} from 'web/lib/firebase/users'

const getIdentity = async () => {
  await auth.authStateReady()
  const user = auth.currentUser
  return user ? {uid: user.uid, token: await user.getIdToken()} : undefined
}

const client =
  typeof window !== 'undefined' ? new APIRealtimeClient(getWebsocketUrl(), getIdentity) : undefined

if (client) onAuthStateChanged(auth, () => void client.refreshIdentity())

export type SubscriptionOptions = {
  topics: string[]
  onBroadcast: (msg: ServerMessage<'broadcast'>) => void
  onError?: (err: Error) => void
  enabled?: boolean
  /** Refetch here: nothing is replayed, so whatever was broadcast while disconnected is gone. */
  onReconnect?: () => void
}

export function useApiSubscription(opts: SubscriptionOptions) {
  const onReconnect = useEvent(opts.onReconnect)

  useEffect(() => {
    const ws = client
    if (ws != null) {
      if (opts.enabled ?? true) {
        ws.subscribe(opts.topics, opts.onBroadcast).catch(opts.onError)
        const stopListening = ws.onReconnect(onReconnect)
        return () => {
          stopListening()
          ws.unsubscribe(opts.topics, opts.onBroadcast).catch(opts.onError)
        }
      }
    }
  }, [opts.enabled, JSON.stringify(opts.topics)])
}
