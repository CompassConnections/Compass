import {Server as HttpServer} from 'node:http'

import {getWebsocketUrl} from 'common/api/utils'
import {
  BroadcastPayload,
  CLIENT_MESSAGE_SCHEMA,
  ClientMessage,
  ServerMessage,
} from 'common/api/websockets'
import {IS_LOCAL} from 'common/hosting/constants'
import {debug} from 'common/logger'
import {isError} from 'lodash'
import {log, metrics} from 'shared/utils'
import {RawData, Server as WebSocketServer, WebSocket} from 'ws'

import {Switchboard} from './switchboard'

// Extend the type definition locally
interface HeartbeatWebSocket extends WebSocket {
  isAlive?: boolean
}

const SWITCHBOARD = new Switchboard()

// if a connection doesn't ping for this long, we assume the other side is toast
// const CONNECTION_TIMEOUT_MS = 60 * 1000

export class MessageParseError extends Error {
  details?: unknown
  constructor(message: string, details?: unknown) {
    super(message)
    this.name = 'MessageParseError'
    this.details = details
  }
}

function serializeError(err: unknown) {
  return isError(err) ? err.message : 'Unexpected error.'
}

function parseMessage(data: RawData): ClientMessage {
  let messageObj: any
  try {
    messageObj = JSON.parse(data.toString())
  } catch (err) {
    log.error(err)
    throw new MessageParseError('Message was not valid UTF-8 encoded JSON.')
  }
  const result = CLIENT_MESSAGE_SCHEMA.safeParse(messageObj)
  if (!result.success) {
    const issues = result.error.issues.map((i) => {
      return {
        field: i.path.join('.') || null,
        error: i.message,
      }
    })
    throw new MessageParseError('Error parsing message.', issues)
  } else {
    return result.data
  }
}

function processMessage(ws: HeartbeatWebSocket, data: RawData): ServerMessage<'ack'> {
  try {
    const msg = parseMessage(data)
    const {type, txid} = msg
    try {
      switch (type) {
        case 'identify': {
          SWITCHBOARD.identify(ws, msg.uid)
          break
        }
        case 'subscribe': {
          SWITCHBOARD.subscribe(ws, ...msg.topics)
          break
        }
        case 'unsubscribe': {
          SWITCHBOARD.unsubscribe(ws, ...msg.topics)
          break
        }
        case 'ping': {
          SWITCHBOARD.markSeen(ws)
          break
        }
        default:
          throw new Error("Unknown message type; shouldn't be possible here.")
      }
    } catch (err) {
      log.error(err)
      return {type: 'ack', txid, success: false, error: serializeError(err)}
    }
    return {type: 'ack', txid, success: true}
  } catch (err) {
    log.error(err)
    return {type: 'ack', success: false, error: serializeError(err)}
  }
}

export function broadcastMulti(topics: string[], data: BroadcastPayload) {
  // ian: Don't await this: we don't need to hear back from all the clients and can take a dozen ms
  const sendToSubscribers = (topic: string, msg: any) => {
    const json = JSON.stringify(msg)
    const subscribers = SWITCHBOARD.getSubscribers(topic)
    return Promise.allSettled(
      subscribers.map(
        ([ws, _]) =>
          new Promise<void>((resolve) =>
            ws.send(json, (err) => {
              if (err) log.error('Broadcast error', {error: err})
              resolve()
            }),
          ),
      ),
    ).catch((err) => log.error('Broadcast failed', {error: err}))
  }

  // it isn't secure to do this in prod for auth reasons (maybe?)
  // but it's super convenient for testing
  if (IS_LOCAL) {
    const msg = {type: 'broadcast', topic: '*', topics, data}
    sendToSubscribers('*', msg)
  }

  for (const topic of topics) {
    const msg = {type: 'broadcast', topic, data}
    sendToSubscribers(topic, msg)
    metrics.inc('ws/broadcasts_sent', {topic})
  }
}

export function broadcast(topic: string, data: BroadcastPayload) {
  return broadcastMulti([topic], data)
}

export function listen(server: HttpServer, path: string) {
  const wss = new WebSocketServer({server, path})
  let deadConnectionCleaner: NodeJS.Timeout | undefined

  const HEARTBEAT_INTERVAL = 25000 // 25s
  const MAX_SESSION_DURATION = 4 * 60 * 1000 // 4 minutes

  wss.on('listening', () => {
    log.info(`Web socket server listening on ${path}. ${getWebsocketUrl()}`)

    // 1. Keep-alive check: Terminate zombies who don't respond to pings
    deadConnectionCleaner = setInterval(() => {
      for (const ws of wss.clients as Set<HeartbeatWebSocket>) {
        if (ws.isAlive === false) {
          debug('Terminating dead connection (heartbeat fail)')
          ws.terminate()
          continue
        }
        ws.isAlive = false
        // debug('Sending ping to client');
        ws.ping()
      }
    }, HEARTBEAT_INTERVAL)
  })

  wss.on('connection', (ws: HeartbeatWebSocket) => {
    ws.isAlive = true
    // debug('Received pong from client');

    // 2. Hard Session Limit: Sever connection after 5 mins to allow Scale-to-Zero
    // This stops bots/idle users from resetting the Cloud Run 15-min idle timer indefinitely.
    const sessionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        debug('Closing WS: Max session duration reached (5m)')
        ws.close(1000, 'Session limit reached') // 1000 is a normal closure
      }
    }, MAX_SESSION_DURATION)

    ws.on('pong', () => (ws.isAlive = true))

    metrics.inc('ws/connections_established')
    metrics.set('ws/open_connections', wss.clients.size)
    debug('WS client connected.')
    SWITCHBOARD.connect(ws)

    ws.on('message', (data) => {
      const result = processMessage(ws, data)
      // mqp: check ws.readyState before sending?
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(result))
      }
    })

    ws.on('close', (code, reason) => {
      clearTimeout(sessionTimeout) // 3. Clean up the timer!
      metrics.inc('ws/connections_terminated')
      metrics.set('ws/open_connections', wss.clients.size)
      debug(`WS client disconnected.`, {code, reason: reason.toString()})
      SWITCHBOARD.disconnect(ws)
    })

    ws.on('error', (err) => {
      clearTimeout(sessionTimeout)
      log.error('Error on websocket connection.', {error: err})
    })
  })

  wss.on('close', function close() {
    clearInterval(deadConnectionCleaner)
  })

  return wss
}
