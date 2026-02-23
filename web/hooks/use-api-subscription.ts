import {getWebsocketUrl} from 'common/api/utils'
import {APIRealtimeClient} from 'common/api/websocket-client'
import {ServerMessage} from 'common/api/websockets'
import {useEffect} from 'react'

const client = typeof window !== 'undefined' ? new APIRealtimeClient(getWebsocketUrl()) : undefined

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
