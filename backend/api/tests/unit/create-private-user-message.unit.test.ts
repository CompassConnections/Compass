jest.mock('shared/utils')
jest.mock('shared/supabase/init')
jest.mock('api/helpers/private-messages')
jest.mock('api/helpers/first-message')
// Keep the real constants but stub the staff checks: `isAdminId` returns true for everyone when
// running locally, which would otherwise exempt the test user from the first-message rules.
jest.mock('common/envs/constants', () => ({
  ...jest.requireActual('common/envs/constants'),
  isAdminId: jest.fn(),
  isModUsername: jest.fn(),
}))

import {MAX_COMMENT_JSON_LENGTH} from 'api/create-comment'
import {createPrivateUserMessage} from 'api/create-private-user-message'
import {AuthedUser} from 'api/helpers/endpoint'
import * as firstMessage from 'api/helpers/first-message'
import * as helpersPrivateMessagesModules from 'api/helpers/private-messages'
import * as constants from 'common/envs/constants'
import * as supabaseInit from 'shared/supabase/init'
import * as sharedUtils from 'shared/utils'

const OTHER_USER_ID = '111'

describe('createPrivateUserMessage', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    // The handler now looks up the channel's other members to enforce blocks, so the fake client
    // needs `manyOrNone`. Default: a single other member who has not blocked anyone.
    const mockPg = {
      manyOrNone: jest.fn().mockResolvedValue([{user_id: OTHER_USER_ID}]),
    } as any

    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
    ;(sharedUtils.getPrivateUser as jest.Mock).mockResolvedValue({
      id: OTHER_USER_ID,
      blockedUserIds: [],
      blockedByUserIds: [],
    })
    ;(constants.isAdminId as jest.Mock).mockReturnValue(false)
    ;(constants.isModUsername as jest.Mock).mockReturnValue(false)
    // Default: the channel already has messages, so nothing here is an opener.
    ;(firstMessage.isOpener as jest.Mock).mockResolvedValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('successfully create a private user message', async () => {
      const mockBody = {
        content: {'': 'x'.repeat(MAX_COMMENT_JSON_LENGTH - 8)},
        channelId: 123,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockCreator = {
        id: mockAuth.uid,
        is_banned_from_posting: false,
      }

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockCreator)

      await createPrivateUserMessage(mockBody, mockAuth, mockReq)

      expect(sharedUtils.getUser).toBeCalledTimes(1)
      expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid)
      expect(helpersPrivateMessagesModules.createPrivateUserMessageMain).toBeCalledTimes(1)
      expect(helpersPrivateMessagesModules.createPrivateUserMessageMain).toBeCalledWith(
        mockCreator,
        mockBody.channelId,
        mockBody.content,
        expect.any(Object),
        'private',
      )
    })
  })
  describe('the first-message rules', () => {
    const mockAuth = {uid: '321'} as AuthedUser
    const body = {content: {a: 'b'}, channelId: 123}

    beforeEach(() => {
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue({id: mockAuth.uid, username: 'sam'})
    })

    it('checks the opener of a 1:1 conversation before sending it', async () => {
      ;(firstMessage.isOpener as jest.Mock).mockResolvedValue(true)
      await createPrivateUserMessage(body, mockAuth, {} as any)
      expect(firstMessage.assertAcceptableOpener).toBeCalledWith(
        expect.any(Object),
        expect.objectContaining({id: mockAuth.uid}),
        OTHER_USER_ID,
        body.content,
      )
      expect(helpersPrivateMessagesModules.createPrivateUserMessageMain).toBeCalledTimes(1)
    })

    it('does not send when the opener is refused', async () => {
      ;(firstMessage.isOpener as jest.Mock).mockResolvedValue(true)
      ;(firstMessage.assertAcceptableOpener as jest.Mock).mockRejectedValue(new Error('too short'))
      await expect(createPrivateUserMessage(body, mockAuth, {} as any)).rejects.toThrow('too short')
      expect(helpersPrivateMessagesModules.createPrivateUserMessageMain).not.toBeCalled()
    })

    it('leaves replies alone', async () => {
      ;(firstMessage.isOpener as jest.Mock).mockResolvedValue(false)
      await createPrivateUserMessage(body, mockAuth, {} as any)
      expect(firstMessage.assertAcceptableOpener).not.toBeCalled()
    })

    it('leaves group conversations alone', async () => {
      ;(firstMessage.isOpener as jest.Mock).mockResolvedValue(true)
      ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue({
        manyOrNone: jest.fn().mockResolvedValue([{user_id: OTHER_USER_ID}, {user_id: '222'}]),
      })
      ;(sharedUtils.getPrivateUser as jest.Mock).mockResolvedValue({
        blockedUserIds: [],
        blockedByUserIds: [],
      })
      await createPrivateUserMessage(body, mockAuth, {} as any)
      expect(firstMessage.assertAcceptableOpener).not.toBeCalled()
    })

    it('exempts staff', async () => {
      ;(firstMessage.isOpener as jest.Mock).mockResolvedValue(true)
      ;(constants.isModUsername as jest.Mock).mockReturnValue(true)
      await createPrivateUserMessage(body, mockAuth, {} as any)
      expect(firstMessage.isOpener).not.toBeCalled()
      expect(firstMessage.assertAcceptableOpener).not.toBeCalled()
    })
  })

  describe('when an error occurs', () => {
    it('should throw if the content is too long', async () => {
      const mockBody = {
        content: {'': 'x'.repeat(MAX_COMMENT_JSON_LENGTH)},
        channelId: 123,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      expect(createPrivateUserMessage(mockBody, mockAuth, mockReq)).rejects.toThrowError(
        `Message JSON should be less than ${MAX_COMMENT_JSON_LENGTH}`,
      )
    })

    it('should throw if the user does not exist', async () => {
      const mockBody = {
        content: {mockJson: 'mockJsonContent'},
        channelId: 123,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(false)

      expect(createPrivateUserMessage(mockBody, mockAuth, mockReq)).rejects.toThrowError(
        `Your account was not found`,
      )
    })

    it('should throw if the user does not exist', async () => {
      const mockBody = {
        content: {mockJson: 'mockJsonContent'},
        channelId: 123,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockCreator = {
        isBannedFromPosting: true,
      }

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockCreator)

      expect(createPrivateUserMessage(mockBody, mockAuth, mockReq)).rejects.toThrowError(
        `Your account has been suspended`,
      )
    })

    // The point of splitting the copy: someone on an automatic hold meets this message on every
    // attempt, and must not be told they are suspended when nobody has judged the account yet.
    it('tells a member on a provisional hold that it is a hold, not a verdict', async () => {
      const mockBody = {
        content: {mockJson: 'mockJsonContent'},
        channelId: 123,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue({
        isBannedFromPosting: true,
        banReason: 'auto_rate_limit',
      })

      const err = await createPrivateUserMessage(mockBody, mockAuth, mockReq).catch(
        (e: unknown) => e as Error,
      )
      expect(err.message).toContain('on hold')
      expect(err.message).toContain("isn't a decision about you")
      expect(err.message).not.toContain('suspended')
    })

    // The channel-creation guard only runs once. Before this, blocking someone you had already
    // spoken to left the existing channel fully writable — the case blocking exists for.
    it('should throw if the sender has blocked the other member', async () => {
      const mockAuth = {uid: '321'} as AuthedUser
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue({id: mockAuth.uid})
      ;(sharedUtils.getPrivateUser as jest.Mock).mockImplementation(async (id: string) =>
        id === mockAuth.uid
          ? {id, blockedUserIds: [OTHER_USER_ID], blockedByUserIds: []}
          : {id, blockedUserIds: [], blockedByUserIds: []},
      )

      await expect(
        createPrivateUserMessage({content: {a: 'b'}, channelId: 123}, mockAuth, {} as any),
      ).rejects.toThrowError('You can no longer interact with this person')
      expect(helpersPrivateMessagesModules.createPrivateUserMessageMain).not.toBeCalled()
    })

    it('should throw if the other member has blocked the sender', async () => {
      const mockAuth = {uid: '321'} as AuthedUser
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue({id: mockAuth.uid})
      ;(sharedUtils.getPrivateUser as jest.Mock).mockImplementation(async (id: string) =>
        id === mockAuth.uid
          ? {id, blockedUserIds: [], blockedByUserIds: []}
          : {id, blockedUserIds: [mockAuth.uid], blockedByUserIds: []},
      )

      await expect(
        createPrivateUserMessage({content: {a: 'b'}, channelId: 123}, mockAuth, {} as any),
      ).rejects.toThrowError('You can no longer interact with this person')
      expect(helpersPrivateMessagesModules.createPrivateUserMessageMain).not.toBeCalled()
    })
  })
})
