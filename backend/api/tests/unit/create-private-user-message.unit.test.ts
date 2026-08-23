jest.mock('shared/utils')
jest.mock('shared/supabase/init')
jest.mock('api/helpers/private-messages')

import {MAX_COMMENT_JSON_LENGTH} from 'api/create-comment'
import {createPrivateUserMessage} from 'api/create-private-user-message'
import {AuthedUser} from 'api/helpers/endpoint'
import * as helpersPrivateMessagesModules from 'api/helpers/private-messages'
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
        `You are banned`,
      )
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
