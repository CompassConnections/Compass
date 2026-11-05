import {createServer, Server} from 'node:http'
import {AddressInfo} from 'node:net'

import {broadcast, listen} from 'shared/websockets/server'
import {canSubscribe, holdsForeignTopic} from 'shared/websockets/topics'
import {WebSocket} from 'ws'

jest.mock('firebase-admin', () => ({
  auth: () => ({
    verifyIdToken: async (token: string) => {
      if (!token.startsWith('valid-')) throw new Error('bad token')
      return {uid: token.replace('valid-', '')}
    },
  }),
}))

describe('canSubscribe', () => {
  it.each([
    'user/alice',
    'private-user/alice',
    'user-notifications/alice',
    'private-user-messages/alice',
    'private-user-messages/alice/typing',
  ])('limits %s to its owner', (topic) => {
    expect(canSubscribe(topic, 'alice')).toBe(true)
    expect(canSubscribe(topic, 'mallory')).toBe(false)
    expect(canSubscribe(topic, undefined)).toBe(false)
  })

  it.each(['user/alice/comment', 'vote/12/comment'])('leaves %s public', (topic) => {
    expect(canSubscribe(topic, undefined)).toBe(true)
  })

  it('refuses a topic it does not know', () => {
    expect(canSubscribe('some-new-topic/alice', 'alice')).toBe(false)
  })
})

describe('holdsForeignTopic', () => {
  it('ignores own, public and signed-out placeholder topics', () => {
    const topics = ['user/alice', 'vote/1/comment', 'user/_', 'user-notifications/undefined']
    expect(holdsForeignTopic(topics, 'alice')).toBe(false)
  })

  it('flags another member’s private topic', () => {
    expect(holdsForeignTopic(['user-notifications/alice'], undefined)).toBe(true)
    expect(holdsForeignTopic(['user-notifications/alice'], 'mallory')).toBe(true)
  })
})

describe('websocket server', () => {
  let server: Server
  let wss: ReturnType<typeof listen>
  let sockets: WebSocket[]
  let txid = 0

  const connect = async () => {
    const port = (server.address() as AddressInfo).port
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`)
    sockets.push(ws)
    const received: any[] = []
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString())
      if (msg.type === 'broadcast') received.push(msg)
    })
    await new Promise((resolve) => ws.once('open', resolve))
    const send = (msg: object) =>
      new Promise<any>((resolve) => {
        const id = txid++
        const onMessage = (raw: Buffer) => {
          const reply = JSON.parse(raw.toString())
          if (reply.type === 'ack' && reply.txid === id) {
            ws.off('message', onMessage)
            resolve(reply)
          }
        }
        ws.on('message', onMessage)
        ws.send(JSON.stringify({...msg, txid: id}))
      })
    return {send, received}
  }

  // Sent last: its arrival shows every earlier broadcast on the same socket has been delivered.
  const flush = async (client: Awaited<ReturnType<typeof connect>>) => {
    await client.send({type: 'subscribe', topics: ['vote/flush/comment']})
    broadcast('vote/flush/comment', {})
    await new Promise<void>((resolve) => {
      const check = () =>
        client.received.some((m) => m.topic === 'vote/flush/comment')
          ? resolve()
          : setTimeout(check, 5)
      check()
    })
    return client.received.filter((m) => m.topic !== 'vote/flush/comment')
  }

  const secret = 'user-notifications/alice'

  beforeEach(async () => {
    sockets = []
    server = createServer()
    wss = listen(server, '/ws')
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  })

  afterEach(async () => {
    delete process.env.WS_ENFORCE_TOPIC_AUTH
    sockets.forEach((ws) => ws.terminate())
    wss.close()
    await new Promise((resolve) => server.close(resolve))
  })

  describe('with enforcement on', () => {
    beforeEach(() => {
      process.env.WS_ENFORCE_TOPIC_AUTH = 'true'
    })

    it('keeps an anonymous connection off a private topic, and still acks', async () => {
      const client = await connect()
      const ack = await client.send({type: 'subscribe', topics: [secret]})
      expect(ack.success).toBe(true)
      broadcast(secret, {notification: 'private'})
      expect(await flush(client)).toEqual([])
    })

    it('ignores the claimed uid and goes by the token', async () => {
      const client = await connect()
      await client.send({type: 'identify', uid: 'alice', token: 'valid-mallory'})
      await client.send({type: 'subscribe', topics: [secret]})
      broadcast(secret, {notification: 'private'})
      expect(await flush(client)).toEqual([])
    })

    it('refuses an identify with a bad token', async () => {
      const client = await connect()
      const ack = await client.send({type: 'identify', uid: 'alice', token: 'forged'})
      expect(ack.success).toBe(false)
      await client.send({type: 'subscribe', topics: [secret]})
      broadcast(secret, {notification: 'private'})
      expect(await flush(client)).toEqual([])
    })

    it('delivers to the owner', async () => {
      const client = await connect()
      await client.send({type: 'identify', uid: 'alice', token: 'valid-alice'})
      await client.send({type: 'subscribe', topics: [secret]})
      broadcast(secret, {notification: 'private'})
      expect(await flush(client)).toHaveLength(1)
    })

    it('drops private topics on sign-out', async () => {
      const client = await connect()
      await client.send({type: 'identify', uid: 'alice', token: 'valid-alice'})
      await client.send({type: 'subscribe', topics: [secret]})
      await client.send({type: 'identify', uid: ''})
      broadcast(secret, {notification: 'private'})
      expect(await flush(client)).toEqual([])
    })

    it('drops the old member’s topics when the connection changes hands', async () => {
      const client = await connect()
      await client.send({type: 'identify', uid: 'alice', token: 'valid-alice'})
      await client.send({type: 'subscribe', topics: [secret]})
      await client.send({type: 'identify', uid: 'bob', token: 'valid-bob'})
      broadcast(secret, {notification: 'private'})
      expect(await flush(client)).toEqual([])
    })
  })

  it('keeps today’s behaviour for old clients until enforcement is on', async () => {
    const client = await connect()
    await client.send({type: 'subscribe', topics: [secret]})
    broadcast(secret, {notification: 'private'})
    expect(await flush(client)).toHaveLength(1)
  })
})
