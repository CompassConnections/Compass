jest.mock('common/discord/core')
jest.mock('shared/supabase/utils')
jest.mock('shared/supabase/init')
jest.mock('common/util/try-catch')

import {contact} from 'api/contact'
import {AuthedUser} from 'api/helpers/endpoint'
import {sendDiscordMessage} from 'common/discord/core'
import {sqlMatch} from 'common/test-utils'
import {tryCatch} from 'common/util/try-catch'
import * as supabaseInit from 'shared/supabase/init'
import * as supabaseUtils from 'shared/supabase/utils'

describe('contact', () => {
  let mockPg: any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      oneOrNone: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should send a discord message to the user', async () => {
      const mockProps = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Error test message',
                },
              ],
            },
          ],
        },
        userId: '123',
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockDbUser = {name: 'Humphrey Mocker'}
      const mockReturnData = {} as any

      ;(tryCatch as jest.Mock).mockResolvedValue({data: mockReturnData, error: null})

      const results = await contact(mockProps, mockAuth, mockReq)

      expect(results.success).toBe(true)
      expect(results.result).toStrictEqual({})
      expect(tryCatch).toBeCalledTimes(1)
      expect(supabaseUtils.insert).toBeCalledTimes(1)
      expect(supabaseUtils.insert).toBeCalledWith(expect.any(Object), 'contact', {
        user_id: mockProps.userId,
        content: JSON.stringify(mockProps.content),
      })
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockDbUser)

      await results.continue()

      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledWith(sqlMatch('select name from users where id = $1'), [
        mockProps.userId,
      ])
      expect(sendDiscordMessage).toBeCalledTimes(1)
      expect(sendDiscordMessage).toBeCalledWith(
        expect.stringContaining(`New message from ${mockDbUser.name}`),
        'contact',
      )
    })
  })

  describe('when an error occurs', () => {
    it('should throw if the insert function fails', async () => {
      const mockProps = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Error test message',
                },
              ],
            },
          ],
        },
        userId: '123',
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(tryCatch as jest.Mock).mockResolvedValue({data: null, error: Error})

      expect(contact(mockProps, mockAuth, mockReq)).rejects.toThrowError(
        'Failed to submit contact message',
      )
    })

    it('should throw if unable to send discord message', async () => {
      const mockProps = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Error test message',
                },
              ],
            },
          ],
        },
        userId: '123',
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockDbUser = {name: 'Humphrey Mocker'}
      const mockReturnData = {} as any

      ;(tryCatch as jest.Mock).mockResolvedValue({data: mockReturnData, error: null})

      const results = await contact(mockProps, mockAuth, mockReq)

      expect(results.success).toBe(true)
      expect(results.result).toStrictEqual({})
      expect(tryCatch).toBeCalledTimes(1)
      expect(supabaseUtils.insert).toBeCalledTimes(1)
      expect(supabaseUtils.insert).toBeCalledWith(expect.any(Object), 'contact', {
        user_id: mockProps.userId,
        content: JSON.stringify(mockProps.content),
      })
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockDbUser)
      ;(sendDiscordMessage as jest.Mock).mockRejectedValue(new Error('Unable to send message'))
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await results.continue()

      expect(errorSpy).toBeCalledTimes(1)
      expect(errorSpy).toBeCalledWith(
        expect.stringContaining('Failed to send discord contact'),
        expect.objectContaining({name: 'Error'}),
      )
    })
  })
})
