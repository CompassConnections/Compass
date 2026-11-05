import {APIRealtimeClient, RealtimeIdentity} from 'common/api/websocket-client'

class FakeSocket {
  static OPEN = 1
  static CONNECTING = 0
  static CLOSING = 2
  static CLOSED = 3
  static last: FakeSocket
  readyState = 1
  sent: any[] = []
  onopen?: (ev: unknown) => void
  onmessage?: (ev: {data: string}) => void
  onclose?: (ev: unknown) => void
  onerror?: (ev: unknown) => void
  constructor() {
    FakeSocket.last = this
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
