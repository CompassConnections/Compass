import {getUser} from 'api/get-user'
import {toUserAPIResponse} from 'common/api/user-types'
import {sqlMatch} from 'common/test-utils'
import * as supabaseInit from 'shared/supabase/init'

jest.mock('shared/supabase/init')
jest.mock('common/supabase/users')
jest.mock('common/api/user-types')

describe('getUser', () => {
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
    describe('and fetching by id', () => {
      it('should fetch user successfully by id', async () => {
        const mockProps = {id: 'mockId'}
        const mockUser = {} as any

        ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockUser)
        ;(toUserAPIResponse as jest.Mock).mockReturnValue('mockApiResponse')

        const result = await getUser(mockProps)

        expect(result).toBe('mockApiResponse')
        expect(mockPg.oneOrNone).toBeCalledTimes(1)
        expect(mockPg.oneOrNone).toBeCalledWith(
          sqlMatch('select * from users'),
          [mockProps.id],
          expect.any(Function),
        )
        expect(toUserAPIResponse).toBeCalledTimes(1)
        expect(toUserAPIResponse).toBeCalledWith(mockUser)
      })
    })

    describe('when fetching by username', () => {
      it('should fetch user successfully by username', async () => {
        const mockProps = {username: 'mockUsername'}
        const mockUser = {} as any

        ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockUser)

        await getUser(mockProps)

        expect(mockPg.oneOrNone).toHaveBeenCalledWith(
          sqlMatch('where username = $1'),
          [mockProps.username],
          expect.any(Function),
        )
      })
    })
  })

  describe('when an error occurs', () => {
    describe('and fetching by id', () => {
      it('should throw when user is not found by id', async () => {
        const mockProps = {id: 'mockId'}

        ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(false)

        expect(getUser(mockProps)).rejects.toThrow('User not found')
      })
    })
    describe('when fetching by username', () => {
      it('should throw when user is not found by id', async () => {
        const mockProps = {username: 'mockUsername'}

        ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(false)

        expect(getUser(mockProps)).rejects.toThrow('User not found')
      })
    })
  })
})
