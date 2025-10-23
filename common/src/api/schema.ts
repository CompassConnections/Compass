import {
  contentSchema,
  combinedProfileSchema,
  baseProfilesSchema,
  arraybeSchema,
} from 'common/api/zod-types'
import {PrivateChatMessage} from 'common/chat-message'
import {CompatibilityScore} from 'common/profiles/compatibility-score'
import {MAX_COMPATIBILITY_QUESTION_LENGTH} from 'common/profiles/constants'
import {Profile, ProfileRow} from 'common/profiles/profile'
import {Row} from 'common/supabase/utils'
import {PrivateUser, User} from 'common/user'
import {z} from 'zod'
import {LikeData, ShipData} from './profile-types'
import {DisplayUser, FullUser} from './user-types'
import {PrivateMessageChannel} from 'common/supabase/private-messages'
import {Notification} from 'common/notifications'
import {arrify} from 'common/util/array'
import {notification_preference} from 'common/user-notification-preferences'

// mqp: very unscientific, just balancing our willingness to accept load
// with user willingness to put up with stale data
export const DEFAULT_CACHE_STRATEGY =
  'public, max-age=5, stale-while-revalidate=10'

type APIGenericSchema = {
  // GET is for retrieval, POST is to mutate something, PUT is idempotent mutation (can be repeated safely)
  method: 'GET' | 'POST' | 'PUT'
  // whether the endpoint requires authentication
  authed: boolean
  // whether the endpoint requires authentication
  rateLimited?: boolean
  // zod schema for the request body (or for params for GET requests)
  props: z.ZodType
  // note this has to be JSON serializable
  returns?: Record<string, any>
  // Cache-Control header. like, 'max-age=60'
  cache?: string
}

let _apiTypeCheck: { [x: string]: APIGenericSchema }

export const API = (_apiTypeCheck = {
  health: {
    method: 'GET',
    authed: false,
    rateLimited: false,
    props: z.object({}),
    returns: {} as { message: 'Server is working.'; uid?: string },
  },
  'get-supabase-token': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({}),
    returns: {} as { jwt: string },
  },
  'mark-all-notifs-read': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z.object({}),
  },
  'user/by-id/:id/block': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z.object({id: z.string()}).strict(),
  },
  'user/by-id/:id/unblock': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z.object({id: z.string()}).strict(),
  },
  'ban-user': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z
      .object({
        userId: z.string(),
        unban: z.boolean().optional(),
      })
      .strict(),
  },
  'create-user': {
    // TODO rest
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as { user: User; privateUser: PrivateUser },
    props: z
      .object({
        deviceToken: z.string().optional(),
        adminToken: z.string().optional(),
      })
      .strict(),
  },
  'create-profile': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as Row<'profiles'>,
    props: baseProfilesSchema,
  },
  report: {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: z
      .object({
        contentOwnerId: z.string(),
        contentType: z.enum(['user', 'comment', 'contract']),
        contentId: z.string(),
        description: z.string().optional(),
        parentId: z.string().optional(),
        parentType: z.enum(['contract', 'post', 'user']).optional(),
      })
      .strict(),
    returns: {} as any,
  },
  me: {
    method: 'GET',
    authed: true,
    rateLimited: false,
    cache: DEFAULT_CACHE_STRATEGY,
    props: z.object({}),
    returns: {} as FullUser,
  },
  'me/update': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: z.object({
      name: z.string().trim().min(1).optional(),
      username: z.string().trim().min(1).optional(),
      avatarUrl: z.string().optional(),
      bio: z.string().optional(),
      link: z.record(z.string().nullable()).optional(),
      // settings
      optOutBetWarnings: z.boolean().optional(),
      isAdvancedTrader: z.boolean().optional(),
      //internal
      shouldShowWelcome: z.boolean().optional(),
      hasSeenContractFollowModal: z.boolean().optional(),
      hasSeenLoanModal: z.boolean().optional(),

      // Legacy fields (deprecated)
      /** @deprecated Use links.site instead */
      website: z.string().optional(),
      /** @deprecated Use links.x instead */
      twitterHandle: z.string().optional(),
      /** @deprecated Use links.discord instead */
      discordHandle: z.string().optional(),
    }),
    returns: {} as FullUser,
  },
  'update-profile': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: combinedProfileSchema.partial(),
    returns: {} as ProfileRow,
  },
  'update-notif-settings': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z.object({
      type: z.string() as z.ZodType<notification_preference>,
      medium: z.enum(['email', 'browser', 'mobile']),
      enabled: z.boolean(),
    }),
  },
  'me/delete': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: z.object({
      username: z.string(), // just so you're sure
    }),
  },
  'me/private': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({}),
    returns: {} as PrivateUser,
  },
  'user/:username': {
    method: 'GET',
    authed: false,
    rateLimited: false,
    cache: DEFAULT_CACHE_STRATEGY,
    returns: {} as FullUser,
    props: z.object({username: z.string()}).strict(),
  },
  'user/:username/lite': {
    method: 'GET',
    authed: false,
    rateLimited: false,
    cache: DEFAULT_CACHE_STRATEGY,
    returns: {} as DisplayUser,
    props: z.object({username: z.string()}).strict(),
  },
  'user/by-id/:id': {
    method: 'GET',
    authed: false,
    rateLimited: false,
    cache: DEFAULT_CACHE_STRATEGY,
    returns: {} as FullUser,
    props: z.object({id: z.string()}).strict(),
  },
  'user/by-id/:id/lite': {
    method: 'GET',
    authed: false,
    rateLimited: false,
    cache: DEFAULT_CACHE_STRATEGY,
    returns: {} as DisplayUser,
    props: z.object({id: z.string()}).strict(),
  },
  'search-users': {
    method: 'GET',
    authed: true,
    rateLimited: true,
    cache: DEFAULT_CACHE_STRATEGY,
    returns: [] as FullUser[],
    props: z
      .object({
        term: z.string(),
        limit: z.coerce.number().gte(0).lte(20).default(500),
        page: z.coerce.number().gte(0).default(0),
      })
      .strict(),
  },
  'compatible-profiles': {
    method: 'GET',
    authed: true,
    rateLimited: true,
    props: z.object({userId: z.string()}),
    returns: {} as {
      profile: Profile
      compatibleProfiles: Profile[]
      profileCompatibilityScores: {
        [userId: string]: CompatibilityScore
      }
    },
  },
  'remove-pinned-photo': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {success: true},
    props: z
      .object({
        userId: z.string(),
      })
      .strict(),
  },
  'get-compatibility-questions': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({}),
    returns: {} as {
      status: 'success'
      questions: (Row<'compatibility_prompts'> & {
        answer_count: number
        score: number
      })[]
    },
  },
  'like-profile': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: z.object({
      targetUserId: z.string(),
      remove: z.boolean().optional(),
    }),
    returns: {} as {
      status: 'success'
    },
  },
  'ship-profiles': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: z.object({
      targetUserId1: z.string(),
      targetUserId2: z.string(),
      remove: z.boolean().optional(),
    }),
    returns: {} as {
      status: 'success'
    },
  },
  'get-likes-and-ships': {
    method: 'GET',
    authed: true,
    rateLimited: true,
    props: z
      .object({
        userId: z.string(),
      })
      .strict(),
    returns: {} as {
      status: 'success'
      likesReceived: LikeData[]
      likesGiven: LikeData[]
      ships: ShipData[]
    },
  },
  'has-free-like': {
    method: 'GET',
    authed: true,
    rateLimited: true,
    props: z.object({}).strict(),
    returns: {} as {
      status: 'success'
      hasFreeLike: boolean
    },
  },
  'star-profile': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: z.object({
      targetUserId: z.string(),
      remove: z.boolean().optional(),
    }),
    returns: {} as {
      status: 'success'
    },
  },
  'get-profiles': {
    method: 'GET',
    authed: true,
    rateLimited: true,
    props: z
      .object({
        limit: z.coerce.number().gt(0).lte(20).optional().default(20),
        after: z.string().optional(),
        // Search and filter parameters
        name: z.string().optional(),
        genders: arraybeSchema.optional(),
        pref_gender: arraybeSchema.optional(),
        pref_age_min: z.coerce.number().optional(),
        pref_age_max: z.coerce.number().optional(),
        pref_relation_styles: arraybeSchema.optional(),
        pref_romantic_styles: arraybeSchema.optional(),
        diet: arraybeSchema.optional(),
        political_beliefs: arraybeSchema.optional(),
        wants_kids_strength: z.coerce.number().optional(),
        has_kids: z.coerce.number().optional(),
        is_smoker: z.coerce.boolean().optional(),
        shortBio: z.coerce.boolean().optional(),
        geodbCityIds: arraybeSchema.optional(),
        lat: z.coerce.number().optional(),
        lon: z.coerce.number().optional(),
        radius: z.coerce.number().optional(),
        compatibleWithUserId: z.string().optional(),
        orderBy: z
          .enum(['last_online_time', 'created_time', 'compatibility_score'])
          .optional()
          .default('last_online_time'),
      })
      .strict(),
    returns: {} as {
      status: 'success' | 'fail'
      profiles: Profile[]
    },
  },
  'get-profile-answers': {
    method: 'GET',
    authed: true,
    rateLimited: true,
    props: z.object({userId: z.string()}).strict(),
    returns: {} as {
      status: 'success'
      answers: Row<'compatibility_answers'>[]
    },
  },
  'create-comment': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: z.object({
      userId: z.string(),
      content: contentSchema,
      replyToCommentId: z.string().optional(),
    }),
    returns: {} as any,
  },
  'hide-comment': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: z.object({
      commentId: z.string(),
      hide: z.boolean(),
    }),
    returns: {} as any,
  },
  'get-channel-memberships': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({
      channelId: z.coerce.number().optional(),
      createdTime: z.string().optional(),
      lastUpdatedTime: z.string().optional(),
      limit: z.coerce.number(),
    }),
    returns: {
      channels: [] as PrivateMessageChannel[],
      memberIdsByChannelId: {} as { [channelId: string]: string[] },
    },
  },
  'get-channel-messages': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({
      channelId: z.coerce.number(),
      limit: z.coerce.number(),
      id: z.coerce.number().optional(),
    }),
    returns: [] as PrivateChatMessage[],
  },
  'get-channel-seen-time': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({
      channelIds: z
        .array(z.coerce.number())
        .or(z.coerce.number())
        .transform(arrify),
    }),
    returns: [] as [number, string][],
  },
  'set-channel-seen-time': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z.object({
      channelId: z.coerce.number(),
    }),
  },
  'set-last-online-time': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z.object({}),
  },
  'get-notifications': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    returns: [] as Notification[],
    props: z
      .object({
        after: z.coerce.number().optional(),
        limit: z.coerce.number().gte(0).lte(1000).default(100),
      })
      .strict(),
  },
  'create-private-user-message': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      content: contentSchema,
      channelId: z.number(),
    }),
  },
  'create-private-user-message-channel': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      userIds: z.array(z.string()),
    }),
  },
  'update-private-user-message-channel': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      channelId: z.number(),
      notifyAfterTime: z.number(),
    }),
  },
  'leave-private-user-message-channel': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      channelId: z.number(),
    }),
  },
  'create-compatibility-question': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      question: z.string().min(1).max(MAX_COMPATIBILITY_QUESTION_LENGTH),
      options: z.record(z.string(), z.number()),
    }),
  },
  'create-vote': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      title: z.string().min(1),
      isAnonymous: z.boolean(),
      description: contentSchema,
    }),
  },
  'vote': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      voteId: z.number(),
      priority: z.number(),
      choice: z.enum(['for', 'abstain', 'against']),
    }),
  },
  'search-location': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      term: z.string(),
      limit: z.number().optional(),
    }),
  },
  'search-near-city': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      cityId: z.string(),
      radius: z.number().min(1).max(500),
    }),
  },
  'contact': {
    method: 'POST',
    authed: false,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      content: contentSchema,
      userId: z.string().optional(),
    }),
  },
  'get-messages-count': {
    method: 'GET',
    authed: false,
    rateLimited: false,
    props: z.object({}),
    returns: {} as { count: number },
  },
  'save-subscription': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      subscription: z.record(z.any())
    }),
  },
  'create-bookmarked-search': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as Row<'bookmarked_searches'>,
    props: z
      .object({
        search_filters: z.any().optional(),
        location: z.any().optional(),
        search_name: z.string().nullable().optional(),
      }),
  },
} as const)

export type APIPath = keyof typeof API
export type APISchema<N extends APIPath> = (typeof API)[N]

export type APIParams<N extends APIPath> = z.input<APISchema<N>['props']>
export type ValidatedAPIParams<N extends APIPath> = z.output<
  APISchema<N>['props']
>

export type APIResponse<N extends APIPath> = APISchema<N> extends {
    returns: Record<string, any>
  }
  ? APISchema<N>['returns']
  : void

export type APIResponseOptionalContinue<N extends APIPath> =
  | { continue: () => Promise<void>; result: APIResponse<N> }
  | APIResponse<N>
