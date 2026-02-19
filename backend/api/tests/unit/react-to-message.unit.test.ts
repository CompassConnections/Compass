import {AuthedUser} from 'api/helpers/endpoint'
import * as messageHelpers from 'api/helpers/private-messages'
import {reactToMessage} from 'api/react-to-message'
import {sqlMatch} from 'common/test-utils'
import * as supabaseInit from 'shared/supabase/init'

jest.mock('shared/supabase/init')
jest.mock('api/helpers/private-messages')

describe('reactToMessage', () => {
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
    it('should return success', async () => {
      const mockProps = {
        messageId: 123,
        reaction: 'mockReaction',
        toDelete: false,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockMessage = {channel_id: 'mockChannelId'}

      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockMessage)
      ;(mockPg.none as jest.Mock).mockResolvedValue(null)
      ;(messageHelpers.broadcastPrivateMessages as jest.Mock).mockResolvedValue(null)

      const result = await reactToMessage(mockProps, mockAuth, mockReq)
      const [sql, params] = mockPg.oneOrNone.mock.calls[0]
      const [sql1, params1] = mockPg.none.mock.calls[0]

      expect(result.success).toBeTruthy()
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(params).toEqual([mockAuth.uid, mockProps.messageId])
      expect(sql).toEqual(sqlMatch('SELECT *'))
      expect(sql).toEqual(sqlMatch('FROM private_user_message_channel_members m'))
      expect(mockPg.none).toBeCalledTimes(1)
      expect(params1).toEqual([mockProps.reaction, mockAuth.uid, mockProps.messageId])
      expect(sql1).toEqual(sqlMatch('UPDATE private_user_messages'))
      expect(sql1).toEqual(sqlMatch('SET reactions ='))
      expect(messageHelpers.broadcastPrivateMessages).toBeCalledTimes(1)
      expect(messageHelpers.broadcastPrivateMessages).toBeCalledWith(
        expect.any(Object),
        mockMessage.channel_id,
        mockAuth.uid,
      )
    })

    it('should return success when removing a reaction', async () => {
      const mockProps = {
        messageId: 123,
        reaction: 'mockReaction',
        toDelete: true,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockMessage = {channel_id: 'mockChannelId'}

      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockMessage)
      ;(mockPg.none as jest.Mock).mockResolvedValue(null)
      ;(messageHelpers.broadcastPrivateMessages as jest.Mock).mockResolvedValue(null)

      const result = await reactToMessage(mockProps, mockAuth, mockReq)
      const [_sql, _params] = mockPg.oneOrNone.mock.calls[0]
      const [sql1, params1] = mockPg.none.mock.calls[0]

      expect(result.success).toBeTruthy()
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.none).toBeCalledTimes(1)
      expect(params1).toEqual([mockProps.reaction, mockProps.messageId, mockAuth.uid])
      expect(sql1).toEqual(sqlMatch('UPDATE private_user_messages'))
      expect(sql1).toEqual(sqlMatch('SET reactions = reactions - $1'))
    })
  })
  describe('when an error occurs', () => {
    it('should throw if user does not have the authorization to react', async () => {
      const mockProps = {
        messageId: 123,
        reaction: 'mockReaction',
        toDelete: false,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(false)

      expect(reactToMessage(mockProps, mockAuth, mockReq)).rejects.toThrow(
        'Not authorized to react to this message',
      )
    })

    it('should return success', async () => {
      const mockProps = {
        messageId: 123,
        reaction: 'mockReaction',
        toDelete: false,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockMessage = {channel_id: 'mockChannelId'}

      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockMessage)
      ;(mockPg.none as jest.Mock).mockResolvedValue(null)
      ;(messageHelpers.broadcastPrivateMessages as jest.Mock).mockRejectedValue(
        new Error('Broadcast error'),
      )
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await reactToMessage(mockProps, mockAuth, mockReq)

      expect(errorSpy).toBeCalledWith(
        expect.stringContaining('broadcastPrivateMessages failed'),
        expect.any(Error),
      )
    })
  })
})
