import {getUserAndProfile} from 'api/get-user-and-profile'
import * as supabaseInit from 'shared/supabase/init'

jest.mock('shared/supabase/init')
jest.mock('common/supabase/users')

describe('getUserAndProfile', () => {
  let mockPg: any

  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      oneOrNone: jest.fn(),
      any: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })

  describe('getUserAndProfile', () => {
    it('should return user and profile when both exist', async () => {
      const mockUser = {
        id: 'mock-user-id',
        username: 'mockuser',
        name: 'Mock User',
        data: {},
        created_time: '2023-01-01T00:00:00Z',
      }

      const mockProfile = {
        id: 'mock-profile-id',
        user_id: 'mock-user-id',
        bio: 'Mock bio',
        city: 'Mock city',
      }

      const mockInterests = [{id: '1'}, {id: '2'}]
      const mockCauses = [{id: '3'}]
      const mockWork = [{id: '4'}, {id: '5'}]

      mockPg.oneOrNone.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(mockProfile)

      mockPg.any
        .mockResolvedValueOnce(mockInterests)
        .mockResolvedValueOnce(mockCauses)
        .mockResolvedValueOnce(mockWork)

      const result = await getUserAndProfile('mockuser')

      expect(result).toEqual({
        user: mockUser,
        profile: {
          ...mockProfile,
          interests: mockInterests.map((e) => e.id),
          causes: mockCauses.map((e) => e.id),
          work: mockWork.map((e) => e.id),
        },
      })

      expect(mockPg.oneOrNone).toHaveBeenCalledTimes(2)
      expect(mockPg.any).toHaveBeenCalledTimes(3)
    })

    it('should return null when user does not exist', async () => {
      mockPg.oneOrNone.mockResolvedValueOnce(null)

      const result = await getUserAndProfile('nonexistent')

      expect(result).toBeNull()
    })

    it('should return user with null profile when profile does not exist', async () => {
      const mockUser = {
        id: 'mock-user-id',
        username: 'mockuser',
        name: 'Mock User',
        data: {},
        created_time: '2023-01-01T00:00:00Z',
      }

      mockPg.oneOrNone.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(null)

      mockPg.any.mockResolvedValue([])

      const result = await getUserAndProfile('mockuser')

      expect(result).toEqual({
        user: mockUser,
        profile: null,
      })
    })
  })
})
