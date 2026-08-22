import {QuestionWithStats} from 'common/api/types' // mqp: very unscientific, just balancing our willingness to accept load
import {
  arraybeSchema,
  combinedProfileSchema,
  contentSchema,
  dateSchema,
  zBoolean,
} from 'common/api/zod-types'
import {
  AdminBlogPost,
  BLOG_POST_STATUSES,
  BLOG_POSTS_PER_PAGE,
  BLOG_SLUG_REGEX,
  BlogPost,
  BlogPostSummary,
  MAX_BLOG_EXCERPT_LENGTH,
  MAX_BLOG_NOTIFICATION_LENGTH,
  MAX_BLOG_SLUG_LENGTH,
  MAX_BLOG_TITLE_LENGTH,
  MIN_BLOG_SLUG_LENGTH,
  MIN_BLOG_TITLE_LENGTH,
} from 'common/blog/blog'
import {ChatMessage} from 'common/chat-message'
import {COMMENT_TYPES} from 'common/comment'
import {FeedItem, MAX_FEED_LIMIT} from 'common/feed/feed'
import {BAN_REASONS} from 'common/moderation/ban'
import {Notification} from 'common/notifications'
import {
  MAX_NEXT_ACTION_LENGTH,
  OUTREACH_STAGES,
  OutreachRow,
  OutreachStats,
} from 'common/outreach/outreach'
import {CompatibilityScore} from 'common/profiles/compatibility-score'
import {MAX_COMPATIBILITY_QUESTION_LENGTH, OPTION_TABLES} from 'common/profiles/constants'
import {Profile, ProfileRow, ProfileWithoutUser} from 'common/profiles/profile'
import {
  AdminSpotlight,
  HOME_SPOTLIGHT_LIMIT,
  MAX_SPOTLIGHT_ADMIN_NOTE_LENGTH,
  MAX_SPOTLIGHT_HEADLINE_LENGTH,
  MAX_SPOTLIGHT_QUOTE_CONTEXT_LENGTH,
  MAX_SPOTLIGHT_QUOTE_LENGTH,
  MAX_SPOTLIGHT_TAG_LENGTH,
  MAX_SPOTLIGHT_TAGS,
  MIN_SPOTLIGHT_QUOTE_LENGTH,
  PublicSpotlight,
  SPOTLIGHT_STATUSES,
  SpotlightCandidate,
} from 'common/profiles/spotlights'
import {ReferralCount, ReferralTree} from 'common/referrals'
import {RepoStats, Stats} from 'common/stats' // mqp: very unscientific, just balancing our willingness to accept load
import {PrivateMessageChannel} from 'common/supabase/private-messages'
import {Row} from 'common/supabase/utils'
import {
  MAX_MODERATOR_NOTE_LENGTH,
  MAX_TESTIMONIAL_BODY_LENGTH,
  MAX_TESTIMONIAL_HEADLINE_LENGTH,
  MIN_TESTIMONIAL_BODY_LENGTH,
  ModTestimonial,
  PublicTestimonial,
  TESTIMONIAL_STATUSES,
} from 'common/testimonials/testimonials'
import {PrivateUser, User} from 'common/user'
import {NOTIFICATION_PREFERENCE_TYPES} from 'common/user-notification-preferences'
import {arrify} from 'common/util/array'
import {STANCES, VOTE_STATUSES} from 'common/votes/constants'
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
   * Maximum request body size, as an `express.json({limit})` value (e.g. '20mb').
   * Only needed for endpoints carrying binary payloads such as base64-encoded audio.
   * @default '1mb'
   */
  bodyLimit?: string

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
   * Get open-source repository activity
   * Proxies a small slice of the GitHub API so the about page can evidence the "community owned"
   * claim. Proxied rather than called from the browser because unauthenticated GitHub is limited to
   * 60 requests/hour per IP, which a public page would exhaust.
   *
   * @returns Contributor / commit / star counts, or nulls when GitHub is unreachable
   */
  'repo-stats': {
    method: 'GET',
    authed: false,
    rateLimited: true,
    props: z.object({}),
    cache: 'public, max-age=3600',
    returns: {} as RepoStats,
    summary: 'Get open-source repository activity',
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
        // Why they are being banned; decides what the member is told. Defaults to a provisional
        // 'under_review' hold, so a moderator has to opt in to the permanent copy.
        reason: z.enum(BAN_REASONS).optional(),
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
        parentType: z.enum(['contract', 'post', 'user', 'vote']).optional(),
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
      type: z.enum(NOTIFICATION_PREFERENCE_TYPES),
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
        /**
         * A parting testimonial, offered when the stated reason is that they found someone here.
         *
         * Carried on the deletion call rather than posted separately because the account is destroyed
         * moments later: two calls means a window where the delete succeeds and the testimonial is
         * rejected for having no author, which loses the one thing worth keeping.
         */
        testimonial: z
          .object({
            body: z
              .string()
              .trim()
              .min(MIN_TESTIMONIAL_BODY_LENGTH)
              .max(MAX_TESTIMONIAL_BODY_LENGTH),
            headline: z.string().trim().max(MAX_TESTIMONIAL_HEADLINE_LENGTH).nullable().optional(),
            rating: z.number().int().min(1).max(5).nullable().optional(),
            showAuthor: zBoolean.optional(),
          })
          .strict()
          .optional(),
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
        orientation: arraybeSchema.optional(),
        neurotype: arraybeSchema.optional(),
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
        exercise: arraybeSchema.optional(),
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
        // `card` trims the response to the fields the profile grid renders, and replaces the
        // rich-text `bio` with a truncated `bio_snippet`. Defaults to `full` so existing API
        // consumers keep getting the complete row.
        projection: z.enum(['card', 'full']).optional().default('card'),
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
      // Which table the comment lives in. Defaults to 'profile' so existing callers keep working.
      commentType: z.enum(COMMENT_TYPES).optional(),
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
      leftMemberIdsByChannelId: {} as {[channelId: string]: string[]},
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
  'create-vote-comment': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      voteId: z.number(),
      content: contentSchema,
      replyToCommentId: z.string().optional(),
      stance: z.enum(STANCES).optional(),
    }),
    summary: 'Comment on a proposal',
    tag: 'Votes',
  },
  'update-vote-status': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as {status: string},
    props: z.object({
      voteId: z.number(),
      status: z.enum(VOTE_STATUSES),
    }),
    summary: "Set a proposal's status (admin only)",
    tag: 'Votes',
  },
  'edit-vote-comment': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as any,
    props: z.object({
      commentId: z.string(),
      content: contentSchema,
    }),
    summary: 'Edit your own comment on a proposal',
    tag: 'Votes',
  },
  'set-vote-mute': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    returns: {} as {muted: boolean},
    props: z.object({
      voteId: z.number(),
      muted: z.boolean(),
    }),
    summary: 'Mute or unmute notifications for a proposal discussion',
    tag: 'Votes',
  },
  'get-vote-mute': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    returns: {} as {muted: boolean},
    props: z.object({
      voteId: z.coerce.number(),
    }),
    summary: 'Whether the current user has muted a proposal discussion',
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
  'get-channels-count': {
    method: 'GET',
    authed: false,
    rateLimited: false,
    props: z.object({}),
    returns: {} as {count: number},
    summary: 'Get the total number of message channels (public endpoint)',
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
        // Where `content` came from. 'voice' means it is a speech transcript, so the LLM has to be
        // told to read past filler words and to write the bio itself rather than us storing the
        // transcript verbatim.
        source: z.enum(['text', 'url', 'voice']).optional(),
      })
      .strict(),
    returns: {} as {
      profile: Partial<ProfileWithoutUser>
      status: string
    },
    summary: 'Extract profile information from text using LLM',
    tag: 'Profiles',
  },
  'transcribe-audio': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    // Audio arrives base64-encoded in the JSON body, which is far bigger than the default 1mb.
    bodyLimit: '20mb',
    props: z
      .object({
        // Base64-encoded audio (no data: URI prefix).
        audio: z.string().min(1),
        // Recording container/codec as reported by MediaRecorder, e.g. 'audio/webm;codecs=opus'.
        mimeType: z.string().min(1),
        locale: z.string().optional(),
      })
      .strict(),
    returns: {} as {
      transcript: string
    },
    summary: 'Transcribe a voice recording to text',
    tag: 'Profiles',
  },
  'get-user-journeys': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({
      hoursFromNow: z.string(),
    }),
    returns: {} as {
      users: User[]
      events: Row<'user_events'>[]
    },
    summary: 'Get user journeys (events) for users created within the last N hours. Admin only.',
    tag: 'Admin',
  },
  'get-outreach-queue': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z
      .object({
        // Members with an existing thread are always returned in full. This caps only the
        // never-contacted bucket, which would otherwise be the entire member list on every load.
        newMemberLimit: z.coerce.number().min(1).max(100).optional(),
        // Skip the first few days after signup so a member has had time to fill their profile in
        // before being judged on how complete it is.
        minSignupDays: z.coerce.number().min(0).max(30).optional(),
      })
      .strict(),
    returns: {} as {rows: OutreachRow[]},
    summary: 'Get the member outreach queue. Admin only.',
    tag: 'Admin',
  },
  'get-outreach-stats': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    // Deliberately unparameterised: the queue's `newMemberLimit` decides how much of the directory is
    // worth paging through today, and letting it move these numbers would make a page-size control
    // look like a change in how outreach is going.
    props: z.object({}).strict(),
    returns: {} as OutreachStats,
    summary: 'Measured outcome rates per outreach stage and per automated send. Admin only.',
    tag: 'Admin',
  },
  'get-my-referrals': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({}).strict(),
    returns: {} as {
      count: number
      members: {
        id: string
        name: string
        username: string
        avatarUrl: string | null
        joinedTime: string
      }[]
    },
    summary: 'The members who joined from your referral link.',
    tag: 'Users',
  },
  'get-my-referral-count': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({}).strict(),
    returns: {} as ReferralCount,
    // Private and short. The sidebar badge asks for this on every page, and the in-memory cache only
    // stops the *flicker* — it still re-fetches on each navigation. Sixty seconds of browser cache
    // makes moving around the site cost nothing, and is short enough that a count which changed
    // while you were reading catches up on its own.
    cache: 'private, max-age=60',
    summary: 'How many people are on Compass because of you.',
    tag: 'Users',
  },
  'get-referral-tree': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({}).strict(),
    returns: {} as ReferralTree,
    summary: 'Everyone who is on Compass because of you, recursively.',
    tag: 'Users',
  },
  'update-outreach-contact': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z
      .object({
        userId: z.string(),
        stage: z.enum(OUTREACH_STAGES).nullable().optional(),
        nextAction: z.string().max(MAX_NEXT_ACTION_LENGTH).nullable().optional(),
      })
      .strict(),
    summary: 'Set the outreach stage or next action for a member. Admin only.',
    tag: 'Admin',
  },
  'get-search-alert': {
    method: 'GET',
    authed: true,
    rateLimited: true,
    props: z.object({id: z.coerce.number()}).strict(),
    returns: {} as {
      profiles: Profile[]
      /** The saved searches that matched, for naming what this alert was. Deleted ones are dropped. */
      searches: {id: number; name: string | null; filters: any; location: any}[]
      createdTime: number
      /** Members the alert named who are no longer visible — deleted, disabled or banned since. */
      goneCount: number
    },
    summary: 'The people one saved-search alert was about. Owner only.',
    tag: 'Search',
  },
  'create-outreach-search': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z.object({userId: z.string()}).strict(),
    returns: {} as {searchId: number},
    summary:
      'Save a search on a member’s behalf, built from the preferences already on their profile. Admin only.',
    tag: 'Admin',
  },
  'get-profile-feed': {
    method: 'GET',
    authed: false,
    rateLimited: true,
    props: z
      .object({
        // Country *name* as stored on `profiles.country` ("Italy"), matched case-insensitively — there
        // is no country-code column. Per-country feeds matter more than one global one here: the
        // bottleneck is local density, and a scattered worldwide firehose reads as growth while every
        // city stays as empty as it was.
        country: z.string().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(MAX_FEED_LIMIT).optional(),
      })
      .strict(),
    returns: {} as {items: FeedItem[]},
    // Rendered into RSS by web's /feed.xml, which no one polls more than a few times an hour.
    cache: 'public, max-age=600, stale-while-revalidate=3600',
    summary:
      'Newest public profiles that allow syndication, projected down to each member’s feed_visibility level.',
    tag: 'Profiles',
  },
  'get-testimonials': {
    method: 'GET',
    authed: false,
    rateLimited: true,
    props: z.object({}).strict(),
    returns: {} as {testimonials: PublicTestimonial[]},
    // The wall is the same for everyone and changes only when a moderator acts, so it is worth a real
    // cache. The cost is that a freshly approved testimonial can take a minute to appear publicly.
    cache: 'public, max-age=60, stale-while-revalidate=300',
    summary: 'Get every approved testimonial, most featured first.',
    tag: 'Testimonials',
  },
  'get-testimonials-mod': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z
      .object({
        // Omitted means every status, which is what the moderation queue wants.
        status: z.enum(TESTIMONIAL_STATUSES).optional(),
      })
      .strict(),
    returns: {} as {testimonials: ModTestimonial[]},
    // Deliberately a separate endpoint from `get-testimonials` rather than a flag on it: that one is
    // CDN-cached under a public key, and a moderator's response landing in that cache would serve
    // unpublished testimonials to everyone.
    summary: 'Get testimonials in any state, with moderation fields. Mods and admins only.',
    tag: 'Testimonials',
  },
  'create-testimonial': {
    method: 'POST',
    authed: true,
    rateLimited: true,
    props: z
      .object({
        body: z.string().trim().min(MIN_TESTIMONIAL_BODY_LENGTH).max(MAX_TESTIMONIAL_BODY_LENGTH),
        headline: z.string().trim().max(MAX_TESTIMONIAL_HEADLINE_LENGTH).nullable().optional(),
        rating: z.number().int().min(1).max(5).nullable().optional(),
        /** False publishes the words without the name. */
        showAuthor: zBoolean.optional(),
      })
      .strict(),
    returns: {} as {status: 'pending'},
    summary: 'Submit a testimonial for moderation.',
    tag: 'Testimonials',
  },
  'update-testimonial-status': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z
      .object({
        id: z.number().int(),
        status: z.enum(TESTIMONIAL_STATUSES).optional(),
        // Higher floats to the top of the wall; null returns it to plain reverse-chronological order.
        featuredRank: z.number().int().min(0).max(1000).nullable().optional(),
        moderatorNote: z.string().max(MAX_MODERATOR_NOTE_LENGTH).nullable().optional(),
      })
      .strict(),
    summary: 'Approve, reject, hide or feature a testimonial. Mods and admins only.',
    tag: 'Testimonials',
  },
  'get-spotlights': {
    method: 'GET',
    authed: false,
    rateLimited: true,
    props: z
      .object({
        limit: z.coerce.number().int().min(1).max(HOME_SPOTLIGHT_LIMIT).optional(),
      })
      .strict(),
    returns: {} as {spotlights: PublicSpotlight[]},
    // Same shape of cache as the testimonials wall: identical for everyone, changes only when an admin
    // acts. Kept short because withdrawing consent has to take effect quickly — a member who unticks
    // the box should not stay on the front page for an hour.
    cache: 'public, max-age=60, stale-while-revalidate=300',
    summary: 'Get the live member spotlights for the home page, most featured first.',
    tag: 'Spotlights',
  },
  'get-spotlights-admin': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({}).strict(),
    returns: {} as {spotlights: AdminSpotlight[]; candidates: SpotlightCandidate[]},
    // Separate endpoint rather than a flag on `get-spotlights`, for the same reason the testimonials
    // pair is split: that one is CDN-cached under a public key, and an admin response landing in it
    // would serve drafts — and the candidate list, which is a roster of consenting members — to
    // everyone.
    summary: 'Every spotlight in any state, plus consenting members without one. Admins only.',
    tag: 'Spotlights',
  },
  'create-spotlight': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z
      .object({
        userId: z.string(),
        // The editorial fields. Everything else on the card (name, age, city, photo, headline) is
        // snapshotted from the live profile by the handler and is not client-supplied — an admin
        // typing a member's details by hand is how a spotlight ends up saying something the profile
        // never said.
        quote: z.string().trim().min(MIN_SPOTLIGHT_QUOTE_LENGTH).max(MAX_SPOTLIGHT_QUOTE_LENGTH),
        quoteContext: z
          .string()
          .trim()
          .max(MAX_SPOTLIGHT_QUOTE_CONTEXT_LENGTH)
          .nullable()
          .optional(),
        tags: z
          .array(z.string().trim().min(1).max(MAX_SPOTLIGHT_TAG_LENGTH))
          .max(MAX_SPOTLIGHT_TAGS)
          .optional(),
        adminNote: z.string().max(MAX_SPOTLIGHT_ADMIN_NOTE_LENGTH).nullable().optional(),
      })
      .strict(),
    returns: {} as {spotlight: AdminSpotlight},
    summary: 'Snapshot a consenting member’s profile into a draft spotlight. Admins only.',
    tag: 'Spotlights',
  },
  'update-spotlight': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z
      .object({
        id: z.number().int(),
        status: z.enum(SPOTLIGHT_STATUSES).optional(),
        // Higher floats to the front of the rail; null returns it to newest-first.
        featuredRank: z.number().int().min(0).max(1000).nullable().optional(),
        quote: z
          .string()
          .trim()
          .min(MIN_SPOTLIGHT_QUOTE_LENGTH)
          .max(MAX_SPOTLIGHT_QUOTE_LENGTH)
          .optional(),
        quoteContext: z
          .string()
          .trim()
          .max(MAX_SPOTLIGHT_QUOTE_CONTEXT_LENGTH)
          .nullable()
          .optional(),
        headline: z.string().trim().max(MAX_SPOTLIGHT_HEADLINE_LENGTH).nullable().optional(),
        tags: z
          .array(z.string().trim().min(1).max(MAX_SPOTLIGHT_TAG_LENGTH))
          .max(MAX_SPOTLIGHT_TAGS)
          .optional(),
        adminNote: z.string().max(MAX_SPOTLIGHT_ADMIN_NOTE_LENGTH).nullable().optional(),
        /**
         * Re-read name, age, city, country, photo and headline from the live profile and re-stamp
         * `captured_time`. The escape hatch for "they changed their photo and asked us to update it" —
         * explicit, admin-triggered, and never automatic, which is the entire point of the table.
         */
        refreshSnapshot: zBoolean.optional(),
      })
      .strict(),
    returns: {} as {spotlight: AdminSpotlight},
    summary: 'Edit, re-snapshot, publish or take down a spotlight. Admins only.',
    tag: 'Spotlights',
  },
  'get-blog-posts': {
    method: 'GET',
    authed: false,
    rateLimited: true,
    props: z
      .object({
        limit: z.coerce.number().int().min(1).max(BLOG_POSTS_PER_PAGE).optional(),
        offset: z.coerce.number().int().min(0).optional(),
      })
      .strict(),
    returns: {} as {posts: BlogPostSummary[]},
    // The list is identical for everyone and changes only when an admin publishes, so it caches like
    // the testimonials wall. Longer than that one, though: nothing here is consent-gated, so there is
    // no revocation that has to take effect within the minute.
    cache: 'public, max-age=300, stale-while-revalidate=3600',
    summary: 'The published blog posts, newest first. Bodies are not included.',
    tag: 'Blog',
  },
  'get-blog-post': {
    method: 'GET',
    authed: false,
    rateLimited: true,
    props: z
      .object({
        slug: z.string().max(MAX_BLOG_SLUG_LENGTH),
      })
      .strict(),
    returns: {} as {post: BlogPost | null},
    // `null` rather than a 404 for a slug that does not exist, so that the page can render its own
    // not-found state and Next can still statically generate the route.
    cache: 'public, max-age=300, stale-while-revalidate=3600',
    summary: 'One published blog post by slug, body included. Null if there is no such post.',
    tag: 'Blog',
  },
  'get-blog-posts-admin': {
    method: 'GET',
    authed: true,
    rateLimited: false,
    props: z.object({}).strict(),
    returns: {} as {posts: AdminBlogPost[]},
    // Separate endpoint rather than a flag on `get-blog-posts`, for the same reason the testimonials
    // and spotlights pairs are split: that one is CDN-cached under a public key, and an admin
    // response landing in it would serve every unpublished draft to everyone.
    summary: 'Every blog post in any state, bodies included. Admins only.',
    tag: 'Blog',
  },
  'create-blog-post': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z
      .object({
        // Validated against the same regex as the CHECK constraint on the column. Refused rather
        // than silently slugified: this is the post's permanent URL, and quietly rewriting what an
        // admin typed is how you end up with a link in a notification that goes nowhere.
        slug: z
          .string()
          .trim()
          .min(MIN_BLOG_SLUG_LENGTH)
          .max(MAX_BLOG_SLUG_LENGTH)
          .regex(BLOG_SLUG_REGEX, 'Lowercase letters, digits and single dashes only'),
        title: z.string().trim().min(MIN_BLOG_TITLE_LENGTH).max(MAX_BLOG_TITLE_LENGTH),
        excerpt: z.string().trim().max(MAX_BLOG_EXCERPT_LENGTH).nullable().optional(),
        content: contentSchema.optional(),
        coverImageUrl: z.string().url().nullable().optional(),
      })
      .strict(),
    returns: {} as {post: AdminBlogPost},
    summary: 'Create a blog post as a draft. Admins only.',
    tag: 'Blog',
  },
  'update-blog-post': {
    method: 'POST',
    authed: true,
    rateLimited: false,
    props: z
      .object({
        id: z.number().int(),
        // Every field independently optional, the same contract as `update-spotlight`: the publish
        // button sends only a status, the editor sends only the body. `undefined` leaves a column
        // alone and `null` clears it.
        slug: z
          .string()
          .trim()
          .min(MIN_BLOG_SLUG_LENGTH)
          .max(MAX_BLOG_SLUG_LENGTH)
          .regex(BLOG_SLUG_REGEX, 'Lowercase letters, digits and single dashes only')
          .optional(),
        title: z.string().trim().min(MIN_BLOG_TITLE_LENGTH).max(MAX_BLOG_TITLE_LENGTH).optional(),
        excerpt: z.string().trim().max(MAX_BLOG_EXCERPT_LENGTH).nullable().optional(),
        content: contentSchema.optional(),
        coverImageUrl: z.string().url().nullable().optional(),
        status: z.enum(BLOG_POST_STATUSES).optional(),
        /**
         * The body of the in-app notification sent to every member. The title is the post's own
         * title, so only the message is typed here.
         *
         * Sending is gated on three things at once in the handler: this being present, the post
         * ending the update `published`, and no broadcast having gone out before. Passing it is
         * therefore a request, not a command — the point being that "publish" and "tell 1,200
         * people" are one action from the admin's side and must never be two by accident.
         */
        notificationText: z.string().trim().min(1).max(MAX_BLOG_NOTIFICATION_LENGTH).optional(),
      })
      .strict(),
    returns: {} as {post: AdminBlogPost; notifiedCount: number},
    summary: 'Edit, publish, notify about, or take down a blog post. Admins only.',
    tag: 'Blog',
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
