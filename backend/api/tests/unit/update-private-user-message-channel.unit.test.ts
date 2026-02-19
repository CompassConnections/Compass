import {AuthedUser} from 'api/helpers/endpoint'
import {updatePrivateUserMessageChannel} from 'api/update-private-user-message-channel'
import * as supabaseUtils from 'common/supabase/utils'
import {sqlMatch} from 'common/test-utils'
import * as supabaseInit from 'shared/supabase/init'
import * as sharedUtils from 'shared/utils'

jest.mock('shared/supabase/init')
jest.mock('shared/utils')
jest.mock('common/supabase/utils')

describe('updatePrivateUserMessageChannel', () => {
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
    it('should return success after updating the users private message channel', async () => {
      const mockBody = {
        channelId: 123,
        notifyAfterTime: 10,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(true)
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(true)
      ;(supabaseUtils.millisToTs as jest.Mock).mockReturnValue('mockMillisToTs')

      const results = await updatePrivateUserMessageChannel(mockBody, mockAuth, mockReq)

      expect(results.status).toBe('success')
      expect(results.channelId).toBe(mockBody.channelId)
      expect(sharedUtils.getUser).toBeCalledTimes(1)
      expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid)
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledWith(
        sqlMatch('select status from private_user_message_channel_members'),
        [mockBody.channelId, mockAuth.uid],
      )
      expect(mockPg.none).toBeCalledTimes(1)
      expect(mockPg.none).toBeCalledWith(sqlMatch('update private_user_message_channel_members'), [
        mockBody.channelId,
        mockAuth.uid,
        'mockMillisToTs',
      ])
    })
  })
  describe('when an error occurs', () => {
    it('should throw if the user account does not exist', async () => {
      const mockBody = {
        channelId: 123,
        notifyAfterTime: 10,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(false)

      expect(updatePrivateUserMessageChannel(mockBody, mockAuth, mockReq)).rejects.toThrow(
        'Your account was not found',
      )
    })

    it('should throw if the user is not authorized in the channel', async () => {
      const mockBody = {
        channelId: 123,
        notifyAfterTime: 10,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(true)
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(false)

      expect(updatePrivateUserMessageChannel(mockBody, mockAuth, mockReq)).rejects.toThrow(
        'You are not authorized to this channel',
      )
    })
  })
})
