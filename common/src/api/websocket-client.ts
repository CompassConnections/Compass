import {ClientMessage, ClientMessageType, ServerMessage, WS_MAX_SESSION_MS} from './websockets'

// mqp: useful for debugging
const VERBOSE_LOGGING = false

// mqp: no way should our server ever take 5 seconds to reply
const TIMEOUT_MS = 5000

const RECONNECT_WAIT_MS = 5000

// Spreads out the tabs that all lost their connection at once, after a deploy for instance.
const RECONNECT_JITTER_MS = 3000

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'focus']

const isTabVisible = () => typeof document === 'undefined' || document.visibilityState === 'visible'

const jitter = () => Math.random() * RECONNECT_JITTER_MS

type ConnectingState = typeof WebSocket.CONNECTING
type OpenState = typeof WebSocket.OPEN
type ClosingState = typeof WebSocket.CLOSING
type ClosedState = typeof WebSocket.CLOSED

export type ReadyState = OpenState | ConnectingState | ClosedState | ClosingState

export function formatState(state: ReadyState) {
  switch (state) {
    case WebSocket.CONNECTING:
      return 'connecting'
    case WebSocket.OPEN:
      return 'open'
    case WebSocket.CLOSING:
      return 'closing'
    case WebSocket.CLOSED:
      return 'closed'
    default:
      throw new Error('Invalid websocket state.')
  }
}

export type RealtimeIdentity = {uid: string; token: string}

export type BroadcastHandler = (msg: ServerMessage<'broadcast'>) => void

type OutstandingTxn = {
  resolve: () => void
  reject: (err: Error) => void
  timeout?: NodeJS.Timeout
}

/** Client for the API websocket realtime server. Automatically manages reconnection
 * and resubscription on disconnect, and allows subscribers to get a callback
 * when something is broadcasted.
 *
 * It only reconnects for a tab someone is using: visible, with activity during the last session.
 * An open socket keeps a Cloud Run instance awake, so a forgotten tab has to let go of it, and comes
 * back on the next sign of life. Broadcasts sent in between are lost, which is what `onReconnect` is
 * for. */
export class APIRealtimeClient {
  ws!: WebSocket
  url: string
  txid: number
  // all txns that are in flight, with no ack/error/timeout
  txns: Map<number, OutstandingTxn>
  // subscribers by the topic they are subscribed to
  subscriptions: Map<string, BroadcastHandler[]>
  connectTimeout?: NodeJS.Timeout
  heartbeat?: number | undefined
  getIdentity?: () => Promise<RealtimeIdentity | undefined>
  identified: boolean
  // identify calls run one at a time, so a slow sign-in cannot land after the sign-out that followed
  identityQueue: Promise<void>
  lastActivity: number
  closedManually: boolean
  hasOpened: boolean
  reconnectHandlers: Set<() => void>

  constructor(url: string, getIdentity?: () => Promise<RealtimeIdentity | undefined>) {
    this.url = url
    this.txid = 0
    this.txns = new Map()
    this.subscriptions = new Map()
    this.getIdentity = getIdentity
    this.identified = false
    this.identityQueue = Promise.resolve()
    this.lastActivity = Date.now()
    this.closedManually = false
    this.hasOpened = false
    this.reconnectHandlers = new Set()
    this.connect()
    this.listenForActivity()
  }

  listenForActivity() {
    if (typeof window === 'undefined' || !window.addEventListener) return
    const onActivity = () => this.noteActivity()
    // Capture, because a scroll inside an element does not bubble up to the window.
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, {capture: true, passive: true})
    }
    document.addEventListener('visibilitychange', () => {
      if (isTabVisible()) this.noteActivity()
    })
  }

  noteActivity() {
    this.lastActivity = Date.now()
    if (this.state === WebSocket.CLOSED && !this.closedManually) {
      this.waitAndReconnect(jitter())
    }
  }

  get inUse() {
    return isTabVisible() && Date.now() - this.lastActivity < WS_MAX_SESSION_MS
  }

  /** Runs after a reconnect, not the first connect, to fetch what was broadcast in between. */
  onReconnect(handler: () => void) {
    this.reconnectHandlers.add(handler)
    return () => {
      this.reconnectHandlers.delete(handler)
    }
  }

  get state() {
    return this.ws.readyState as ReadyState
  }

  close() {
    this.closedManually = true
    this.ws.close(1000, 'Closed manually.')
    clearTimeout(this.connectTimeout)
  }

  connect() {
    // you may wish to refer to https://websockets.spec.whatwg.org/
    // in order to check the semantics of events etc.
    this.ws = new WebSocket(this.url)
    this.ws.onmessage = (ev) => {
      this.receiveMessage(JSON.parse(ev.data))
    }
    this.ws.onerror = (ev) => {
      console.error('API websocket error: ', ev)
      // this can fire without an onclose if this is the first time we ever try
      // to connect, so we need to turn on our reconnect in that case
      if (this.inUse) this.waitAndReconnect()
    }
    this.ws.onopen = (_ev) => {
      if (VERBOSE_LOGGING) {
        console.info('API websocket opened.')
      }
      // Send a heartbeat ping every 25s
      this.heartbeat = window.setInterval(() => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.sendMessage('ping', {}).catch(console.error)
        }
      }, 25000)
      this.identified = false
      this.resubscribe().catch(console.error)
      const isReconnect = this.hasOpened
      this.hasOpened = true
      // After the identity, so the private topics are live again before anyone refetches.
      void this.refreshIdentity().then(() => {
        if (isReconnect) this.reconnectHandlers.forEach((handler) => handler())
      })
    }
    this.ws.onclose = (ev) => {
      // note that if the connection closes due to an error, onerror fires and then this
      if (VERBOSE_LOGGING) {
        console.info(`API websocket closed with code=${ev.code}: ${ev.reason}`)
      }
      if (this.heartbeat) clearInterval(this.heartbeat)

      // mqp: we might need to change how the txn stuff works if we ever want to
      // implement "wait until i am subscribed, and then do something" in a component.
      // right now it cannot be reliably used to detect that in the presence of reconnects
      for (const txn of Array.from(this.txns.values())) {
        clearTimeout(txn.timeout)
        txn.reject(new Error('Websocket was closed.'))
      }
      this.txns.clear()

      // 1000 is also what the server sends at the session limit, so it does not mean we are done.
      if (!this.closedManually && this.inUse) {
        this.waitAndReconnect(ev.code === 1000 ? jitter() : RECONNECT_WAIT_MS)
      }
    }
  }

  waitAndReconnect(delayMs = RECONNECT_WAIT_MS) {
    if (this.connectTimeout == null) {
      this.connectTimeout = setTimeout(() => {
        this.connectTimeout = undefined
        this.connect()
      }, delayMs)
    }
  }

  receiveMessage(msg: ServerMessage) {
    if (VERBOSE_LOGGING) {
      console.info('< Incoming API websocket message: ', msg)
    }
    switch (msg.type) {
      case 'broadcast': {
        const handlers = this.subscriptions.get(msg.topic)
        if (handlers == null) {
          // it's not exceptional for a message to come in with no handlers --
          // maybe the server didn't get our unsubscribe yet
          return
        }
        for (const handler of handlers) {
          handler(msg)
        }
        return
      }
      case 'ack': {
        if (msg.txid != null) {
          const txn = this.txns.get(msg.txid)
          if (txn == null) {
            // mqp: only reason this should happen is getting an ack after timeout
            console.warn(`Websocket message with old txid=${msg.txid}.`)
          } else {
            clearTimeout(txn.timeout)
            if (msg.error != null) {
              txn.reject(new Error(msg.error))
            } else {
              txn.resolve()
            }
            this.txns.delete(msg.txid)
          }
        }
        return
      }
      default:
        console.warn(`Unknown API websocket message type received: ${msg}`)
    }
  }

  async sendMessage<T extends ClientMessageType>(
    type: T,
    data: Omit<ClientMessage<T>, 'type' | 'txid'>,
  ) {
    if (VERBOSE_LOGGING) {
      console.info(`> Outgoing API websocket ${type} message: `, data)
    }
    if (this.state === WebSocket.OPEN) {
      return new Promise<void>((resolve, reject) => {
        const txid = this.txid++
        const timeout = setTimeout(() => {
          this.txns.delete(txid)
          reject(new Error(`Websocket message with txid ${txid} timed out.`))
        }, TIMEOUT_MS)
        this.txns.set(txid, {resolve, reject, timeout})
        this.ws.send(JSON.stringify({type, txid, ...data}))
      })
    } else {
      // expected if components in the code try to subscribe or unsubscribe
      // while the socket is closed -- in this case we expect to get the state
      // fixed up in the websocket onopen handler when we reconnect
    }
  }

  async resubscribe() {
    if (this.subscriptions.size > 0) {
      await this.sendMessage('subscribe', {topics: Array.from(this.subscriptions.keys())})
    }
  }

  /** Tell the server who is signed in. Call on connect and whenever that changes. */
  refreshIdentity() {
    this.identityQueue = this.identityQueue.then(() => this.sendIdentity()).catch(console.error)
    return this.identityQueue
  }

  private async sendIdentity() {
    if (!this.getIdentity) return
    const identity = await this.getIdentity()
    if (!identity && !this.identified) return
    await this.sendMessage('identify', identity ?? {uid: ''})
    this.identified = !!identity
    // The server drops private topics it could not yet match to this connection, which includes
    // anything subscribed while the token was still being verified, so send them again.
    if (identity) await this.resubscribe()
  }

  async subscribe(topics: string[], handler: BroadcastHandler) {
    for (const topic of topics) {
      let existingHandlers = this.subscriptions.get(topic)
      if (existingHandlers == null) {
        this.subscriptions.set(topic, (existingHandlers = [handler]))
        return await this.sendMessage('subscribe', {topics: [topic]})
      } else {
        existingHandlers.push(handler)
      }
    }
  }

  async unsubscribe(topics: string[], handler: BroadcastHandler) {
    for (const topic of topics) {
      const existingHandlers = this.subscriptions.get(topic)
      if (existingHandlers == null) {
        console.error(`Subscription mapping busted -- ${topic} handlers null.`)
      } else {
        const remainingHandlers = existingHandlers.filter((h) => h != handler)
        if (remainingHandlers.length > 0) {
          this.subscriptions.set(topic, remainingHandlers)
        } else {
          this.subscriptions.delete(topic)
          return await this.sendMessage('unsubscribe', {topics: [topic]})
        }
      }
    }
  }
}
