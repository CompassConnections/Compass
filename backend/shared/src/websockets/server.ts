import { Server as HttpServer } from 'node:http'
import { Server as WebSocketServer, RawData, WebSocket } from 'ws'
import { isError } from 'lodash'
import { log, metrics } from 'shared/utils'
import { Switchboard } from './switchboard'
import {
  BroadcastPayload,
  ClientMessage,
  ServerMessage,
  CLIENT_MESSAGE_SCHEMA,
} from 'common/api/websockets'
import {IS_LOCAL} from "common/hosting/constants";
import {getWebsocketUrl} from "common/api/utils";

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
    const { type, txid } = msg
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
      return { type: 'ack', txid, success: false, error: serializeError(err) }
    }
    return { type: 'ack', txid, success: true }
  } catch (err) {
    log.error(err)
    return { type: 'ack', success: false, error: serializeError(err) }
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
              if (err) log.error('Broadcast error', { error: err })
              resolve()
            })
          )
      )
    ).catch((err) => log.error('Broadcast failed', { error: err }))
  }

  // it isn't secure to do this in prod for auth reasons (maybe?)
  // but it's super convenient for testing
  if (IS_LOCAL) {
    const msg = { type: 'broadcast', topic: '*', topics, data }
    sendToSubscribers('*', msg)
  }

  for (const topic of topics) {
    const msg = { type: 'broadcast', topic, data }
    sendToSubscribers(topic, msg)
    metrics.inc('ws/broadcasts_sent', { topic })
  }
}

export function broadcast(topic: string, data: BroadcastPayload) {
  return broadcastMulti([topic], data)
}

export function listen(server: HttpServer, path: string) {
  const wss = new WebSocketServer({ server, path })
  let deadConnectionCleaner: NodeJS.Timeout | undefined
  wss.on('listening', () => {
    log.info(`Web socket server listening on ${path}. ${getWebsocketUrl()}`)
    deadConnectionCleaner = setInterval(() => {
      for (const ws of wss.clients as Set<HeartbeatWebSocket>) {
        if (ws.isAlive === false) {
          log.debug('Terminating dead connection');
          ws.terminate();
          continue;
        }
        ws.isAlive = false;
        // log.debug('Sending ping to client');
        ws.ping();
      }
    }, 25000);
  })
  wss.on('error', (err) => {
    log.error('Error on websocket server.', { error: err })
  })
  wss.on('connection', (ws: HeartbeatWebSocket) => {
    ws.isAlive = true;
    // log.debug('Received pong from client');
    ws.on('pong', () => (ws.isAlive = true));
    metrics.inc('ws/connections_established')
    metrics.set('ws/open_connections', wss.clients.size)
    log.debug('WS client connected.')
    SWITCHBOARD.connect(ws)
    ws.on('message', (data) => {
      const result = processMessage(ws, data)
      // mqp: check ws.readyState before sending?
      ws.send(JSON.stringify(result))
    })
    ws.on('close', (code, reason) => {
      metrics.inc('ws/connections_terminated')
      metrics.set('ws/open_connections', wss.clients.size)
      log.debug(`WS client disconnected.`, { code, reason: reason.toString() })
      SWITCHBOARD.disconnect(ws)
    })
    ws.on('error', (err) => {
      log.error('Error on websocket connection.', { error: err })
    })
  })
  wss.on('close', function close() {
    clearInterval(deadConnectionCleaner)
  })
  return wss
}
