jest.mock('shared/supabase/init')
jest.mock('api/helpers/private-messages')

import {sqlMatch} from 'common/test-utils'
import {deleteMessage} from 'api/delete-message'
import * as supabaseInit from 'shared/supabase/init'
import * as messageHelpers from 'api/helpers/private-messages'
import {AuthedUser} from 'api/helpers/endpoint'

describe('deleteMessage', () => {
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
    it('should delete a message', async () => {
      const mockMessageId = {
        messageId: 123,
      }
      const mockMessage = {
        channel_id: 'mockChannelId',
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockMessage)
      ;(mockPg.none as jest.Mock).mockResolvedValue(null)
      ;(messageHelpers.broadcastPrivateMessages as jest.Mock).mockResolvedValue(null)

      const results = await deleteMessage(mockMessageId, mockAuth, mockReq)
      expect(results.success).toBeTruthy()

      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledWith(sqlMatch('SELECT *'), [
        mockMessageId.messageId,
        mockAuth.uid,
      ])
      expect(mockPg.none).toBeCalledTimes(1)
      expect(mockPg.none).toBeCalledWith(sqlMatch('DELETE'), [
        mockMessageId.messageId,
        mockAuth.uid,
      ])
      expect(messageHelpers.broadcastPrivateMessages).toBeCalledTimes(1)
      expect(messageHelpers.broadcastPrivateMessages).toBeCalledWith(
        expect.any(Object),
        mockMessage.channel_id,
        mockAuth.uid,
      )
    })
  })
  describe('when an error occurs', () => {
    it('should throw if the message was not found', async () => {
      const mockMessageId = {
        messageId: 123,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(null)

      expect(deleteMessage(mockMessageId, mockAuth, mockReq)).rejects.toThrow('Message not found')
    })

    it('should throw if the message was not broadcasted', async () => {
      const mockMessageId = {
        messageId: 123,
      }
      const mockMessage = {
        channel_id: 'mockChannelId',
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockMessage)
      ;(mockPg.none as jest.Mock).mockResolvedValue(null)
      ;(messageHelpers.broadcastPrivateMessages as jest.Mock).mockRejectedValue(
        new Error('Broadcast Error'),
      )
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await deleteMessage(mockMessageId, mockAuth, mockReq)

      expect(errorSpy).toBeCalledTimes(1)
      expect(errorSpy).toBeCalledWith(
        expect.stringContaining('broadcastPrivateMessages failed'),
        expect.any(Error),
      )
    })
  })
})
