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
          // Anyone can ask this endpoint for anyone's profile, so the date behind the age is blanked
          // out here — only `age`, which the database derives from it, ever reaches a reader.
          birth_date: null,
        },
      })

      expect(mockPg.oneOrNone).toHaveBeenCalledTimes(2)
      expect(mockPg.any).toHaveBeenCalledTimes(3)
    })

    it('redacts a members-only profile for a signed-out reader', async () => {
      const mockUser = {
        id: 'mock-user-id',
        username: 'mockuser',
        name: 'Mock User',
        avatarUrl: 'https://example.com/face.jpg',
      }

      const mockProfile = {
        id: 'mock-profile-id',
        user_id: 'mock-user-id',
        visibility: 'member',
        disabled: false,
        bio: 'Mock bio',
        city: 'Mock city',
        pinned_url: 'https://example.com/photo.jpg',
        birth_date: '1990-01-01',
      }

      mockPg.oneOrNone.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(mockProfile)

      const result = await getUserAndProfile('mockuser')

      // The display name and nothing else: no bio, no city, no photo, not even the profile id the
      // option tables join on.
      expect(result).toEqual({
        user: {...mockUser, avatarUrl: ''},
        profile: {user_id: 'mock-user-id', visibility: 'member', disabled: false},
      })
      // The option tables are never even read for a reader who may not see them.
      expect(mockPg.any).not.toHaveBeenCalled()
    })

    it('returns a members-only profile in full to a signed-in member', async () => {
      const mockUser = {id: 'mock-user-id', username: 'mockuser', name: 'Mock User'}
      const mockProfile = {
        id: 'mock-profile-id',
        user_id: 'mock-user-id',
        visibility: 'member',
        bio: 'Mock bio',
        birth_date: '1990-01-01',
      }

      mockPg.oneOrNone.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(mockProfile)
      mockPg.any.mockResolvedValue([])

      const result = await getUserAndProfile('mockuser', 'some-other-member')

      expect(result?.profile).toMatchObject({bio: 'Mock bio'})
      // Everyone but the owner still reads the age, never the date behind it.
      expect(result?.profile?.birth_date).toBeNull()
    })

    it('returns birth_date only to the owner', async () => {
      const mockUser = {id: 'mock-user-id', username: 'mockuser', name: 'Mock User'}
      const mockProfile = {
        id: 'mock-profile-id',
        user_id: 'mock-user-id',
        visibility: 'member',
        birth_date: '1990-01-01',
      }

      mockPg.oneOrNone.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(mockProfile)
      mockPg.any.mockResolvedValue([])

      const result = await getUserAndProfile('mockuser', 'mock-user-id')

      expect(result?.profile?.birth_date).toBe('1990-01-01')
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
