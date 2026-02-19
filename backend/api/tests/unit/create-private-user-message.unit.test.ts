jest.mock('shared/utils')
jest.mock('shared/supabase/init')
jest.mock('api/helpers/private-messages')

import {createPrivateUserMessage} from 'api/create-private-user-message'
import * as sharedUtils from 'shared/utils'
import * as supabaseInit from 'shared/supabase/init'
import * as helpersPrivateMessagesModules from 'api/helpers/private-messages'
import {AuthedUser} from 'api/helpers/endpoint'
import {MAX_COMMENT_JSON_LENGTH} from 'api/create-comment'

describe('createPrivateUserMessage', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    const mockPg = {} as any

    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
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
        isBannedFromPosting: false,
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
  })
})
