jest.mock('shared/supabase/init')
jest.mock('shared/utils')
jest.mock('api/helpers/private-messages')

import {AuthedUser} from 'api/helpers/endpoint'
import * as messageHelpers from 'api/helpers/private-messages'
import {leavePrivateUserMessageChannel} from 'api/leave-private-user-message-channel'
import {sqlMatch} from 'common/test-utils'
import * as supabaseInit from 'shared/supabase/init'
import * as sharedUtils from 'shared/utils'

describe('leavePrivateUserMessageChannel', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      oneOrNone: jest.fn(),
      none: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should leave a private message channel', async () => {
      const mockProps = {channelId: 123}
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockUser = {name: 'mockName'}
      const mockLeaveChatContent = 'mockLeaveChatContentValue'

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser)
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(true)
      ;(messageHelpers.leaveChatContent as jest.Mock).mockReturnValue(mockLeaveChatContent)

      const results = await leavePrivateUserMessageChannel(mockProps, mockAuth, mockReq)

      expect(results.status).toBe('success')
      expect(results.channelId).toBe(mockProps.channelId)
      expect(sharedUtils.getUser).toBeCalledTimes(1)
      expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid)
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledWith(
        sqlMatch('select status from private_user_message_channel_members'),
        [mockProps.channelId, mockAuth.uid],
      )
      expect(mockPg.none).toBeCalledTimes(1)
      expect(mockPg.none).toBeCalledWith(sqlMatch('update private_user_message_channel_members'), [
        mockProps.channelId,
        mockAuth.uid,
      ])
      expect(messageHelpers.leaveChatContent).toBeCalledTimes(1)
      expect(messageHelpers.leaveChatContent).toBeCalledWith(mockUser.name)
      expect(messageHelpers.insertPrivateMessage).toBeCalledTimes(1)
      expect(messageHelpers.insertPrivateMessage).toBeCalledWith(
        mockLeaveChatContent,
        mockProps.channelId,
        mockAuth.uid,
        'system_status',
        expect.any(Object),
      )
    })
  })
  describe('when an error occurs', () => {
    it('should throw if the account was not found', async () => {
      const mockProps = {channelId: 123}
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(false)

      expect(leavePrivateUserMessageChannel(mockProps, mockAuth, mockReq)).rejects.toThrow(
        'Your account was not found',
      )
    })

    it('should throw if you are not a member', async () => {
      const mockProps = {channelId: 123}
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockUser = {name: 'mockName'}

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser)
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(false)

      expect(leavePrivateUserMessageChannel(mockProps, mockAuth, mockReq)).rejects.toThrow(
        'You are not authorized to post to this channel',
      )
    })
  })
})
