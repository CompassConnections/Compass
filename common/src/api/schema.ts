import {QuestionWithStats} from 'common/api/types' // mqp: very unscientific, just balancing our willingness to accept load
import {
  arraybeSchema,
  combinedProfileSchema,
  contentSchema,
  dateSchema,
  zBoolean,
} from 'common/api/zod-types'
import {ChatMessage} from 'common/chat-message'
import {Notification} from 'common/notifications'
import {CompatibilityScore} from 'common/profiles/compatibility-score'
import {MAX_COMPATIBILITY_QUESTION_LENGTH, OPTION_TABLES} from 'common/profiles/constants'
import {Profile, ProfileRow, ProfileWithoutUser} from 'common/profiles/profile'
import {Stats} from 'common/stats' // mqp: very unscientific, just balancing our willingness to accept load
import {PrivateMessageChannel} from 'common/supabase/private-messages'
import {Row} from 'common/supabase/utils'
import {PrivateUser, User} from 'common/user'
import {notification_preference} from 'common/user-notification-preferences'
import {arrify} from 'common/util/array'
import {z} from 'zod'

import {LikeData, ShipData} from './profile-types'
import {FullUser, HiddenProfile} from './user-types' // mqp: very unscientific, just balancing our willingness to accept load

// mqp: very unscientific, just balancing our willingness to accept load
// with user willingness to put up with stale data
export const DEFAULT_CACHE_STRATEGY = 'public, max-age=5, stale-while-revalidate=10'

/**
 * Generic API endpoint schema configuration
 *
 * Defines the structure and behavior of API endpoints including HTTP method,
 * authentication requirements, request/response schemas, and metadata.
 */
export type APIGenericSchema = {
  /**
   * HTTP method for the endpoint
   * - GET: For data retrieval operations
   * - POST: For creating/updating resources or state-changing operations
   * - PUT: For idempotent updates (can be safely repeated)
   */
  method: 'GET' | 'POST' | 'PUT'

  /**
   * Authentication requirement flag
   * - true: Endpoint requires valid authentication token
   * - false: Endpoint is publicly accessible
   */
  authed: boolean

  /**
   * Rate limiting flag
   * When true, endpoint is subject to rate limiting based on configuration
   * @default false
   */
  rateLimited?: boolean

  /**
   * Zod schema for request validation
   * - For GET requests: Validates query parameters
   * - For POST/PUT requests: Validates request body
   */
  props: z.ZodType

  /**
   * Response type definition (JSON serializable)
   * Used for TypeScript typing and API documentation generation
   */
  returns?: z.ZodType | Record<string, any>

  /**
   * Cache-Control header value
   * Controls caching behavior for GET endpoints
   * @example 'public, max-age=60'
   */
  cache?: string

  /**
   * Human-readable summary of the endpoint
   * Used in API documentation
   */
  summary?: string

  /**
   * Tag for organizing endpoints in documentation
   * Groups related endpoints together
   */
  tag?: string

  /**
   * Deprecation information for legacy endpoints
   * Provides migration guidance for deprecated APIs
   */
  deprecation?: {
    /** Flag indicating if endpoint is deprecated */
    deprecated: boolean
    /** Path to replacement endpoint if available */
    migrationPath?: string
    /** Date when endpoint will be removed */
    sunsetDate?: string
  }
}

let _apiTypeCheck: {[x: string]: APIGenericSchema}

export const API = (_apiTypeCheck = {
  /**
   * Health check endpoint
   * Returns server status information for monitoring and debugging
   *
   * @example
   * ```json
   * {
   *   "message": "Server is working.",
   *   "uid": "user123",
   *   "version": "1.2.3",
   *   "git": {
   *     "revision": "abc123",
   *     "commitDate": "2023-01-01T00:00:00Z"
   *   }
   * }
   * ```
   */
  health: {
    method: 'GET',
    authed: false,
    rateLimited: false,
    props: z.object({}),
    returns: {} as {
      message: 'Server is working.'
      uid?: string
      version?: string
      git?: {
        revision?: string
        commitDate?: string
        author?: string
        message?: string
      }
    },
    summary: 'Check whether the API server is running',
    tag: 'General',
  },
  /**
   * Get platform statistics
   * Returns public statistics about the platform including user count and other metrics
   *
   * @returns Object containing various platform statistics
   */
  stats: {
    method: 'GET',
    authed: false,
    rateLimited: true,
    props: z.object({}),
    cache: 'public, max-age=60',
    returns: {} as Stats,
    summary: 'Get platform statistics',
    tag: 'General',
  },
  /**
   * Get Supabase JWT token
   * Returns a JWT token for authenticated clients to access Supabase directly
   * Requires Firebase authentication
   *
   * @returns JWT token string for Supabase authentication
   * @security Requires Firebase authentication token
   */
  'get-supabase-token': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({}),
    returns: {} as {jwt: string},
    summary: 'Return a Supabase JWT for authenticated clients',
    tag: 'Authentication',
  },
  /**
   * Mark all notifications as read
   * Updates all unread notifications for the authenticated user to read status
   *
   * @security Requires user authentication
   * @returns Success confirmation with count of notifications marked read
   */
  'mark-all-notifs-read': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z.object({}),
    summary: 'Mark all user notifications as read',
    tag: 'Notifications',
  },
  // 'user/:username': {
  //   method: 'GET',
  //   authed: false,
  //   rateLimited: false,
  //   cache: DEFAULT_CACHE_STRATEGY,
  //   returns: {} as FullUser,
  //   props: z.object({username: z.string()}).strict(),
  //   summary: 'Get full public profile by username',
  // },
  // 'user/:username/lite': {
  //   method: 'GET',
  //   authed: false,
  //   rateLimited: false,
  //   cache: DEFAULT_CACHE_STRATEGY,
  //   returns: {} as DisplayUser,
  //   props: z.object({username: z.string()}).strict(),
  //   summary: 'Get lightweight public profile by username',
  // },
  /**
   * Get user profile by ID
   * Retrieves complete profile information for a specific user
   *
   * @param id - User ID to retrieve profile for
   * @security Requires authentication (to protect user privacy)
   * @returns Full user profile including public and member-only information
   * @cache Publicly cacheable with revalidation
   */
  'user/by-id/:id': {
    method: 'GET',
    authed: true,
    rateLimited: true,
    cache: DEFAULT_CACHE_STRATEGY,
    returns: {} as FullUser,
    props: z.object({id: z.string()}).strict(),
    summary: 'Get full profile by user ID',
    tag: 'Users',
  },
  // 'user/by-id/:id/lite': {
  //   method: 'GET',
  //   authed: false,
  //   rateLimited: false,
  //   cache: DEFAULT_CACHE_STRATEGY,
  //   returns: {} as DisplayUser,
  //   props: z.object({id: z.string()}).strict(),
  //   summary: 'Get lightweight profile by user ID',
  // },
  /**
   * Block a user
   * Prevents a user from contacting or viewing the authenticated user's profile
   *
   * @param id - User ID to block
   * @security Requires user authentication
   * @returns Confirmation of block action
   */
  'user/by-id/:id/block': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z.object({id: z.string()}).strict(),
    summary: 'Block a user by their ID',
    tag: 'Users',
  },

  /**
   * Unblock a user
   * Removes blocking restriction on a previously blocked user
   *
   * @param id - User ID to unblock
   * @security Requires user authentication
   * @returns Confirmation of unblock action
   */
  'user/by-id/:id/unblock': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z.object({id: z.string()}).strict(),
    summary: 'Unblock a user by their ID',
    tag: 'Users',
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
    summary: 'Ban or unban a user',
    tag: 'Admin',
  },
  'create-user-and-profile': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as {user: User; privateUser: PrivateUser; profile: any},
    props: z
      .object({
        deviceToken: z.string().optional(),
        locale: z.string().optional(),
        username: z.string().min(1),
        name: z.string().min(1),
        profile: combinedProfileSchema,
        interests: arraybeSchema.optional(),
        causes: arraybeSchema.optional(),
        work: arraybeSchema.optional(),
      })
      .strict(),
    summary: 'Create a new user and profile in a single transaction',
    tag: 'Users',
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
    summary: 'Submit a report for content or a user',
    tag: 'Moderation',
  },
  me: {
    method: 'GET',
    authed: true,
    rateLimited: false,
    cache: DEFAULT_CACHE_STRATEGY,
    props: z.object({}),
    returns: {} as FullUser,
    summary: 'Get the authenticated user full data',
    tag: 'Users',
  },
  'get-user-and-profile': {
    method: 'GET',
    authed: false,
    rateLimited: true,
    props: z.object({
      username: z.string().min(1),
    }),
    returns: {} as {user: User | null | undefined; profile: ProfileRow | null | undefined},
    summary: 'Get user and profile data by username',
    tag: 'Users',
  },
  'me/data': {
    method: 'GET',
    authed: true,
    rateLimited: true,
    props: z.object({}),
    // Full JSON export of the user's data, including
    // profile, private user, answers, messages, endorsements, bookmarks, etc.
    // We deliberately keep this loosely typed as it's meant for export/inspection.
    returns: {} as Record<string, any>,
    summary: 'Download all data for the authenticated user as JSON',
    tag: 'Users',
  },
  'me/update': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: z.object({
      name: z.string().trim().min(1).optional(),
      username: z.string().trim().min(1).optional(),
      avatarUrl: z.string().optional(),
    }),
    returns: {} as FullUser,
    summary: 'Update authenticated user profile and settings',
    tag: 'Users',
  },
  'update-profile': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: combinedProfileSchema.partial(),
    returns: {} as ProfileRow,
    summary: 'Update profile fields for the authenticated user',
    tag: 'Profiles',
  },
  'get-connection-interests': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({
      targetUserId: z.string(),
    }),
    returns: {} as {
      interests: string[]
      targetInterests: string[]
    },
    summary: 'Get connection preferences for a user or another user',
    tag: 'Profiles',
  },
  'update-connection-interest': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: z.object({
      targetUserId: z.string(),
      connectionType: z.string(),
      seeking: z.boolean(),
    }),
    returns: {} as {success: boolean},
    summary: 'Update connection preference for the authenticated user',
    tag: 'Profiles',
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
    summary: 'Update a notification preference for the user',
    tag: 'Notifications',
  },
  'unsubscribe/:token': {
    method: 'POST',
    authed: false,
    rateLimited: true,
    props: z.object({
      token: z.string(),
      'List-Unsubscribe': z.string().optional(),
    }),
    returns: {} as {success: boolean},
    summary: 'Unsubscribe from email notifications using a token',
    tag: 'Notifications',
  },
  'update-user-locale': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z.object({
      locale: z.string(),
    }),
    summary: "Update the user's preferred locale",
    tag: 'Users',
  },
  'me/delete': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: z
      .object({
        reasonCategory: z.string().nullable().optional(),
        reasonDetails: z.string().optional(),
      })
      .strict(),
    summary: 'Delete the authenticated user account',
    tag: 'Users',
  },
  'me/private': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({}),
    returns: {} as PrivateUser,
    summary: 'Get private user data for the authenticated user',
    tag: 'Users',
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
    summary: 'Search users by term with pagination',
    tag: 'Users',
  },
  'compatible-profiles': {
    method: 'GET',
    authed: true,
    rateLimited: true,
    props: z.object({userId: z.string()}),
    returns: {} as {
      // profile: Profile
      // compatibleProfiles: Profile[]
      profileCompatibilityScores: {
        [userId: string]: CompatibilityScore
      }
    },
    summary: 'Find profiles compatible with a given user',
    tag: 'Profiles',
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
    summary: 'Remove the pinned photo from a profile',
    tag: 'Profiles',
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
    summary: 'Create a new compatibility question with options',
    tag: 'Compatibility',
  },
  'set-compatibility-answer': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as Row<'compatibility_answers'>,
    props: z
      .object({
        questionId: z.number(),
        multipleChoice: z.number(),
        prefChoices: z.array(z.number()),
        importance: z.number(),
        explanation: z.string().nullable().optional(),
      })
      .strict(),
    summary: 'Submit or update a compatibility answer',
    tag: 'Compatibility',
  },
  'update-compatibility-question-pin': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: z
      .object({
        questionId: z.number(),
        pinned: z.boolean(),
      })
      .strict(),
    returns: {} as {
      status: 'success'
      pinnedQuestionIds: number[]
    },
    summary: 'Pin or unpin a compatibility question for your profile views',
    tag: 'Compatibility',
  },
  'get-pinned-compatibility-questions': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({}).strict(),
    returns: {} as {
      status: 'success'
      pinnedQuestionIds: number[]
    },
    summary: 'Get pinned compatibility question ids for current user',
    tag: 'Compatibility',
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
    summary: 'Get compatibility answers for a profile',
    tag: 'Compatibility',
  },
  'get-compatibility-questions': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({
      locale: z.string().optional(),
      keyword: z.string().optional(),
    }),
    returns: {} as {
      status: 'success'
      questions: QuestionWithStats[]
    },
    summary: 'Retrieve compatibility questions and stats',
    tag: 'Compatibility',
  },
  'delete-compatibility-answer': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: z.object({
      id: z.number(),
    }),
    returns: {} as {
      status: 'success'
    },
    summary: 'Delete a compatibility answer',
    tag: 'Compatibility',
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
    summary: 'Like or unlike a profile',
    tag: 'Relations',
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
    summary: 'Create or remove a ship between two profiles',
    tag: 'Relations',
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
    summary: 'Star or unstar a profile',
    tag: 'Relations',
  },
  'hide-profile': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: z.object({
      hiddenUserId: z.string(),
    }),
    returns: {} as {
      status: 'success'
    },
    summary: 'Hide a profile for the current user',
    tag: 'Relations',
  },
  'unhide-profile': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: z.object({
      hiddenUserId: z.string(),
    }),
    returns: {} as {
      status: 'success'
    },
    summary: 'Unhide a previously hidden profile for the current user',
    tag: 'Relations',
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
    summary: 'Fetch likes and ships for a user',
    tag: 'Profiles',
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
    summary: 'Check whether the user has a free like available',
    tag: 'Profiles',
  },
  'get-hidden-profiles': {
    method: 'GET',
    authed: true,
    rateLimited: true,
    props: z
      .object({
        limit: z.coerce.number().min(1).max(200).optional(),
        offset: z.coerce.number().min(0).optional(),
      })
      .strict(),
    returns: {} as {
      status: 'success'
      hidden: HiddenProfile[]
      count: number
    },
    summary: 'Get the list of profiles the current user has hidden',
    tag: 'Profiles',
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
        education_levels: arraybeSchema.optional(),
        pref_gender: arraybeSchema.optional(),
        pref_age_min: z.coerce.number().optional(),
        pref_age_max: z.coerce.number().optional(),
        drinks_min: z.coerce.number().optional(),
        drinks_max: z.coerce.number().optional(),
        big5_openness_min: z.coerce.number().optional(),
        big5_openness_max: z.coerce.number().optional(),
        big5_conscientiousness_min: z.coerce.number().optional(),
        big5_conscientiousness_max: z.coerce.number().optional(),
        big5_extraversion_min: z.coerce.number().optional(),
        big5_extraversion_max: z.coerce.number().optional(),
        big5_agreeableness_min: z.coerce.number().optional(),
        big5_agreeableness_max: z.coerce.number().optional(),
        big5_neuroticism_min: z.coerce.number().optional(),
        big5_neuroticism_max: z.coerce.number().optional(),
        religion: arraybeSchema.optional(),
        pref_relation_styles: arraybeSchema.optional(),
        pref_romantic_styles: arraybeSchema.optional(),
        diet: arraybeSchema.optional(),
        political_beliefs: arraybeSchema.optional(),
        mbti: arraybeSchema.optional(),
        interests: arraybeSchema.optional(),
        causes: arraybeSchema.optional(),
        work: arraybeSchema.optional(),
        relationship_status: arraybeSchema.optional(),
        languages: arraybeSchema.optional(),
        last_active: z.string().optional(),
        wants_kids_strength: z.coerce.number().optional(),
        has_kids: z.coerce.number().optional(),
        is_smoker: zBoolean.optional().optional(),
        psychedelics: arraybeSchema.optional(),
        cannabis: arraybeSchema.optional(),
        psychedelics_intention: arraybeSchema.optional(),
        cannabis_intention: arraybeSchema.optional(),
        psychedelics_pref: arraybeSchema.optional(),
        cannabis_pref: arraybeSchema.optional(),
        shortBio: zBoolean.optional().optional(),
        hasPhoto: zBoolean.optional().optional(),
        geodbCityIds: arraybeSchema.optional(),
        lat: z.coerce.number().optional(),
        lon: z.coerce.number().optional(),
        radius: z.coerce.number().optional(),
        raised_in_lat: z.coerce.number().optional(),
        raised_in_lon: z.coerce.number().optional(),
        raised_in_radius: z.coerce.number().optional(),
        compatibleWithUserId: z.string().optional(),
        skipId: z.string().optional(),
        locale: z.string().optional(),
        orderBy: z
          .enum(['last_online_time', 'created_time', 'compatibility_score'])
          .optional()
          .default('last_online_time'),
      })
      .strict(),
    returns: {} as {
      status: 'success' | 'fail'
      profiles: Profile[]
      count: number
    },
    summary: 'List profiles with filters, pagination and ordering',
    tag: 'Profiles',
  },
  'get-options': {
    method: 'GET',
    authed: true,
    rateLimited: true,
    returns: {},
    props: z
      .object({
        table: z.enum(OPTION_TABLES),
        locale: z.string().optional(),
      })
      .strict(),
    summary: 'Get profile options like interests',
    tag: 'Utilities',
  },
  'update-options': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {},
    props: z
      .object({
        table: z.enum(OPTION_TABLES),
        values: arraybeSchema.optional(),
      })
      .strict(),
    summary: 'Update profile options like interests',
    tag: 'Utilities',
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
    summary: 'Create a comment or reply',
    tag: 'Profiles',
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
    summary: 'Hide or unhide a comment',
    tag: 'Profiles',
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
      memberIdsByChannelId: {} as {[channelId: string]: string[]},
    },
    summary: 'List private message channel memberships',
    tag: 'Messages',
  },
  'get-channel-messages': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({
      channelId: z.coerce.number(),
      limit: z.coerce.number(),
      id: z.coerce.number().optional(),
      beforeId: z.coerce.number().optional(),
    }),
    returns: [] as ChatMessage[],
    summary: 'Retrieve messages for a private channel',
    tag: 'Messages',
  },
  'get-last-messages': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({
      channelIds: z.array(z.coerce.number()).optional(),
    }),
    returns: {} as Record<number, ChatMessage>,
    summary: 'Get last message for each channel',
    tag: 'Messages',
  },
  'get-channel-seen-time': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({
      channelIds: z.array(z.coerce.number()).or(z.coerce.number()).transform(arrify),
    }),
    returns: z.array(
      z.tuple([
        z.number(), // Channel ID
        dateSchema, // This turns the ISO string into a JS Date object
      ]),
    ),
    summary: 'Get last seen times for one or more channels',
    tag: 'Messages',
  },
  'set-channel-seen-time': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z.object({
      channelId: z.coerce.number(),
    }),
    summary: 'Set last seen time for a channel',
    tag: 'Messages',
  },
  'set-last-online-time': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z.object({}),
    summary: 'Update the user last online timestamp',
    tag: 'Users',
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
        locale: z.string().optional(),
      })
      .strict(),
    summary: 'Fetch notifications for the authenticated user',
    tag: 'Notifications',
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
    summary: 'Send a message in a private channel',
    tag: 'Messages',
  },
  'create-private-user-message-channel': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      userIds: z.array(z.string()),
    }),
    summary: 'Create a new private message channel between users',
    tag: 'Messages',
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
    summary: 'Update settings for a private message channel',
    tag: 'Messages',
  },
  'leave-private-user-message-channel': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      channelId: z.number(),
    }),
    summary: 'Leave a private message channel',
    tag: 'Messages',
  },
  'edit-message': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      messageId: z.number(),
      content: contentSchema,
    }),
    summary: 'Edit a private message',
    tag: 'Messages',
  },
  'delete-message': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      messageId: z.number(),
    }),
    summary: 'Delete a private message',
    tag: 'Messages',
  },
  'react-to-message': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      messageId: z.number(),
      reaction: z.string(),
      toDelete: z.boolean().optional(),
    }),
    summary: 'Add or remove a reaction to a message',
    tag: 'Messages',
  },
  // 'get-message-reactions': {
  //   method: 'GET',
  //   authed: true,
  //   rateLimited: false,
  //   returns: {} as {
  //     reactions: Record<string, number>
  //   },
  //   props: z.object({
  //     messageId: z.string(),
  //   }),
  //   summary: 'Get reactions for a message',
  //   tag: 'Messages',
  // },
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
    summary: 'Create a new vote/poll',
    tag: 'Votes',
  },
  vote: {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      voteId: z.number(),
      priority: z.number(),
      choice: z.enum(['for', 'abstain', 'against']),
    }),
    summary: 'Cast a vote on an existing poll',
    tag: 'Votes',
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
    summary: 'Search for a location by text',
    tag: 'Search',
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
    summary: 'Find places near a GeoDB city ID within a radius',
    tag: 'Search',
  },
  contact: {
    method: 'POST',
    authed: false,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      content: contentSchema,
      userId: z.string().optional(),
    }),
    summary: 'Send a contact/support message',
    tag: 'Contact',
  },
  'get-messages-count': {
    method: 'GET',
    authed: false,
    rateLimited: false,
    props: z.object({}),
    returns: {} as {count: number},
    summary: 'Get the total number of messages (public endpoint)',
    tag: 'Messages',
  },
  'save-subscription': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      subscription: z.record(z.any()),
    }),
    summary: 'Save a push/browser subscription for the user',
    tag: 'Notifications',
  },
  'save-subscription-mobile': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      token: z.string(),
    }),
    summary: 'Save a mobile push subscription for the user',
    tag: 'Notifications',
  },
  'create-bookmarked-search': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as Row<'bookmarked_searches'>,
    props: z.object({
      search_filters: z.any().optional(),
      location: z.any().optional(),
      search_name: z.string().nullable().optional(),
    }),
    summary: 'Create a bookmarked search for quick reuse',
    tag: 'Search',
  },
  'delete-bookmarked-search': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      id: z.number(),
    }),
    summary: 'Delete a bookmarked search by ID',
    tag: 'Search',
  },
  'cancel-event': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as {success: boolean},
    props: z.object({
      eventId: z.string(),
    }),
    summary: 'Cancel an event (creator only)',
    tag: 'Events',
  },
  'rsvp-event': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as {success: boolean},
    props: z.object({
      eventId: z.string(),
      status: z.enum(['going', 'maybe', 'not_going']),
    }),
    summary: 'RSVP to an event',
    tag: 'Events',
  },
  'cancel-rsvp': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as {success: boolean},
    props: z.object({
      eventId: z.string(),
    }),
    summary: 'Cancel RSVP to an event',
    tag: 'Events',
  },
  'create-event': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      locationType: z.enum(['in_person', 'online']),
      locationAddress: z.string().max(500).optional(),
      locationUrl: z.string().url().max(500).optional(),
      eventStartTime: z.string().datetime(),
      eventEndTime: z.string().datetime().optional(),
      maxParticipants: z.number().int().min(1).optional(),
    }),
    summary: 'Create a new event',
    tag: 'Events',
  },
  'get-events': {
    method: 'GET',
    authed: false,
    rateLimited: false,
    returns: {} as {
      upcoming: any[]
      past: any[]
    },
    props: z.object({}),
    summary: 'Get all public events split into upcoming and past',
    tag: 'Events',
  },
  'update-event': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    returns: {} as {success: boolean},
    props: z
      .object({
        eventId: z.string(),
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        locationType: z.enum(['in_person', 'online']),
        locationAddress: z.string().max(500).optional(),
        locationUrl: z.string().url().max(500).optional(),
        eventStartTime: z.string(),
        eventEndTime: z.string().optional(),
        maxParticipants: z.number().min(1).max(1000).optional(),
      })
      .strict(),
    summary: 'Update an existing event',
    tag: 'Events',
  },
  'validate-username': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as {
      valid: boolean
      message?: string | undefined
      suggestedUsername?: string | undefined
    },
    props: z
      .object({
        username: z.string().min(1),
      })
      .strict(),
    summary: 'Validate if a username is available',
    tag: 'Users',
  },
  'llm-extract-profile': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: z
      .object({
        content: z.string().min(1).optional(),
        url: z.string().url().optional(),
        locale: z.string().optional(),
      })
      .strict(),
    returns: {} as {
      profile: Partial<ProfileWithoutUser>
      status: string
    },
    summary: 'Extract profile information from text using LLM',
    tag: 'Profiles',
  },
} as const)

export type APIPath = keyof typeof API
export type APISchema<N extends APIPath> = (typeof API)[N]

export type APIParams<N extends APIPath> = z.input<APISchema<N>['props']>
export type ValidatedAPIParams<N extends APIPath> = z.output<APISchema<N>['props']>

/**
 * A helper to extract either the Input (backend) or Output (frontend)
 * while preserving the fallback logic for non-zod types.
 */
type ExtractAPIResult<N extends APIPath, TMode extends 'input' | 'output'> =
  APISchema<N> extends {returns: z.ZodTypeAny}
    ? TMode extends 'input'
      ? z.input<APISchema<N>['returns']>
      : z.output<APISchema<N>['returns']>
    : APISchema<N> extends {returns: infer R}
      ? R
      : void

// 1. Frontend: The "Output" (Dates)
export type APIResponse<N extends APIPath> = ExtractAPIResult<N, 'output'>

// 2. Backend: The "Input" (Strings/Dates)
export type APIBackendReturn<N extends APIPath> = ExtractAPIResult<N, 'input'>

// 3. Keep your wrapper using the Backend Return type
export type APIResponseOptionalContinue<N extends APIPath> =
  | {continue: () => Promise<void>; result: APIBackendReturn<N>}
  | APIBackendReturn<N>
