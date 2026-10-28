import {createPrivateUserMessageChannel} from 'api/create-private-user-message-channel'
import {getConnectionInterests} from 'api/get-connection-interests'
import {AuthedUser} from 'api/helpers/endpoint'
import * as privateMessageModules from 'api/helpers/private-messages'
import {sendDiscordMessage} from 'common/discord/core'
import * as constants from 'common/envs/constants'
import {
  AUTO_BAN_UNDER_REVIEW_CODE,
  BURST_WINDOW_MINUTES,
  MAX_NEW_CHANNELS_PER_BURST,
  MAX_NEW_CHANNELS_PER_DAY,
} from 'common/moderation/ban'
import {
  MIN_ANSWERS_TO_MESSAGE,
  MIN_BIO_CHARS_TO_MESSAGE,
  PROFILE_INCOMPLETE_CODE,
} from 'common/moderation/first-message'
import {sqlMatch} from 'common/test-utils'
import * as utilArrayModules from 'common/util/array'
import * as admin from 'firebase-admin'
import * as supabaseInit from 'shared/supabase/init'
import {updateUser} from 'shared/supabase/users'
import * as sharedUtils from 'shared/utils'

jest.mock('shared/supabase/init')
// Keep the real constants (DOMAIN, ...) but stub the staff checks: `isAdminId` returns true for
// everyone when running locally, which would otherwise exempt the test user from the spam guard.
jest.mock('common/envs/constants', () => ({
  ...jest.requireActual('common/envs/constants'),
  isAdminId: jest.fn(),
  isModUsername: jest.fn(),
}))
jest.mock('common/util/array')
jest.mock('api/get-connection-interests')
jest.mock('common/discord/core')
jest.mock('api/helpers/private-messages')
jest.mock('shared/supabase/users')
jest.mock('shared/utils')
jest.mock('firebase-admin', () => ({
  auth: jest.fn(),
}))

// The profile-gate row for a sender who has done their part. `oneOrNone` serves three different
// queries in this handler (the recipient's profile, the existing-channel lookup, and this), so the
// fake answers by SQL rather than by call order.
const completeProfile = {
  bio_chars: `${MIN_BIO_CHARS_TO_MESSAGE}`,
  answers: `${MIN_ANSWERS_TO_MESSAGE}`,
}
const oneOrNoneWith = (ownProfile: unknown, fallback: unknown) =>
  jest.fn((sql: string) => Promise.resolve(sql.includes('bio_chars') ? ownProfile : fallback))

describe('createPrivateUserMessageChannel', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      oneOrNone: jest.fn(),
      one: jest.fn(),
      none: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
    ;(admin.auth as jest.Mock).mockReturnValue({
      getUser: jest.fn().mockResolvedValue({emailVerified: true}),
    })
    ;(constants.isAdminId as jest.Mock).mockReturnValue(false)
    ;(constants.isModUsername as jest.Mock).mockReturnValue(false)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should successfully create a private user message channel (currentChannel)', async () => {
      const mockBody = {
        userIds: ['123'],
      }
      const mockUserIds = ['123', '321']
      const mockPrivateUsers = [
        {
          id: '123',
          blockedUserIds: ['111'],
          blockedByUserIds: [],
        },
        {
          id: '321',
          blockedUserIds: ['111'],
          blockedByUserIds: [],
        },
      ]
      const mockCurrentChannel = {
        channel_id: '444',
        allow_direct_messaging: true,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockCreator = {
        is_banned_from_posting: false,
      }

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockCreator)
      ;(utilArrayModules.filterDefined as jest.Mock).mockReturnValue(mockPrivateUsers)
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockCurrentChannel)

      const results = await createPrivateUserMessageChannel(mockBody, mockAuth, mockReq)

      expect(results.status).toBe('success')
      expect(results.channelId).toBe(444)
      expect(sharedUtils.getUser).toBeCalledTimes(1)
      expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid)
      expect(sharedUtils.getPrivateUser).toBeCalledTimes(2)
      expect(sharedUtils.getPrivateUser).toBeCalledWith(mockUserIds[0])
      expect(sharedUtils.getPrivateUser).toBeCalledWith(mockUserIds[1])
      expect(mockPg.oneOrNone).toBeCalledTimes(3)
      expect(mockPg.oneOrNone).toBeCalledWith(
        sqlMatch('select channel_id from private_user_message_channel_members'),
        [mockUserIds],
      )
    })

    it('should successfully create a private user message channel (channel)', async () => {
      const mockBody = {
        userIds: ['123'],
      }
      const mockUserIds = ['123', '321']
      const mockPrivateUsers = [
        {
          id: '123',
          blockedUserIds: ['111'],
          blockedByUserIds: [],
        },
        {
          id: '321',
          blockedUserIds: ['111'],
          blockedByUserIds: [],
        },
      ]
      const mockChannel = {
        id: '333',
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockCreator = {
        is_banned_from_posting: false,
      }

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockCreator)
      ;(utilArrayModules.filterDefined as jest.Mock).mockReturnValue(mockPrivateUsers)
      mockPg.oneOrNone = oneOrNoneWith(completeProfile, false)
      // First pg.one is the recent-channel count (under limit), second is the channel insert.
      ;(mockPg.one as jest.Mock)
        .mockResolvedValueOnce({burst_count: '0', day_count: '0'})
        .mockResolvedValueOnce(mockChannel)

      const results = await createPrivateUserMessageChannel(mockBody, mockAuth, mockReq)

      expect(results.status).toBe('success')
      expect(results.channelId).toBe(333)
      expect(sharedUtils.getUser).toBeCalledTimes(1)
      expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid)
      expect(sharedUtils.getPrivateUser).toBeCalledTimes(2)
      expect(sharedUtils.getPrivateUser).toBeCalledWith(mockUserIds[0])
      expect(sharedUtils.getPrivateUser).toBeCalledWith(mockUserIds[1])
      expect(updateUser).not.toHaveBeenCalled()
      expect(sendDiscordMessage).not.toHaveBeenCalled()
      expect(mockPg.one).toBeCalledTimes(2)
      expect(mockPg.one).toBeCalledWith(
        sqlMatch(
          'insert into private_user_message_channels default\n     values\n     returning id',
        ),
      )
      expect(mockPg.none).toBeCalledTimes(1)
      expect(mockPg.none).toBeCalledWith(
        sqlMatch(
          'insert into private_user_message_channel_members (channel_id, user_id, role, status)',
        ),
        [mockChannel.id, mockAuth.uid],
      )
      expect(privateMessageModules.addUsersToPrivateMessageChannel).toBeCalledTimes(1)
      expect(privateMessageModules.addUsersToPrivateMessageChannel).toBeCalledWith(
        [mockUserIds[0]],
        mockChannel.id,
        expect.any(Object),
      )
    })
  })

  describe('when the daily new-conversation limit is exceeded', () => {
    const mockBody = {userIds: ['123']}
    const mockAuth = {uid: '321'} as AuthedUser
    const mockReq = {} as any
    const mockPrivateUsers = [
      {id: '123', blockedUserIds: [], blockedByUserIds: []},
      {id: '321', blockedUserIds: [], blockedByUserIds: []},
    ]
    const mockCreator = {
      id: '321',
      name: 'Spammy McSpam',
      username: 'spammy',
      isBannedFromPosting: false,
    }

    beforeEach(() => {
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockCreator)
      ;(utilArrayModules.filterDefined as jest.Mock).mockReturnValue(mockPrivateUsers)
      // getProfile + no-existing-channel lookups both return falsy.
      mockPg.oneOrNone = oneOrNoneWith(completeProfile, null)
    })

    it('bans the user and notifies admins on the conversation past the daily limit', async () => {
      // Already at the limit in the last 24h → this new one is over it.
      ;(mockPg.one as jest.Mock).mockResolvedValueOnce({
        burst_count: '0',
        day_count: `${MAX_NEW_CHANNELS_PER_DAY}`,
      })
      ;(sendDiscordMessage as jest.Mock).mockResolvedValue(null)

      await expect(
        createPrivateUserMessageChannel(mockBody, mockAuth, mockReq),
      ).rejects.toThrowError(/temporarily on hold/)

      expect(updateUser).toHaveBeenCalledWith(mockAuth.uid, {
        isBannedFromPosting: true,
        banReason: 'auto_rate_limit',
      })
      expect(sendDiscordMessage).toHaveBeenCalledTimes(1)
      expect(sendDiscordMessage).toHaveBeenCalledWith(
        expect.stringContaining('Auto-ban'),
        'reports',
      )
      // The count query runs, but the channel is never created once the user is banned.
      expect(mockPg.one).toHaveBeenCalledTimes(1)
      expect(privateMessageModules.addUsersToPrivateMessageChannel).not.toHaveBeenCalled()
    })

    it('bans the user on the conversation past the burst limit, even under the daily one', async () => {
      // A burst: already at the burst limit, well under the daily one.
      ;(mockPg.one as jest.Mock).mockResolvedValueOnce({
        burst_count: `${MAX_NEW_CHANNELS_PER_BURST}`,
        day_count: `${MAX_NEW_CHANNELS_PER_BURST}`,
      })
      ;(sendDiscordMessage as jest.Mock).mockResolvedValue(null)

      const error = await createPrivateUserMessageChannel(mockBody, mockAuth, mockReq).catch(
        (e) => e,
      )

      expect(error.message).toContain(`past ${BURST_WINDOW_MINUTES} minutes`)
      expect(error.details).toMatchObject({context: AUTO_BAN_UNDER_REVIEW_CODE})
      expect(updateUser).toHaveBeenCalledWith(mockAuth.uid, {
        isBannedFromPosting: true,
        banReason: 'auto_rate_limit',
      })
      expect(sendDiscordMessage).toHaveBeenCalledWith(
        expect.stringContaining(
          `within ${BURST_WINDOW_MINUTES}min (limit ${MAX_NEW_CHANNELS_PER_BURST})`,
        ),
        'reports',
      )
      expect(mockPg.one).toHaveBeenCalledTimes(1)
      expect(privateMessageModules.addUsersToPrivateMessageChannel).not.toHaveBeenCalled()
    })

    it('tags the error so the client can show the "under review" explanation', async () => {
      ;(mockPg.one as jest.Mock).mockResolvedValueOnce({
        burst_count: '0',
        day_count: `${MAX_NEW_CHANNELS_PER_DAY}`,
      })
      ;(sendDiscordMessage as jest.Mock).mockResolvedValue(null)

      const error = await createPrivateUserMessageChannel(mockBody, mockAuth, mockReq).catch(
        (e) => e,
      )

      expect(error.code).toBe(403)
      expect(error.details).toMatchObject({context: AUTO_BAN_UNDER_REVIEW_CODE})
    })

    it('still bans when the Discord notification fails', async () => {
      ;(mockPg.one as jest.Mock).mockResolvedValueOnce({
        burst_count: '0',
        day_count: `${MAX_NEW_CHANNELS_PER_DAY}`,
      })
      ;(sendDiscordMessage as jest.Mock).mockRejectedValue(new Error('Discord down'))
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await expect(
        createPrivateUserMessageChannel(mockBody, mockAuth, mockReq),
      ).rejects.toThrowError(/temporarily on hold/)

      expect(updateUser).toHaveBeenCalledWith(mockAuth.uid, {
        isBannedFromPosting: true,
        banReason: 'auto_rate_limit',
      })
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send auto-ban discord report'),
        expect.any(Error),
      )
    })

    it.each([
      ['an admin', 'isAdminId'],
      ['a moderator', 'isModUsername'],
    ])('never bans %s, however many conversations they start', async (_label, staffCheck) => {
      ;((constants as any)[staffCheck] as jest.Mock).mockReturnValue(true)
      ;(mockPg.one as jest.Mock).mockResolvedValueOnce({id: '333'})

      const results = await createPrivateUserMessageChannel(mockBody, mockAuth, mockReq)

      expect(results.status).toBe('success')
      expect(updateUser).not.toHaveBeenCalled()
      expect(sendDiscordMessage).not.toHaveBeenCalled()
      // The recent-channel count query is skipped entirely: the only pg.one is the channel insert.
      expect(mockPg.one).toHaveBeenCalledTimes(1)
      expect(privateMessageModules.addUsersToPrivateMessageChannel).toHaveBeenCalledTimes(1)
    })

    it('does not ban when still under the limit', async () => {
      // One short of the limit → this one is still allowed; second pg.one is the channel insert.
      ;(mockPg.one as jest.Mock)
        .mockResolvedValueOnce({
          burst_count: `${MAX_NEW_CHANNELS_PER_BURST - 1}`,
          day_count: `${MAX_NEW_CHANNELS_PER_DAY - 1}`,
        })
        .mockResolvedValueOnce({id: '333'})

      const results = await createPrivateUserMessageChannel(mockBody, mockAuth, mockReq)

      expect(results.status).toBe('success')
      expect(updateUser).not.toHaveBeenCalled()
      expect(sendDiscordMessage).not.toHaveBeenCalled()
      expect(privateMessageModules.addUsersToPrivateMessageChannel).toHaveBeenCalledTimes(1)
    })
  })

  describe('the profile gate', () => {
    const mockBody = {userIds: ['123']}
    const mockAuth = {uid: '321'} as AuthedUser
    const mockReq = {} as any
    const mockPrivateUsers = [
      {id: '123', blockedUserIds: [], blockedByUserIds: []},
      {id: '321', blockedUserIds: [], blockedByUserIds: []},
    ]

    beforeEach(() => {
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue({id: '321', username: 'newbie'})
      ;(utilArrayModules.filterDefined as jest.Mock).mockReturnValue(mockPrivateUsers)
    })

    it('refuses a sender with no bio, naming what is missing', async () => {
      mockPg.oneOrNone = oneOrNoneWith({bio_chars: '0', answers: `${MIN_ANSWERS_TO_MESSAGE}`}, null)

      const error = await createPrivateUserMessageChannel(mockBody, mockAuth, mockReq).catch(
        (e) => e,
      )

      expect(error.code).toBe(403)
      expect(error.message).toContain(`bio of at least ${MIN_BIO_CHARS_TO_MESSAGE} characters`)
      expect(error.details).toMatchObject({
        context: PROFILE_INCOMPLETE_CODE,
        bio: true,
        answers: false,
      })
      expect(mockPg.one).not.toHaveBeenCalled()
      expect(privateMessageModules.addUsersToPrivateMessageChannel).not.toHaveBeenCalled()
    })

    it('refuses a sender with too few compatibility answers', async () => {
      mockPg.oneOrNone = oneOrNoneWith(
        {bio_chars: `${MIN_BIO_CHARS_TO_MESSAGE}`, answers: `${MIN_ANSWERS_TO_MESSAGE - 1}`},
        null,
      )

      const error = await createPrivateUserMessageChannel(mockBody, mockAuth, mockReq).catch(
        (e) => e,
      )

      expect(error.details).toMatchObject({
        context: PROFILE_INCOMPLETE_CODE,
        bio: false,
        answers: true,
      })
    })

    it('treats a member with no profile row as having nothing filled in', async () => {
      mockPg.oneOrNone = oneOrNoneWith(null, null)

      const error = await createPrivateUserMessageChannel(mockBody, mockAuth, mockReq).catch(
        (e) => e,
      )

      // The answers rule is tunable down to zero, at which point nobody can fail it.
      expect(error.details).toMatchObject({
        context: PROFILE_INCOMPLETE_CODE,
        bio: true,
        answers: MIN_ANSWERS_TO_MESSAGE > 0,
      })
    })

    it('does not touch a conversation that already exists', async () => {
      // Existing channel → returned before the gate is consulted, whatever the profile looks like.
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue({
        channel_id: '444',
        allow_direct_messaging: true,
      })

      const results = await createPrivateUserMessageChannel(mockBody, mockAuth, mockReq)

      expect(results.channelId).toBe(444)
    })

    it('exempts staff', async () => {
      ;(constants.isModUsername as jest.Mock).mockReturnValue(true)
      mockPg.oneOrNone = oneOrNoneWith(null, null)
      ;(mockPg.one as jest.Mock).mockResolvedValueOnce({id: '333'})

      const results = await createPrivateUserMessageChannel(mockBody, mockAuth, mockReq)

      expect(results.status).toBe('success')
    })
  })

  describe('when an error occurs', () => {
    it('should throw if user email is not verified', async () => {
      const mockBody = {
        userIds: ['123'],
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(admin.auth as jest.Mock).mockReturnValue({
        getUser: jest.fn().mockResolvedValue({emailVerified: false}),
      })

      expect(createPrivateUserMessageChannel(mockBody, mockAuth, mockReq)).rejects.toThrowError(
        'You must verify your email to contact people.',
      )

      expect(admin.auth().getUser).toHaveBeenCalledWith(mockAuth.uid)
    })

    it('should throw if the user account doesnt exist', async () => {
      const mockBody = {
        userIds: ['123'],
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(false)

      expect(createPrivateUserMessageChannel(mockBody, mockAuth, mockReq)).rejects.toThrowError(
        'Your account was not found',
      )
    })

    it('should throw if the authId is banned from posting', async () => {
      const mockBody = {
        userIds: ['123'],
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockCreator = {
        isBannedFromPosting: true,
      }

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockCreator)

      expect(createPrivateUserMessageChannel(mockBody, mockAuth, mockReq)).rejects.toThrowError(
        'Your account has been suspended',
      )
    })

    it('should throw if the array lengths dont match (privateUsers, userIds)', async () => {
      const mockBody = {
        userIds: ['123'],
      }
      const mockPrivateUsers = [
        {
          id: '123',
          blockedUserIds: ['111'],
          blockedByUserIds: [],
        },
      ]
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockCreator = {
        isBannedFromPosting: false,
      }

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockCreator)
      ;(utilArrayModules.filterDefined as jest.Mock).mockReturnValue(mockPrivateUsers)

      expect(createPrivateUserMessageChannel(mockBody, mockAuth, mockReq)).rejects.toThrowError(
        `Private user ${mockAuth.uid} not found`,
      )
    })

    it('should throw if the recipient has disabled direct messaging', async () => {
      const mockBody = {
        userIds: ['123'],
      }
      const mockPrivateUsers = [
        {id: '123', blockedUserIds: [], blockedByUserIds: []},
        {id: '321', blockedUserIds: [], blockedByUserIds: []},
      ]
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue({
        username: 'recipient',
        isBannedFromPosting: false,
      })
      ;(utilArrayModules.filterDefined as jest.Mock).mockReturnValue(mockPrivateUsers)
      // The first oneOrNone is getProfile for user '123'.
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValueOnce({allow_direct_messaging: false})
      // No shared connection interest, so there is nothing to override the preference.
      ;(getConnectionInterests as jest.Mock).mockResolvedValue({interests: [], targetInterests: []})

      await expect(
        createPrivateUserMessageChannel(mockBody, mockAuth, mockReq),
      ).rejects.toThrowError('recipient has disabled direct messaging')
    })

    it('lets an admin message someone who has disabled direct messaging', async () => {
      const mockBody = {
        userIds: ['123'],
      }
      const mockPrivateUsers = [
        {id: '123', blockedUserIds: [], blockedByUserIds: []},
        {id: '321', blockedUserIds: [], blockedByUserIds: []},
      ]
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(constants.isAdminId as jest.Mock).mockReturnValue(true)
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue({
        username: 'admin',
        isBannedFromPosting: false,
      })
      ;(utilArrayModules.filterDefined as jest.Mock).mockReturnValue(mockPrivateUsers)
      // Only the existing-channel lookup runs: the direct-messaging check is skipped entirely, so
      // getProfile is never consulted.
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue({channel_id: '444'})

      const results = await createPrivateUserMessageChannel(mockBody, mockAuth, mockReq)

      expect(results.status).toBe('success')
      expect(results.channelId).toBe(444)
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(getConnectionInterests).not.toBeCalled()
    })

    it('should throw if there is a blocked user in the userId list', async () => {
      const mockBody = {
        userIds: ['123'],
      }
      const mockPrivateUsers = [
        {
          id: '123',
          blockedUserIds: ['111'],
          blockedByUserIds: [],
        },
        {
          id: '321',
          blockedUserIds: ['123'],
          blockedByUserIds: [],
        },
      ]
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockCreator = {
        isBannedFromPosting: false,
      }

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockCreator)
      ;(utilArrayModules.filterDefined as jest.Mock).mockReturnValue(mockPrivateUsers)

      expect(createPrivateUserMessageChannel(mockBody, mockAuth, mockReq)).rejects.toThrowError(
        `One of the users has blocked another user in the list`,
      )
    })
  })
})
