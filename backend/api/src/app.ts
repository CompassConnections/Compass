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
import {getCompatibleProfilesHandler} from './compatible-profiles'
import {createComment} from './create-comment'
import {createCompatibilityQuestion} from './create-compatibility-question'
import {setCompatibilityAnswer} from './set-compatibility-answer'
import {deleteCompatibilityAnswer} from './delete-compatibility-answer'
import {createProfile} from './create-profile'
import {createUser} from './create-user'
import {getCompatibilityQuestions} from './get-compatibililty-questions'
import {getLikesAndShips} from './get-likes-and-ships'
import {getProfileAnswers} from './get-profile-answers'
import {getProfiles} from './get-profiles'
import {getSupabaseToken} from './get-supabase-token'
import {getMe} from './get-me'
import {hasFreeLike} from './has-free-like'
import {health} from './health'
import {type APIHandler, typedEndpoint} from './helpers/endpoint'
import {hideComment} from './hide-comment'
import {likeProfile} from './like-profile'
import {markAllNotifsRead} from './mark-all-notifications-read'
import {removePinnedPhoto} from './remove-pinned-photo'
import {report} from './report'
import {searchLocation} from './search-location'
import {searchNearCity} from './search-near-city'
import {shipProfiles} from './ship-profiles'
import {starProfile} from './star-profile'
import {updateProfile} from './update-profile'
import {updateMe} from './update-me'
import {deleteMe} from './delete-me'
import {getCurrentPrivateUser} from './get-current-private-user'
import {createPrivateUserMessage} from './create-private-user-message'
import {
  getChannelMemberships,
  getChannelMessagesEndpoint,
  getLastSeenChannelTime,
  setChannelLastSeenTime,
} from 'api/get-private-messages'
import {searchUsers} from './search-users'
import {createPrivateUserMessageChannel} from './create-private-user-message-channel'
import {leavePrivateUserMessageChannel} from './leave-private-user-message-channel'
import {updatePrivateUserMessageChannel} from './update-private-user-message-channel'
import {getNotifications} from './get-notifications'
import {updateNotifSettings} from './update-notif-setting'
import {setLastOnlineTime} from './set-last-online-time'
import swaggerUi from "swagger-ui-express"
import {sendSearchNotifications} from "api/send-search-notifications";
import {sendDiscordMessage} from "common/discord/core";
import {getMessagesCount} from "api/get-messages-count";
import {createVote} from "api/create-vote";
import {vote} from "api/vote";
import {contact} from "api/contact";
import {saveSubscription} from "api/save-subscription";
import {createBookmarkedSearch} from './create-bookmarked-search'
import {deleteBookmarkedSearch} from './delete-bookmarked-search'
import {OpenAPIV3} from 'openapi-types';
import {version as pkgVersion} from './../package.json'
import {git} from './../metadata.json'
import {z, ZodFirstPartyTypeKind, ZodTypeAny} from "zod";
import {getUser} from "api/get-user";
import {localSendTestEmail} from "api/test";
import path from "node:path";
import {saveSubscriptionMobile} from "api/save-subscription-mobile";
import {IS_LOCAL} from "common/hosting/constants";
import {editMessage} from "api/edit-message";
import {reactToMessage} from "api/react-to-message";
import {deleteMessage} from "api/delete-message";
import {updateOptions} from "api/update-options";
import {getOptions} from "api/get-options";

// const corsOptions: CorsOptions = {
//   origin: ['*'], // Only allow requests from this domain
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true, // if you use cookies or auth headers
// };
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


const schemaCache = new WeakMap<ZodTypeAny, any>();

export function zodToOpenApiSchema(zodObj: ZodTypeAny,): any {
  if (schemaCache.has(zodObj)) {
    return schemaCache.get(zodObj);
  }

  const def: any = (zodObj as any)._def;
  const typeName = def.typeName as ZodFirstPartyTypeKind;

  // Placeholder so recursive references can point here
  const placeholder: any = {};
  schemaCache.set(zodObj, placeholder);

  let schema: any;

  switch (typeName) {
    case 'ZodString':
      schema = {type: 'string'};
      break;
    case 'ZodNumber':
      schema = {type: 'number'};
      break;
    case 'ZodBoolean':
      schema = {type: 'boolean'};
      break;
    case 'ZodEnum':
      schema = {type: 'string', enum: def.values};
      break;
    case 'ZodArray':
      schema = {type: 'array', items: zodToOpenApiSchema(def.type)};
      break;
    case 'ZodObject': {
      const shape = def.shape();
      const properties: Record<string, any> = {};
      const required: string[] = [];

      for (const key in shape) {
        const child = shape[key];
        properties[key] = zodToOpenApiSchema(child);
        if (!child.isOptional()) required.push(key);
      }

      schema = {
        type: 'object',
        properties,
        ...(required.length ? {required} : {}),
      };
      break;
    }
    case 'ZodRecord':
      schema = {
        type: 'object',
        additionalProperties: zodToOpenApiSchema(def.valueType),
      };
      break;
    case 'ZodIntersection': {
      const left = zodToOpenApiSchema(def.left);
      const right = zodToOpenApiSchema(def.right);
      schema = {allOf: [left, right]};
      break;
    }
    case 'ZodLazy':
      schema = {type: 'object', description: 'Lazy schema - details omitted'};
      break;
    case 'ZodUnion':
      schema = {
        oneOf: def.options.map((opt: ZodTypeAny) => zodToOpenApiSchema(opt)),
      };
      break;
    default:
      schema = {type: 'string'}; // fallback for unhandled
  }

  Object.assign(placeholder, schema);
  return schema;
}

function generateSwaggerPaths(api: typeof API) {
  const paths: Record<string, any> = {};

  for (const [route, config] of Object.entries(api)) {
    const pathKey = '/' + route.replace(/_/g, '-'); // optional: convert underscores to dashes
    const method = config.method.toLowerCase();
    const summary = (config as any).summary ?? route;

    // Include props in request body for POST/PUT
    const operation: any = {
      summary,
      tags: [(config as any).tag ?? 'API'],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: {type: 'object'}, // could be improved by introspecting returns
            },
          },
        },
      },
    };

    // Include props in request body for POST/PUT
    if (config.props && ['post', 'put', 'patch'].includes(method)) {
      operation.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: zodToOpenApiSchema(config.props),
          },
        },
      };
    }

    // Include props as query parameters for GET/DELETE
    if (config.props && ['get', 'delete'].includes(method)) {
      const shape = (config.props as z.ZodObject<any>)._def.shape();
      operation.parameters = Object.entries(shape).map(([key, zodType]) => {
        const typeMap: Record<string, string> = {
          ZodString: 'string',
          ZodNumber: 'number',
          ZodBoolean: 'boolean',
        };
        const t = zodType as z.ZodTypeAny; // assert type to ZodTypeAny
        return {
          name: key,
          in: 'query',
          required: !(t.isOptional ?? false),
          schema: {type: typeMap[t._def.typeName] ?? 'string'},
        };
      });
    }

    paths[pathKey] = {
      [method]: operation,
    }

    if (config.authed) {
      operation.security = [{BearerAuth: []}];
    }
  }

  return paths;
}


const swaggerDocument: OpenAPIV3.Document = {
  openapi: "3.0.0",
  info: {
    title: "Compass API",
    description: `Compass is a free, open-source platform to help people form deep, meaningful, and lasting connections — whether platonic, romantic, or collaborative. It’s made possible by contributions from the community, including code, ideas, feedback, and donations. Unlike typical apps, Compass prioritizes values, interests, and personality over swipes and ads, giving you full control over who you discover and how you connect.\n Git: ${git.commitDate} (${git.revision}).`,
    version: pkgVersion,
    contact: {
      name: "Compass",
      email: "hello@compassmeet.com",
      url: "https://compassmeet.com"
    }
  },
  paths: generateSwaggerPaths(API),
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
      },
    },
  }
} as OpenAPIV3.Document;

// Triggers Missing parameter name at index 3: *; visit https://git.new/pathToRegexpError for info
// May not be necessary
// app.options('*', allowCorsUnrestricted)

const handlers: { [k in APIPath]: APIHandler<k> } = {
  health: health,
  'get-supabase-token': getSupabaseToken,
  'get-notifications': getNotifications,
  'mark-all-notifs-read': markAllNotifsRead,
  // 'user/:username': getUser,
  // 'user/:username/lite': getDisplayUser,
  'user/by-id/:id': getUser,
  // 'user/by-id/:id/lite': getDisplayUser,
  'user/by-id/:id/block': blockUser,
  'user/by-id/:id/unblock': unblockUser,
  'search-users': searchUsers,
  'ban-user': banUser,
  report: report,
  'create-user': createUser,
  'create-profile': createProfile,
  me: getMe,
  'me/private': getCurrentPrivateUser,
  'me/update': updateMe,
  'update-notif-settings': updateNotifSettings,
  'me/delete': deleteMe,
  'update-profile': updateProfile,
  'like-profile': likeProfile,
  'ship-profiles': shipProfiles,
  'get-likes-and-ships': getLikesAndShips,
  'has-free-like': hasFreeLike,
  'star-profile': starProfile,
  'get-profiles': getProfiles,
  'get-profile-answers': getProfileAnswers,
  'get-compatibility-questions': getCompatibilityQuestions,
  'remove-pinned-photo': removePinnedPhoto,
  'create-comment': createComment,
  'hide-comment': hideComment,
  'create-compatibility-question': createCompatibilityQuestion,
  'set-compatibility-answer': setCompatibilityAnswer,
  'delete-compatibility-answer': deleteCompatibilityAnswer,
  'create-vote': createVote,
  'vote': vote,
  'contact': contact,
  'compatible-profiles': getCompatibleProfilesHandler,
  'search-location': searchLocation,
  'search-near-city': searchNearCity,
  'create-private-user-message': createPrivateUserMessage,
  'create-private-user-message-channel': createPrivateUserMessageChannel,
  'update-private-user-message-channel': updatePrivateUserMessageChannel,
  'leave-private-user-message-channel': leavePrivateUserMessageChannel,
  'get-channel-memberships': getChannelMemberships,
  'get-channel-messages': getChannelMessagesEndpoint,
  'get-channel-seen-time': getLastSeenChannelTime,
  'set-channel-seen-time': setChannelLastSeenTime,
  'get-messages-count': getMessagesCount,
  'set-last-online-time': setLastOnlineTime,
  'save-subscription': saveSubscription,
  'save-subscription-mobile': saveSubscriptionMobile,
  'create-bookmarked-search': createBookmarkedSearch,
  'delete-bookmarked-search': deleteBookmarkedSearch,
  'delete-message': deleteMessage,
  'edit-message': editMessage,
  'react-to-message': reactToMessage,
  'update-options': updateOptions,
  'get-options': getOptions,
  // 'auth-google': authGoogle,
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
      await sendDiscordMessage(
        "Failed to send [daily notifications](https://console.cloud.google.com/cloudscheduler?project=compass-130ba) for bookmarked searches...",
        "health"
      )
      return res.status(500).json({error: "Internal server error"});
    }
  }
);

const responses = {
  200: {
    description: "Request successful",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            status: {type: "string", example: "success"}
          },
        },
      },
    },
  },
  401: {
    description: "Unauthorized (e.g., invalid or missing API key)",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            error: {type: "string", example: "Unauthorized"},
          },
        },
      },
    },
  },
  500: {
    description: "Internal server error during request processing",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            error: {type: "string", example: "Internal server error"},
          },
        },
      },
    },
  },
};

swaggerDocument.paths["/internal/send-search-notifications"] = {
  post: {
    summary: "Trigger daily search notifications",
    description:
      "Internal endpoint used by Compass schedulers to send daily notifications for bookmarked searches. Requires a valid `x-api-key` header.",
    tags: ["Internal"],
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    requestBody: {
      required: false,
    },
    responses: responses,
  },
} as any


// Local Endpoints
if (IS_LOCAL) {
  app.post(pathWithPrefix("/local/send-test-email"),
    async (req, res) => {
      if (!IS_LOCAL) {
        return res.status(401).json({error: "Unauthorized"});
      }

      try {
        const result = await localSendTestEmail()
        return res.status(200).json(result)
      } catch (err) {
        return res.status(500).json({error: err});
      }
    }
  );
  swaggerDocument.paths["/local/send-test-email"] = {
    post: {
      summary: "Send a test email",
      description: "Local endpoint to send a test email.",
      tags: ["Local"],
      requestBody: {
        required: false,
      },
      responses: responses,
    },
  } as any
}


const rootPath = pathWithPrefix("/")
app.get(
  rootPath,
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'Compass API Docs',
    customCssUrl: '/swagger.css',
  }),
)
app.use(rootPath, swaggerUi.serve)

app.use(express.static(path.join(__dirname, 'public')));

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
