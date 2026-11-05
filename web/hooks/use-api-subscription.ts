import {getWebsocketUrl} from 'common/api/utils'
import {APIRealtimeClient} from 'common/api/websocket-client'
import {ServerMessage} from 'common/api/websockets'
import {onAuthStateChanged} from 'firebase/auth'
import {useEffect} from 'react'
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
}

export function useApiSubscription(opts: SubscriptionOptions) {
  useEffect(() => {
    const ws = client
    if (ws != null) {
      if (opts.enabled ?? true) {
        ws.subscribe(opts.topics, opts.onBroadcast).catch(opts.onError)
        return () => {
          ws.unsubscribe(opts.topics, opts.onBroadcast).catch(opts.onError)
        }
      }
    }
  }, [opts.enabled, JSON.stringify(opts.topics)])
}
