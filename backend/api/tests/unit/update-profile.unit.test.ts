jest.mock('shared/supabase/init')
jest.mock('shared/supabase/utils')
jest.mock('common/util/try-catch')
jest.mock('shared/profiles/parse-photos')
jest.mock('shared/supabase/users')

import {AuthedUser} from 'api/helpers/endpoint'
import {updateProfileEndpoint} from 'api/update-profile'
import {sqlMatch} from 'common/test-utils'
import {tryCatch} from 'common/util/try-catch'
import {removePinnedUrlFromPhotoUrls} from 'shared/profiles/parse-photos'
import * as supabaseInit from 'shared/supabase/init'
import * as supabaseUsers from 'shared/supabase/users'
import * as supabaseUtils from 'shared/supabase/utils'

describe('updateProfiles', () => {
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
    it('should update an existing profile when provided the user id', async () => {
      const mockProps = {
        pinned_url: 'mockAvatarUrl',
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockData = 'success'

      ;(tryCatch as jest.Mock)
        .mockResolvedValueOnce({data: true})
        .mockResolvedValueOnce({data: mockData, error: null})

      const result = await updateProfileEndpoint(mockProps, mockAuth, mockReq)

      expect(result).toBe(mockData)
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledWith(
        sqlMatch('select * from profiles where user_id = $1'),
        [mockAuth.uid],
      )
      expect(removePinnedUrlFromPhotoUrls).toBeCalledTimes(1)
      expect(removePinnedUrlFromPhotoUrls).toBeCalledWith(mockProps)
      expect(supabaseUsers.updateUserData).toBeCalledTimes(0)
      expect(supabaseUtils.update).toBeCalledTimes(0)
    })
  })

  describe('when an error occurs', () => {
    it('should throw if the profile does not exist', async () => {
      const mockProps = {
        age: 28,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(tryCatch as jest.Mock).mockResolvedValue({data: false})

      expect(updateProfileEndpoint(mockProps, mockAuth, mockReq)).rejects.toThrow(
        'Profile not found',
      )
    })

    it('should throw if unable to update the profile', async () => {
      const mockProps = {
        age: 28,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(tryCatch as jest.Mock)
        .mockResolvedValueOnce({data: true})
        .mockResolvedValueOnce({data: null, error: Error})

      expect(updateProfileEndpoint(mockProps, mockAuth, mockReq)).rejects.toThrow(
        'Error updating profile',
      )
    })
  })
})
