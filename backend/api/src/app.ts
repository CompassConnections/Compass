import {API, type APIPath} from 'common/api/schema'
import {APIError, pathWithPrefix} from 'common/api/utils'
import cors from 'cors'
import * as crypto from 'crypto'
import express, {type ErrorRequestHandler, type RequestHandler} from 'express'
import {hrtime} from 'node:process'
import {withMonitoringContext} from 'shared/monitoring/context'
import {log} from 'shared/monitoring/log'
import {metrics} from 'shared/monitoring/metrics'
import {banUser} from './ban-user'
import {blockUser, unblockUser} from './block-user'
import {getCompatibleLoversHandler} from './compatible-profiles'
import {createComment} from './create-comment'
import {createCompatibilityQuestion} from './create-compatibility-question'
import {createLover} from './create-lover'
import {createUser} from './create-user'
import {getCompatibilityQuestions} from './get-compatibililty-questions'
import {getLikesAndShips} from './get-likes-and-ships'
import {getLoverAnswers} from './get-lover-answers'
import {getProfiles} from './get-profiles'
import {getSupabaseToken} from './get-supabase-token'
import {getDisplayUser, getUser} from './get-user'
import {getMe} from './get-me'
import {hasFreeLike} from './has-free-like'
import {health} from './health'
import {type APIHandler, typedEndpoint} from './helpers/endpoint'
import {hideComment} from './hide-comment'
import {likeLover} from './like-lover'
import {markAllNotifsRead} from './mark-all-notifications-read'
import {removePinnedPhoto} from './remove-pinned-photo'
import {report} from './report'
import {searchLocation} from './search-location'
import {searchNearCity} from './search-near-city'
import {shipLovers} from './ship-profiles'
import {starLover} from './star-lover'
import {updateLover} from './update-lover'
import {updateMe} from './update-me'
import {deleteMe} from './delete-me'
import {getCurrentPrivateUser} from './get-current-private-user'
import {createPrivateUserMessage} from './create-private-user-message'
import {
  getChannelMemberships,
  getChannelMessages,
  getLastSeenChannelTime,
  setChannelLastSeenTime,
} from 'api/get-private-messages'
import {searchUsers} from './search-users'
import {createPrivateUserMessageChannel} from './create-private-user-message-channel'
import {leavePrivateUserMessageChannel} from './leave-private-user-message-channel'
import {updatePrivateUserMessageChannel} from './update-private-user-message-channel'
import {getNotifications} from './get-notifications'
import {updateNotifSettings} from './update-notif-setting'
import swaggerUi from "swagger-ui-express"
import * as fs from "fs"
import {sendSearchNotifications} from "api/send-search-notifications";

const allowCorsUnrestricted: RequestHandler = cors({})

function cacheController(policy?: string): RequestHandler {
  return (_req, res, next) => {
    if (policy) res.appendHeader('Cache-Control', policy)
    next()
  }
}

const requestMonitoring: RequestHandler = (req, _res, next) => {
  const traceContext = req.get('X-Cloud-Trace-Context')
  const traceId = traceContext
    ? traceContext.split('/')[0]
    : crypto.randomUUID()
  const context = {endpoint: req.path, traceId}
  withMonitoringContext(context, () => {
    const startTs = hrtime.bigint()
    log(`${req.method} ${req.url}`)
    metrics.inc('http/request_count', {endpoint: req.path})
    next()
    const endTs = hrtime.bigint()
    const latencyMs = Number(endTs - startTs) / 1e6
    metrics.push('http/request_latency', latencyMs, {endpoint: req.path})
  })
}

const apiErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof APIError) {
    log.info(error)
    if (!res.headersSent) {
      const output: { [k: string]: unknown } = {message: error.message}
      if (error.details != null) {
        output.details = error.details
      }
      res.status(error.code).json(output)
    }
  } else {
    log.error(error)
    if (!res.headersSent) {
      res.status(500).json({message: error.stack, error})
    }
  }
}

export const app = express()
app.use(requestMonitoring)

const swaggerDocument = JSON.parse(fs.readFileSync("./openapi.json", "utf-8"))
swaggerDocument.info = {
  ...swaggerDocument.info,
  description: "Compass is a free, open-source platform to help people form deep, meaningful, and lasting connections — whether platonic, romantic, or collaborative. It’s made possible by contributions from the community, including code, ideas, feedback, and donations. Unlike typical apps, Compass prioritizes values, interests, and personality over swipes and ads, giving you full control over who you discover and how you connect.",
  version: "1.0.0",
  contact: {
    name: "Compass",
    email: "compass.meet.info@gmail.com",
    url: "https://compassmeet.com"
  }
};

const rootPath = pathWithPrefix("/")
app.get(rootPath, swaggerUi.setup(swaggerDocument))
app.use(rootPath, swaggerUi.serve)

app.options('*', allowCorsUnrestricted)

const handlers: { [k in APIPath]: APIHandler<k> } = {
  health: health,
  'get-supabase-token': getSupabaseToken,
  'get-notifications': getNotifications,
  'mark-all-notifs-read': markAllNotifsRead,
  'user/:username': getUser,
  'user/:username/lite': getDisplayUser,
  'user/by-id/:id': getUser,
  'user/by-id/:id/lite': getDisplayUser,
  'user/by-id/:id/block': blockUser,
  'user/by-id/:id/unblock': unblockUser,
  'search-users': searchUsers,
  'ban-user': banUser,
  report: report,
  'create-user': createUser,
  'create-lover': createLover,
  me: getMe,
  'me/private': getCurrentPrivateUser,
  'me/update': updateMe,
  'update-notif-settings': updateNotifSettings,
  'me/delete': deleteMe,
  'update-lover': updateLover,
  'like-lover': likeLover,
  'ship-profiles': shipLovers,
  'get-likes-and-ships': getLikesAndShips,
  'has-free-like': hasFreeLike,
  'star-lover': starLover,
  'get-profiles': getProfiles,
  'get-lover-answers': getLoverAnswers,
  'get-compatibility-questions': getCompatibilityQuestions,
  'remove-pinned-photo': removePinnedPhoto,
  'create-comment': createComment,
  'hide-comment': hideComment,
  'create-compatibility-question': createCompatibilityQuestion,
  'compatible-profiles': getCompatibleLoversHandler,
  'search-location': searchLocation,
  'search-near-city': searchNearCity,
  'create-private-user-message': createPrivateUserMessage,
  'create-private-user-message-channel': createPrivateUserMessageChannel,
  'update-private-user-message-channel': updatePrivateUserMessageChannel,
  'leave-private-user-message-channel': leavePrivateUserMessageChannel,
  'get-channel-memberships': getChannelMemberships,
  'get-channel-messages': getChannelMessages,
  'get-channel-seen-time': getLastSeenChannelTime,
  'set-channel-seen-time': setChannelLastSeenTime,
}

Object.entries(handlers).forEach(([path, handler]) => {
  const api = API[path as APIPath]
  const cache = cacheController((api as any).cache)
  const url = pathWithPrefix('/' + path as APIPath)

  const apiRoute = [
    url,
    express.json(),
    allowCorsUnrestricted,
    cache,
    typedEndpoint(path as any, handler as any),
    apiErrorHandler,
  ] as const

  if (api.method === 'POST') {
    app.post(...apiRoute)
  } else if (api.method === 'GET') {
    app.get(...apiRoute)
    // } else if (api.method === 'PUT') {
    //   app.put(...apiRoute)
  } else {
    throw new Error('Unsupported API method')
  }
})

// console.log('COMPASS_API_KEY:', process.env.COMPASS_API_KEY)

// Internal Endpoints
app.post(pathWithPrefix("/internal/send-search-notifications"),
  async (req, res) => {
    const apiKey = req.header("x-api-key");
    if (apiKey !== process.env.COMPASS_API_KEY) {
      return res.status(401).json({error: "Unauthorized"});
    }

    try {
      const result = await sendSearchNotifications()
      return res.status(200).json(result)
    } catch (err) {
      console.error("Failed to send notifications:", err);
      return res.status(500).json({error: "Internal server error"});
    }
  }
);


app.use(allowCorsUnrestricted, (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(200).send()
  } else {
    res
      .status(404)
      .set('Content-Type', 'application/json')
      .json({
        message: `This is the Compass API, but the requested route '${req.path}' does not exist. Please check your URL for any misspellings, the docs at https://api.compassmeet.com, or simply refer to app.ts on GitHub`,
      })
  }
})
