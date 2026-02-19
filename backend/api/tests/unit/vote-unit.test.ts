jest.mock('shared/supabase/init')
jest.mock('shared/utils')

import {AuthedUser} from 'api/helpers/endpoint'
import {vote} from 'api/vote'
import * as supabaseInit from 'shared/supabase/init'
import * as sharedUtils from 'shared/utils'
import {sqlMatch} from 'common/test-utils'

describe('vote', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      one: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  describe('when given valid input', () => {
    it('should vote successfully', async () => {
      const mockProps = {
        voteId: 1,
        choice: 'for' as const,
        priority: 10,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockUser = {id: 'mockUserId'}
      const mockResult = 'success'

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser)
      ;(mockPg.one as jest.Mock).mockResolvedValue(mockResult)

      const result = await vote(mockProps, mockAuth, mockReq)

      expect(result.data).toBe(mockResult)
      expect(sharedUtils.getUser).toBeCalledTimes(1)
      expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid)
      expect(mockPg.one).toBeCalledTimes(1)
      expect(mockPg.one).toBeCalledWith(
        sqlMatch('insert into vote_results (user_id, vote_id, choice, priority)'),
        [mockUser.id, mockProps.voteId, 1, mockProps.priority],
      )
    })
  })
  describe('when an error occurs', () => {
    it('should throw if unable to find the account', async () => {
      const mockProps = {
        voteId: 1,
        choice: 'for' as const,
        priority: 10,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(false)

      expect(vote(mockProps, mockAuth, mockReq)).rejects.toThrow('Your account was not found')
    })

    it('should throw if the choice is invalid', async () => {
      const mockProps = {
        voteId: 1,
        priority: 10,
      } as any
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockUser = {id: 'mockUserId'}

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser)

      expect(vote(mockProps, mockAuth, mockReq)).rejects.toThrow('Invalid choice')
    })

    it('should throw if unable to record vote', async () => {
      const mockProps = {
        voteId: 1,
        choice: 'for' as const,
        priority: 10,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockUser = {id: 'mockUserId'}

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser)
      ;(mockPg.one as jest.Mock).mockRejectedValue(new Error('Result error'))

      expect(vote(mockProps, mockAuth, mockReq)).rejects.toThrow('Error recording vote')
    })
  })
})
