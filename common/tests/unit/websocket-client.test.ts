import {APIRealtimeClient, RealtimeIdentity} from 'common/api/websocket-client'

class FakeSocket {
  static OPEN = 1
  static CONNECTING = 0
  static CLOSING = 2
  static CLOSED = 3
  static last: FakeSocket
  static count = 0
  readyState = 1
  sent: any[] = []
  onopen?: (ev: unknown) => void
  onmessage?: (ev: {data: string}) => void
  onclose?: (ev: unknown) => void
  onerror?: (ev: unknown) => void
  constructor() {
    FakeSocket.last = this
    FakeSocket.count++
  }
  close() {}
  send(raw: string) {
    const msg = JSON.parse(raw)
    this.sent.push(msg)
    // Acked on a later tick, like a real server.
    setTimeout(() =>
      this.onmessage?.({data: JSON.stringify({type: 'ack', txid: msg.txid, success: true})}),
    )
  }
}

const sentOfType = (type: string) => FakeSocket.last.sent.filter((m) => m.type === type)

describe('APIRealtimeClient identity', () => {
  let identity: RealtimeIdentity | undefined

  const open = async () => {
    const client = new APIRealtimeClient('ws://test', async () => identity)
    FakeSocket.last.onopen?.({})
    await client.identityQueue
    return client
  }

  beforeEach(() => {
    ;(global as any).WebSocket = FakeSocket
    ;(global as any).window = {setInterval: () => 0}
    identity = {uid: 'alice', token: 'token-1'}
  })

  afterEach(() => {
    delete (global as any).WebSocket
    delete (global as any).window
  })

  it('identifies on connect, then subscribes again so private topics are not lost', async () => {
    const client = await open()
    await client.subscribe(['user/alice'], () => {})
    await client.refreshIdentity()

    expect(sentOfType('identify').at(-1)).toMatchObject({uid: 'alice', token: 'token-1'})
    const last = FakeSocket.last.sent.at(-1)
    expect(last).toMatchObject({type: 'subscribe', topics: ['user/alice']})
  })

  it('sends a tokenless identify on sign-out', async () => {
    const client = await open()
    identity = undefined
    await client.refreshIdentity()

    const last = sentOfType('identify').at(-1)
    expect(last.token).toBeUndefined()
  })

  it('stays quiet for a visitor who never signed in', async () => {
    identity = undefined
    await open()
    expect(sentOfType('identify')).toEqual([])
  })
})

describe('APIRealtimeClient reconnection', () => {
  const SESSION_MS = 4 * 60 * 1000
  const ONE_MINUTE = 60 * 1000
  let listeners: Record<string, () => void>
  let client: APIRealtimeClient

  const serverCloses = (code = 1000) => {
    FakeSocket.last.readyState = 3
    FakeSocket.last.onclose?.({code})
  }
  const flushMicrotasks = async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve()
  }

  beforeEach(() => {
    jest.useFakeTimers()
    listeners = {}
    const addEventListener = (event: string, handler: () => void) => {
      listeners[event] = handler
    }
    ;(global as any).WebSocket = FakeSocket
    ;(global as any).window = {setInterval: () => 0, addEventListener}
    ;(global as any).document = {visibilityState: 'visible', addEventListener}
    FakeSocket.count = 0
    client = new APIRealtimeClient('ws://test')
    FakeSocket.last.onopen?.({})
  })

  afterEach(() => {
    jest.useRealTimers()
    delete (global as any).WebSocket
    delete (global as any).window
    delete (global as any).document
  })

  it('reconnects after the session limit for a tab in use', () => {
    jest.advanceTimersByTime(ONE_MINUTE)
    listeners.pointerdown()
    jest.advanceTimersByTime(SESSION_MS - ONE_MINUTE)
    serverCloses()
    jest.advanceTimersByTime(5000)
    expect(FakeSocket.count).toBe(2)
  })

  it('lets go of a visible tab nobody has touched', () => {
    jest.advanceTimersByTime(SESSION_MS)
    serverCloses()
    jest.advanceTimersByTime(60 * ONE_MINUTE)
    expect(FakeSocket.count).toBe(1)
  })

  it('stops within two sessions of the last activity', () => {
    jest.advanceTimersByTime(SESSION_MS - 1000)
    listeners.keydown()
    jest.advanceTimersByTime(1000)
    serverCloses()
    jest.advanceTimersByTime(5000)
    expect(FakeSocket.count).toBe(2)

    FakeSocket.last.onopen?.({})
    jest.advanceTimersByTime(SESSION_MS)
    serverCloses()
    jest.advanceTimersByTime(60 * ONE_MINUTE)
    expect(FakeSocket.count).toBe(2)
  })

  it('comes back on the next activity', () => {
    jest.advanceTimersByTime(SESSION_MS)
    serverCloses()
    listeners.pointerdown()
    jest.advanceTimersByTime(5000)
    expect(FakeSocket.count).toBe(2)
  })

  it('lets go of a hidden tab, and comes back when it is shown', () => {
    ;(global as any).document.visibilityState = 'hidden'
    serverCloses()
    jest.advanceTimersByTime(60 * ONE_MINUTE)
    expect(FakeSocket.count).toBe(1)
    ;(global as any).document.visibilityState = 'visible'
    listeners.visibilitychange()
    jest.advanceTimersByTime(5000)
    expect(FakeSocket.count).toBe(2)
  })

  it('does not retry an abnormal close for a tab nobody is using', () => {
    jest.advanceTimersByTime(SESSION_MS)
    serverCloses(1006)
    jest.advanceTimersByTime(60 * ONE_MINUTE)
    expect(FakeSocket.count).toBe(1)
  })

  it('stays closed after a manual close, whatever the activity', () => {
    client.close()
    serverCloses()
    listeners.pointerdown()
    jest.advanceTimersByTime(5000)
    expect(FakeSocket.count).toBe(1)
  })

  it('calls onReconnect after a reconnect but not the first connect', async () => {
    const handler = jest.fn()
    client.onReconnect(handler)
    await flushMicrotasks()
    expect(handler).not.toBeCalled()

    serverCloses()
    jest.advanceTimersByTime(5000)
    FakeSocket.last.onopen?.({})
    await flushMicrotasks()
    expect(handler).toBeCalledTimes(1)
  })
})
